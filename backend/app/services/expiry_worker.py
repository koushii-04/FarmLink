import asyncio
import logging
from datetime import datetime
from app.database import SessionLocal
from app.models import Offer, OfferStatus

logger = logging.getLogger("farmlink.expiry")

async def run_expiry_checker(sio=None, interval_seconds: int = 60):
    """
    Periodically checks for negotiation offers that exceeded the 24-hour expiry threshold
    and transitions them automatically to Expired.
    """
    logger.info("Offer Expiry Worker initialized.")
    while True:
        try:
            await asyncio.sleep(interval_seconds)
            now = datetime.utcnow()
            db = SessionLocal()
            try:
                expired_offers = db.query(Offer).filter(
                    Offer.status.in_([OfferStatus.PENDING.value, OfferStatus.COUNTERED.value]),
                    Offer.expires_at <= now
                ).all()

                for offer in expired_offers:
                    offer.status = OfferStatus.EXPIRED.value
                    offer.updated_at = now
                    logger.info(f"Offer #{offer.id} automatically transitioned to Expired.")
                    db.commit()

                    if sio:
                        payload = {
                            "offer_id": offer.id,
                            "status": offer.status,
                            "message": "Offer expired after 24 hours of inactivity."
                        }
                        await sio.emit("offer_updated", payload, room=f"offer_{offer.id}")
                        await sio.emit("notification", {
                            "type": "offer_expired",
                            "offer_id": offer.id,
                            "text": f"Offer #{offer.id} has expired."
                        }, room=f"user_{offer.buyer_id}")
                        await sio.emit("notification", {
                            "type": "offer_expired",
                            "offer_id": offer.id,
                            "text": f"Offer #{offer.id} has expired."
                        }, room=f"user_{offer.farmer_id}")
            except Exception as e:
                logger.error(f"Error during expiry check: {e}")
                db.rollback()
            finally:
                db.close()
        except asyncio.CancelledError:
            logger.info("Expiry worker stopping...")
            break
        except Exception as e:
            logger.error(f"Unexpected expiry loop error: {e}")
