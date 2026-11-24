from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.salon import Barber
from app.models.queue import QueueEntry
from app.schemas.salon import BarberOut, BarberUpdate, BarberAvailabilityUpdate
from app.websocket.manager import manager

router = APIRouter(prefix="/api/barbers", tags=["Barbers"])

@router.get("", response_model=List[BarberOut])
def get_all_barbers(db: Session = Depends(get_db)):
    """List all barbers with their current status, active customer, and chair info."""
    barbers = db.query(Barber).order_by(Barber.chair_number.asc()).all()
    results = []
    for b in barbers:
        active_entry = db.query(QueueEntry).filter(
            QueueEntry.assigned_barber_id == b.id,
            QueueEntry.status.in_(["CALLED", "IN_CHAIR"])
        ).first()

        results.append(BarberOut(
            id=b.id,
            name=b.name,
            chair_number=b.chair_number,
            specialties=b.specialties,
            status=b.status,
            is_on_duty_today=b.is_on_duty_today,
            rating_avg=float(b.rating_avg),
            total_served_today=b.total_served_today,
            user_id=b.user_id,
            active_token=active_entry.token_number if active_entry else None,
            active_customer_name=active_entry.customer_name if active_entry else None,
            service_started_at=active_entry.service_started_at.isoformat() if active_entry and active_entry.service_started_at else None
        ))
    return results

@router.get("/me")
def get_my_barber_station(
    current_user = Depends(require_role("barber")),
    db: Session = Depends(get_db)
):
    """Barber: get current station state, active customer, and next candidate."""
    barber = db.query(Barber).filter(Barber.user_id == current_user.id).first()
    if not barber:
        raise HTTPException(status_code=404, detail="Barber profile not associated with this account.")

    active_entry = db.query(QueueEntry).filter(
        QueueEntry.assigned_barber_id == barber.id,
        QueueEntry.status.in_(["CALLED", "IN_CHAIR"])
    ).first()

    # Next candidate in line
    next_candidate = db.query(QueueEntry).filter(
        QueueEntry.status == "WAITING",
        (QueueEntry.preferred_barber_id == barber.id) | (QueueEntry.preferred_barber_id.is_(None))
    ).order_by(QueueEntry.created_at.asc()).first()

    return {
        "barber": {
            "id": barber.id,
            "name": barber.name,
            "chair_number": barber.chair_number,
            "status": barber.status,
            "specialties": barber.specialties,
            "is_on_duty_today": barber.is_on_duty_today,
            "rating_avg": float(barber.rating_avg),
            "total_served_today": barber.total_served_today
        },
        "active_customer": {
            "id": active_entry.id,
            "token_number": active_entry.token_number,
            "customer_name": active_entry.customer_name,
            "customer_phone": active_entry.customer_phone,
            "status": active_entry.status,
            "total_duration_minutes": active_entry.total_duration_minutes,
            "total_price": float(active_entry.total_price),
            "service_started_at": active_entry.service_started_at.isoformat() if active_entry.service_started_at else None,
            "services": [{"name": s.service_name, "duration": s.duration_at_entry, "price": float(s.price_at_entry)} for s in active_entry.services]
        } if active_entry else None,
        "next_in_line": {
            "id": next_candidate.id,
            "token_number": next_candidate.token_number,
            "customer_name": next_candidate.customer_name,
            "total_duration_minutes": next_candidate.total_duration_minutes,
            "services": [s.service_name for s in next_candidate.services]
        } if next_candidate else None
    }

@router.put("/{barber_id}/availability")
async def update_barber_availability(
    barber_id: str,
    payload: BarberAvailabilityUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Barber or Admin: toggle status (AVAILABLE, ON_BREAK, OFF_DUTY)."""
    barber = db.query(Barber).filter(Barber.id == barber_id).first()
    if not barber:
        raise HTTPException(status_code=404, detail="Barber not found")

    barber.status = payload.status
    db.commit()
    await manager.broadcast({"event": "BARBER_STATUS_CHANGED", "barber_id": barber.id, "status": barber.status})
    return {"message": f"Barber {barber.name} status updated to {barber.status}."}
