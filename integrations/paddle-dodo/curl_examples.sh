#!/bin/bash
# 第 2 阶段 API 测试命令集

BASE_URL="http://localhost:8000"

echo "=== 第 2 阶段 API 测试命令 ==="
echo ""

# 1. 初始化 Plan
echo "1. 初始化 Free/Pro Plan"
echo "curl -X POST $BASE_URL/plans/seed"
echo ""

# 2. 注册用户
echo "2. 注册用户"
echo "curl -X POST $BASE_URL/auth/register \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\":\"user@example.com\",\"password\":\"pass123\"}'"
echo ""

# 3. 登录
echo "3. 登录获取 Token"
echo "curl -X POST $BASE_URL/auth/login \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\":\"user@example.com\",\"password\":\"pass123\"}'"
echo ""

# 4. 获取完整订阅信息
echo "4. 获取完整订阅信息"
echo "curl -X GET $BASE_URL/subscriptions/me \\"
echo "  -H 'Authorization: Bearer <your_token>'"
echo ""

# 5. 获取简化订阅状态
echo "5. 获取简化订阅状态"
echo "curl -X GET $BASE_URL/subscriptions/me/status \\"
echo "  -H 'Authorization: Bearer <your_token>'"
echo ""

# 6. 列出所有 Plan
echo "6. 列出所有 Plan"
echo "curl -X GET $BASE_URL/plans"
echo ""

# 实际执行示例（取消注释以运行）
# TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
#   -H 'Content-Type: application/json' \
#   -d '{"email":"user@example.com","password":"pass123"}' | jq -r '.access_token')
# 
# echo "获得的 Token: $TOKEN"
# echo ""
# echo "查询订阅状态..."
# curl -X GET $BASE_URL/subscriptions/me/status \
#   -H "Authorization: Bearer $TOKEN"
