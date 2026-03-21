# manage_licenses.py

import argparse
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from db import SessionLocal, init_db
import models


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def resolve_app_limit(plan: str) -> Optional[int]:
    plan = plan.lower()
    if plan == "basic":
        return 1
    if plan == "pro":
        return 5
    if plan == "enterprise":
        return None  # 无上限
    return None


def create_license(
    license_key: str,
    plan: str = "pro",
    days_valid: int = 365,
    status: str = "ACTIVE",
    kind: str = "tenant",
    customer_name: Optional[str] = None,
) -> models.License:
    db = next(get_db())
    expires_at = datetime.utcnow() + timedelta(days=days_valid)

    app_limit = resolve_app_limit(plan)

    lic = models.License(
        license_key=license_key,
        plan=plan,
        status=status,
        expires_at=expires_at,
        kind=kind,
        app_limit=app_limit,
    )
    db.add(lic)
    db.commit()
    db.refresh(lic)
    print(
        f"Created license: key={lic.license_key}, plan={lic.plan}, "
        f"kind={lic.kind}, app_limit={lic.app_limit}, "
        f"status={lic.status}, expires_at={lic.expires_at}"
    )
    if customer_name:
        print(f"  For customer: {customer_name}")
    return lic


def list_licenses() -> None:
    db = next(get_db())
    licenses = db.query(models.License).order_by(models.License.id.desc()).all()
    if not licenses:
        print("No licenses found.")
        return

    for lic in licenses:
        print(
            f"[{lic.id}] key={lic.license_key} | plan={lic.plan} | "
            f"kind={lic.kind} | app_limit={lic.app_limit} | "
            f"status={lic.status} | expires_at={lic.expires_at}"
        )


def update_status(license_key: str, status: str) -> Optional[models.License]:
    db = next(get_db())
    lic = db.query(models.License).filter_by(license_key=license_key).first()
    if not lic:
        print(f"License not found: {license_key}")
        return None

    lic.status = status
    db.commit()
    db.refresh(lic)
    print(
        f"Updated license: key={lic.license_key} | plan={lic.plan} | "
        f"kind={lic.kind} | app_limit={lic.app_limit} | "
        f"status={lic.status} | expires_at={lic.expires_at}"
    )
    return lic


def main():
    # 确保表已创建（包括新列）
    init_db()

    parser = argparse.ArgumentParser(description="License management helper")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # create
    create_parser = subparsers.add_parser("create", help="Create a new license")
    create_parser.add_argument("license_key", type=str, help="License key string")
    create_parser.add_argument(
        "--plan",
        type=str,
        default="pro",
        choices=["basic", "pro", "enterprise"],
    )
    create_parser.add_argument("--days", type=int, default=365)
    create_parser.add_argument(
        "--status",
        type=str,
        default="ACTIVE",
        choices=["ACTIVE", "INACTIVE"],
    )
    create_parser.add_argument(
        "--kind",
        type=str,
        default="tenant",
        choices=["admin", "tenant"],
    )
    create_parser.add_argument(
        "--customer",
        type=str,
        default=None,
        help="Customer name (for your own reference)",
    )

    # list
    subparsers.add_parser("list", help="List all licenses")

    # deactivate
    deactivate_parser = subparsers.add_parser("deactivate", help="Deactivate a license")
    deactivate_parser.add_argument("license_key", type=str)

    args = parser.parse_args()

    if args.command == "create":
        create_license(
            license_key=args.license_key,
            plan=args.plan,
            days_valid=args.days,
            status=args.status,
            kind=args.kind,
            customer_name=args.customer,
        )
    elif args.command == "list":
        list_licenses()
    elif args.command == "deactivate":
        update_status(args.license_key, "INACTIVE")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
