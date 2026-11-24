from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, CustomerProfile
from app.models.queue import QueueEntry
from app.schemas.queue import QueueEntryOut
from app.api.queue import build_queue_out

router = APIRouter(prefix="/api/customers", tags=["Customer Portal"])

@router.get("/me")
def get_customer_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Customer: view profile, visit counts, and total expenditure."""
    profile = db.query(CustomerProfile).filter(CustomerProfile.user_id == current_user.id).first()
    return {
        "user_id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "total_visits": profile.total_visits if profile else 0,
        "total_spent": float(profile.total_spent) if profile else 0.0,
        "notes": profile.notes if profile else ""
    }

@router.get("/history", response_model=List[QueueEntryOut])
def get_customer_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Customer: view past visits, services taken, and tokens."""
    entries = db.query(QueueEntry).filter(
        QueueEntry.customer_phone == current_user.phone
    ).order_by(QueueEntry.created_at.desc()).limit(20).all()

    return [build_queue_out(e) for e in entries]
