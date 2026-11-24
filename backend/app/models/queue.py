from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Text, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import generate_uuid, utc_now

class QueueEntry(Base):
    __tablename__ = "queue_entries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    token_number = Column(String(20), unique=True, nullable=False, index=True) # e.g. "SF-001"
    customer_id = Column(String(36), ForeignKey("customer_profiles.id"), nullable=True) # None for quick walk-ins
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(20), nullable=False, index=True)
    preferred_barber_id = Column(String(36), ForeignKey("barbers.id"), nullable=True) # None = Any available
    assigned_barber_id = Column(String(36), ForeignKey("barbers.id"), nullable=True)
    status = Column(String(20), default="WAITING", nullable=False, index=True) # WAITING, CALLED, IN_CHAIR, DONE, CANCELLED, NO_SHOW
    entry_source = Column(String(20), default="ONLINE", nullable=False) # ONLINE, WALK_IN
    
    total_duration_minutes = Column(Integer, default=0, nullable=False)
    total_price = Column(Numeric(10, 2), default=0.00, nullable=False)
    estimated_wait_minutes = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)
    called_at = Column(DateTime(timezone=True), nullable=True)
    service_started_at = Column(DateTime(timezone=True), nullable=True)
    service_completed_at = Column(DateTime(timezone=True), nullable=True)

    customer = relationship("CustomerProfile", back_populates="queue_entries")
    preferred_barber = relationship("Barber", back_populates="preferred_queue_entries", foreign_keys=[preferred_barber_id])
    assigned_barber = relationship("Barber", back_populates="assigned_queue_entries", foreign_keys=[assigned_barber_id])
    services = relationship("QueueEntryService", back_populates="queue_entry", cascade="all, delete-orphan")
    review = relationship("Review", back_populates="queue_entry", uselist=False, cascade="all, delete-orphan")

class QueueEntryService(Base):
    __tablename__ = "queue_entry_services"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    queue_entry_id = Column(String(36), ForeignKey("queue_entries.id"), nullable=False)
    service_id = Column(String(36), ForeignKey("services.id"), nullable=False)
    service_name = Column(String(100), nullable=False)
    price_at_entry = Column(Numeric(10, 2), nullable=False)
    duration_at_entry = Column(Integer, nullable=False)

    queue_entry = relationship("QueueEntry", back_populates="services")
    service = relationship("Service", back_populates="queue_entry_services")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    queue_entry_id = Column(String(36), ForeignKey("queue_entries.id"), unique=True, nullable=False)
    customer_name = Column(String(100), nullable=False)
    barber_id = Column(String(36), ForeignKey("barbers.id"), nullable=True)
    rating = Column(Integer, nullable=False) # 1 to 5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    queue_entry = relationship("QueueEntry", back_populates="review")
    barber = relationship("Barber", back_populates="reviews")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="QUEUE_UPDATE") # QUEUE_JOINED, CALLED, IN_CHAIR, DONE, CANCELLED
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="notifications")
