from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, ConfigDict

class ServiceBase(BaseModel):
    name_en: str
    name_gu: str
    description: Optional[str] = None
    price: Decimal
    duration_minutes: int
    is_active: Optional[bool] = True
    display_order: Optional[int] = 0

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    name_en: Optional[str] = None
    name_gu: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    duration_minutes: Optional[int] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None

class ServiceOut(ServiceBase):
    model_config = ConfigDict(from_attributes=True)
    id: str

class BarberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    chair_number: str
    specialties: str
    status: str # AVAILABLE, BUSY, ON_BREAK, OFF_DUTY
    is_on_duty_today: bool
    rating_avg: float
    total_served_today: int
    user_id: Optional[str] = None
    active_token: Optional[str] = None
    active_customer_name: Optional[str] = None
    service_started_at: Optional[str] = None

class BarberUpdate(BaseModel):
    name: Optional[str] = None
    chair_number: Optional[str] = None
    specialties: Optional[str] = None
    is_on_duty_today: Optional[bool] = None

class BarberAvailabilityUpdate(BaseModel):
    status: str # AVAILABLE, ON_BREAK, OFF_DUTY

class SalonSettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    salon_name: str
    tagline: str
    phone: str
    address: str
    opening_time: str
    closing_time: str
    is_online_queue_open: bool
    max_online_queue_capacity: int
    cutoff_minutes_before_close: int
    announcements: Optional[str] = None

class SalonSettingsUpdate(BaseModel):
    salon_name: Optional[str] = None
    tagline: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    is_online_queue_open: Optional[bool] = None
    max_online_queue_capacity: Optional[int] = None
    announcements: Optional[str] = None
