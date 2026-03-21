# License Server Protocol

Base URL: `https://license.yourdomain.com`

## 1. POST /v1/licenses/validate

用于自托管 admin 在启动/定期检查授权状态。

### Request

`POST /v1/licenses/validate`

Body (JSON):

```json
{
  "license_key": "PDL-XXXX-XXXX-XXXX"
}
Successful Response
json
{
  "status": "ok",
  "plan": "pro",
  "expires_at": "2027-01-01T00:00:00Z"
}
status: "ok"

plan: 授权计划标识（如 basic / pro）
plan: "basic" / "pro" / "enterprise"（未来你要按计划区别功能时会用到）
expires_at: ISO8601 到期时间（UTC）

Error Response
json
{
  "status": "error",
  "code": "NOT_FOUND"
}
code 取值：

"NOT_FOUND": key 不存在

"EXPIRED": 已过期

"REVOKED": 已被撤销

2. POST /v1/licenses/activate
用于 admin 激活时测试 license key 是否有效。

Request
POST /v1/licenses/activate

Body (JSON):

json
{
  "license_key": "PDL-XXXX-XXXX-XXXX"
}
Successful Response
结构同 /v1/licenses/validate：

json
{
  "status": "ok",
  "plan": "pro",
  "expires_at": "2027-01-01T00:00:00Z"
}
Error Response
结构同 /v1/licenses/validate：

json
{
  "status": "error",
  "code": "NOT_FOUND"
}
text
“当 code 为 EXPIRED 时，status 一律视为无效授权（admin 端应锁定功能）”
3. 保存，这个文档后面给 Kiro 和你自己都用。

***

## 二、实现 src/lib/license.ts（checkLicense）

1. 新建文件：`src/lib/license.ts`。  
2. 填入这个实现骨架（后面你可以微调缓存策略）：

```ts
// src/lib/license.ts
type LicenseStatus = 'ACTIVE' | 'UNLICENSED' | 'INVALID'

const LICENSE_SERVER_URL = process.env.LICENSE_SERVER_URL
const LICENSE_KEY = process.env.LICENSE_KEY

let cachedStatus: LicenseStatus = 'UNLICENSED'
let lastCheck = 0
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 小时

export async function checkLicense(): Promise<LicenseStatus> {
  if (!LICENSE_KEY) {
    cachedStatus = 'UNLICENSED'
    return cachedStatus
  }

  const now = Date.now()
  if (now - lastCheck < CACHE_TTL_MS && cachedStatus === 'ACTIVE') {
    return cachedStatus
  }

  if (!LICENSE_SERVER_URL) {
    // 没配置服务地址，直接当 INVALID
    cachedStatus = 'INVALID'
    lastCheck = now
    return cachedStatus
  }

  try {
    const res = await fetch(`${LICENSE_SERVER_URL}/v1/licenses/validate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ license_key: LICENSE_KEY }),
    })

    const data = await res.json()

    if (data.status === 'ok') {
      cachedStatus = 'ACTIVE'
    } else {
      cachedStatus = 'INVALID'
    }
  } catch {
    // 请求失败时保守处理
    cachedStatus = 'INVALID'
  }

  lastCheck = Date.now()
  return cachedStatus
}
在 .env.local/部署环境里预留：

LICENSE_SERVER_URL=https://license.yourdomain.com

LICENSE_KEY=PDL-XXXX-XXXX-XXXX（先随便写个占位，后面再换真 key）。