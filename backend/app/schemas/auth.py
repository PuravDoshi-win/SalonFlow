from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    full_name: str
    phone: str

class LoginRequest(BaseModel):
    username: str # Email or 10-digit phone number
    password: str
    remember_me: Optional[bool] = False

class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: str = Field(..., pattern=r"^[6-9]\d{9}$")
    password: str = Field(..., min_length=6)

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    email: Optional[str] = None
    phone: str
    role: str
    is_active: bool

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)

class StaffCreateRequest(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone: str = Field(..., pattern=r"^[6-9]\d{9}$")
    password: str = Field(..., min_length=6)
    role_name: str # receptionist, barber
    chair_number: Optional[str] = None
    specialties: Optional[str] = None
