"""
练习/内容路由模块。

演示基于 Pro 订阅和试用的受保护路由。
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app import models
from app.deps import get_current_user, get_db_session
from app.dependencies.subscriptions import (
    require_pro_subscription,
    require_trial_or_subscription,
)

router = APIRouter(prefix="/practice", tags=["practice"])


class PracticeResponse(BaseModel):
    """练习内容响应"""
    message: str
    feature: str
    access: str


@router.get(
    "/star-light-home",
    response_model=PracticeResponse,
    summary="Star Light Home - Pro Only",
    description="这是一个演示 Pro 订阅保护的示例路由。只有拥有活跃 Pro 订阅的用户才能访问此内容。",
)
def get_star_light_home(
    current_user: models.User = Depends(require_pro_subscription),
) -> PracticeResponse:
    """
    获取 Star Light Home 内容（仅限 Pro 用户）。
    """
    return PracticeResponse(
        message="Welcome to Star Light Home (Pro only)",
        feature="star-light-home",
        access="pro",
    )


# 专门给 Grammar Master 用的依赖工厂：
# 让 FastAPI 注入 current_user 和 db，再调用 require_trial_or_subscription
def trial_or_subscription_grammar_master(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> models.User:
    return require_trial_or_subscription(
        product_key="grammar-master",
        current_user=current_user,
        db=db,
    )


@router.get(
    "/grammar-master/content",
    response_model=PracticeResponse,
    summary="Grammar Master Content - Trial or Subscription",
    description="获取 Grammar Master 内容。需要有效的订阅或试用。",
)
def get_grammar_master_content(
    current_user: models.User = Depends(trial_or_subscription_grammar_master),
) -> PracticeResponse:
    """
    获取 Grammar Master 内容。

    需要用户拥有 Grammar Master 的有效订阅或试用。
    """
    return PracticeResponse(
        message="Welcome to Grammar Master",
        feature="grammar-master",
        access="trial_or_subscription",
    )
