from decimal import Decimal
import logging
from sqlalchemy.orm import Session
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models.user import Role, User, CustomerProfile, StaffProfile
from app.models.salon import Service, Barber, SalonSetting
from app.models.queue import QueueEntry, QueueEntryService

logger = logging.getLogger("salonflow.init_db")

def init_db():
    """Create tables and seed initial demo data."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # 1. Seed Roles
        roles_data = [
            ("customer", "Salon customer with queue joining & tracking access"),
            ("receptionist", "Front desk operator managing queue & walk-ins"),
            ("barber", "Stylist with chair control & service completion"),
            ("admin", "Salon owner with full analytics & operational settings")
        ]
        roles_map = {}
        for role_name, desc in roles_data:
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                role = Role(name=role_name, description=desc)
                db.add(role)
                db.flush()
            roles_map[role_name] = role

        # 2. Seed Default Salon Settings
        settings = db.query(SalonSetting).first()
        if not settings:
            settings = SalonSetting(
                id=1,
                salon_name="SalonFlow Luxury Studio",
                tagline="Smart Salon. Zero Waiting.",
                phone="+91 98765 43210",
                address="Ring Road, High-End District, Ahmedabad, Gujarat",
                opening_time="09:00:00",
                closing_time="21:00:00",
                is_online_queue_open=True,
                max_online_queue_capacity=30,
                cutoff_minutes_before_close=30,
                announcements="Welcome to SalonFlow! Free High-Speed Wi-Fi available. Refreshments on request."
            )
            db.add(settings)
            db.flush()

        # 3. Seed Realistic Indian Salon Services
        services_data = [
            ("Haircut", "હેરકટ", "Precision haircut with consultation and hot towel refresh", 150.00, 30, 1),
            ("Beard Trim", "દાઢી ટ્રીમ", "Custom beard sculpting, trimming and organic beard oil", 80.00, 15, 2),
            ("Hair Wash", "હેર વોશ", "Rejuvenating shampoo wash, conditioning and blow dry", 100.00, 15, 3),
            ("Hair Spa", "હેર સ્પા", "Deep conditioning botanical hair massage & steam therapy", 400.00, 45, 4),
            ("Facial", "ફેશિયલ", "Gold radiance detox facial with skin exfoliation", 500.00, 45, 5),
            ("Hair Coloring", "હેર કલરિંગ", "Global rich ammonia-free hair coloring & styling", 700.00, 60, 6),
            ("Head Massage", "હેડ મસાજ", "Traditional soothing herbal oil pressure point massage", 150.00, 20, 7),
        ]
        for name_en, name_gu, desc, price, duration, order in services_data:
            svc = db.query(Service).filter(Service.name_en == name_en).first()
            if not svc:
                svc = Service(
                    name_en=name_en,
                    name_gu=name_gu,
                    description=desc,
                    price=Decimal(str(price)),
                    duration_minutes=duration,
                    display_order=order,
                    is_active=True
                )
                db.add(svc)

        # 4. Seed Salon Owner
        owner_email = "owner@salonflow.com"
        owner = db.query(User).filter(User.email == owner_email).first()
        if not owner:
            owner = User(
                role_id=roles_map["admin"].id,
                full_name="Rajesh Patel (Owner)",
                email=owner_email,
                phone="9876543210",
                hashed_password=get_password_hash("Owner@123"),
                is_active=True
            )
            db.add(owner)
            db.flush()
            staff_prof = StaffProfile(user_id=owner.id, employee_code="SF-EMP-001", designation="Salon Owner & Director")
            db.add(staff_prof)

        # 5. Seed Receptionist
        reception_email = "reception@salonflow.com"
        receptionist = db.query(User).filter(User.email == reception_email).first()
        if not receptionist:
            receptionist = User(
                role_id=roles_map["receptionist"].id,
                full_name="Pooja Sharma (Reception)",
                email=reception_email,
                phone="9876543211",
                hashed_password=get_password_hash("Staff@123"),
                is_active=True
            )
            db.add(receptionist)
            db.flush()
            reception_prof = StaffProfile(user_id=receptionist.id, employee_code="SF-EMP-002", designation="Front Desk Manager")
            db.add(reception_prof)

        # 6. Seed 4 Barbers
        barbers_data = [
            ("Ravi Kumar", "ravi@salonflow.com", "9876543212", "Chair 1", "Fade Cuts & Modern Textures", "AVAILABLE"),
            ("Amit Shah", "amit@salonflow.com", "9876543213", "Chair 2", "Beard Sculpting & Classic Cuts", "AVAILABLE"),
            ("Imran Khan", "imran@salonflow.com", "9876543214", "Chair 3", "Hair Spa & Scalp Therapy", "AVAILABLE"),
            ("Vikram Joshi", "vikram@salonflow.com", "9876543215", "Chair 4", "Hair Coloring & Styling", "AVAILABLE"),
        ]
        for b_name, b_email, b_phone, chair, specs, initial_status in barbers_data:
            b_user = db.query(User).filter(User.email == b_email).first()
            if not b_user:
                b_user = User(
                    role_id=roles_map["barber"].id,
                    full_name=b_name,
                    email=b_email,
                    phone=b_phone,
                    hashed_password=get_password_hash("Barber@123"),
                    is_active=True
                )
                db.add(b_user)
                db.flush()
                barber = Barber(
                    user_id=b_user.id,
                    name=b_name,
                    chair_number=chair,
                    specialties=specs,
                    status=initial_status,
                    is_on_duty_today=True,
                    rating_avg=Decimal("4.9"),
                    total_served_today=3
                )
                db.add(barber)

        # 7. Seed Demo Customer
        cust_email = "customer@salonflow.com"
        customer = db.query(User).filter(User.email == cust_email).first()
        if not customer:
            customer = User(
                role_id=roles_map["customer"].id,
                full_name="Mehul Desai",
                email=cust_email,
                phone="9876543220",
                hashed_password=get_password_hash("Customer@123"),
                is_active=True
            )
            db.add(customer)
            db.flush()
            cust_prof = CustomerProfile(user_id=customer.id, notes="Prefers herbal shampoo wash", total_visits=4, total_spent=Decimal("1200.00"))
            db.add(cust_prof)

        db.commit()
        logger.info("SalonFlow database initialized with seed data.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
