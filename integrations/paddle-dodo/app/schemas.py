from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True


class PlanBase(BaseModel):
    name: str
    paddle_price_id: str
    description: Optional[str] = None


class PlanCreate(PlanBase):
    pass


class PlanOut(PlanBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SubscriptionOut(BaseModel):
    id: int
    user_id: int
    plan_id: int
    status: str
    paddle_subscription_id: Optional[str] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool
    created_at: datetime
    plan: PlanOut

    class Config:
        from_attributes = True
