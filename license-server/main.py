# license-server/main.py
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from db import SessionLocal, init_db
import models
from schemas import LicenseCheckRequest, LicenseCheckResponse

app = FastAPI()


@app.on_event("startup")
def on_startup():
    init_db()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/v1/licenses/validate", response_model=LicenseCheckResponse)
def validate_license(payload: LicenseCheckRequest, db: Session = Depends(get_db)):
    lic = db.query(models.License).filter_by(license_key=payload.license_key).first()
    if not lic:
        return LicenseCheckResponse(status="error", code="NOT_FOUND")

    now = datetime.utcnow()
    if lic.status != "ACTIVE":
        return LicenseCheckResponse(status="error", code=lic.status)
    if lic.expires_at < now:
        return LicenseCheckResponse(status="error", code="EXPIRED")

    return LicenseCheckResponse(
        status="ok",
        plan=lic.plan,
        expires_at=lic.expires_at,
    )

@app.post("/v1/licenses/activate", response_model=LicenseCheckResponse)
def activate_license(payload: LicenseCheckRequest, db: Session = Depends(get_db)):
    return validate_license(payload, db)  # type: ignore
