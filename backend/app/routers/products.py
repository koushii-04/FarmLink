from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import ProduceListing, User
from app.schemas import ListingCreate, ListingUpdate, ListingResponse
from app.auth import get_current_user, require_role
import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import ProduceListing, User
from app.schemas import ListingCreate, ListingUpdate, ListingResponse
from app.auth import get_current_user, require_role


router = APIRouter(prefix="/products", tags=["Produce Listings"])

@router.get("", response_model=List[ListingResponse])
def get_products(
    category: Optional[str] = Query(None, description="Filter by crop category"),
    quality_grade: Optional[str] = Query(None, description="Filter by quality tier"),
    search: Optional[str] = Query(None, description="Search by title, variety, description or location"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    status: Optional[str] = Query("active", description="Listing status"),
    sort: Optional[str] = Query("featured", description="Sort order: featured, price_asc, price_desc, qty_desc"),
    db: Session = Depends(get_db)
):
    query = db.query(ProduceListing)

    if status:
        query = query.filter(ProduceListing.status == status)
    if category and category.lower() != "all":
        query = query.filter(ProduceListing.category.ilike(f"%{category}%"))
    if quality_grade and quality_grade.lower() != "all":
        query = query.filter(ProduceListing.quality_grade == quality_grade)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (ProduceListing.title.ilike(search_fmt)) |
            (ProduceListing.variety.ilike(search_fmt)) |
            (ProduceListing.description.ilike(search_fmt)) |
            (ProduceListing.location.ilike(search_fmt))
        )
    if min_price is not None:
        query = query.filter(ProduceListing.base_price_per_unit >= min_price)
    if max_price is not None:
        query = query.filter(ProduceListing.base_price_per_unit <= max_price)

    if sort == "price_asc":
        query = query.order_by(ProduceListing.base_price_per_unit.asc())
    elif sort == "price_desc":
        query = query.order_by(ProduceListing.base_price_per_unit.desc())
    elif sort == "qty_desc":
        query = query.order_by(ProduceListing.quantity.desc())
    else:
        query = query.order_by(ProduceListing.created_at.desc())

    listings = query.all()
    return listings

@router.get("/farmer/my-listings", response_model=List[ListingResponse])
def get_my_listings(
    current_user: User = Depends(require_role(["farmer"])),
    db: Session = Depends(get_db)
):
    return db.query(ProduceListing).filter(
        ProduceListing.farmer_id == current_user.id
    ).order_by(ProduceListing.created_at.desc()).all()

@router.get("/{product_id}", response_model=ListingResponse)
def get_product_by_id(product_id: int, db: Session = Depends(get_db)):
    listing = db.query(ProduceListing).filter(ProduceListing.id == product_id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produce listing not found"
        )
    return listing

@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["farmer"])) # Protect the route!
):
    # Ensure the directory exists
    os.makedirs("static/uploads", exist_ok=True)
    
    # Save the file to the local disk
    # (In production, you would generate a UUID here so files don't overwrite each other)
    file_location = f"static/uploads/{file.filename.replace(' ', '_')}"
    
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    # Return the clean URL path to the frontend
    return {"image_url": f"/{file_location}"}
# -----------------------------

@router.post("", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ListingCreate,
    current_user: User = Depends(require_role(["farmer"])),
    db: Session = Depends(get_db)
):
    listing = ProduceListing(
        farmer_id=current_user.id,
        title=payload.title,
        description=payload.description or f"Direct farm gate batch harvested at {payload.location or current_user.location}.",
        category=payload.category,
        variety=payload.variety,
        quantity=payload.quantity,
        unit=payload.unit or "Kg",
        min_order_quantity=payload.min_order_quantity,
        base_price_per_unit=payload.base_price_per_unit,
        instant_buy_rate=payload.instant_buy_rate,
        min_floor_price=payload.min_floor_price,
        moisture_content=payload.moisture_content,
        size_uniformity=payload.size_uniformity,
        shelf_life_days=payload.shelf_life_days,
        pesticide_residue=payload.pesticide_residue,
        packaging_type=payload.packaging_type,
        is_organic=payload.is_organic or False,
        location=payload.location or current_user.location,
        harvest_date=payload.harvest_date,
        quality_grade=payload.quality_grade,
        quality_notes=payload.quality_notes,
        image_url=payload.image_url,
        status="active"
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing

@router.put("/{product_id}", response_model=ListingResponse)
def update_product(
    product_id: int,
    payload: ListingUpdate,
    current_user: User = Depends(require_role(["farmer"])),
    db: Session = Depends(get_db)
):
    listing = db.query(ProduceListing).filter(ProduceListing.id == product_id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produce listing not found"
        )

    if listing.farmer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this listing"
        )

    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(listing, key, value)

    db.commit()
    db.refresh(listing)
    return listing

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    current_user: User = Depends(require_role(["farmer"])),
    db: Session = Depends(get_db)
):
    listing = db.query(ProduceListing).filter(ProduceListing.id == product_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produce listing not found")

    if listing.farmer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    db.delete(listing)
    db.commit()
    return None
