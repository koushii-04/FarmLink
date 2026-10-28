import json
import logging
from datetime import datetime, timedelta
from app.database import SessionLocal, Base, engine
from app.models import (
    User, ProduceListing, Offer, Order, Payment,
    OfferStatus, OrderStatus
)
from app.auth import get_password_hash

logger = logging.getLogger("farmlink.seed")
logging.basicConfig(level=logging.INFO)

def seed_database(force: bool = False):
    logger.info("Initializing tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if not force and db.query(User).count() > 0:
            logger.info("Database already seeded. Skipping initial data injection.")
            return

        # If forcing reseeding, clear old records
        if force:
            db.query(Payment).delete()
            db.query(Order).delete()
            db.query(Offer).delete()
            db.query(ProduceListing).delete()
            db.query(User).delete()
            db.commit()

        logger.info("Seeding realistic visual matching sample data...")

        # 1. Create Core Users matching Screenshots
        farmer1 = User(
            email="ramesh@farmer.com",
            hashed_password=get_password_hash("password123"),
            full_name='Rameshwar "Ramesh" Patil',
            phone="+91 98224 81720",
            role="farmer",
            organization_name="Patil Organic & Agro Farms",
            location="Lasalgaon, Nashik, Maharashtra - 422306"
        )
        farmer2 = User(
            email="gurpreet@farmer.com",
            hashed_password=get_password_hash("password123"),
            full_name="Kisan Singh",
            phone="+91 98765 43210",
            role="farmer",
            organization_name="Kisan's Farm",
            location="Nashik, Maharashtra, Maharashtra - 422306"
        )
        farmer3 = User(
            email="himachal@farmer.com",
            hashed_password=get_password_hash("password123"),
            full_name="Rajinder Sharma",
            phone="+91 98160 55443",
            role="farmer",
            organization_name="Himachal Valley Apple Orchards",
            location="Shimla, Himachal Pradesh - 171001"
        )
        farmer4 = User(
            email="kolar@farmer.com",
            hashed_password=get_password_hash("password123"),
            full_name="Venkatesh Reddy",
            phone="+91 94480 33221",
            role="farmer",
            organization_name="Kolar GreenFields Agro",
            location="Kolar APMC Mandi, Karnataka - 563101"
        )
        farmer5 = User(
            email="rao@farmer.com",
            hashed_password=get_password_hash("password123"),
            full_name="Kishan Rao",
            phone="+91 91234 56789",
            role="farmer",
            organization_name="Rao Agri Co-op",
            location="Guntur, Andhra Pradesh - 522004"
        )

        buyer1 = User(
            email="ananya@buyer.com",
            hashed_password=get_password_hash("password123"),
            full_name="Ananya Sharma (Procurement Head)",
            phone="+91 98765 88990",
            role="buyer",
            organization_name="GreenFork Kitchens & University Hostels",
            location="Vellore / Chennai Hub, Tamil Nadu - 560064",
            gstin="33AABCU9603R1ZM"
        )
        buyer2 = User(
            email="varun@buyer.com",
            hashed_password=get_password_hash("password123"),
            full_name="Varun",
            phone="+91 98765 43210",
            role="buyer",
            organization_name="Varun Foods",
            location="Chennai, Tamil Nadu - 560064",
            gstin="29AACVFR45"
        )

        db.add_all([farmer1, farmer2, farmer3, farmer4, farmer5, buyer1, buyer2])
        db.commit()
        for u in [farmer1, farmer2, farmer3, farmer4, buyer1, buyer2]:
            db.refresh(u)

        # 2. Create Produce Listings matching images
        listings = [
            # 1. Nashik Red Onions (Exact Match)
            ProduceListing(
                farmer_id=farmer1.id,
                title="Nashik Premium Red Onions (Garwa Summer Crop)",
                variety="Garwa Dark Red",
                category="Vegetables",
                quantity=2500.0,
                unit="Kg",
                min_order_quantity=100.0,
                base_price_per_unit=24.0,
                instant_buy_rate=23.0,
                min_floor_price=20.0,
                moisture_content=9.5,
                size_uniformity=92.0,
                shelf_life_days=45,
                pesticide_residue="FSSAI Export Standard",
                packaging_type="50kg Ventilated Jute Bags",
                is_organic=True,
                location="Lasalgaon, Nashik",
                harvest_date="2026-08-20",
                quality_grade="Grade A",
                quality_notes="Top-tier Garwa Summer crop with 90-day storage guarantee and aerated jute bagging. Certified zero sprout.",
                image_url="https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80",
                status="active"
            ),
            # 2. Shimla Apples (Exact Match)
            ProduceListing(
                farmer_id=farmer3.id,
                title="Shimla Royal Delicious Organic Apples",
                variety="Royal Delicious",
                category="Fruits",
                quantity=1500.0,
                unit="Kg",
                min_order_quantity=100.0,
                base_price_per_unit=85.0,
                instant_buy_rate=82.0,
                min_floor_price=72.0,
                moisture_content=84.0,
                size_uniformity=95.0,
                shelf_life_days=60,
                pesticide_residue="FSSAI Export Standard",
                packaging_type="20kg Corrugated Boxes with Trays",
                is_organic=True,
                location="Kotgarh / Shimla, HP",
                harvest_date="2026-08-25",
                quality_grade="Grade A",
                quality_notes="Crisp orchard pick, natural high-altitude wax bloom, deep scarlet coloration, TSS 15° Brix.",
                image_url="https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80",
                status="active"
            ),
            # 3. Basmati Rice (Exact Match)
            ProduceListing(
                farmer_id=farmer2.id,
                title="Punjab Traditional 1121 Pusa Basmati Rice",
                variety="1121 Pusa",
                category="Grains & Pulses",
                quantity=8000.0,
                unit="Kg",
                min_order_quantity=50.0,
                base_price_per_unit=92.0,
                instant_buy_rate=89.0,
                min_floor_price=85.0,
                moisture_content=11.8,
                size_uniformity=98.0,
                shelf_life_days=365,
                pesticide_residue="FSSAI Export Standard",
                packaging_type="25kg Non-Woven Poly Bags",
                is_organic=False,
                location="Taraori, Punjab Regional Mandi",
                harvest_date="2026-01-15",
                quality_grade="Grade A",
                quality_notes="Aged 18 months, raw slender grain length 8.35mm, expands 2.5x on cooking with rich aroma.",
                image_url="https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
                status="active"
            ),
            # 4. Kolar Tomatoes (Exact Match)
            ProduceListing(
                farmer_id=farmer4.id,
                title="Kolar Hybrid Table & Puree Tomatoes",
                variety="Hybrid Roma Plum",
                category="Vegetables",
                quantity=3500.0,
                unit="Kg",
                min_order_quantity=200.0,
                base_price_per_unit=28.0,
                instant_buy_rate=26.0,
                min_floor_price=22.0,
                moisture_content=93.5,
                size_uniformity=88.0,
                shelf_life_days=18,
                pesticide_residue="FSSAI Export Standard",
                packaging_type="25kg Plastic Crates",
                is_organic=False,
                location="Kolar Mandi, Karnataka",
                harvest_date="2026-08-27",
                quality_grade="Grade B",
                quality_notes="Thick skin, firm pulp, high lycopene solids 5.2% ideal for commercial purees and gravies.",
                image_url="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80",
                status="active"
            ),
            # 5. Guntur Chillies
            ProduceListing(
                farmer_id=farmer1.id,
                title="Guntur Teja S17 Whole Red Chillies",
                variety="Teja S17",
                category="Spices & Condiments",
                quantity=1200.0,
                unit="Kg",
                min_order_quantity=50.0,
                base_price_per_unit=190.0,
                instant_buy_rate=185.0,
                min_floor_price=170.0,
                moisture_content=9.0,
                size_uniformity=94.0,
                shelf_life_days=180,
                pesticide_residue="FSSAI Export Standard",
                packaging_type="30kg Jute Gunny Bags",
                is_organic=True,
                location="Guntur APMC, Andhra Pradesh",
                harvest_date="2026-07-15",
                quality_grade="Grade A",
                quality_notes="Sun dried, intense heat 75,000 SHU, natural red colour value ASTA 65.",
                image_url="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80",
                status="active"
            )
        ]
        db.add_all(listings)
        db.commit()
        for l in listings:
            db.refresh(l)

        # 3. Create Sample Negotiations matching Image 5
        # Offer 1: Nashik Red Onions (Accepted with Exact Text from Image 5)
        timeline_1 = [
            {
                "type": "initial",
                "sender_role": "buyer",
                "sender_name": "Ananya Sharma",
                "sender_org": "GreenFork Kitchens & University Hostels",
                "proposed_price": 19.0,
                "proposed_quantity": 2000.0,
                "total_amount": 38000.0,
                "text": "Greetings Rameshwar ji! We manage university dining kitchens across campus hostels. We require 2,000 Kg of Grade A onions and would like to propose ₹19/Kg with immediate UPI escrow lock.",
                "timestamp": "07:45 pm",
                "date_str": "28 Aug, 07:45 pm"
            },
            {
                "type": "counter",
                "sender_role": "farmer",
                "sender_name": 'Rameshwar "Ramesh" Patil',
                "sender_org": "Patil Organic & Agro Farms",
                "proposed_price": 21.0,
                "proposed_quantity": 2000.0,
                "total_amount": 42000.0,
                "text": "Namaste Ananya ji. Our onions are top-tier Garwa Summer crop with 90-day storage guarantee and aerated jute bagging. The lowest I can do for 2,000 Kg is ₹21/Kg, which saves you 25% vs local APMC mandi wholesale.",
                "timestamp": "05:00 pm",
                "date_str": "28 Aug, 05:00 pm"
            },
            {
                "type": "accepted",
                "sender_role": "buyer",
                "sender_name": "Ananya Sharma",
                "sender_org": "GreenFork Kitchens & University Hostels",
                "proposed_price": 21.0,
                "proposed_quantity": 2000.0,
                "total_amount": 42000.0,
                "text": "Agreed at ₹21/Kg for 2,000 Kgs. Deal locked in escrow.",
                "timestamp": "05:15 pm",
                "date_str": "28 Aug, 05:15 pm"
            }
        ]

        offer1 = Offer(
            listing_id=listings[0].id,
            buyer_id=buyer1.id,
            farmer_id=farmer1.id,
            proposed_price_per_unit=21.0,
            proposed_quantity=2000.0,
            total_amount=42000.0,
            status=OfferStatus.ACCEPTED.value,
            last_action_by="buyer",
            last_action_user_id=buyer1.id,
            counter_notes="Agreed at ₹21/Kg for 2,000 Kgs. Deal locked in escrow.",
            timeline_json=json.dumps(timeline_1),
            expires_at=datetime.utcnow() + timedelta(hours=22)
        )

        # Offer 2: Shimla Apples (Accepted at ₹74/Kg, 500 Kgs)
        timeline_2 = [
            {
                "type": "initial",
                "sender_role": "buyer",
                "sender_name": "Ananya Sharma",
                "sender_org": "GreenFork Kitchens & University Hostels",
                "proposed_price": 70.0,
                "proposed_quantity": 500.0,
                "total_amount": 35000.0,
                "text": "Procuring for hostel mess breakfast. Requesting ₹70/Kg for 500 Kgs apples.",
                "timestamp": "11:20 am",
                "date_str": "27 Aug, 11:20 am"
            },
            {
                "type": "counter",
                "sender_role": "farmer",
                "sender_name": "Rajinder Sharma",
                "sender_org": "Himachal Valley Apple Orchards",
                "proposed_price": 74.0,
                "proposed_quantity": 500.0,
                "total_amount": 37000.0,
                "text": "Best price loaded in Kotgarh is ₹74/Kg with foam netting.",
                "timestamp": "02:15 pm",
                "date_str": "27 Aug, 02:15 pm"
            },
            {
                "type": "accepted",
                "sender_role": "buyer",
                "sender_name": "Ananya Sharma",
                "sender_org": "GreenFork Kitchens & University Hostels",
                "proposed_price": 74.0,
                "proposed_quantity": 500.0,
                "total_amount": 37000.0,
                "text": "Accepted at ₹74/Kg. Please prepare shipment.",
                "timestamp": "03:00 pm",
                "date_str": "27 Aug, 03:00 pm"
            }
        ]

        offer2 = Offer(
            listing_id=listings[1].id,
            buyer_id=buyer1.id,
            farmer_id=farmer3.id,
            proposed_price_per_unit=74.0,
            proposed_quantity=500.0,
            total_amount=37000.0,
            status=OfferStatus.ACCEPTED.value,
            last_action_by="buyer",
            last_action_user_id=buyer1.id,
            counter_notes="Accepted deal at ₹74/Kg.",
            timeline_json=json.dumps(timeline_2),
            expires_at=datetime.utcnow() + timedelta(hours=19)
        )

        # Offer 3: Kolar Tomatoes (Accepted at ₹19/Kg, 2000 Kgs)
        timeline_3 = [
            {
                "type": "initial",
                "sender_role": "buyer",
                "sender_name": "Ananya Sharma",
                "sender_org": "GreenFork Kitchens & University Hostels",
                "proposed_price": 18.0,
                "proposed_quantity": 2000.0,
                "total_amount": 36000.0,
                "text": "Bulk tomato requirement for central kitchen. Proposing ₹18/Kg.",
                "timestamp": "09:00 am",
                "date_str": "26 Aug, 09:00 am"
            },
            {
                "type": "counter",
                "sender_role": "farmer",
                "sender_name": "Venkatesh Reddy",
                "sender_org": "Kolar GreenFields Agro",
                "proposed_price": 19.0,
                "proposed_quantity": 2000.0,
                "total_amount": 38000.0,
                "text": "Settle at ₹19/Kg in sanitized plastic crates.",
                "timestamp": "11:30 am",
                "date_str": "26 Aug, 11:30 am"
            },
            {
                "type": "accepted",
                "sender_role": "buyer",
                "sender_name": "Ananya Sharma",
                "sender_org": "GreenFork Kitchens & University Hostels",
                "proposed_price": 19.0,
                "proposed_quantity": 2000.0,
                "total_amount": 38000.0,
                "text": "Accepted at ₹19/Kg.",
                "timestamp": "12:10 pm",
                "date_str": "26 Aug, 12:10 pm"
            }
        ]

        offer3 = Offer(
            listing_id=listings[3].id,
            buyer_id=buyer1.id,
            farmer_id=farmer4.id,
            proposed_price_per_unit=19.0,
            proposed_quantity=2000.0,
            total_amount=38000.0,
            status=OfferStatus.ACCEPTED.value,
            last_action_by="buyer",
            last_action_user_id=buyer1.id,
            counter_notes="Accepted deal at ₹19/Kg.",
            timeline_json=json.dumps(timeline_3),
            expires_at=datetime.utcnow() + timedelta(hours=14)
        )

        db.add_all([offer1, offer2, offer3])
        db.commit()
        for o in [offer1, offer2, offer3]:
            db.refresh(o)

        # 4. Create Order 1 matching Invoice INV-FARMLINK-7093 in Image 3
        order1 = Order(
            invoice_number="INV-FARMLINK-7093",
            offer_id=offer1.id,
            buyer_id=buyer1.id,
            farmer_id=farmer1.id,
            listing_id=listings[0].id,
            total_amount=42000.0,
            quantity=2000.0,
            unit="Kgs",
            price_per_unit=21.0,
            status=OrderStatus.CONFIRMED.value,
            delivery_address="Main Campus Delivery Gate 4, Vellore / Chennai Hub, Tamil Nadu - 560064"
        )
        db.add(order1)
        db.commit()
        db.refresh(order1)

        # Create Payment matching Image 3 (Secured in Escrow)
        payment1 = Payment(
            order_id=order1.id,
            razorpay_order_id="order_rzp_fl_7093_escrow",
            razorpay_payment_id="pay_fl_7093_upi_captured",
            razorpay_signature="simulated_sig_fl_7093",
            amount=42000.0,
            currency="INR",
            status="captured",
            payment_method="upi",
            webhook_verified=True,
            raw_payload='{"status": "captured", "ref": "UPI/VERIFIED/ESCROW_HOLD"}'
        )
        db.add(payment1)
        db.commit()

        # 5. Create Order 2 matching Invoice INV-FARMLINK-4499 in Image 4
        # Basmati Rice for Varun Foods
        offer_rice = Offer(
            listing_id=listings[2].id,
            buyer_id=buyer2.id,
            farmer_id=farmer2.id,
            proposed_price_per_unit=87.0,
            proposed_quantity=50.0,
            total_amount=4350.0,
            status=OfferStatus.ACCEPTED.value,
            last_action_by="farmer",
            last_action_user_id=farmer2.id,
            counter_notes="Accepted deal for 50 Kgs Basmati Rice.",
            timeline_json=json.dumps([
                {
                    "type": "accepted",
                    "sender_role": "farmer",
                    "sender_name": "Verified Kisan",
                    "sender_org": "Kisan's Farm",
                    "proposed_price": 87.0,
                    "proposed_quantity": 50.0,
                    "total_amount": 4350.0,
                    "text": "Confirmed at ₹87/Kg for 50 Kgs.",
                    "timestamp": "04:30 pm"
                }
            ]),
            expires_at=datetime.utcnow() + timedelta(hours=24)
        )
        db.add(offer_rice)
        db.commit()
        db.refresh(offer_rice)

        order2 = Order(
            invoice_number="INV-FARMLINK-4499",
            offer_id=offer_rice.id,
            buyer_id=buyer2.id,
            farmer_id=farmer2.id,
            listing_id=listings[2].id,
            total_amount=4350.0,
            quantity=50.0,
            unit="Kgs",
            price_per_unit=87.0,
            status=OrderStatus.CONFIRMED.value,
            delivery_address="Main Campus Delivery Gate 4, Chennai, Tamil Nadu - 560064"
        )
        db.add(order2)
        db.commit()
        db.refresh(order2)

        payment2 = Payment(
            order_id=order2.id,
            razorpay_order_id="order_rzp_fl_4499_escrow",
            razorpay_payment_id="pay_fl_4499_upi_captured",
            razorpay_signature="simulated_sig_fl_4499",
            amount=4350.0,
            currency="INR",
            status="captured",
            payment_method="upi",
            webhook_verified=True,
            raw_payload='{"status": "captured", "ref": "UPI/VERIFIED/ESCROW_HOLD"}'
        )
        db.add(payment2)
        db.commit()

        logger.info("Database seeding successfully completed with screenshot-matching data!")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database(force=True)
