from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app import models, schemas
from app.deps import get_db_session, get_current_user

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


class SubscriptionStatusResponse(BaseModel):
    """简化的订阅状态响应"""
    plan: str
    status: str


@router.get("/me", response_model=schemas.SubscriptionOut)
def get_current_subscription(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """
    获取当前用户的订阅详情。
    返回最新的活跃订阅信息（包括 plan 详情）。
    """
    subscription = (
        db.query(models.Subscription)
        .filter(models.Subscription.user_id == current_user.id)
        .order_by(models.Subscription.created_at.desc())
        .first()
    )

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No subscription found for this user",
        )

    return subscription


@router.get("/me/status", response_model=SubscriptionStatusResponse)
def get_subscription_status(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """
    获取当前用户的订阅状态（简化版）。
    返回 {"plan": "free"} 或 {"plan": "pro"} 等。
    """
    subscription = (
        db.query(models.Subscription)
        .filter(models.Subscription.user_id == current_user.id)
        .order_by(models.Subscription.created_at.desc())
        .first()
    )

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No subscription found for this user",
        )

    plan = db.query(models.Plan).filter(models.Plan.id == subscription.plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Plan not found",
        )

    return {
        "plan": plan.name.lower(),
        "status": subscription.status,
    }
