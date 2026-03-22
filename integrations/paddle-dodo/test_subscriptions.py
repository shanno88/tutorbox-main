#!/usr/bin/env python
"""
测试脚本：验证第 2 阶段功能
- 初始化 Free/Pro Plan
- 注册用户（自动分配 Free 订阅）
- 查询订阅状态
"""
import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def test_seed_plans():
    """初始化 Free/Pro Plan"""
    print_section("1. 初始化 Free/Pro Plan")
    resp = requests.post(f"{BASE_URL}/plans/seed")
    print(f"状态码: {resp.status_code}")
    data = resp.json()
    print(f"响应: {json.dumps(data, indent=2)}")
    return resp.status_code == 200

def test_register():
    """注册新用户"""
    print_section("2. 注册新用户")
    payload = {
        "email": "subscriber@example.com",
        "password": "password123"
    }
    resp = requests.post(f"{BASE_URL}/auth/register", json=payload)
    print(f"状态码: {resp.status_code}")
    data = resp.json()
    print(f"响应: {json.dumps(data, indent=2)}")
    return resp.status_code == 200

def test_login():
    """登录用户"""
    print_section("3. 登录用户")
    payload = {
        "email": "subscriber@example.com",
        "password": "password123"
    }
    resp = requests.post(f"{BASE_URL}/auth/login", json=payload)
    print(f"状态码: {resp.status_code}")
    data = resp.json()
    print(f"响应: {json.dumps(data, indent=2)}")
    
    if resp.status_code == 200:
        token = data.get("access_token")
        print(f"\n✅ 获得 Token: {token[:50]}...")
        return token
    return None

def test_get_subscription_full(token):
    """获取完整订阅信息"""
    print_section("4. 获取完整订阅信息 (GET /subscriptions/me)")
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/subscriptions/me", headers=headers)
    print(f"状态码: {resp.status_code}")
    data = resp.json()
    print(f"响应: {json.dumps(data, indent=2)}")
    return resp.status_code == 200

def test_get_subscription_status(token):
    """获取简化订阅状态"""
    print_section("5. 获取简化订阅状态 (GET /subscriptions/me/status)")
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/subscriptions/me/status", headers=headers)
    print(f"状态码: {resp.status_code}")
    data = resp.json()
    print(f"响应: {json.dumps(data, indent=2)}")
    return resp.status_code == 200

def test_without_auth():
    """测试无认证访问"""
    print_section("6. 测试无认证访问 (应该返回 403)")
    resp = requests.get(f"{BASE_URL}/subscriptions/me")
    print(f"状态码: {resp.status_code}")
    data = resp.json()
    print(f"响应: {json.dumps(data, indent=2)}")
    return resp.status_code == 403

if __name__ == "__main__":
    print("确保服务器正在运行: uvicorn app.main:app --reload")
    print("按 Enter 继续...")
    input()
    
    try:
        # 第 1 步：初始化 Plan
        if not test_seed_plans():
            print("❌ 初始化 Plan 失败")
            sys.exit(1)
        
        # 第 2 步：注册用户
        if not test_register():
            print("❌ 注册失败")
            sys.exit(1)
        
        # 第 3 步：登录
        token = test_login()
        if not token:
            print("❌ 登录失败")
            sys.exit(1)
        
        # 第 4 步：获取完整订阅信息
        if not test_get_subscription_full(token):
            print("❌ 获取完整订阅信息失败")
            sys.exit(1)
        
        # 第 5 步：获取简化订阅状态
        if not test_get_subscription_status(token):
            print("❌ 获取简化订阅状态失败")
            sys.exit(1)
        
        # 第 6 步：测试无认证访问
        if not test_without_auth():
            print("⚠️  无认证访问应该返回 403")
        
        print_section("✅ 所有测试通过！")
        
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        sys.exit(1)
