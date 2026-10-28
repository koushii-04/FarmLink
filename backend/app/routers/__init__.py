from app.routers.auth import router as auth_router
from app.routers.products import router as products_router
from app.routers.offers import router as offers_router
from app.routers.orders import router as orders_router
from app.routers.payments import router as payments_router

__all__ = [
    "auth_router",
    "products_router",
    "offers_router",
    "orders_router",
    "payments_router"
]
