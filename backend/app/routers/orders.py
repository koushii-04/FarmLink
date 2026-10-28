import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Order, Offer, ProduceListing, User, OrderStatus, OfferStatus
from app.schemas import OrderFromOfferCreate, OrderStatusUpdate, OrderResponse
from app.auth import get_current_user, require_role
from app.sockets.negotiation import sio

router = APIRouter(prefix="/orders", tags=["Order Lifecycle Management"])

@router.post("/from-offer/{offer_id}", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order_from_offer(
    offer_id: int,
    payload: OrderFromOfferCreate,
    current_user: User = Depends(require_role(["buyer"])),
    db: Session = Depends(get_db)
):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")

    if offer.buyer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this offer")

    if offer.status != OfferStatus.ACCEPTED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot generate order from offer in state '{offer.status}'. Offer must be 'Accepted'."
        )

    # Check if order already exists for this offer
    existing_order = db.query(Order).filter(Order.offer_id == offer.id).first()
    if existing_order:
        return existing_order

    listing = db.query(ProduceListing).filter(ProduceListing.id == offer.listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated produce listing not found")

    invoice_no = f"INV-FARMLINK-{random.randint(1000, 9999)}"

    order = Order(
        invoice_number=invoice_no,
        offer_id=offer.id,
        buyer_id=offer.buyer_id,
        farmer_id=offer.farmer_id,
        listing_id=listing.id,
        total_amount=offer.total_amount,
        quantity=offer.proposed_quantity,
        unit=listing.unit,
        price_per_unit=offer.proposed_price_per_unit,
        status=OrderStatus.PENDING_PAYMENT.value,
        delivery_address=payload.delivery_address or "Main Campus Delivery Gate 4, Vellore / Chennai Hub, Tamil Nadu - 560064"
    )
    db.add(order)

    # Adjust listing available stock
    if listing.quantity >= offer.proposed_quantity:
        listing.quantity = round(listing.quantity - offer.proposed_quantity, 2)
        if listing.quantity == 0:
            listing.status = "sold_out"

    db.commit()
    db.refresh(order)

    # Notify parties via Socket.io
    try:
        await sio.emit("order_created", {
            "order_id": order.id,
            "invoice_number": order.invoice_number,
            "offer_id": offer.id,
            "status": order.status,
            "total_amount": order.total_amount
        }, room=f"user_{order.farmer_id}")
    except Exception:
        pass

    return order

@router.get("", response_model=List[OrderResponse])
def get_orders(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Order)
    if current_user.role == "farmer":
        query = query.filter(Order.farmer_id == current_user.id)
    else:
        query = query.filter(Order.buyer_id == current_user.id)

    if status_filter:
        query = query.filter(Order.status == status_filter)

    return query.order_by(Order.created_at.desc()).all()

@router.get("/{order_id}", response_model=OrderResponse)
def get_order_by_id(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if current_user.id not in [order.buyer_id, order.farmer_id]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return order

@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if current_user.id not in [order.buyer_id, order.farmer_id]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    target_status = payload.status
    current_status = order.status

    if target_status == OrderStatus.DISPATCHED.value:
        if current_user.role != "farmer":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the farmer can advance an order to 'Dispatched'"
            )
        order.dispatch_notes = payload.dispatch_notes or "Dispatched from farm logistics hub"
        if payload.tracking_number:
            order.tracking_number = payload.tracking_number
        order.status = OrderStatus.DISPATCHED.value

    elif target_status == OrderStatus.DELIVERED.value:
        order.status = OrderStatus.DELIVERED.value

    elif target_status == OrderStatus.CONFIRMED.value:
        order.status = OrderStatus.CONFIRMED.value

    db.commit()
    db.refresh(order)

    # Broadcast status change to both buyer and farmer
    try:
        alert_payload = {
            "type": "order_status_updated",
            "order_id": order.id,
            "status": order.status,
            "text": f"Order #{order.id} status updated to '{order.status}'."
        }
        await sio.emit("notification", alert_payload, room=f"user_{order.buyer_id}")
        await sio.emit("notification", alert_payload, room=f"user_{order.farmer_id}")
    except Exception:
        pass

    return order
