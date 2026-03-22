# app/deps.py
from typing import Generator, Optional
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status, Header
import jwt
from datetime import datetime

from .db import get_db
from .config import settings
from . import models


def get_db_session() -> Generator[Session, None, None]:
    """Yield a database session from the shared get_db() generator."""
    yield from get_db()


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db_session),
) -> models.User:
    """
    从 Authorization header 的 Bearer token 中解析当前用户。
    
    只接受标准 JWT token（使用 settings.jwt_secret_key 签名）。
    
    JWT Payload 必须包含：
    - sub: 用户 ID（字符串）
    - exp: 过期时间（可选，Unix timestamp）
    
    Token 无效或用户不存在时抛 401。
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
        )
    
    # 提取 Bearer token
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
        )
    
    token = parts[1]
    
    # 解析 JWT
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    # 查询用户
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found in DB. Did you call /auth/upsert-user first?",
        )
    
    return user


def get_current_user_or_upsert(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db_session),
) -> models.User:
    """
    从 JWT token 中解析用户，如果不存在则创建。
    
    用于 /auth/upsert-user 端点。
    
    JWT Payload 必须包含：
    - sub: 用户 ID（字符串）
    - email: 用户邮箱
    - name: 用户名（可选）
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
        )
    
    # 提取 Bearer token
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
        )
    
    token = parts[1]
    
    # 解析 JWT
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        name: Optional[str] = payload.get("name")
        
        if user_id is None or email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing sub or email",
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    # Upsert user
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if user:
        # Update existing user
        user.email = email
        if name:
            user.name = name
        db.commit()
        db.refresh(user)
    else:
        # Create new user
        user = models.User(
            id=user_id,
            email=email,
            hashed_password="",  # No password for JWT-only users
            name=name,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return user


# 别名：保持向后兼容（Trial 路由可以使用任一名称）
get_current_user_for_trial = get_current_user
