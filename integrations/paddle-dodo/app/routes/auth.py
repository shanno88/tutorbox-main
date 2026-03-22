from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import hashlib
from datetime import datetime, timedelta
import jwt
from pydantic import BaseModel
from typing import Optional

from app import models, schemas
from app.deps import get_db_session, get_current_user, get_current_user_or_upsert
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


def hash_password(password: str) -> str:
    # 简单 SHA256，占位用，后面要的话可以再换成 bcrypt
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码是否匹配"""
    return hash_password(plain_password) == hashed_password


def create_access_token(user_id: int) -> str:
    """生成 JWT token"""
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {
        "sub": str(user_id),  # 转换为字符串
        "exp": int(expire.timestamp()),
    }
    token = jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return token


def get_or_create_free_plan(db: Session) -> models.Plan:
    """获取或创建 Free plan"""
    plan = db.query(models.Plan).filter(models.Plan.name == "Free").first()
    if not plan:
        plan = models.Plan(
            name="Free",
            paddle_price_id="free",
            description="Free plan",
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)
    return plan


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str


@router.post("/register", response_model=schemas.UserOut)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db_session)):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = models.User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 为新用户自动分配 Free 订阅
    free_plan = get_or_create_free_plan(db)
    subscription = models.Subscription(
        user_id=user.id,
        plan_id=free_plan.id,
        status="active",
    )
    db.add(subscription)
    db.commit()

    return user


@router.post("/login", response_model=LoginResponse)
def login(login_in: LoginRequest, db: Session = Depends(get_db_session)):
    """
    登录端点：验证邮箱和密码，返回 JWT token。
    """
    user = db.query(models.User).filter(models.User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


class UpsertUserRequest(BaseModel):
    """Upsert user from JWT payload"""
    email: str
    name: Optional[str] = None


@router.post("/upsert-user", response_model=schemas.UserOut)
def upsert_user(
    user: models.User = Depends(get_current_user_or_upsert),
):
    """
    Upsert user from JWT token.
    
    This endpoint is called by external auth systems (e.g., NextAuth) to sync users.
    It uses JWT authentication (same as other protected endpoints).
    
    The JWT payload must contain:
    - sub: user_id (string)
    - email: user email
    - name: user name (optional)
    
    If user exists: updates email and name fields
    If user doesn't exist: creates new user record
    
    Returns the current user object.
    """
    # User is already fetched and validated by get_current_user_or_upsert dependency
    # Just return the user object
    return user
