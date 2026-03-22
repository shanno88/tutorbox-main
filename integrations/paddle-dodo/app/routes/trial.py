# app/routes/trial.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app import models, schemas
from app.deps import get_current_user, get_db_session
from app.config import settings

router = APIRouter(prefix="/trial", tags=["trial"])


@router.post("/start", response_model=schemas.TrialOut)
async def start_trial(
    trial_create: schemas.TrialCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """
    开始某个产品的试用。

    如果用户已有该产品的活跃试用，返回现有的试用记录。
    否则创建新的试用记录。

    Args:
        trial_create: 包含 product_key 的请求体
        current_user: 当前登录用户
        db: 数据库 session

    Returns:
        schemas.TrialOut: 试用记录详情

    Raises:
        HTTPException: 如果创建失败
    """
    # 检查用户是否已有该产品的活跃试用
    existing_trial = (
        db.query(models.Trial)
        .filter(
            models.Trial.user_id == current_user.id,
            models.Trial.product_key == trial_create.product_key,
            models.Trial.status == "active",
        )
        .first()
    )

    if existing_trial:
        # 检查是否已过期
        trial_end_time = existing_trial.started_at + timedelta(days=settings.trial_days)
        if datetime.utcnow() >= trial_end_time:
            # 已过期，更新状态
            existing_trial.status = "expired"
            db.commit()
            db.refresh(existing_trial)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Trial for {trial_create.product_key} has expired",
            )
        # 试用仍有效，返回现有记录
        return existing_trial

    # 创建新的试用记录
    new_trial = models.Trial(
        user_id=current_user.id,
        product_key=trial_create.product_key,
        status="active",
    )
    db.add(new_trial)
    db.commit()
    db.refresh(new_trial)

    return new_trial


@router.get("/status/{product_key}", response_model=schemas.TrialStatusResponse)
async def get_trial_status(
    product_key: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """
    查询当前用户对某个产品的试用状态。

    Args:
        product_key: 产品 key（如 "grammar-master"）
        current_user: 当前登录用户
        db: 数据库 session

    Returns:
        schemas.TrialStatusResponse: 试用状态详情

    Raises:
        HTTPException: 如果用户没有该产品的试用记录
    """
    trial = (
        db.query(models.Trial)
        .filter(
            models.Trial.user_id == current_user.id,
            models.Trial.product_key == product_key,
        )
        .order_by(models.Trial.created_at.desc())
        .first()
    )

    if not trial:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No trial found for product: {product_key}",
        )

    # 计算剩余天数
    trial_end_time = trial.started_at + timedelta(days=settings.trial_days)
    days_remaining = max(0, (trial_end_time - datetime.utcnow()).days)

    # 如果已过期且状态还是 active，更新状态
    if datetime.utcnow() >= trial_end_time and trial.status == "active":
        trial.status = "expired"
        db.commit()

    return schemas.TrialStatusResponse(
        product_key=trial.product_key,
        status=trial.status,
        started_at=trial.started_at,
        ended_at=trial.ended_at,
        days_remaining=days_remaining if trial.status == "active" else None,
    )
