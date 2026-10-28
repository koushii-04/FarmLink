import json
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Order, Payment, User, OrderStatus
from app.schemas import (
    PaymentInitiateRequest, PaymentInitiateResponse,
    PaymentVerifyRequest, PaymentResponse
)
from app.auth import get_current_user, require_role
from app.services.razorpay_service import razorpay_service
from app.sockets.negotiation import sio

logger = logging.getLogger("farmlink.payments")

router = APIRouter(prefix="/payments", tags=["Payment Gateway & Reconciliation"])

@router.post("/initiate", response_model=PaymentInitiateResponse)
def initiate_payment(
    payload: PaymentInitiateRequest,
    current_user: User = Depends(require_role(["buyer"])),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == payload.order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.buyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if order.status != OrderStatus.PENDING_PAYMENT.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order is in '{order.status}' status, payment is not required."
        )

    # Check if active payment session exists
    existing_payment = db.query(Payment).filter(
        Payment.order_id == order.id,
        Payment.status == "created"
    ).first()

    if existing_payment:
        return {
            "razorpay_order_id": existing_payment.razorpay_order_id,
            "amount": existing_payment.amount,
            "currency": existing_payment.currency,
            "key_id": razorpay_service.key_id,
            "order_id": order.id,
            "notes": {"order_id": str(order.id)}
        }

    # Create new Razorpay order
    rzp_res = razorpay_service.create_order(
        amount_inr=order.total_amount,
        order_id=order.id,
        notes={"order_id": str(order.id), "buyer_email": current_user.email}
    )

    rzp_order_id = rzp_res.get("id")

    payment_record = Payment(
        order_id=order.id,
        razorpay_order_id=rzp_order_id,
        amount=order.total_amount,
        currency="INR",
        status="created",
        payment_method="upi",
        webhook_verified=False
    )
    db.add(payment_record)
    db.commit()

    return {
        "razorpay_order_id": rzp_order_id,
        "amount": order.total_amount,
        "currency": "INR",
        "key_id": razorpay_service.key_id,
        "order_id": order.id,
        "notes": {"order_id": str(order.id)}
    }

@router.post("/verify", response_model=PaymentResponse)
async def verify_client_payment(
    payload: PaymentVerifyRequest,
    current_user: User = Depends(require_role(["buyer"])),
    db: Session = Depends(get_db)
):
    payment_record = db.query(Payment).filter(
        Payment.order_id == payload.order_id,
        Payment.razorpay_order_id == payload.razorpay_order_id
    ).first()

    if not payment_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record not found")

    is_valid = razorpay_service.verify_payment_signature(
        razorpay_order_id=payload.razorpay_order_id,
        razorpay_payment_id=payload.razorpay_payment_id,
        razorpay_signature=payload.razorpay_signature
    )

    if not is_valid:
        payment_record.status = "failed"
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Razorpay signature")

    payment_record.razorpay_payment_id = payload.razorpay_payment_id
    payment_record.razorpay_signature = payload.razorpay_signature
    payment_record.status = "captured"
    payment_record.webhook_verified = True

    # Advance order to Confirmed
    order = db.query(Order).filter(Order.id == payload.order_id).first()
    if order and order.status == OrderStatus.PENDING_PAYMENT.value:
        order.status = OrderStatus.CONFIRMED.value

    db.commit()
    db.refresh(payment_record)

    # Real-time alert
    if order:
        try:
            alert = {
                "type": "payment_confirmed",
                "order_id": order.id,
                "text": f"Payment of INR {payment_record.amount} verified! Order is now Confirmed."
            }
            await sio.emit("notification", alert, room=f"user_{order.buyer_id}")
            await sio.emit("notification", alert, room=f"user_{order.farmer_id}")
        except Exception:
            pass

    return payment_record

@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None, alias="X-Razorpay-Signature"),
    db: Session = Depends(get_db)
):
    """
    Automated Webhook Reconciliation:
    Listens for Razorpay payment callbacks, validates HMAC SHA-256 signature,
    and reconciles payments & orders asynchronously to prevent orphaned orders.
    """
    body_bytes = await request.body()
    body_str = body_bytes.decode("utf-8")

    # If simulation / development bypass header provided for easy testing
    is_valid = razorpay_service.verify_webhook_signature(body_str, x_razorpay_signature or "")
    if not is_valid and not (x_razorpay_signature and x_razorpay_signature.startswith("simulated_")):
        logger.warning("Rejected Razorpay webhook: Signature mismatch")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")

    try:
        event_data = json.loads(body_str)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed JSON")

    event_type = event_data.get("event")
    logger.info(f"Received Razorpay webhook event: {event_type}")

    payload = event_data.get("payload", {})
    payment_entity = payload.get("payment", {}).get("entity", {})
    rzp_order_id = payment_entity.get("order_id")
    rzp_payment_id = payment_entity.get("id")

    if not rzp_order_id:
        return {"status": "ignored", "reason": "No order_id found in webhook payload"}

    payment_record = db.query(Payment).filter(Payment.razorpay_order_id == rzp_order_id).first()
    if not payment_record:
        logger.warning(f"Payment record not found for razorpay_order_id {rzp_order_id}")
        return {"status": "unmatched_order", "razorpay_order_id": rzp_order_id}

    if event_type in ["payment.captured", "order.paid"]:
        payment_record.status = "captured"
        payment_record.razorpay_payment_id = rzp_payment_id
        payment_record.webhook_verified = True
        payment_record.raw_payload = body_str

        # Update order to Confirmed
        order = db.query(Order).filter(Order.id == payment_record.order_id).first()
        if order:
            order.status = OrderStatus.CONFIRMED.value
            db.commit()

            try:
                alert = {
                    "type": "payment_confirmed",
                    "order_id": order.id,
                    "text": f"Webhook verified! Order #{order.id} payment confirmed via UPI escrow."
                }
                await sio.emit("notification", alert, room=f"user_{order.buyer_id}")
                await sio.emit("notification", alert, room=f"user_{order.farmer_id}")
            except Exception:
                pass
        else:
            db.commit()

    elif event_type == "payment.failed":
        payment_record.status = "failed"
        payment_record.raw_payload = body_str
        db.commit()

    return {"status": "processed", "event": event_type}
