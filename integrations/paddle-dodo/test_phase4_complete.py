#!/usr/bin/env python
"""
Phase 4 完整测试：获取实际响应用于文档
"""
import requests
import json
import sqlite3

BASE_URL = "http://localhost:8000"
TEST_EMAIL = "phase4complete@example.com"
TEST_PASSWORD = "pass123"

def test_phase4():
    results = {
        "free_user": {},
        "pro_user": {},
    }
    
    # 1. Initialize plans
    print("1. Initializing plans...")
    requests.post(f"{BASE_URL}/plans/seed")
    
    # 2. Register user
    print("2. Registering user...")
    requests.post(
        f"{BASE_URL}/auth/register",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    
    # 3. Login
    print("3. Logging in...")
    resp = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 4. Test Free user routes
    print("\n4. Testing Free user routes...")
    
    # /dodo/ping
    resp = requests.get(f"{BASE_URL}/dodo/ping", headers=headers)
    results["free_user"]["ping"] = {
        "status": resp.status_code,
        "response": resp.json()
    }
    print(f"   GET /dodo/ping: {resp.status_code}")
    
    # /dodo/profile
    resp = requests.get(f"{BASE_URL}/dodo/profile", headers=headers)
    results["free_user"]["profile"] = {
        "status": resp.status_code,
        "response": resp.json()
    }
    print(f"   GET /dodo/profile: {resp.status_code}")
    
    # /dodo/pro-workflow (should be 403)
    resp = requests.get(f"{BASE_URL}/dodo/pro-workflow", headers=headers)
    results["free_user"]["pro_workflow"] = {
        "status": resp.status_code,
        "response": resp.json()
    }
    print(f"   GET /dodo/pro-workflow: {resp.status_code} (expected 403)")
    
    # /dodo/pro-dashboard (should be 403)
    resp = requests.get(f"{BASE_URL}/dodo/pro-dashboard", headers=headers)
    results["free_user"]["pro_dashboard"] = {
        "status": resp.status_code,
        "response": resp.json()
    }
    print(f"   GET /dodo/pro-dashboard: {resp.status_code} (expected 403)")
    
    # 5. Upgrade user to Pro
    print("\n5. Upgrading user to Pro...")
    conn = sqlite3.connect("app.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM plans WHERE name = 'Pro'")
    pro_plan_id = cursor.fetchone()[0]
    cursor.execute("SELECT id FROM users WHERE email = ?", (TEST_EMAIL,))
    user_id = cursor.fetchone()[0]
    cursor.execute(
        "UPDATE subscriptions SET plan_id = ? WHERE user_id = ? AND status = 'active'",
        (pro_plan_id, user_id)
    )
    conn.commit()
    conn.close()
    print(f"   User {user_id} upgraded to Pro plan {pro_plan_id}")
    
    # 6. Test Pro user routes
    print("\n6. Testing Pro user routes...")
    
    # /dodo/ping (still accessible)
    resp = requests.get(f"{BASE_URL}/dodo/ping", headers=headers)
    results["pro_user"]["ping"] = {
        "status": resp.status_code,
        "response": resp.json()
    }
    print(f"   GET /dodo/ping: {resp.status_code}")
    
    # /dodo/profile (still accessible)
    resp = requests.get(f"{BASE_URL}/dodo/profile", headers=headers)
    results["pro_user"]["profile"] = {
        "status": resp.status_code,
        "response": resp.json()
    }
    print(f"   GET /dodo/profile: {resp.status_code}")
    
    # /dodo/pro-workflow (now accessible)
    resp = requests.get(f"{BASE_URL}/dodo/pro-workflow", headers=headers)
    results["pro_user"]["pro_workflow"] = {
        "status": resp.status_code,
        "response": resp.json()
    }
    print(f"   GET /dodo/pro-workflow: {resp.status_code}")
    
    # /dodo/pro-dashboard (now accessible)
    resp = requests.get(f"{BASE_URL}/dodo/pro-dashboard", headers=headers)
    results["pro_user"]["pro_dashboard"] = {
        "status": resp.status_code,
        "response": resp.json()
    }
    print(f"   GET /dodo/pro-dashboard: {resp.status_code}")
    
    # Print results
    print("\n" + "="*60)
    print("RESULTS")
    print("="*60)
    print(json.dumps(results, indent=2))
    
    return results

if __name__ == "__main__":
    test_phase4()
