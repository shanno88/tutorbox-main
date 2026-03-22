# license-server/schemas.py
from datetime import datetime
from pydantic import BaseModel

class LicenseCheckRequest(BaseModel):
    license_key: str

class LicenseCheckResponse(BaseModel):
    status: str  # "ok" or "error"
    plan: str | None = None
    expires_at: datetime | None = None
    code: str | None = None  # NOT_FOUND / EXPIRED / REVOKED
