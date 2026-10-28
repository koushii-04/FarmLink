import socketio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any

from app.auth import decode_token
from app.database import SessionLocal
from app.models import User, Offer, ProduceListing, OfferStatus
from app.services.offer_fsm import OfferFSM, OfferFSMError
from app.config import settings

logger = logging.getLogger("farmlink.sockets")

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False
)

user_sessions: Dict[str, Dict[str, Any]] = {}

@sio.event
async def connect(sid, environ, auth=None):
    token = None
    if auth and isinstance(auth, dict) and "token" in auth:
        token = auth["token"]
    elif "QUERY_STRING" in environ:
        from urllib.parse import parse_qs
        qs = parse_qs(environ["QUERY_STRING"])
        if "token" in qs:
            token = qs["token"][0]

    if not token:
        logger.warning(f"Connection rejected for {sid}: missing token")
        return False

    payload = decode_token(token)
    if not payload or "sub" not in payload:
        logger.warning(f"Connection rejected for {sid}: invalid token")
        return False

    user_id = int(payload["sub"])
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        user_data = {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "full_name": user.full_name
        }
    finally:
        db.close()

    await sio.save_session(sid, {"user": user_data})
    # Join personal room for targeted alerts
    await sio.enter_room(sid, f"user_{user_id}")
    logger.info(f"User {user_data['full_name']} ({user_data['role']}) connected on socket {sid}")
    return True

@sio.event
async def disconnect(sid):
    session = await sio.get_session(sid)
    if session and "user" in session:
        logger.info(f"User {session['user']['full_name']} disconnected ({sid})")

@sio.event
async def join_offer_room(sid, data):
    offer_id = data.get("offer_id")
    if not offer_id:
        return {"error": "offer_id is required"}

    session = await sio.get_session(sid)
    user = session.get("user")
    if not user:
        return {"error": "Unauthorized"}

    db = SessionLocal()
    try:
        offer = db.query(Offer).filter(Offer.id == int(offer_id)).first()
        if not offer:
            return {"error": "Offer not found"}
        if user["id"] not in [offer.buyer_id, offer.farmer_id]:
            return {"error": "Forbidden: Not a party to this offer"}

        room_name = f"offer_{offer_id}"
        await sio.enter_room(sid, room_name)
        logger.info(f"User {user['id']} joined room {room_name}")
        return {"status": "joined", "room": room_name}
    finally:
        db.close()

@sio.event
async def leave_offer_room(sid, data):
    offer_id = data.get("offer_id")
    if offer_id:
        await sio.leave_room(sid, f"offer_{offer_id}")
    return {"status": "left"}

@sio.event
async def counter_offer(sid, data):
    session = await sio.get_session(sid)
    user_info = session.get("user")
    if not user_info:
        return {"error": "Unauthorized"}

    offer_id = data.get("offer_id")
    new_price = float(data.get("proposed_price_per_unit", 0))
    new_quantity = float(data.get("proposed_quantity", 0))
    notes = data.get("counter_notes")

    db = SessionLocal()
    try:
        offer = db.query(Offer).filter(Offer.id == int(offer_id)).first()
        if not offer:
            return {"error": "Offer not found"}
        user = db.query(User).filter(User.id == user_info["id"]).first()

        try:
            OfferFSM.apply_counter(offer, user, new_price, new_quantity, notes)
            db.commit()
            db.refresh(offer)
        except OfferFSMError as fe:
            db.rollback()
            return {"error": fe.detail}

        payload = {
            "offer_id": offer.id,
            "status": offer.status,
            "proposed_price_per_unit": offer.proposed_price_per_unit,
            "proposed_quantity": offer.proposed_quantity,
            "total_amount": offer.total_amount,
            "last_action_by": offer.last_action_by,
            "last_action_user_id": offer.last_action_user_id,
            "counter_notes": offer.counter_notes,
            "updated_at": offer.updated_at.isoformat() if offer.updated_at else None,
            "expires_at": offer.expires_at.isoformat() if offer.expires_at else None,
            "actor_name": user.full_name
        }

        # Broadcast to offer room
        await sio.emit("offer_updated", payload, room=f"offer_{offer.id}")
        
        # Notify the waiting party
        target_user_id = offer.farmer_id if user.role == "buyer" else offer.buyer_id
        await sio.emit("notification", {
            "type": "new_counter_offer",
            "offer_id": offer.id,
            "text": f"{user.full_name} countered with INR {offer.proposed_price_per_unit}/unit."
        }, room=f"user_{target_user_id}")

        return {"status": "success", "offer": payload}
    finally:
        db.close()

@sio.event
async def accept_offer(sid, data):
    session = await sio.get_session(sid)
    user_info = session.get("user")
    if not user_info:
        return {"error": "Unauthorized"}

    offer_id = data.get("offer_id")
    db = SessionLocal()
    try:
        offer = db.query(Offer).filter(Offer.id == int(offer_id)).first()
        if not offer:
            return {"error": "Offer not found"}
        user = db.query(User).filter(User.id == user_info["id"]).first()

        try:
            OfferFSM.apply_accept(offer, user)
            db.commit()
            db.refresh(offer)
        except OfferFSMError as fe:
            db.rollback()
            return {"error": fe.detail}

        payload = {
            "offer_id": offer.id,
            "status": offer.status,
            "last_action_by": offer.last_action_by,
            "last_action_user_id": offer.last_action_user_id,
            "total_amount": offer.total_amount,
            "actor_name": user.full_name,
            "message": f"Offer accepted by {user.full_name}! Deal locked."
        }

        await sio.emit("offer_accepted", payload, room=f"offer_{offer.id}")
        await sio.emit("offer_updated", payload, room=f"offer_{offer.id}")

        # Send notification to counterparty
        target_user_id = offer.farmer_id if user.role == "buyer" else offer.buyer_id
        await sio.emit("notification", {
            "type": "offer_accepted",
            "offer_id": offer.id,
            "text": f"Offer #{offer.id} accepted! You can now proceed to order and checkout."
        }, room=f"user_{target_user_id}")

        return {"status": "success", "offer": payload}
    finally:
        db.close()

@sio.event
async def reject_offer(sid, data):
    session = await sio.get_session(sid)
    user_info = session.get("user")
    if not user_info:
        return {"error": "Unauthorized"}

    offer_id = data.get("offer_id")
    reason = data.get("reason", "")
    db = SessionLocal()
    try:
        offer = db.query(Offer).filter(Offer.id == int(offer_id)).first()
        if not offer:
            return {"error": "Offer not found"}
        user = db.query(User).filter(User.id == user_info["id"]).first()

        try:
            OfferFSM.apply_reject(offer, user, reason)
            db.commit()
            db.refresh(offer)
        except OfferFSMError as fe:
            db.rollback()
            return {"error": fe.detail}

        payload = {
            "offer_id": offer.id,
            "status": offer.status,
            "last_action_by": offer.last_action_by,
            "last_action_user_id": offer.last_action_user_id,
            "counter_notes": offer.counter_notes,
            "actor_name": user.full_name
        }

        await sio.emit("offer_rejected", payload, room=f"offer_{offer.id}")
        await sio.emit("offer_updated", payload, room=f"offer_{offer.id}")
        return {"status": "success", "offer": payload}
    finally:
        db.close()
