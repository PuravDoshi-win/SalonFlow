from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_role
from app.models.salon import Service
from app.schemas.salon import ServiceCreate, ServiceUpdate, ServiceOut

router = APIRouter(prefix="/api/services", tags=["Services"])

@router.get("", response_model=List[ServiceOut])
def list_services(db: Session = Depends(get_db)):
    """Public/Customer: list all active salon services."""
    return db.query(Service).filter(Service.is_active == True).order_by(Service.display_order.asc()).all()

@router.get("/all", response_model=List[ServiceOut])
def list_all_services(
    current_user = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Admin: list all services including inactive ones."""
    return db.query(Service).order_by(Service.display_order.asc()).all()

@router.post("", response_model=ServiceOut)
def create_service(
    payload: ServiceCreate,
    current_user = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Admin: create a new salon service."""
    service = Service(
        name_en=payload.name_en,
        name_gu=payload.name_gu,
        description=payload.description,
        price=payload.price,
        duration_minutes=payload.duration_minutes,
        is_active=payload.is_active if payload.is_active is not None else True,
        display_order=payload.display_order or 0
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return service

@router.put("/{service_id}", response_model=ServiceOut)
def update_service(
    service_id: str,
    payload: ServiceUpdate,
    current_user = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Admin: update existing service details or toggle active status."""
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(service, field, val)

    db.commit()
    db.refresh(service)
    return service

@router.delete("/{service_id}")
def delete_service(
    service_id: str,
    current_user = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Admin: deactivate service."""
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    service.is_active = False
    db.commit()
    return {"message": f"Service '{service.name_en}' deactivated successfully."}
