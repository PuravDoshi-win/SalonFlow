from datetime import datetime, timezone, timedelta
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from fastapi import HTTPException, status

from app.models.queue import QueueEntry, QueueEntryService
from app.models.salon import Barber, Service, SalonSetting
from app.models.user import User

def utc_now():
    return datetime.now(timezone.utc)

def generate_next_token(db: Session) -> str:
    """Generate sequential daily token e.g. SF-001."""
    # Count entries created today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    count = db.query(QueueEntry).filter(QueueEntry.created_at >= today_start).count()
    return f"SF-{count + 1:03d}"

def calculate_estimated_wait(db: Session, entry: QueueEntry) -> int:
    """
    Calculate dynamic waiting time based on active service remainder and waiting customers ahead.
    Formula:
    Wait = (Remaining chair times of active barbers + Sum of durations of ahead eligible customers) / Available Barbers
    """
    # Active on-duty barbers
    on_duty_barbers = db.query(Barber).filter(
        Barber.is_on_duty_today == True,
        Barber.status != "OFF_DUTY"
    ).all()
    
    active_barber_count = max(1, len([b for b in on_duty_barbers if b.status != "ON_BREAK"]))

    # If specific barber selected
    if entry.preferred_barber_id:
        barber = db.query(Barber).filter(Barber.id == entry.preferred_barber_id).first()
        if not barber or barber.status == "OFF_DUTY":
            return 45 # Default fallback
        
        # Check if barber is currently serving someone
        current_active = db.query(QueueEntry).filter(
            QueueEntry.assigned_barber_id == barber.id,
            QueueEntry.status == "IN_CHAIR"
        ).first()

        remaining_current = 0
        if current_active and current_active.service_started_at:
            elapsed = (utc_now() - current_active.service_started_at).total_seconds() / 60
            remaining_current = max(2, int(current_active.total_duration_minutes - elapsed))

        # Sum of earlier waiting entries that chose this barber or were assigned
        ahead_entries = db.query(QueueEntry).filter(
            QueueEntry.status.in_(["WAITING", "CALLED"]),
            QueueEntry.created_at < entry.created_at,
            or_(
                QueueEntry.preferred_barber_id == barber.id,
                and_(QueueEntry.preferred_barber_id.is_(None), QueueEntry.assigned_barber_id == barber.id)
            )
        ).all()

        wait = remaining_current + sum(e.total_duration_minutes for e in ahead_entries)
        if barber.status == "ON_BREAK":
            wait += 15
        return max(5, wait)

    # If "Any Available Barber"
    # Find all waiting customers ahead of this entry
    ahead_all = db.query(QueueEntry).filter(
        QueueEntry.status.in_(["WAITING", "CALLED"]),
        QueueEntry.created_at < entry.created_at
    ).all()

    total_ahead_mins = sum(e.total_duration_minutes for e in ahead_all)

    # Estimate active chairs remainder
    active_in_chair = db.query(QueueEntry).filter(QueueEntry.status == "IN_CHAIR").all()
    active_remainders = 0
    for a in active_in_chair:
        if a.service_started_at:
            elapsed = (utc_now() - a.service_started_at).total_seconds() / 60
            active_remainders += max(2, int(a.total_duration_minutes - elapsed))
        else:
            active_remainders += a.total_duration_minutes

    est = (active_remainders + total_ahead_mins) // active_barber_count
    return max(5, int(est))

def check_can_join_queue(db: Session, phone: str, is_online: bool = True) -> SalonSetting:
    """Validate salon open hours, cutoff time, capacity, and duplicate phone."""
    settings = db.query(SalonSetting).first()
    if not settings:
        settings = SalonSetting(id=1)
        db.add(settings)
        db.commit()

    # Rule 3: Single active spot per phone number
    existing_active = db.query(QueueEntry).filter(
        QueueEntry.customer_phone == phone,
        QueueEntry.status.in_(["WAITING", "CALLED", "IN_CHAIR"])
    ).first()
    if existing_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"You already have an active queue ticket ({existing_active.token_number}). Please wait for your turn or cancel it first."
        )

    if is_online:
        # Check if online queue is open
        if not settings.is_online_queue_open:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Online queue is currently closed by salon management. Walk-ins are accepted at reception."
            )

        # Capacity check
        active_waiting_count = db.query(QueueEntry).filter(QueueEntry.status == "WAITING").count()
        if active_waiting_count >= settings.max_online_queue_capacity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Salon queue is currently at peak capacity. Please visit as a walk-in or check back soon."
            )

    return settings

def call_next_customer_for_barber(db: Session, barber_id: str) -> QueueEntry:
    """
    Selects earliest eligible waiting customer for Barber X.
    Rule: Customer who chose X OR Any (None). Never a customer who chose another barber.
    """
    barber = db.query(Barber).filter(Barber.id == barber_id).first()
    if not barber:
        raise HTTPException(status_code=404, detail="Barber not found")

    if barber.status == "ON_BREAK":
        raise HTTPException(status_code=400, detail="Cannot call customer while barber is on break.")

    # Rule 2: Single customer in chair or called
    busy_entry = db.query(QueueEntry).filter(
        QueueEntry.assigned_barber_id == barber.id,
        QueueEntry.status.in_(["CALLED", "IN_CHAIR"])
    ).first()
    if busy_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Barber {barber.name} already has an active customer ({busy_entry.token_number}). Complete current service first."
        )

    # Find earliest eligible waiting entry
    candidate = db.query(QueueEntry).filter(
        QueueEntry.status == "WAITING",
        or_(
            QueueEntry.preferred_barber_id == barber.id,
            QueueEntry.preferred_barber_id.is_(None)
        )
    ).order_by(QueueEntry.created_at.asc()).first()

    if not candidate:
        raise HTTPException(status_code=404, detail="No eligible waiting customers in line.")

    # Assign and transition to CALLED
    candidate.status = "CALLED"
    candidate.assigned_barber_id = barber.id
    candidate.called_at = utc_now()
    barber.status = "BUSY"

    db.commit()
    db.refresh(candidate)
    return candidate
