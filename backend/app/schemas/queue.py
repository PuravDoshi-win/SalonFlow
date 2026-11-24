from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict

class QueueJoinRequest(BaseModel):
    service_ids: List[str] = Field(..., min_length=1, max_length=5)
    preferred_barber_id: Optional[str] = None # None means Any Available Barber

class WalkInJoinRequest(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=100)
    customer_phone: str = Field(..., pattern=r"^[6-9]\d{9}$")
    service_ids: List[str] = Field(..., min_length=1, max_length=5)
    preferred_barber_id: Optional[str] = None

class QueueEntryServiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    service_id: str
    service_name: str
    price_at_entry: Decimal
    duration_at_entry: int

class QueueEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    token_number: str
    customer_name: str
    customer_phone: str
    preferred_barber_id: Optional[str] = None
    preferred_barber_name: Optional[str] = None
    assigned_barber_id: Optional[str] = None
    assigned_barber_name: Optional[str] = None
    chair_number: Optional[str] = None
    status: str
    entry_source: str
    total_duration_minutes: int
    total_price: Decimal
    estimated_wait_minutes: int
    queue_position: Optional[int] = None
    created_at: datetime
    called_at: Optional[datetime] = None
    service_started_at: Optional[datetime] = None
    service_completed_at: Optional[datetime] = None
    services: List[QueueEntryServiceOut] = []

class ReviewCreate(BaseModel):
    queue_entry_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    queue_entry_id: str
    customer_name: str
    barber_id: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    created_at: datetime

class QueueSummaryOut(BaseModel):
    total_waiting: int
    estimated_wait_minutes: int
    total_served_today: int
    total_in_chair: int
    average_wait_minutes: int
    is_salon_open: bool
    is_online_queue_open: bool
