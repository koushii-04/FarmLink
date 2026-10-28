import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean,
    DateTime, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.database import Base

class UserRole(str, enum.Enum):
    FARMER = "farmer"
    BUYER = "buyer"

class QualityGrade(str, enum.Enum):
    GRADE_A = "Grade A"
    GRADE_B = "Grade B"
    GRADE_C = "Grade C"

class ProduceStatus(str, enum.Enum):
    ACTIVE = "active"
    SOLD_OUT = "sold_out"
    INACTIVE = "inactive"

class OfferStatus(str, enum.Enum):
    PENDING = "Pending"
    COUNTERED = "Countered"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"
    EXPIRED = "Expired"

class LastActionParty(str, enum.Enum):
    BUYER = "buyer"
    FARMER = "farmer"

class OrderStatus(str, enum.Enum):
    PENDING_PAYMENT = "Pending Payment"
    CONFIRMED = "Confirmed"
    DISPATCHED = "Dispatched"
    DELIVERED = "Delivered"

class PaymentStatus(str, enum.Enum):
    CREATED = "created"
    CAPTURED = "captured"
    FAILED = "failed"
    REFUNDED = "refunded"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(String(20), nullable=False, index=True)  # 'farmer' or 'buyer'
    organization_name = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    gstin = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    listings = relationship("ProduceListing", back_populates="farmer", cascade="all, delete-orphan")
    buyer_offers = relationship("Offer", foreign_keys="Offer.buyer_id", back_populates="buyer")
    farmer_offers = relationship("Offer", foreign_keys="Offer.farmer_id", back_populates="farmer")
    buyer_orders = relationship("Order", foreign_keys="Order.buyer_id", back_populates="buyer")
    farmer_orders = relationship("Order", foreign_keys="Order.farmer_id", back_populates="farmer")


class ProduceListing(Base):
    __tablename__ = "produce_listings"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False, index=True)  # 'Vegetables', 'Fruits', 'Grains & Pulses', 'Spices & Condiments'
    variety = Column(String(100), nullable=True)  # e.g. Garwa Dark Red / 1121 Pusa
    quantity = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False, default="Kg")
    min_order_quantity = Column(Float, nullable=False, default=1.0)
    base_price_per_unit = Column(Float, nullable=False)
    instant_buy_rate = Column(Float, nullable=True)
    min_floor_price = Column(Float, nullable=True)
    
    # Tiered Quality Specs
    moisture_content = Column(Float, nullable=True, default=9.5)
    size_uniformity = Column(Float, nullable=True, default=92.0)
    shelf_life_days = Column(Integer, nullable=True, default=45)
    pesticide_residue = Column(String(100), nullable=True, default="FSSAI Export Standard")
    packaging_type = Column(String(100), nullable=True, default="50kg Ventilated Jute Bags")
    is_organic = Column(Boolean, default=False)

    location = Column(String(255), nullable=True)
    harvest_date = Column(String(50), nullable=True)
    quality_grade = Column(String(20), nullable=False, index=True)  # 'Grade A', 'Grade B', 'Grade C'
    quality_notes = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    status = Column(String(20), nullable=False, default="active", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    farmer = relationship("User", back_populates="listings")
    offers = relationship("Offer", back_populates="listing", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="listing")


class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("produce_listings.id", ondelete="CASCADE"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    proposed_price_per_unit = Column(Float, nullable=False)
    proposed_quantity = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default="Pending", index=True)  # 'Pending', 'Countered', 'Accepted', 'Rejected', 'Expired'
    last_action_by = Column(String(20), nullable=False)  # 'buyer' or 'farmer'
    last_action_user_id = Column(Integer, nullable=False)
    counter_notes = Column(Text, nullable=True)
    
    # Negotiation messages thread (JSON string containing full history)
    timeline_json = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True, index=True)

    # Relationships
    listing = relationship("ProduceListing", back_populates="offers")
    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="buyer_offers")
    farmer = relationship("User", foreign_keys=[farmer_id], back_populates="farmer_offers")
    order = relationship("Order", back_populates="offer", uselist=False)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, nullable=True)  # e.g. INV-FARMLINK-7093
    offer_id = Column(Integer, ForeignKey("offers.id", ondelete="RESTRICT"), unique=True, nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    farmer_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    listing_id = Column(Integer, ForeignKey("produce_listings.id", ondelete="RESTRICT"), nullable=False)
    total_amount = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False, default="Kg")
    price_per_unit = Column(Float, nullable=False)
    status = Column(String(30), nullable=False, default="Pending Payment", index=True)  # 'Pending Payment', 'Confirmed', 'Dispatched', 'Delivered'
    delivery_address = Column(Text, nullable=True)
    dispatch_notes = Column(Text, nullable=True)
    tracking_number = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    offer = relationship("Offer", back_populates="order")
    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="buyer_orders")
    farmer = relationship("User", foreign_keys=[farmer_id], back_populates="farmer_orders")
    listing = relationship("ProduceListing", back_populates="orders")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    razorpay_order_id = Column(String(100), unique=True, nullable=False, index=True)
    razorpay_payment_id = Column(String(100), nullable=True)
    razorpay_signature = Column(String(255), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(String(30), default="created")  # 'created', 'captured', 'failed', 'refunded'
    payment_method = Column(String(50), default="upi")
    webhook_verified = Column(Boolean, default=False)
    raw_payload = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    order = relationship("Order", back_populates="payments")
