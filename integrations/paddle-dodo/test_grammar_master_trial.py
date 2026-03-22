#!/usr/bin/env python
"""
Grammar Master 试用系统集成测试。

测试流程：
1. 初始化 Plan
2. 注册新用户
3. 登录获取 token
4. 验证用户没有试用时无法访问 Grammar Master 内容（返回 403）
5. 开始 Grammar Master 试用
6. 验证试用状态
7. 验证用户可以访问 Grammar Master 内容（返回 200）
8. 模拟试用过期（修改数据库）
9. 验证过期后无法访问 Grammar Master 内容（返回 403）
"""
import requests
import json
import sys
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta

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

def test_access_grammar_master_no_trial(token: str):
    """未开始试用时访问 Grammar Master 内容（应返回 403）"""
    print_section("4. 未开始试用时访问 /practice/grammar-master/content (应返回 403)")
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/practice/grammar-master/content", headers=headers)
    print(f"状态码: {resp.status_code}")
    data = resp.json()
    print(f"响应: {json.dumps(data, indent=2)}")
    
    if resp.status_code == 403:
        print("✅ 正确返回 403")
        return True
    else:
        print("❌ 应该返回 403")
        return False

def test_start_trial(token: str):
    """开始 Grammar Master 试用"""
    print_section("5. 开始 Grammar Master 试用")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"product_key": "grammar-master"}
    resp = requests.post(f"{BASE_URL}/trial/start", json=payload, headers=headers)
    print(f"状态码: {resp.status_code}")
    data = resp.json()
    print(f"响应: {json.dumps(data, indent=2)}")
    
    if resp.status_code == 200:
        print("✅ 试用开始成功")
        return True
    else:
        print("❌ 试用开始失败")
        return False

def test_get_trial_status(token: str):
    """获取试用状态"""
    print_section("6. 获取 Grammar Master 试用状态")
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/trial/status/grammar-master", headers=headers)
    print(f"状态码: {resp.status_code}")
    data = resp.json()
    print(f"响应: {json.dumps(data, indent=2)}")
    
    if resp.status_code == 200:
        days_remaining = data.get("days_remaining")
        status = data.get("status")
        print(f"✅ 试用状态: {status}, 剩余天数: {days_remaining}")
        return True
    else:
        print("❌ 获取试用状态失败")
        return False

def test_access_grammar_master_with_trial(token: str):
    """试用期间访问 Grammar Master 内容（应返回 200）"""
    print_section("7. 试用期间访问 /practice/grammar-master/content (应返回 200)")
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/practice/grammar-master/content", headers=headers)
    print(f"状态码: {resp.status_code}")
    data = resp.json()
    print(f"响应: {json.dumps(data, indent=2)}")
    
    if resp.status_code == 200:
        print("✅ 正确返回 200")
        return True
    else:
        print("❌ 应该返回 200")
        return False

def expire_trial(email: str):
    """通过数据库将试用标记为过期"""
    print_section("8. 模拟试用过期（修改数据库）")
    
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
        
        # 获取 Grammar Master 试用记录
        cursor.execute(
            "SELECT id, started_at FROM trials WHERE user_id = ? AND product_key = 'grammar-master' AND status = 'active'",
            (user_id,)
        )
        trial_row = cursor.fetchone()
        if not trial_row:
            print("❌ 没有找到活跃的 Grammar Master 试用记录")
            return False
        
        trial_id = trial_row[0]
        print(f"试用 ID: {trial_id}")
        
        # 将 started_at 改为 8 天前，使试用过期
        past_date = datetime.utcnow() - timedelta(days=8)
        cursor.execute(
            "UPDATE trials SET started_at = ? WHERE id = ?",
            (past_date.isoformat(), trial_id)
        )
        
        conn.commit()
        print(f"✅ 成功将试用标记为过期（started_at 改为 8 天前）")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ 数据库操作失败: {e}")
        return False

def test_access_grammar_master_expired(token: str):
    """试用过期后访问 Grammar Master 内容（应返回 403）"""
    print_section("9. 试用过期后访问 /practice/grammar-master/content (应返回 403)")
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/practice/grammar-master/content", headers=headers)
    print(f"状态码: {resp.status_code}")
    data = resp.json()
    print(f"响应: {json.dumps(data, indent=2)}")
    
    if resp.status_code == 403:
        print("✅ 正确返回 403")
        return True
    else:
        print("❌ 应该返回 403")
        return False

if __name__ == "__main__":
    print("确保服务器正在运行: uvicorn app.main:app --reload")
    print("按 Enter 继续...")
    input()
    
    try:
        import time
        email = f"gmtest{int(time.time())}@example.com"
        
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
        
        # 第 4 步：未开始试用时访问 Grammar Master（应返回 403）
        if not test_access_grammar_master_no_trial(token):
            print("❌ 权限检查失败")
            sys.exit(1)
        
        # 第 5 步：开始试用
        if not test_start_trial(token):
            print("❌ 开始试用失败")
            sys.exit(1)
        
        # 第 6 步：获取试用状态
        if not test_get_trial_status(token):
            print("❌ 获取试用状态失败")
            sys.exit(1)
        
        # 第 7 步：试用期间访问 Grammar Master（应返回 200）
        if not test_access_grammar_master_with_trial(token):
            print("❌ 试用期间权限检查失败")
            sys.exit(1)
        
        # 第 8 步：模拟试用过期
        if not expire_trial(email):
            print("❌ 模拟试用过期失败")
            sys.exit(1)
        
        # 第 9 步：试用过期后访问 Grammar Master（应返回 403）
        if not test_access_grammar_master_expired(token):
            print("❌ 过期后权限检查失败")
            sys.exit(1)
        
        print_section("✅ 所有测试通过！")
        print("\nGrammar Master 试用系统集成测试完成：")
        print("  ✅ 未开始试用时无法访问内容（403）")
        print("  ✅ 开始试用成功")
        print("  ✅ 试用期间可以访问内容（200）")
        print("  ✅ 试用过期后无法访问内容（403）")
        print("  ✅ 权限控制正常工作")
        
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
