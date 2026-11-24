from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.security import (
    verify_password, get_password_hash, create_access_token, create_refresh_token,
    decode_token, hash_refresh_token
)
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, Role, CustomerProfile, StaffProfile, RefreshToken
from app.models.salon import Barber
from app.schemas.auth import (
    LoginRequest, RegisterRequest, TokenResponse, UserOut,
    RefreshTokenRequest, ChangePasswordRequest, StaffCreateRequest
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register_customer(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Allow customers to register with full name, phone, optional email, and password."""
    # Check phone uniqueness
    if db.query(User).filter(User.phone == payload.phone).first():
        raise HTTPException(status_code=400, detail="An account with this phone number already exists.")
    
    # Check email uniqueness if provided
    if payload.email and db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    customer_role = db.query(Role).filter(Role.name == "customer").first()
    if not customer_role:
        raise HTTPException(status_code=500, detail="Customer role not configured.")

    new_user = User(
        role_id=customer_role.id,
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=get_password_hash(payload.password),
        is_active=True
    )
    db.add(new_user)
    db.flush()

    # Create profile
    profile = CustomerProfile(user_id=new_user.id)
    db.add(profile)

    # Issue tokens
    token_data = {"sub": new_user.id, "role": "customer", "name": new_user.full_name}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Store refresh token
    ref_obj = RefreshToken(
        user_id=new_user.id,
        token_hash=hash_refresh_token(refresh_token),
        expires_at=datetime.now(timezone.utc).replace(microsecond=0)
    )
    db.add(ref_obj)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role="customer",
        user_id=new_user.id,
        full_name=new_user.full_name,
        phone=new_user.phone
    )

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with email or phone number and password."""
    username = payload.username.strip()
    user = db.query(User).filter(
        or_(User.email == username, User.phone == username)
    ).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/phone or password."
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account has been deactivated.")

    role_name = user.role.name if user.role else "customer"
    token_data = {"sub": user.id, "role": role_name, "name": user.full_name}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Store refresh token
    ref_obj = RefreshToken(
        user_id=user.id,
        token_hash=hash_refresh_token(refresh_token),
        expires_at=datetime.now(timezone.utc)
    )
    db.add(ref_obj)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=role_name,
        user_id=user.id,
        full_name=user.full_name,
        phone=user.phone
    )

@router.post("/refresh", response_model=TokenResponse)
def refresh_token_endpoint(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Rotate refresh token and issue new access token."""
    try:
        data = decode_token(payload.refresh_token)
        if data.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type: expected refresh token")
        user_id = data.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    token_hash = hash_refresh_token(payload.refresh_token)
    stored = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.is_revoked == False
    ).first()

    if not stored:
        raise HTTPException(status_code=401, detail="Refresh token revoked or not found")

    # Revoke old refresh token
    stored.is_revoked = True

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    role_name = user.role.name if user.role else "customer"
    new_data = {"sub": user.id, "role": role_name, "name": user.full_name}
    new_access = create_access_token(new_data)
    new_refresh = create_refresh_token(new_data)

    new_ref_obj = RefreshToken(
        user_id=user.id,
        token_hash=hash_refresh_token(new_refresh),
        expires_at=datetime.now(timezone.utc)
    )
    db.add(new_ref_obj)
    db.commit()

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        role=role_name,
        user_id=user.id,
        full_name=user.full_name,
        phone=user.phone
    )

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Revoke all active refresh tokens for the user."""
    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.is_revoked == False
    ).update({"is_revoked": True})
    db.commit()
    return {"message": "Successfully logged out."}

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Return profile information of currently authenticated user."""
    return UserOut(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        role=current_user.role.name if current_user.role else "customer",
        is_active=current_user.is_active
    )

@router.put("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change current user password."""
    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password does not match.")

    current_user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully."}
