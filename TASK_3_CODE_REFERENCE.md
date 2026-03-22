# Task 3: JWT Refactor - Complete Code Reference

## New Files Created

### 1. `src/app/api/trial/start/route.ts`

```typescript
/**
 * POST /api/trial/start
 *
 * Proxy endpoint for starting a trial.
 * - Validates user session via next-auth
 * - Generates JWT token
 * - Forwards request to FastAPI /trial/start
 * - Returns FastAPI response transparently
 */

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    // 1. Get current user from session
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ detail: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Parse request body
    const body = await req.json();
    const { product_key } = body;

    if (!product_key) {
      return new Response(
        JSON.stringify({ detail: "Missing product_key" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Generate JWT token
    const jwtSecret = process.env.FASTAPI_JWT_SECRET;
    if (!jwtSecret) {
      console.error("[trial/start] FASTAPI_JWT_SECRET not configured");
      return new Response(
        JSON.stringify({ detail: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = jwt.sign(
      {
        sub: String(session.user.id),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
      },
      jwtSecret,
      { algorithm: "HS256" }
    );

    // 4. Forward to FastAPI
    const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000";
    const response = await fetch(`${fastApiUrl}/trial/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ product_key }),
    });

    // 5. Return FastAPI response transparently
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[trial/start] Error:", error);
    return new Response(
      JSON.stringify({ detail: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

### 2. `src/app/api/trial/status/[productKey]/route.ts`

```typescript
/**
 * GET /api/trial/status/[productKey]
 *
 * Proxy endpoint for checking trial status.
 * - Validates user session via next-auth
 * - Generates JWT token
 * - Forwards request to FastAPI /trial/status/{product_key}
 * - Returns FastAPI response transparently
 */

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import jwt from "jsonwebtoken";

export async function GET(
  req: Request,
  { params }: { params: { productKey: string } }
) {
  try {
    // 1. Get current user from session
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ detail: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { productKey } = params;

    if (!productKey) {
      return new Response(
        JSON.stringify({ detail: "Missing productKey" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Generate JWT token
    const jwtSecret = process.env.FASTAPI_JWT_SECRET;
    if (!jwtSecret) {
      console.error("[trial/status] FASTAPI_JWT_SECRET not configured");
      return new Response(
        JSON.stringify({ detail: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = jwt.sign(
      {
        sub: String(session.user.id),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
      },
      jwtSecret,
      { algorithm: "HS256" }
    );

    // 3. Forward to FastAPI
    const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000";
    const response = await fetch(
      `${fastApiUrl}/trial/status/${productKey}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // 4. Return FastAPI response transparently
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[trial/status] Error:", error);
    return new Response(
      JSON.stringify({ detail: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

## Updated Files

### 3. `integrations/paddle-dodo/app/routes/trial.py` (Key Changes)

**Import Change**:
```python
# OLD
from app.deps import get_current_user, get_db_session

# NEW
from app.deps import get_current_user_for_trial, get_db_session
```

**Endpoint Changes**:
```python
# OLD
@router.post("/start", response_model=schemas.TrialOut)
async def start_trial(
    trial_create: schemas.TrialCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):

# NEW
@router.post("/start", response_model=schemas.TrialOut)
async def start_trial(
    trial_create: schemas.TrialCreate,
    current_user: models.User = Depends(get_current_user_for_trial),
    db: Session = Depends(get_db_session),
):
```

```python
# OLD
@router.get("/status/{product_key}", response_model=schemas.TrialStatusResponse)
async def get_trial_status(
    product_key: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
):

# NEW
@router.get("/status/{product_key}", response_model=schemas.TrialStatusResponse)
async def get_trial_status(
    product_key: str,
    current_user: models.User = Depends(get_current_user_for_trial),
    db: Session = Depends(get_db_session),
):
```

### 4. `integrations/paddle-dodo/app/routes/practice.py` (Key Changes)

**Import Change**:
```python
# OLD
from app.deps import get_current_user, get_db_session

# NEW
from app.deps import get_current_user_for_trial, get_db_session
```

**Dependency Change**:
```python
# OLD
def trial_or_subscription_grammar_master(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> models.User:

# NEW
def trial_or_subscription_grammar_master(
    current_user: models.User = Depends(get_current_user_for_trial),
    db: Session = Depends(get_db_session),
) -> models.User:
```

### 5. `src/hooks/use-trial.ts` (Key Changes)

**Removed**:
```typescript
// REMOVED: No longer needed
const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";
```

**Updated fetchTrialStatus**:
```typescript
// OLD
const response = await fetch(
  `${fastApiUrl}/trial/status/${productKey}`,
  {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }
);

// NEW
const response = await fetch(
  `/api/trial/status/${productKey}`,
  {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }
);
```

**Updated startTrial**:
```typescript
// OLD
const response = await fetch(`${fastApiUrl}/trial/start`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    product_key: productKey,
  }),
});

// NEW
const response = await fetch(`/api/trial/start`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    product_key: productKey,
  }),
});
```

## Already Implemented

### 6. `integrations/paddle-dodo/app/deps.py` (Already Done)

```python
def get_current_user_for_trial(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db_session),
) -> models.User:
    """
    从 Authorization header 的 Bearer token 中解析当前用户（仅用于 Trial 鉴权）。
    
    只接受标准 JWT token（使用 settings.jwt_secret_key 签名）。
    
    JWT Payload 必须包含：
    - sub: 用户 ID（字符串或整数）
    - exp: 过期时间（可选，Unix timestamp）
    
    Token 无效或用户不存在时抛 401。
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
        )
    
    # 提取 Bearer token
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
        )
    
    token = parts[1]
    
    # 解析 JWT
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
        user_id = int(user_id_str)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    # 查询用户
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    return user
```

## Environment Configuration

### Next.js (.env.local)
```
FASTAPI_URL=http://localhost:8000
FASTAPI_JWT_SECRET=your-secret-key-change-in-production
```

### FastAPI (.env)
```
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
```

## JWT Payload Example

```json
{
  "sub": "123",
  "exp": 1711100400,
  "iat": 1710495600
}
```

- `sub`: User ID as string
- `exp`: Unix timestamp (7 days from now)
- `iat`: Issued at (optional)

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Missing authorization header"
}
```

### 401 Token Expired
```json
{
  "detail": "Token expired"
}
```

### 401 Invalid Token
```json
{
  "detail": "Invalid token"
}
```

### 401 User Not Found
```json
{
  "detail": "User not found"
}
```

### 404 No Trial
```json
{
  "detail": "No trial found for product: grammar-master"
}
```

## Summary

- **2 new API Routes** created for trial management
- **3 files updated** to use JWT validation
- **1 file already done** with JWT implementation
- **Production-ready** JWT authentication with HS256
- **API Route proxy pattern** for secure token handling
- **No breaking changes** to existing auth system
