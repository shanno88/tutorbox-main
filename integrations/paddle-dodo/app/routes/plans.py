from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.deps import get_db_session

router = APIRouter(prefix="/plans", tags=["plans"])


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


def get_or_create_pro_plan(db: Session) -> models.Plan:
    """获取或创建 Pro plan"""
    plan = db.query(models.Plan).filter(models.Plan.name == "Pro").first()
    if not plan:
        plan = models.Plan(
            name="Pro",
            paddle_price_id="pro",
            description="Pro plan",
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)
    return plan


@router.get("/", response_model=list[schemas.PlanOut])
def list_plans(db: Session = Depends(get_db_session)):
    plans = db.query(models.Plan).order_by(models.Plan.id).all()
    return plans


@router.post("/", response_model=schemas.PlanOut)
def create_plan(plan_in: schemas.PlanCreate, db: Session = Depends(get_db_session)):
    plan = models.Plan(
        name=plan_in.name,
        paddle_price_id=plan_in.paddle_price_id,
        description=plan_in.description,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.post("/seed", response_model=dict)
def seed_plans(db: Session = Depends(get_db_session)):
    """
    初始化 Free 和 Pro plan。
    如果已存在则跳过，返回现有的 plan。
    """
    free_plan = get_or_create_free_plan(db)
    pro_plan = get_or_create_pro_plan(db)
    
    return {
        "message": "Plans seeded successfully",
        "free_plan": {
            "id": free_plan.id,
            "name": free_plan.name,
            "paddle_price_id": free_plan.paddle_price_id,
        },
        "pro_plan": {
            "id": pro_plan.id,
            "name": pro_plan.name,
            "paddle_price_id": pro_plan.paddle_price_id,
        },
    }
