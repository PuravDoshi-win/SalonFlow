from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Text, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import generate_uuid, utc_now

class Service(Base):
    __tablename__ = "services"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name_en = Column(String(100), nullable=False)
    name_gu = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    duration_minutes = Column(Integer, nullable=False) # e.g. 30, 45
    is_active = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    queue_entry_services = relationship("QueueEntryService", back_populates="service")

class Barber(Base):
    __tablename__ = "barbers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=True)
    name = Column(String(100), nullable=False)
    chair_number = Column(String(20), nullable=False) # e.g. "Chair 1"
    specialties = Column(String(255), default="All Hair & Beard Services")
    status = Column(String(20), default="AVAILABLE", nullable=False) # AVAILABLE, BUSY, ON_BREAK, OFF_DUTY
    is_on_duty_today = Column(Boolean, default=True, nullable=False)
    avatar_url = Column(String(255), nullable=True)
    rating_avg = Column(Numeric(3, 2), default=5.00)
    total_served_today = Column(Integer, default=0)
    break_started_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="barber_profile")
    assigned_queue_entries = relationship("QueueEntry", back_populates="assigned_barber", foreign_keys="QueueEntry.assigned_barber_id")
    preferred_queue_entries = relationship("QueueEntry", back_populates="preferred_barber", foreign_keys="QueueEntry.preferred_barber_id")
    reviews = relationship("Review", back_populates="barber")

class SalonSetting(Base):
    __tablename__ = "salon_settings"

    id = Column(Integer, primary_key=True, default=1)
    salon_name = Column(String(100), default="SalonFlow Luxury Studio")
    tagline = Column(String(150), default="Smart Salon. Zero Waiting.")
    phone = Column(String(20), default="+91 98765 43210")
    address = Column(String(255), default="Ring Road, High-End District, Ahmedabad, Gujarat")
    opening_time = Column(String(10), default="09:00:00")
    closing_time = Column(String(10), default="21:00:00")
    is_online_queue_open = Column(Boolean, default=True)
    max_online_queue_capacity = Column(Integer, default=30)
    cutoff_minutes_before_close = Column(Integer, default=30)
    announcements = Column(Text, default="Welcome to SalonFlow! Free High-Speed Wi-Fi available. Refreshments on request.")
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
