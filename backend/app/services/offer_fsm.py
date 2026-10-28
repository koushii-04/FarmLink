from datetime import datetime, timedelta
from typing import Tuple
from fastapi import HTTPException, status
from app.models import Offer, User, OfferStatus, LastActionParty
from app.config import settings

class OfferFSMError(HTTPException):
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)

class OfferFSM:
    """
    Finite-State Machine governing negotiation offers.
    Enforces turn-taking and valid state transitions to eliminate race conditions.
    """

    @staticmethod
    def check_and_apply_expiry(offer: Offer) -> bool:
        """Transitions to Expired if untouched beyond the expiration threshold."""
        if offer.status in [OfferStatus.PENDING.value, OfferStatus.COUNTERED.value]:
            if offer.expires_at and datetime.utcnow() >= offer.expires_at:
                offer.status = OfferStatus.EXPIRED.value
                offer.updated_at = datetime.utcnow()
                return True
        return False

    @staticmethod
    def validate_action_turn(offer: Offer, user: User) -> None:
        """
        Enforce strict turn-taking:
        When an offer is submitted or countered, only the counterparty can act next.
        """
        # First verify not in terminal state
        if offer.status in [OfferStatus.ACCEPTED.value, OfferStatus.REJECTED.value, OfferStatus.EXPIRED.value]:
            raise OfferFSMError(
                f"Offer is already in terminal state '{offer.status}'. No further transitions permitted."
            )

        # Check user association
        if user.id not in [offer.buyer_id, offer.farmer_id]:
            raise OfferFSMError("User is neither the buyer nor the farmer associated with this offer.", status_code=status.HTTP_403_FORBIDDEN)

        # Check turn-taking
        if offer.last_action_user_id == user.id:
            raise OfferFSMError(
                "Turn violation: You submitted the last proposal. Waiting for the counterparty to respond."
            )

        expected_role = "farmer" if offer.last_action_by == "buyer" else "buyer"
        if user.role != expected_role:
            raise OfferFSMError(
                f"Turn violation: Current turn belongs to the {expected_role}."
            )

    @classmethod
    def apply_counter(
        cls,
        offer: Offer,
        user: User,
        new_price: float,
        new_quantity: float,
        notes: str = None
    ) -> Offer:
        """Transition state to Countered with strict turn validation"""
        cls.check_and_apply_expiry(offer)
        cls.validate_action_turn(offer, user)

        if new_price <= 0 or new_quantity <= 0:
            raise OfferFSMError("Price and quantity must be positive non-zero numbers.")

        offer.status = OfferStatus.COUNTERED.value
        offer.proposed_price_per_unit = new_price
        offer.proposed_quantity = new_quantity
        offer.total_amount = round(new_price * new_quantity, 2)
        offer.last_action_by = user.role
        offer.last_action_user_id = user.id
        offer.counter_notes = notes
        offer.updated_at = datetime.utcnow()
        offer.expires_at = datetime.utcnow() + timedelta(hours=settings.OFFER_EXPIRY_HOURS)
        return offer

    @classmethod
    def apply_accept(cls, offer: Offer, user: User) -> Offer:
        """Locks the deal into Accepted state"""
        cls.check_and_apply_expiry(offer)
        cls.validate_action_turn(offer, user)

        offer.status = OfferStatus.ACCEPTED.value
        offer.last_action_by = user.role
        offer.last_action_user_id = user.id
        offer.updated_at = datetime.utcnow()
        return offer

    @classmethod
    def apply_reject(cls, offer: Offer, user: User, reason: str = None) -> Offer:
        """Rejects the offer deal"""
        cls.check_and_apply_expiry(offer)
        cls.validate_action_turn(offer, user)

        offer.status = OfferStatus.REJECTED.value
        offer.last_action_by = user.role
        offer.last_action_user_id = user.id
        if reason:
            offer.counter_notes = f"Rejected: {reason}"
        offer.updated_at = datetime.utcnow()
        return offer
