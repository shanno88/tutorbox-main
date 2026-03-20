#!/usr/bin/env python
"""
Phase 4 自动化测试脚本：测试 dodo 模块的所有路由
"""
import requests
import json
import sqlite3
import time

BASE_URL = "http://localhost:8000"
TEST_EMAIL = "phase4test@example.com"
TEST_PASSWORD = "pass123"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def print_result(test_name, status, details=""):
    symbol = "✅" if status else "❌"
    print(f"{symbol} {test_name}")
    if details:
        print(f"   {details}")

def init_plans():
    """初始化 Plan"""
    print_section("初始化 Plan")
    try:
        resp = requests.post(f"{BASE_URL}/plans/seed")
        if resp.status_code == 200:
            print_result("POST /plans/seed", True, f"Status: {resp.status_code}")
            return True
        else:
            print_result("POST /plans/seed", False, f"Status: {resp.status_code}")
            return False
    except Exception as e:
        print_result("POST /plans/seed", False, str(e))
        return False

def register_user():
    """注册用户"""
    print_section("注册用户")
    try:
        resp = requests.post(
            f"{BASE_URL}/auth/register",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if resp.status_code == 200:
            print_result("POST /auth/register", True, f"Status: {resp.status_code}")
            return True
        else:
            print_result("POST /auth/register", False, f"Status: {resp.status_code}, Response: {resp.text}")
            return False
    except Exception as e:
        print_result("POST /auth/register", False, str(e))
        return False

def login_user():
    """登录用户获取 token"""
    print_section("登录用户")
    try:
        resp = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if resp.status_code == 200:
            data = resp.json()
            token = data.get("access_token")
            print_result("POST /auth/login", True, f"Status: {resp.status_code}, Token: {token[:20]}...")
            return token
        else:
            print_result("POST /auth/login", False, f"Status: {resp.status_code}")
            return None
    except Exception as e:
        print_result("POST /auth/login", False, str(e))
        return None

def test_free_user_routes(token):
    """测试 Free 用户可访问的路由"""
    print_section("测试 Free 用户路由")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test /dodo/ping
    try:
        resp = requests.get(f"{BASE_URL}/dodo/ping", headers=headers)
        success = resp.status_code == 200
        print_result("GET /dodo/ping", success, f"Status: {resp.status_code}")
        if success:
            print(f"   Response: {json.dumps(resp.json(), indent=2)}")
    except Exception as e:
        print_result("GET /dodo/ping", False, str(e))
    
    # Test /dodo/profile
    try:
        resp = requests.get(f"{BASE_URL}/dodo/profile", headers=headers)
        success = resp.status_code == 200
        print_result("GET /dodo/profile", success, f"Status: {resp.status_code}")
        if success:
            print(f"   Response: {json.dumps(resp.json(), indent=2)}")
    except Exception as e:
        print_result("GET /dodo/profile", False, str(e))

def test_free_user_pro_routes(token):
    """测试 Free 用户无法访问的 Pro 路由"""
    print_section("测试 Free 用户访问 Pro 路由（应返回 403）")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test /dodo/pro-workflow
    try:
        resp = requests.get(f"{BASE_URL}/dodo/pro-workflow", headers=headers)
        success = resp.status_code == 403
        print_result("GET /dodo/pro-workflow", success, f"Status: {resp.status_code} (expected 403)")
        if resp.status_code == 403:
            print(f"   Response: {json.dumps(resp.json(), indent=2)}")
    except Exception as e:
        print_result("GET /dodo/pro-workflow", False, str(e))
    
    # Test /dodo/pro-dashboard
    try:
        resp = requests.get(f"{BASE_URL}/dodo/pro-dashboard", headers=headers)
        success = resp.status_code == 403
        print_result("GET /dodo/pro-dashboard", success, f"Status: {resp.status_code} (expected 403)")
        if resp.status_code == 403:
            print(f"   Response: {json.dumps(resp.json(), indent=2)}")
    except Exception as e:
        print_result("GET /dodo/pro-dashboard", False, str(e))

def upgrade_user_to_pro():
    """通过数据库将用户升级到 Pro"""
    print_section("升级用户到 Pro")
    try:
        conn = sqlite3.connect("app.db")
        cursor = conn.cursor()
        
        # 获取 Pro plan 的 ID
        cursor.execute("SELECT id FROM plans WHERE name = 'Pro'")
        pro_plan_id = cursor.fetchone()[0]
        
        # 获取用户 ID
        cursor.execute("SELECT id FROM users WHERE email = ?", (TEST_EMAIL,))
        user_id = cursor.fetchone()[0]
        
        # 升级用户
        cursor.execute(
            "UPDATE subscriptions SET plan_id = ? WHERE user_id = ? AND status = 'active'",
            (pro_plan_id, user_id)
        )
        conn.commit()
        conn.close()
        
        print_result("升级用户到 Pro", True, f"User ID: {user_id}, Pro Plan ID: {pro_plan_id}")
        return True
    except Exception as e:
        print_result("升级用户到 Pro", False, str(e))
        return False

def test_pro_user_routes(token):
    """测试 Pro 用户可访问的路由"""
    print_section("测试 Pro 用户路由")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test /dodo/pro-workflow
    try:
        resp = requests.get(f"{BASE_URL}/dodo/pro-workflow", headers=headers)
        success = resp.status_code == 200
        print_result("GET /dodo/pro-workflow", success, f"Status: {resp.status_code}")
        if success:
            print(f"   Response: {json.dumps(resp.json(), indent=2)}")
    except Exception as e:
        print_result("GET /dodo/pro-workflow", False, str(e))
    
    # Test /dodo/pro-dashboard
    try:
        resp = requests.get(f"{BASE_URL}/dodo/pro-dashboard", headers=headers)
        success = resp.status_code == 200
        print_result("GET /dodo/pro-dashboard", success, f"Status: {resp.status_code}")
        if success:
            print(f"   Response: {json.dumps(resp.json(), indent=2)}")
    except Exception as e:
        print_result("GET /dodo/pro-dashboard", False, str(e))

def test_pro_user_free_routes(token):
    """测试 Pro 用户仍然可以访问 Free 路由"""
    print_section("测试 Pro 用户访问 Free 路由（应返回 200）")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test /dodo/ping
    try:
        resp = requests.get(f"{BASE_URL}/dodo/ping", headers=headers)
        success = resp.status_code == 200
        print_result("GET /dodo/ping", success, f"Status: {resp.status_code}")
    except Exception as e:
        print_result("GET /dodo/ping", False, str(e))
    
    # Test /dodo/profile
    try:
        resp = requests.get(f"{BASE_URL}/dodo/profile", headers=headers)
        success = resp.status_code == 200
        print_result("GET /dodo/profile", success, f"Status: {resp.status_code}")
    except Exception as e:
        print_result("GET /dodo/profile", False, str(e))

def main():
    print("\n" + "="*60)
    print("  Phase 4 Dodo 模块自动化测试")
    print("="*60)
    
    # 初始化
    if not init_plans():
        print("\n❌ 初始化失败，退出")
        return
    
    # 注册用户
    if not register_user():
        print("\n❌ 注册失败，退出")
        return
    
    # 登录获取 token
    token = login_user()
    if not token:
        print("\n❌ 登录失败，退出")
        return
    
    # 测试 Free 用户
    test_free_user_routes(token)
    test_free_user_pro_routes(token)
    
    # 升级用户到 Pro
    if not upgrade_user_to_pro():
        print("\n❌ 升级失败，退出")
        return
    
    # 等待一下，确保数据库更新
    time.sleep(1)
    
    # 测试 Pro 用户
    test_pro_user_routes(token)
    test_pro_user_free_routes(token)
    
    print_section("测试完成")
    print("✅ 所有测试完成！")

if __name__ == "__main__":
    main()
