"""
练习/内容路由模块。

演示基于 Pro 订阅的受保护路由。
这是一个示例，展示如何使用 require_pro_subscription 依赖来保护需要 Pro 订阅的内容。
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app import models
from app.dependencies.subscriptions import require_pro_subscription

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
    
    此端点演示如何使用 require_pro_subscription 依赖来保护需要 Pro 订阅的内容。
    
    Args:
        current_user: 当前用户（必须拥有活跃的 Pro 订阅）
    
    Returns:
        PracticeResponse: 欢迎信息和功能描述
    
    Raises:
        HTTPException: 如果用户没有 Pro 订阅（403）或未认证（401）
    """
    return PracticeResponse(
        message="Welcome to Star Light Home (Pro only)",
        feature="star-light-home",
        access="pro",
    )
