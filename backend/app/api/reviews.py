from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.queue import QueueEntry, Review
from app.schemas.queue import ReviewCreate, ReviewOut

router = APIRouter(prefix="/api/reviews", tags=["Customer Reviews"])

@router.post("", response_model=ReviewOut)
def submit_review(
    payload: ReviewCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Customer submits 1-5 star review for completed service."""
    entry = db.query(QueueEntry).filter(QueueEntry.id == payload.queue_entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found.")

    if entry.status != "DONE":
        raise HTTPException(status_code=400, detail="Reviews can only be submitted for completed services.")

    # Rule: Prevent multiple reviews for the same queue entry
    existing = db.query(Review).filter(Review.queue_entry_id == payload.queue_entry_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="A review has already been submitted for this visit.")

    review = Review(
        queue_entry_id=entry.id,
        customer_name=entry.customer_name,
        barber_id=entry.assigned_barber_id,
        rating=payload.rating,
        comment=payload.comment
    )
    db.add(review)

    # Update barber average rating if assigned
    if entry.assigned_barber:
        all_ratings = db.query(Review.rating).filter(Review.barber_id == entry.assigned_barber_id).all()
        ratings_list = [r[0] for r in all_ratings] + [payload.rating]
        entry.assigned_barber.rating_avg = round(sum(ratings_list) / len(ratings_list), 2)

    db.commit()
    db.refresh(review)
    return review

@router.get("", response_model=List[ReviewOut])
def list_latest_reviews(db: Session = Depends(get_db)):
    """List recent customer feedback."""
    return db.query(Review).order_by(Review.created_at.desc()).limit(15).all()
