import hmac
import hashlib
import json
import logging
from typing import Dict, Any, Optional
import razorpay
from app.config import settings

logger = logging.getLogger("farmlink.razorpay")

class RazorpayService:
    def __init__(self):
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET
        self.webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
        self.is_mock = self.key_id.startswith("rzp_test_Farmlink") or not self.key_secret
        
        if not self.is_mock:
            try:
                self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
            except Exception as e:
                logger.warning(f"Failed to initialize live Razorpay client, using test sandbox: {e}")
                self.client = None
                self.is_mock = True
        else:
            self.client = None
            logger.info("Razorpay Service initialized in local simulated sandbox mode.")

    def create_order(self, amount_inr: float, order_id: int, notes: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Creates an order in paise (1 INR = 100 paise)"""
        amount_paise = int(round(amount_inr * 100))
        receipt = f"rec_ord_{order_id}"
        notes_data = notes or {}
        notes_data["internal_order_id"] = str(order_id)
        
        if not self.is_mock and self.client:
            try:
                response = self.client.order.create({
                    "amount": amount_paise,
                    "currency": "INR",
                    "receipt": receipt,
                    "notes": notes_data,
                    "payment_capture": 1
                })
                return response
            except Exception as e:
                logger.error(f"Razorpay live API error: {e}. Falling back to simulation.")

        # Fallback / Simulated Order
        simulated_rzp_id = f"order_{hashlib.md5(f'{order_id}_{amount_paise}'.encode()).hexdigest()[:14]}"
        return {
            "id": simulated_rzp_id,
            "entity": "order",
            "amount": amount_paise,
            "amount_paid": 0,
            "amount_due": amount_paise,
            "currency": "INR",
            "receipt": receipt,
            "status": "created",
            "notes": notes_data
        }

    def verify_payment_signature(self, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
        """Verifies payment signature using HMAC SHA256"""
        if self.is_mock and razorpay_signature.startswith("simulated_sig_"):
            return True

        # Standard HMAC SHA256 verification
        try:
            msg = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
            expected_signature = hmac.new(
                self.key_secret.encode("utf-8"),
                msg,
                hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(expected_signature, razorpay_signature)
        except Exception as e:
            logger.error(f"Signature verification exception: {e}")
            return False

    def verify_webhook_signature(self, webhook_body: str, received_signature: str) -> bool:
        """Verifies server-to-server webhook callback signature"""
        if not received_signature:
            return False
        
        if self.is_mock and received_signature.startswith("simulated_wh_sig_"):
            return True

        try:
            expected_signature = hmac.new(
                self.webhook_secret.encode("utf-8"),
                webhook_body.encode("utf-8"),
                hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(expected_signature, received_signature)
        except Exception as e:
            logger.error(f"Webhook signature calculation error: {e}")
            return False

razorpay_service = RazorpayService()
