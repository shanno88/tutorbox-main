#!/usr/bin/env python
"""
第 3 阶段测试脚本：验证 Pro 订阅权限控制。

测试流程：
1. 初始化 Plan
2. 注册新用户（自动获得 Free 订阅）
3. 登录获取 token
4. 验证 Free 用户无法访问 Pro 路由（返回 403）
5. 通过数据库将用户升级到 Pro
6. 验证 Pro 用户可以访问 Pro 路由（返回 200）
"""
import requests
import json
import sys
import sqlite3
from pathlib import Path

BASE_URL = "http://localhost:8000"
DB_PATH = "app.db"

def print_section(title):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}")

def test_seed_plans():
    """初始化 Free/Pro Plan"""
    print_section("1. 初始化 Free/Pro Plan")
    resp = requests.post(f"{BASE_URL}/plans/seed")
    print(f"状态码: {resp.status_code}")
    data = resp.json()
    print(f"响应: {json.dumps(data, indent=2)}")
    return resp.status_code == 200

def test_register(email: str):
    """注册新用户"""
    print_section(f"2. 注册新用户: {email}")
    payload = {
        "email": email,
        "password": "password123"
    }
    resp = requests.post(f"{BASE_URL}/auth/register", json=payload)
    print(f"状态码: {resp.status_code}")
    data = resp.json()
    print(f"响应: {json.dumps(data, indent=2)}")
    return resp.status_code == 200

def test_login(email: str):
    """登录用户"""
    print_section(f"3. 登录用户: {email}")
    payload = {
        "email": email,
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

def test_get_subscription_status(token: str, label: str = ""):
    """获取订阅状态"""
    print_section(f"4. 获取订阅状态 {label}")
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/subscriptions/me/status", headers=headers)
    print(f"状态码: {resp.status_code}")
    data = resp.json()
    print(f"响应: {json.dumps(data, indent=2)}")
    return resp.status_code == 200

def test_access_pro_route_free(token: str):
    """Free 用户尝试访问 Pro 路由"""
    print_section("5. Free 用户访问 /practice/star-light-home (应返回 403)")
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/practice/star-light-home", headers=headers)
    print(f"状态码: {resp.status_code}")
    data = resp.json()
    print(f"响应: {json.dumps(data, indent=2)}")
    
    if resp.status_code == 403:
        print("✅ 正确返回 403")
        return True
    else:
        print("❌ 应该返回 403")
        return False

def test_access_pro_route_pro(token: str):
    """Pro 用户访问 Pro 路由"""
    print_section("6. Pro 用户访问 /practice/star-light-home (应返回 200)")
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/practice/star-light-home", headers=headers)
    print(f"状态码: {resp.status_code}")
    data = resp.json()
    print(f"响应: {json.dumps(data, indent=2)}")
    
    if resp.status_code == 200:
        print("✅ 正确返回 200")
        return True
    else:
        print("❌ 应该返回 200")
        return False

def upgrade_user_to_pro(email: str):
    """通过数据库将用户升级到 Pro"""
    print_section("7. 通过数据库将用户升级到 Pro")
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # 获取用户 ID
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        user_row = cursor.fetchone()
        if not user_row:
            print(f"❌ 用户 {email} 不存在")
            return False
        
        user_id = user_row[0]
        print(f"用户 ID: {user_id}")
        
        # 获取 Pro plan ID
        cursor.execute("SELECT id FROM plans WHERE name = 'Pro'")
        plan_row = cursor.fetchone()
        if not plan_row:
            print("❌ Pro plan 不存在")
            return False
        
        pro_plan_id = plan_row[0]
        print(f"Pro Plan ID: {pro_plan_id}")
        
        # 更新用户的订阅
        cursor.execute(
            "UPDATE subscriptions SET plan_id = ? WHERE user_id = ? AND status = 'active'",
            (pro_plan_id, user_id)
        )
        
        if cursor.rowcount == 0:
            print("❌ 没有找到活跃的订阅记录")
            return False
        
        conn.commit()
        print(f"✅ 成功将用户 {email} 升级到 Pro")
        
        # 验证更新
        cursor.execute(
            "SELECT s.id, s.plan_id, p.name FROM subscriptions s "
            "JOIN plans p ON s.plan_id = p.id WHERE s.user_id = ? AND s.status = 'active'",
            (user_id,)
        )
        result = cursor.fetchone()
        if result:
            print(f"验证: Subscription ID={result[0]}, Plan ID={result[1]}, Plan Name={result[2]}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ 数据库操作失败: {e}")
        return False

if __name__ == "__main__":
    print("确保服务器正在运行: uvicorn app.main:app --reload")
    print("按 Enter 继续...")
    input()
    
    try:
        import time
        email = f"protest{int(time.time())}@example.com"
        
        # 第 1 步：初始化 Plan
        if not test_seed_plans():
            print("❌ 初始化 Plan 失败")
            sys.exit(1)
        
        # 第 2 步：注册用户
        if not test_register(email):
            print("❌ 注册失败")
            sys.exit(1)
        
        # 第 3 步：登录
        token = test_login(email)
        if not token:
            print("❌ 登录失败")
            sys.exit(1)
        
        # 第 4 步：验证 Free 订阅
        if not test_get_subscription_status(token, "(Free 用户)"):
            print("❌ 获取订阅状态失败")
            sys.exit(1)
        
        # 第 5 步：Free 用户访问 Pro 路由（应返回 403）
        if not test_access_pro_route_free(token):
            print("❌ Free 用户权限检查失败")
            sys.exit(1)
        
        # 第 6 步：升级用户到 Pro
        if not upgrade_user_to_pro(email):
            print("❌ 升级用户失败")
            sys.exit(1)
        
        # 第 7 步：验证 Pro 订阅
        if not test_get_subscription_status(token, "(Pro 用户)"):
            print("❌ 获取 Pro 订阅状态失败")
            sys.exit(1)
        
        # 第 8 步：Pro 用户访问 Pro 路由（应返回 200）
        if not test_access_pro_route_pro(token):
            print("❌ Pro 用户权限检查失败")
            sys.exit(1)
        
        print_section("✅ 所有测试通过！")
        print("\n第 3 阶段验证完成：")
        print("  ✅ Free 用户无法访问 Pro 路由（403）")
        print("  ✅ Pro 用户可以访问 Pro 路由（200）")
        print("  ✅ 权限控制正常工作")
        
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
