# license-server/models.py
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from db import Base

class License(Base):
    __tablename__ = "licenses"

    id = Column(Integer, primary_key=True, index=True)
    license_key = Column(String, unique=True, index=True, nullable=False)
    plan = Column(String, nullable=False, default="pro")
    expires_at = Column(DateTime, nullable=False)
    status = Column(String, nullable=False, default="ACTIVE")  # ACTIVE / EXPIRED / REVOKED
