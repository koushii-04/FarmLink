import os
from fastapi.staticfiles import StaticFiles
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from app.config import settings
from app.database import engine, Base
from app.sockets.negotiation import sio
from app.routers import (
    auth_router,
    products_router,
    offers_router,
    orders_router,
    payments_router
)
from app.seed import seed_database
from app.services.expiry_worker import run_expiry_checker

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("farmlink.main")

expiry_task = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup sequence
    logger.info("FarmLink backend starting up...")
    Base.metadata.create_all(bind=engine)
    seed_database()

    # Launch background negotiation expiry checker
    global expiry_task
    expiry_task = asyncio.create_task(run_expiry_checker(sio, interval_seconds=30))
    logger.info("Negotiation Expiry task scheduled.")

    yield

    # Shutdown sequence
    logger.info("FarmLink backend shutting down...")
    if expiry_task:
        expiry_task.cancel()
        try:
            await expiry_task
        except asyncio.CancelledError:
            pass

# Initialize FastAPI core
fastapi_app = FastAPI(
    title="FarmLink API",
    description="Multi-sided Digital Marketplace connecting local farmers with institutional bulk buyers",
    version="1.0.0",
    lifespan=lifespan
)
# --- ADD THIS BLOCK RIGHT HERE ---
# Create the uploads folder automatically if it doesn't exist
os.makedirs("static/uploads", exist_ok=True)
# Tell FastAPI to serve files from this folder to the web
fastapi_app.mount("/static", StaticFiles(directory="static"), name="static")

# CORS Middleware
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local React client during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST Routers
fastapi_app.include_router(auth_router)
fastapi_app.include_router(products_router)
fastapi_app.include_router(offers_router)
fastapi_app.include_router(orders_router)
fastapi_app.include_router(payments_router)

@fastapi_app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": "FarmLink API",
        "version": "1.0.0",
        "database": engine.url.drivername
    }

# Wrap FastAPI with ASGI Socket.io server
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
