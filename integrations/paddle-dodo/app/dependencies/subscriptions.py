"""
订阅权限依赖模块。

提供基于订阅状态的权限检查依赖，用于保护需要特定订阅级别的路由。
"""
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models
from app.deps import get_current_user, get_db_session


def require_pro_subscription(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> models.User:
    """
    检查当前用户是否拥有活跃的 Pro 订阅。
    
    如果用户没有活跃的 Pro 订阅，返回 403 Forbidden。
    
    Args:
        current_user: 当前登录用户（通过 JWT token 获取）
        db: 数据库 session
    
    Returns:
        models.User: 当前用户（如果验证通过）
    
    Raises:
        HTTPException: 如果用户没有活跃的 Pro 订阅
    """
    # 查询用户最新的活跃订阅
    subscription = (
        db.query(models.Subscription)
        .filter(
            models.Subscription.user_id == current_user.id,
            models.Subscription.status == "active",
        )
        .order_by(models.Subscription.created_at.desc())
        .first()
    )

    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Pro subscription required",
        )

    # 查询订阅对应的 plan
    plan = db.query(models.Plan).filter(models.Plan.id == subscription.plan_id).first()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Plan not found",
        )

    # 检查 plan 是否为 Pro
    if plan.name.lower() != "pro":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Pro subscription required",
        )

    return current_user



def require_trial_or_subscription(
    product_key: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> models.User:
    """
    检查当前用户是否拥有该产品的活跃订阅或有效试用。

    优先检查订阅，如果没有订阅则检查试用。
    如果都没有，返回 403 Forbidden。

    Args:
        product_key: 产品 key（如 "grammar-master"）
        current_user: 当前登录用户（通过 JWT token 获取）
        db: 数据库 session

    Returns:
        models.User: 当前用户（如果验证通过）

    Raises:
        HTTPException: 如果用户既没有活跃订阅也没有有效试用
    """
    from datetime import datetime, timedelta
    from app.config import settings

    # 1. 先检查是否有该产品的活跃订阅（这里只认 Pro）
    subscription = (
        db.query(models.Subscription)
        .filter(
            models.Subscription.user_id == current_user.id,
            models.Subscription.status == "active",
        )
        .order_by(models.Subscription.created_at.desc())
        .first()
    )

    if subscription:
        # 查询订阅对应的 plan
        plan = (
            db.query(models.Plan)
            .filter(models.Plan.id == subscription.plan_id)
            .first()
        )

        # 只有 Pro 订阅才放行，其他（比如 Free）继续走试用逻辑
        if plan and plan.name.lower() == "pro":
            return current_user
        # 如果不是 Pro，就不要 return，继续往下检查 trial

    # 2. 检查是否有该产品的活跃试用
    trial = (
        db.query(models.Trial)
        .filter(
            models.Trial.user_id == current_user.id,
            models.Trial.product_key == product_key,
            models.Trial.status == "active",
        )
        .order_by(models.Trial.created_at.desc())
        .first()
    )

    if trial:
        # 检查试用是否已过期
        trial_end_time = trial.started_at + timedelta(days=settings.trial_days)
        if datetime.utcnow() < trial_end_time:
            return current_user
        else:
            # 试用已过期，更新状态
            trial.status = "expired"
            db.commit()

    # 3. 都没有，返回 403
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Trial or subscription required for product: {product_key}",
    )
