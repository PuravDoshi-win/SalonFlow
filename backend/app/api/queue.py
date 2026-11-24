from typing import List, Optional
from datetime import datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, CustomerProfile
from app.models.salon import Service, Barber, SalonSetting
from app.models.queue import QueueEntry, QueueEntryService
from app.schemas.queue import (
    QueueJoinRequest, WalkInJoinRequest, QueueEntryOut,
    QueueEntryServiceOut, QueueSummaryOut
)
from app.services.queue_engine import (
    generate_next_token, calculate_estimated_wait, check_can_join_queue,
    call_next_customer_for_barber, utc_now
)
from app.websocket.manager import manager

router = APIRouter(prefix="/api/queue", tags=["Queue Operations"])

def build_queue_out(entry: QueueEntry, position: Optional[int] = None) -> QueueEntryOut:
    return QueueEntryOut(
        id=entry.id,
        token_number=entry.token_number,
        customer_name=entry.customer_name,
        customer_phone=entry.customer_phone,
        preferred_barber_id=entry.preferred_barber_id,
        preferred_barber_name=entry.preferred_barber.name if entry.preferred_barber else "Any Available Barber",
        assigned_barber_id=entry.assigned_barber_id,
        assigned_barber_name=entry.assigned_barber.name if entry.assigned_barber else None,
        chair_number=entry.assigned_barber.chair_number if entry.assigned_barber else None,
        status=entry.status,
        entry_source=entry.entry_source,
        total_duration_minutes=entry.total_duration_minutes,
        total_price=entry.total_price,
        estimated_wait_minutes=entry.estimated_wait_minutes,
        queue_position=position,
        created_at=entry.created_at,
        called_at=entry.called_at,
        service_started_at=entry.service_started_at,
        service_completed_at=entry.service_completed_at,
        services=[
            QueueEntryServiceOut(
                service_id=s.service_id,
                service_name=s.service_name,
                price_at_entry=s.price_at_entry,
                duration_at_entry=s.duration_at_entry
            ) for s in entry.services
        ]
    )

@router.post("/join", response_model=QueueEntryOut)
async def customer_join_queue(
    payload: QueueJoinRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Customer: join live queue remotely from mobile/web."""
    check_can_join_queue(db, current_user.phone, is_online=True)

    services = db.query(Service).filter(Service.id.in_(payload.service_ids), Service.is_active == True).all()
    if not services:
        raise HTTPException(status_code=400, detail="Please select at least one valid active service.")

    total_price = sum(s.price for s in services)
    total_duration = sum(s.duration_minutes for s in services)

    token = generate_next_token(db)
    customer_prof = db.query(CustomerProfile).filter(CustomerProfile.user_id == current_user.id).first()

    new_entry = QueueEntry(
        token_number=token,
        customer_id=customer_prof.id if customer_prof else None,
        customer_name=current_user.full_name,
        customer_phone=current_user.phone,
        preferred_barber_id=payload.preferred_barber_id,
        status="WAITING",
        entry_source="ONLINE",
        total_duration_minutes=total_duration,
        total_price=total_price,
        created_at=utc_now()
    )
    db.add(new_entry)
    db.flush()

    for svc in services:
        qs = QueueEntryService(
            queue_entry_id=new_entry.id,
            service_id=svc.id,
            service_name=svc.name_en,
            price_at_entry=svc.price,
            duration_at_entry=svc.duration_minutes
        )
        db.add(qs)

    new_entry.estimated_wait_minutes = calculate_estimated_wait(db, new_entry)
    db.commit()
    db.refresh(new_entry)

    # Position in waiting line
    pos = db.query(QueueEntry).filter(
        QueueEntry.status == "WAITING",
        QueueEntry.created_at <= new_entry.created_at
    ).count()

    await manager.broadcast({"event": "QUEUE_UPDATED", "token": new_entry.token_number, "action": "JOINED"})
    return build_queue_out(new_entry, position=pos)

@router.post("/walkin", response_model=QueueEntryOut)
async def add_walkin_customer(
    payload: WalkInJoinRequest,
    current_user = Depends(require_role("receptionist", "admin")),
    db: Session = Depends(get_db)
):
    """Receptionist: admit in-person walk-in customer into unified queue."""
    check_can_join_queue(db, payload.customer_phone, is_online=False)

    services = db.query(Service).filter(Service.id.in_(payload.service_ids), Service.is_active == True).all()
    if not services:
        raise HTTPException(status_code=400, detail="Please select at least one valid service.")

    total_price = sum(s.price for s in services)
    total_duration = sum(s.duration_minutes for s in services)
    token = generate_next_token(db)

    new_entry = QueueEntry(
        token_number=token,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        preferred_barber_id=payload.preferred_barber_id,
        status="WAITING",
        entry_source="WALK_IN",
        total_duration_minutes=total_duration,
        total_price=total_price,
        created_at=utc_now()
    )
    db.add(new_entry)
    db.flush()

    for svc in services:
        qs = QueueEntryService(
            queue_entry_id=new_entry.id,
            service_id=svc.id,
            service_name=svc.name_en,
            price_at_entry=svc.price,
            duration_at_entry=svc.duration_minutes
        )
        db.add(qs)

    new_entry.estimated_wait_minutes = calculate_estimated_wait(db, new_entry)
    db.commit()
    db.refresh(new_entry)

    pos = db.query(QueueEntry).filter(
        QueueEntry.status == "WAITING",
        QueueEntry.created_at <= new_entry.created_at
    ).count()

    await manager.broadcast({"event": "QUEUE_UPDATED", "token": new_entry.token_number, "action": "WALKIN_ADDED"})
    return build_queue_out(new_entry, position=pos)

@router.get("/status/{identifier}", response_model=QueueEntryOut)
def get_queue_status(identifier: str, db: Session = Depends(get_db)):
    """Retrieve live queue status by token number (e.g., SF-001) or UUID."""
    entry = db.query(QueueEntry).filter(
        or_(QueueEntry.token_number == identifier, QueueEntry.id == identifier)
    ).first()

    if not entry:
        raise HTTPException(status_code=404, detail="Queue token not found.")

    pos = None
    if entry.status == "WAITING":
        pos = db.query(QueueEntry).filter(
            QueueEntry.status == "WAITING",
            QueueEntry.created_at <= entry.created_at
        ).count()
        entry.estimated_wait_minutes = calculate_estimated_wait(db, entry)

    return build_queue_out(entry, position=pos)

@router.get("/my-active", response_model=Optional[QueueEntryOut])
def get_my_active_token(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Customer: check if they have an active token in progress."""
    entry = db.query(QueueEntry).filter(
        QueueEntry.customer_phone == current_user.phone,
        QueueEntry.status.in_(["WAITING", "CALLED", "IN_CHAIR"])
    ).first()

    if not entry:
        return None

    pos = None
    if entry.status == "WAITING":
        pos = db.query(QueueEntry).filter(
            QueueEntry.status == "WAITING",
            QueueEntry.created_at <= entry.created_at
        ).count()
        entry.estimated_wait_minutes = calculate_estimated_wait(db, entry)

    return build_queue_out(entry, position=pos)

@router.get("/live", response_model=List[QueueEntryOut])
def get_live_queue(db: Session = Depends(get_db)):
    """Receptionist/Display: all active customers in WAITING, CALLED, IN_CHAIR."""
    entries = db.query(QueueEntry).filter(
        QueueEntry.status.in_(["WAITING", "CALLED", "IN_CHAIR"])
    ).order_by(QueueEntry.created_at.asc()).all()

    waiting_list = [e for e in entries if e.status == "WAITING"]
    results = []
    for e in entries:
        pos = waiting_list.index(e) + 1 if e in waiting_list else None
        results.append(build_queue_out(e, position=pos))
    return results

@router.post("/{entry_id}/cancel")
async def cancel_queue_entry(
    entry_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Customer or Receptionist: cancel waiting entry."""
    entry = db.query(QueueEntry).filter(QueueEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found.")

    if entry.status != "WAITING":
        raise HTTPException(status_code=400, detail="Cannot cancel an entry that has already been called or served.")

    entry.status = "CANCELLED"
    db.commit()
    await manager.broadcast({"event": "QUEUE_UPDATED", "token": entry.token_number, "action": "CANCELLED"})
    return {"message": f"Token {entry.token_number} cancelled successfully."}

@router.post("/{barber_id}/call-next", response_model=QueueEntryOut)
async def call_next_action(
    barber_id: str,
    current_user = Depends(require_role("receptionist", "barber", "admin")),
    db: Session = Depends(get_db)
):
    """Call earliest eligible waiting customer for Barber X."""
    entry = call_next_customer_for_barber(db, barber_id)
    await manager.broadcast({
        "event": "CUSTOMER_CALLED",
        "token": entry.token_number,
        "barber_id": barber_id,
        "barber_name": entry.assigned_barber.name,
        "chair_number": entry.assigned_barber.chair_number
    })
    return build_queue_out(entry)

@router.post("/{entry_id}/no-show")
async def mark_no_show(
    entry_id: str,
    current_user = Depends(require_role("receptionist", "admin")),
    db: Session = Depends(get_db)
):
    """Mark a called customer who failed to arrive as NO_SHOW."""
    entry = db.query(QueueEntry).filter(QueueEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found.")

    if entry.status != "CALLED":
        raise HTTPException(status_code=400, detail="Only CALLED customers can be marked as NO_SHOW.")

    entry.status = "NO_SHOW"
    if entry.assigned_barber:
        entry.assigned_barber.status = "AVAILABLE"

    db.commit()
    await manager.broadcast({"event": "QUEUE_UPDATED", "token": entry.token_number, "action": "NO_SHOW"})
    return {"message": f"Token {entry.token_number} marked as NO_SHOW. Barber is now available."}

@router.post("/{entry_id}/start")
async def start_service(
    entry_id: str,
    current_user = Depends(require_role("barber", "receptionist", "admin")),
    db: Session = Depends(get_db)
):
    """Barber: customer arrives at chair; start service and timer."""
    entry = db.query(QueueEntry).filter(QueueEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found.")

    if entry.status != "CALLED":
        raise HTTPException(status_code=400, detail="Entry must be CALLED before starting service.")

    entry.status = "IN_CHAIR"
    entry.service_started_at = utc_now()
    if entry.assigned_barber:
        entry.assigned_barber.status = "BUSY"

    db.commit()
    await manager.broadcast({"event": "SERVICE_STARTED", "token": entry.token_number, "barber_id": entry.assigned_barber_id})
    return {"message": f"Service started for token {entry.token_number}."}

@router.post("/{entry_id}/complete")
async def complete_service(
    entry_id: str,
    current_user = Depends(require_role("barber", "receptionist", "admin")),
    db: Session = Depends(get_db)
):
    """Barber: service completed; release barber chair and update metrics."""
    entry = db.query(QueueEntry).filter(QueueEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found.")

    if entry.status != "IN_CHAIR":
        raise HTTPException(status_code=400, detail="Service must be IN_CHAIR before completing.")

    entry.status = "DONE"
    entry.service_completed_at = utc_now()

    if entry.assigned_barber:
        entry.assigned_barber.status = "AVAILABLE"
        entry.assigned_barber.total_served_today += 1

    if entry.customer:
        entry.customer.total_visits += 1
        entry.customer.total_spent += entry.total_price

    db.commit()
    await manager.broadcast({"event": "SERVICE_COMPLETED", "token": entry.token_number, "barber_id": entry.assigned_barber_id})
    return {"message": f"Service completed for token {entry.token_number}."}

@router.get("/summary", response_model=QueueSummaryOut)
def get_queue_summary(db: Session = Depends(get_db)):
    """Public summary for home screen & TV banner."""
    waiting_count = db.query(QueueEntry).filter(QueueEntry.status == "WAITING").count()
    in_chair_count = db.query(QueueEntry).filter(QueueEntry.status == "IN_CHAIR").count()
    
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    served_today = db.query(QueueEntry).filter(
        QueueEntry.status == "DONE",
        QueueEntry.created_at >= today_start
    ).count()

    settings = db.query(SalonSetting).first()

    return QueueSummaryOut(
        total_waiting=waiting_count,
        estimated_wait_minutes=max(5, waiting_count * 15),
        total_served_today=served_today,
        total_in_chair=in_chair_count,
        average_wait_minutes=25,
        is_salon_open=True,
        is_online_queue_open=settings.is_online_queue_open if settings else True
    )
