import json
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Offer, ProduceListing, User, OfferStatus
from app.schemas import OfferCreate, OfferCounter, OfferResponse
from app.auth import get_current_user, require_role
from app.services.offer_fsm import OfferFSM, OfferFSMError
from app.sockets.negotiation import sio
from app.config import settings

router = APIRouter(prefix="/offers", tags=["Negotiations"])

@router.post("", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
async def create_offer(
    payload: OfferCreate,
    current_user: User = Depends(require_role(["buyer"])),
    db: Session = Depends(get_db)
):
    listing = db.query(ProduceListing).filter(ProduceListing.id == payload.listing_id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produce listing not found"
        )
    if listing.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot make an offer on an inactive or sold-out listing"
        )
    if payload.proposed_quantity < listing.min_order_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimum order quantity for this batch is {listing.min_order_quantity} {listing.unit}"
        )
    if payload.proposed_quantity > listing.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested quantity exceeds available stock of {listing.quantity} {listing.unit}"
        )

    # Check for active existing pending/countered offer on same listing by this buyer
    existing = db.query(Offer).filter(
        Offer.listing_id == listing.id,
        Offer.buyer_id == current_user.id,
        Offer.status.in_([OfferStatus.PENDING.value, OfferStatus.COUNTERED.value])
    ).first()
    if existing:
        OfferFSM.check_and_apply_expiry(existing)
        if existing.status in [OfferStatus.PENDING.value, OfferStatus.COUNTERED.value]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have an active negotiation in progress for this produce batch."
            )

    total_amount = round(payload.proposed_price_per_unit * payload.proposed_quantity, 2)
    expires_at = datetime.utcnow() + timedelta(hours=settings.OFFER_EXPIRY_HOURS)

    time_now_str = datetime.now().strftime("%I:%M %p")
    date_now_str = datetime.now().strftime("%d %b, %I:%M %p")

    initial_message = {
        "type": "initial",
        "sender_role": "buyer",
        "sender_name": current_user.full_name,
        "sender_org": current_user.organization_name or "Institutional Buyer",
        "proposed_price": payload.proposed_price_per_unit,
        "proposed_quantity": payload.proposed_quantity,
        "total_amount": total_amount,
        "text": payload.counter_notes or f"We require {payload.proposed_quantity} {listing.unit} of {listing.title} and would like to propose ₹{payload.proposed_price_per_unit}/{listing.unit} with immediate UPI escrow lock.",
        "timestamp": time_now_str,
        "date_str": date_now_str
    }

    offer = Offer(
        listing_id=listing.id,
        buyer_id=current_user.id,
        farmer_id=listing.farmer_id,
        proposed_price_per_unit=payload.proposed_price_per_unit,
        proposed_quantity=payload.proposed_quantity,
        total_amount=total_amount,
        status=OfferStatus.PENDING.value,
        last_action_by="buyer",
        last_action_user_id=current_user.id,
        counter_notes=payload.counter_notes,
        timeline_json=json.dumps([initial_message]),
        expires_at=expires_at
    )
    db.add(offer)
    db.commit()
    db.refresh(offer)

    # Real-time alert to farmer
    try:
        await sio.emit("notification", {
            "type": "new_offer",
            "offer_id": offer.id,
            "text": f"New offer received from {current_user.full_name} for '{listing.title}': ₹{offer.proposed_price_per_unit}/{listing.unit}"
        }, room=f"user_{listing.farmer_id}")
    except Exception:
        pass

    return offer

@router.get("/my-offers", response_model=List[OfferResponse])
def get_my_offers(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Offer)
    if current_user.role == "farmer":
        query = query.filter(Offer.farmer_id == current_user.id)
    else:
        query = query.filter(Offer.buyer_id == current_user.id)

    offers = query.order_by(Offer.updated_at.desc()).all()

    # Apply passive 24-hr expiry checks
    has_expired = False
    for off in offers:
        if OfferFSM.check_and_apply_expiry(off):
            has_expired = True

    if has_expired:
        db.commit()

    if status_filter and status_filter.upper() != "ALL":
        offers = [o for o in offers if o.status.lower() == status_filter.lower()]

    return offers

@router.get("/{offer_id}", response_model=OfferResponse)
def get_offer_detail(
    offer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")

    if current_user.id not in [offer.buyer_id, offer.farmer_id]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if OfferFSM.check_and_apply_expiry(offer):
        db.commit()
        db.refresh(offer)

    return offer

@router.post("/{offer_id}/counter", response_model=OfferResponse)
async def counter_offer(
    offer_id: int,
    payload: OfferCounter,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")

    OfferFSM.apply_counter(
        offer,
        current_user,
        payload.proposed_price_per_unit,
        payload.proposed_quantity,
        payload.counter_notes
    )

    # Append to timeline
    time_now_str = datetime.now().strftime("%I:%M %p")
    date_now_str = datetime.now().strftime("%d %b, %I:%M %p")
    history = []
    if offer.timeline_json:
        try:
            history = json.loads(offer.timeline_json)
        except Exception:
            history = []

    history.append({
        "type": "counter",
        "sender_role": current_user.role,
        "sender_name": current_user.full_name,
        "sender_org": current_user.organization_name or ("Farmer" if current_user.role == "farmer" else "Buyer"),
        "proposed_price": payload.proposed_price_per_unit,
        "proposed_quantity": payload.proposed_quantity,
        "total_amount": round(payload.proposed_price_per_unit * payload.proposed_quantity, 2),
        "text": payload.counter_notes or f"Counter proposed: ₹{payload.proposed_price_per_unit}/unit for {payload.proposed_quantity} units.",
        "timestamp": time_now_str,
        "date_str": date_now_str
    })
    offer.timeline_json = json.dumps(history)

    db.commit()
    db.refresh(offer)

    # Real-time Socket.io broadcast to offer room
    try:
        await sio.emit("offer_updated", {
            "offer_id": offer.id,
            "status": offer.status,
            "proposed_price_per_unit": offer.proposed_price_per_unit,
            "proposed_quantity": offer.proposed_quantity,
            "total_amount": offer.total_amount,
            "last_action_by": offer.last_action_by,
            "last_action_user_id": offer.last_action_user_id,
            "counter_notes": offer.counter_notes,
            "timeline_json": offer.timeline_json,
            "updated_at": offer.updated_at.isoformat() if offer.updated_at else None,
            "expires_at": offer.expires_at.isoformat() if offer.expires_at else None,
            "actor_name": current_user.full_name
        }, room=f"offer_{offer.id}")

        target_user_id = offer.farmer_id if current_user.role == "buyer" else offer.buyer_id
        await sio.emit("notification", {
            "type": "new_counter_offer",
            "offer_id": offer.id,
            "text": f"{current_user.full_name} countered with ₹{offer.proposed_price_per_unit}/unit."
        }, room=f"user_{target_user_id}")
    except Exception:
        pass

    return offer

@router.post("/{offer_id}/accept", response_model=OfferResponse)
async def accept_offer(
    offer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")

    OfferFSM.apply_accept(offer, current_user)

    # Append to timeline
    time_now_str = datetime.now().strftime("%I:%M %p")
    history = []
    if offer.timeline_json:
        try:
            history = json.loads(offer.timeline_json)
        except Exception:
            history = []

    history.append({
        "type": "accepted",
        "sender_role": current_user.role,
        "sender_name": current_user.full_name,
        "sender_org": current_user.organization_name or current_user.full_name,
        "proposed_price": offer.proposed_price_per_unit,
        "proposed_quantity": offer.proposed_quantity,
        "total_amount": offer.total_amount,
        "text": f"Offer accepted by {current_user.full_name}! Deal locked in at ₹{offer.proposed_price_per_unit}/unit. Proceed to escrow payment.",
        "timestamp": time_now_str,
    })
    offer.timeline_json = json.dumps(history)

    db.commit()
    db.refresh(offer)

    try:
        payload = {
            "offer_id": offer.id,
            "status": offer.status,
            "last_action_by": offer.last_action_by,
            "last_action_user_id": offer.last_action_user_id,
            "total_amount": offer.total_amount,
            "timeline_json": offer.timeline_json,
            "actor_name": current_user.full_name
        }
        await sio.emit("offer_accepted", payload, room=f"offer_{offer.id}")
        await sio.emit("offer_updated", payload, room=f"offer_{offer.id}")
        
        target_user_id = offer.farmer_id if current_user.role == "buyer" else offer.buyer_id
        await sio.emit("notification", {
            "type": "offer_accepted",
            "offer_id": offer.id,
            "text": f"Offer #{offer.id} was accepted by {current_user.full_name}! Deal locked."
        }, room=f"user_{target_user_id}")
    except Exception:
        pass

    return offer

@router.post("/{offer_id}/reject", response_model=OfferResponse)
async def reject_offer(
    offer_id: int,
    reason: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")

    OfferFSM.apply_reject(offer, current_user, reason)
    db.commit()
    db.refresh(offer)

    try:
        payload = {
            "offer_id": offer.id,
            "status": offer.status,
            "last_action_by": offer.last_action_by,
            "last_action_user_id": offer.last_action_user_id,
            "counter_notes": offer.counter_notes,
            "actor_name": current_user.full_name
        }
        await sio.emit("offer_rejected", payload, room=f"offer_{offer.id}")
        await sio.emit("offer_updated", payload, room=f"offer_{offer.id}")
    except Exception:
        pass

    return offer
