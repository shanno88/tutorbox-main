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
