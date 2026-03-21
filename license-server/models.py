from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from db import Base


class License(Base):
    __tablename__ = "licenses"

    id = Column(Integer, primary_key=True, index=True)

    # 唯一的 license key
    license_key = Column(String, unique=True, index=True, nullable=False)

    # 客户等级：basic / pro / enterprise（默认 pro）
    plan = Column(String, nullable=False, default="pro")

    # 许可状态：ACTIVE / EXPIRED / REVOKED / INACTIVE
    status = Column(String, nullable=False, default="ACTIVE")

    # 到期时间
    expires_at = Column(DateTime, nullable=False)

    # 新增：license 类型（admin 控制后台，tenant 卖给客户）
    kind = Column(String, nullable=False, default="admin")

    # 新增：允许接入的 app 数量，null 表示不限（比如 enterprise）
    app_limit = Column(Integer, nullable=True)
