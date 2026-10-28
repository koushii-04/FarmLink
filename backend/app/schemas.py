from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime

# --- User Schemas ---
class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    phone: Optional[str] = None
    role: str = Field(..., pattern="^(farmer|buyer)$")
    organization_name: Optional[str] = None
    location: Optional[str] = None
    gstin: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    organization_name: Optional[str] = None
    location: Optional[str] = None
    gstin: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Produce Listing Schemas ---
class ListingCreate(BaseModel):
    title: str = Field(..., min_length=2)
    description: Optional[str] = None
    category: str = Field(..., description="Vegetables, Fruits, Grains & Pulses, Spices & Condiments, Oilseeds")
    variety: Optional[str] = None
    quantity: float = Field(..., gt=0)
    unit: str = Field(default="Kg")
    min_order_quantity: float = Field(default=1.0, gt=0)
    base_price_per_unit: float = Field(..., gt=0)
    instant_buy_rate: Optional[float] = None
    min_floor_price: Optional[float] = None
    
    # Tiered Specs
    moisture_content: Optional[float] = 9.5
    size_uniformity: Optional[float] = 92.0
    shelf_life_days: Optional[int] = 45
    pesticide_residue: Optional[str] = "FSSAI Export Standard"
    packaging_type: Optional[str] = "50kg Ventilated Jute Bags"
    is_organic: Optional[bool] = False

    location: Optional[str] = None
    harvest_date: Optional[str] = None
    quality_grade: str = Field(..., pattern="^(Grade A|Grade B|Grade C)$")
    quality_notes: Optional[str] = None
    image_url: Optional[str] = None

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    variety: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    min_order_quantity: Optional[float] = None
    base_price_per_unit: Optional[float] = None
    instant_buy_rate: Optional[float] = None
    min_floor_price: Optional[float] = None
    moisture_content: Optional[float] = None
    size_uniformity: Optional[float] = None
    shelf_life_days: Optional[int] = None
    pesticide_residue: Optional[str] = None
    packaging_type: Optional[str] = None
    is_organic: Optional[bool] = None
    location: Optional[str] = None
    harvest_date: Optional[str] = None
    quality_grade: Optional[str] = Field(None, pattern="^(Grade A|Grade B|Grade C)$")
    quality_notes: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|sold_out|inactive)$")

class ListingResponse(BaseModel):
    id: int
    farmer_id: int
    title: str
    description: Optional[str] = None
    category: str
    variety: Optional[str] = None
    quantity: float
    unit: str
    min_order_quantity: float
    base_price_per_unit: float
    instant_buy_rate: Optional[float] = None
    min_floor_price: Optional[float] = None
    moisture_content: Optional[float] = None
    size_uniformity: Optional[float] = None
    shelf_life_days: Optional[int] = None
    pesticide_residue: Optional[str] = None
    packaging_type: Optional[str] = None
    is_organic: Optional[bool] = None
    location: Optional[str] = None
    harvest_date: Optional[str] = None
    quality_grade: str
    quality_notes: Optional[str] = None
    image_url: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    farmer: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# --- Offer / Negotiation Schemas ---
class OfferCreate(BaseModel):
    listing_id: int
    proposed_price_per_unit: float = Field(..., gt=0)
    proposed_quantity: float = Field(..., gt=0)
    counter_notes: Optional[str] = None

class OfferCounter(BaseModel):
    proposed_price_per_unit: float = Field(..., gt=0)
    proposed_quantity: float = Field(..., gt=0)
    counter_notes: Optional[str] = None

class OfferResponse(BaseModel):
    id: int
    listing_id: int
    buyer_id: int
    farmer_id: int
    proposed_price_per_unit: float
    proposed_quantity: float
    total_amount: float
    status: str
    last_action_by: str
    last_action_user_id: int
    counter_notes: Optional[str] = None
    timeline_json: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    listing: Optional[ListingResponse] = None
    buyer: Optional[UserResponse] = None
    farmer: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# --- Order Schemas ---
class OrderFromOfferCreate(BaseModel):
    delivery_address: Optional[str] = "Main Campus Delivery Gate 4, Vellore / Chennai Hub, Tamil Nadu - 560064"

class OrderStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(Pending Payment|Confirmed|Dispatched|Delivered)$")
    dispatch_notes: Optional[str] = None
    tracking_number: Optional[str] = None

class OrderResponse(BaseModel):
    id: int
    invoice_number: Optional[str] = None
    offer_id: int
    buyer_id: int
    farmer_id: int
    listing_id: int
    total_amount: float
    quantity: float
    unit: str
    price_per_unit: float
    status: str
    delivery_address: Optional[str] = None
    dispatch_notes: Optional[str] = None
    tracking_number: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    listing: Optional[ListingResponse] = None
    buyer: Optional[UserResponse] = None
    farmer: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# --- Payment Schemas ---
class PaymentInitiateRequest(BaseModel):
    order_id: int

class PaymentInitiateResponse(BaseModel):
    razorpay_order_id: str
    amount: float
    currency: str
    key_id: str
    order_id: int
    notes: Optional[dict] = None

class PaymentVerifyRequest(BaseModel):
    order_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class PaymentResponse(BaseModel):
    id: int
    order_id: int
    razorpay_order_id: str
    razorpay_payment_id: Optional[str] = None
    amount: float
    currency: str
    status: str
    payment_method: str
    webhook_verified: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
