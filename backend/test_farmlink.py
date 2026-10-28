import time
import pytest
from fastapi.testclient import TestClient
from app.main import fastapi_app
from app.database import Base, engine, SessionLocal
from app.models import User, ProduceListing, Offer, Order, Payment

client = TestClient(fastapi_app)

def setup_module():
    Base.metadata.create_all(bind=engine)

def test_full_farmlink_e2e_flow():
    ts = int(time.time())
    # 1. Sign up Farmer
    farmer_signup = client.post("/auth/signup", json={
        "email": f"test_farmer_{ts}@farmer.com",
        "password": "securepassword123",
        "full_name": "Kishan Rao",
        "phone": "+91 91234 56789",
        "role": "farmer",
        "organization_name": "Rao Agri Co-op",
        "location": "Guntur, Andhra Pradesh"
    })
    assert farmer_signup.status_code == 201, farmer_signup.text
    farmer_token = farmer_signup.json()["access_token"]
    farmer_headers = {"Authorization": f"Bearer {farmer_token}"}

    # 2. Sign up Institutional Buyer
    buyer_signup = client.post("/auth/signup", json={
        "email": f"test_buyer_{ts}@buyer.com",
        "password": "securepassword123",
        "full_name": "Sunita Menon",
        "phone": "+91 98765 11223",
        "role": "buyer",
        "organization_name": "BigBasket Institutional",
        "location": "Hyderabad, Telangana"
    })
    assert buyer_signup.status_code == 201, buyer_signup.text
    buyer_token = buyer_signup.json()["access_token"]
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    # 3. Farmer creates a Produce Listing with Grade A quality tier
    listing_res = client.post("/products", headers=farmer_headers, json={
        "title": "Guntur Teja S17 Red Chillies",
        "description": "High pungency SHU 75,000 sun dried whole red chillies.",
        "category": "Spices & Condiments",
        "quantity": 3000.0,
        "unit": "Kg",
        "min_order_quantity": 200.0,
        "base_price_per_unit": 190.0,
        "location": "Guntur APMC",
        "harvest_date": "2026-10-15",
        "quality_grade": "Grade A",
        "quality_notes": "Uniform bright red color, moisture <10%, stalkless.",
        "image_url": "https://example.com/chillies.jpg"
    })
    assert listing_res.status_code == 201, listing_res.text
    listing_id = listing_res.json()["id"]

    # 4. Buyer discovers products & filters by Grade A and Spices
    browse_res = client.get("/products?category=Spices&quality_grade=Grade A")
    assert browse_res.status_code == 200
    assert any(p["id"] == listing_id for p in browse_res.json())

    # 5. Buyer initiates negotiation (Make an Offer)
    offer_res = client.post("/offers", headers=buyer_headers, json={
        "listing_id": listing_id,
        "proposed_price_per_unit": 175.0,
        "proposed_quantity": 500.0,
        "counter_notes": "Requesting 175/kg for 500kg bulk delivery to Hyderabad warehouse."
    })
    assert offer_res.status_code == 201, offer_res.text
    offer_data = offer_res.json()
    offer_id = offer_data["id"]
    assert offer_data["status"] == "Pending"
    assert offer_data["last_action_by"] == "buyer"

    # 6. Strict Turn-Taking Test: Buyer attempts to counter their own proposal immediately
    # -> MUST FAIL with Turn violation!
    turn_violation_res = client.post(f"/offers/{offer_id}/counter", headers=buyer_headers, json={
        "proposed_price_per_unit": 176.0,
        "proposed_quantity": 500.0
    })
    assert turn_violation_res.status_code == 400
    assert "Turn violation" in turn_violation_res.json()["detail"]

    # 7. Farmer counters proposal with a new price
    counter_res = client.post(f"/offers/{offer_id}/counter", headers=farmer_headers, json={
        "proposed_price_per_unit": 182.0,
        "proposed_quantity": 500.0,
        "counter_notes": "Can do 182/kg loaded on truck."
    })
    assert counter_res.status_code == 200, counter_res.text
    assert counter_res.json()["status"] == "Countered"
    assert counter_res.json()["proposed_price_per_unit"] == 182.0
    assert counter_res.json()["last_action_by"] == "farmer"

    # 8. Strict Turn-Taking Test: Farmer attempts to accept or counter again consecutively
    # -> MUST FAIL with Turn violation!
    double_farmer_res = client.post(f"/offers/{offer_id}/accept", headers=farmer_headers)
    assert double_farmer_res.status_code == 400
    assert "Turn violation" in double_farmer_res.json()["detail"]

    # 9. Buyer accepts the counter proposal -> Deal Locked!
    accept_res = client.post(f"/offers/{offer_id}/accept", headers=buyer_headers)
    assert accept_res.status_code == 200, accept_res.text
    assert accept_res.json()["status"] == "Accepted"

    # 10. Attempting any further transition on an Accepted offer -> MUST FAIL (terminal state)
    terminal_res = client.post(f"/offers/{offer_id}/counter", headers=farmer_headers, json={
        "proposed_price_per_unit": 185.0,
        "proposed_quantity": 500.0
    })
    assert terminal_res.status_code == 400
    assert "terminal state" in terminal_res.json()["detail"]

    # 11. Generate Order from Accepted Offer
    order_res = client.post(f"/orders/from-offer/{offer_id}", headers=buyer_headers, json={
        "delivery_address": "BigBasket Central DC, Shamshabad, Hyderabad"
    })
    assert order_res.status_code == 201, order_res.text
    order_data = order_res.json()
    order_id = order_data["id"]
    assert order_data["status"] == "Pending Payment"
    assert order_data["total_amount"] == 182.0 * 500.0

    # 12. Initiate Razorpay Payment Session
    payment_init_res = client.post("/payments/initiate", headers=buyer_headers, json={
        "order_id": order_id
    })
    assert payment_init_res.status_code == 200, payment_init_res.text
    rzp_order_id = payment_init_res.json()["razorpay_order_id"]
    assert rzp_order_id is not None

    # 13. Reconcile via Server-to-Server Webhook Callback (with signature validation)
    webhook_payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": f"pay_test_{order_id}",
                    "order_id": rzp_order_id,
                    "amount": int(order_data["total_amount"] * 100),
                    "currency": "INR",
                    "status": "captured",
                    "method": "upi"
                }
            }
        }
    }
    webhook_res = client.post(
        "/payments/webhook",
        json=webhook_payload,
        headers={"X-Razorpay-Signature": "simulated_wh_sig_valid"}
    )
    assert webhook_res.status_code == 200, webhook_res.text
    assert webhook_res.json()["status"] == "processed"

    # Check order is now Confirmed
    order_check = client.get(f"/orders/{order_id}", headers=buyer_headers)
    assert order_check.json()["status"] == "Confirmed"

    # 14. Advance Order Delivery Lifecycle: Farmer dispatches order with tracking
    dispatch_res = client.patch(f"/orders/{order_id}/status", headers=farmer_headers, json={
        "status": "Dispatched",
        "tracking_number": "AP-09-TR-7788",
        "dispatch_notes": "Shipped via Guntur Cold Freight Logistics"
    })
    assert dispatch_res.status_code == 200, dispatch_res.text
    assert dispatch_res.json()["status"] == "Dispatched"
    assert dispatch_res.json()["tracking_number"] == "AP-09-TR-7788"

    # 15. Advance Order Delivery Lifecycle: Delivery Confirmation
    delivered_res = client.patch(f"/orders/{order_id}/status", headers=buyer_headers, json={
        "status": "Delivered"
    })
    assert delivered_res.status_code == 200, delivered_res.text
    assert delivered_res.json()["status"] == "Delivered"

    print("\n[SUCCESS] Entire FarmLink End-to-End Test Suite Passed Flawlessly!")

if __name__ == "__main__":
    test_full_farmlink_e2e_flow()
