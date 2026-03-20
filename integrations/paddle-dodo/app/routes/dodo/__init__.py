from fastapi import APIRouter, Depends
from app.deps import get_current_user
from app.dependencies.subscriptions import require_pro_subscription

router = APIRouter(prefix="/dodo", tags=["dodo"])

@router.get("/ping")
async def dodo_ping(user = Depends(get_current_user)):
    """
    Dodo public route: simple liveness check for authenticated users.
    Free access.
    """
    return {
        "message": "dodo base alive",
        "user_id": user.id,
        "scope": "public",
    }

@router.get("/profile")
async def dodo_profile(user = Depends(get_current_user)):
    """
    Dodo user profile route: returns basic user information.
    Free access.
    """
    return {
        "user_id": user.id,
        "email": user.email,
        "projects": 0,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "scope": "free",
    }

@router.get("/pro-workflow")
async def dodo_pro_workflow(user = Depends(require_pro_subscription)):
    """
    Dodo Pro-only route: example protected workflow.
    Pro access required.
    """
    return {
        "message": "dodo pro workflow",
        "user_id": user.id,
        "scope": "pro",
    }

@router.get("/pro-dashboard")
async def dodo_pro_dashboard(user = Depends(require_pro_subscription)):
    """
    Dodo Pro dashboard route: returns dashboard statistics and analytics.
    Pro access required.
    """
    return {
        "user_id": user.id,
        "dashboard": {
            "total_workflows": 5,
            "active_projects": 2,
            "api_calls_this_month": 1250,
            "storage_used_gb": 2.5,
            "last_sync": "2026-03-19T10:30:00Z",
        },
        "scope": "pro",
    }
