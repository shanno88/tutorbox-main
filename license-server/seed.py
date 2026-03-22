# license-server/seed.py
from datetime import datetime, timedelta, timezone
from db import SessionLocal, init_db
from models import License

def main():
    init_db()
    db = SessionLocal()

    # 清空旧数据（按你需要可选）
    db.query(License).delete()

    now = datetime.now(timezone.utc)

    lic_valid = License(
        license_key="TEST-VALID-111",
        plan="pro",
        expires_at=now + timedelta(days=365),
        status="ACTIVE",
    )
    lic_expired = License(
        license_key="TEST-EXPIRED-222",
        plan="pro",
        expires_at=now - timedelta(days=1),
        status="EXPIRED",
    )
    lic_revoked = License(
        license_key="TEST-REVOKED-333",
        plan="pro",
        expires_at=now + timedelta(days=365),
        status="REVOKED",
    )

    db.add_all([lic_valid, lic_expired, lic_revoked])
    db.commit()
    db.close()

if __name__ == "__main__":
    main()
