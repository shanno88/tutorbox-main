#!/usr/bin/env python
"""调试 JWT token"""
import jwt
from datetime import datetime, timedelta
from app.config import settings

# 生成 token
user_id = 1
expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
payload = {
    "sub": user_id,
    "exp": int(expire.timestamp()),
}

print(f"Secret Key: {settings.jwt_secret_key}")
print(f"Algorithm: {settings.jwt_algorithm}")
print(f"Payload: {payload}")

token = jwt.encode(
    payload,
    settings.jwt_secret_key,
    algorithm=settings.jwt_algorithm,
)

print(f"\nGenerated Token: {token}")

# 尝试解码
try:
    decoded = jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )
    print(f"\nDecoded Payload: {decoded}")
    print(f"User ID: {decoded.get('sub')}")
except Exception as e:
    print(f"\nDecoding Error: {e}")
