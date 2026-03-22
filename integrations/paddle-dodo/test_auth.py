#!/usr/bin/env python
"""
快速测试脚本：验证注册和登录功能
使用方法：python test_auth.py
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_register():
    """测试注册"""
    print("\n=== 测试注册 ===")
    payload = {
        "email": "test@example.com",
        "password": "password123"
    }
    resp = requests.post(f"{BASE_URL}/auth/register", json=payload)
    print(f"状态码: {resp.status_code}")
    print(f"响应: {json.dumps(resp.json(), indent=2)}")
    return resp.json() if resp.status_code == 200 else None

def test_login():
    """测试登录"""
    print("\n=== 测试登录 ===")
    payload = {
        "email": "test@example.com",
        "password": "password123"
    }
    resp = requests.post(f"{BASE_URL}/auth/login", json=payload)
    print(f"状态码: {resp.status_code}")
    data = resp.json()
    print(f"响应: {json.dumps(data, indent=2)}")
    return data.get("access_token") if resp.status_code == 200 else None

def test_login_wrong_password():
    """测试错误密码"""
    print("\n=== 测试错误密码 ===")
    payload = {
        "email": "test@example.com",
        "password": "wrongpassword"
    }
    resp = requests.post(f"{BASE_URL}/auth/login", json=payload)
    print(f"状态码: {resp.status_code}")
    print(f"响应: {json.dumps(resp.json(), indent=2)}")

if __name__ == "__main__":
    print("确保服务器正在运行: uvicorn app.main:app --reload")
    print("按 Enter 继续...")
    input()
    
    test_register()
    token = test_login()
    test_login_wrong_password()
    
    if token:
        print(f"\n✅ 登录成功！Token: {token[:50]}...")
    else:
        print("\n❌ 登录失败")
