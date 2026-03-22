# External Auth System Integration Guide

This guide explains how to integrate your own authentication system with the Trial & Subscription API.

## Overview

The API uses JWT (JSON Web Tokens) for authentication. Your auth system needs to:

1. Generate a JWT token with user information
2. Call `/auth/upsert-user` to sync the user to our database
3. Call trial/subscription endpoints with the same JWT token

## JWT Token Format

### Required Fields

Your JWT payload **must** include:

```json
{
  "sub": "user_id_string",
  "email": "user@example.com",
  "name": "User Name",
  "exp": 1234567890
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sub` | string | ✅ Yes | Unique user identifier (e.g., from your auth system) |
| `email` | string | ✅ Yes | User's email address |
| `name` | string | ❌ Optional | User's display name |
| `exp` | number | ✅ Yes | Token expiration time (Unix timestamp) |

### Signing the Token

- **Algorithm**: HS256
- **Secret**: Use the shared `JWT_SECRET_KEY` (configured in both systems)
- **Expiration**: Typically 7 days from now

Example (Node.js):

```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    sub: user.id,           // Your user ID
    email: user.email,
    name: user.name,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  },
  process.env.JWT_SECRET_KEY,
  { algorithm: 'HS256' }
);
```

## Integration Flow

### Step 1: Generate JWT Token

Generate a JWT token with your user's information using the shared secret.

### Step 2: Upsert User

Before calling any trial/subscription endpoints, sync the user to our database:

```bash
POST /auth/upsert-user
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Response** (200 OK):

```json
{
  "id": "user_id_string",
  "email": "user@example.com",
  "name": "User Name",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or expired token
- `401 Unauthorized`: Missing `sub` or `email` in token

### Step 3: Call Trial/Subscription Endpoints

Now you can call any protected endpoint with the same JWT token:

```bash
POST /trial/start
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "product_key": "grammar-master"
}
```

## Endpoint Reference

### POST /auth/upsert-user

Sync/create user in the database.

**Request**:
```bash
POST /auth/upsert-user
Authorization: Bearer {JWT_TOKEN}
```

**Response** (200 OK):
```json
{
  "id": "user_id_string",
  "email": "user@example.com",
  "name": "User Name",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Behavior**:
- If user exists (by `sub`): Updates `email` and `name` fields
- If user doesn't exist: Creates new user record
- Returns the current user object

---

### POST /trial/start

Start a trial for a product.

**Request**:
```bash
POST /trial/start
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "product_key": "grammar-master"
}
```

**Response** (200 OK):
```json
{
  "product_key": "grammar-master",
  "status": "active",
  "started_at": "2024-01-15T10:30:00Z",
  "ended_at": null,
  "days_remaining": 7
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid token or user not found
- `400 Bad Request`: Missing `product_key`

---

### GET /trial/status/{product_key}

Check trial status for a product.

**Request**:
```bash
GET /trial/status/grammar-master
Authorization: Bearer {JWT_TOKEN}
```

**Response** (200 OK):
```json
{
  "product_key": "grammar-master",
  "status": "active",
  "started_at": "2024-01-15T10:30:00Z",
  "ended_at": null,
  "days_remaining": 7
}
```

**Response** (404 Not Found):
```json
{
  "detail": "Trial not found"
}
```

---

## Complete Example

### Node.js Integration

```javascript
const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:8000';
const JWT_SECRET = process.env.JWT_SECRET_KEY;

async function integrateUser(user) {
  // 1. Generate JWT token
  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    },
    JWT_SECRET,
    { algorithm: 'HS256' }
  );

  // 2. Upsert user
  const upsertRes = await fetch(`${API_URL}/auth/upsert-user`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!upsertRes.ok) {
    throw new Error(`Upsert failed: ${upsertRes.status}`);
  }

  const userData = await upsertRes.json();
  console.log('User synced:', userData);

  // 3. Start trial
  const trialRes = await fetch(`${API_URL}/trial/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ product_key: 'grammar-master' }),
  });

  if (!trialRes.ok) {
    throw new Error(`Trial start failed: ${trialRes.status}`);
  }

  const trialData = await trialRes.json();
  console.log('Trial started:', trialData);

  return trialData;
}

// Usage
integrateUser({
  id: 'user_123',
  email: 'user@example.com',
  name: 'John Doe',
});
```

### Python Integration

```python
import jwt
import requests
from datetime import datetime, timedelta

API_URL = 'http://localhost:8000'
JWT_SECRET = os.getenv('JWT_SECRET_KEY')

def integrate_user(user):
    # 1. Generate JWT token
    payload = {
        'sub': user['id'],
        'email': user['email'],
        'name': user.get('name'),
        'exp': datetime.utcnow() + timedelta(days=7),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')

    # 2. Upsert user
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
    }
    
    upsert_res = requests.post(
        f'{API_URL}/auth/upsert-user',
        headers=headers,
    )
    upsert_res.raise_for_status()
    user_data = upsert_res.json()
    print('User synced:', user_data)

    # 3. Start trial
    trial_res = requests.post(
        f'{API_URL}/trial/start',
        headers=headers,
        json={'product_key': 'grammar-master'},
    )
    trial_res.raise_for_status()
    trial_data = trial_res.json()
    print('Trial started:', trial_data)

    return trial_data

# Usage
integrate_user({
    'id': 'user_123',
    'email': 'user@example.com',
    'name': 'John Doe',
})
```

## Error Handling

### Common Errors

| Status | Error | Cause | Solution |
|--------|-------|-------|----------|
| 401 | `Invalid token` | Token signature invalid | Check JWT_SECRET_KEY matches |
| 401 | `Token expired` | Token expiration time passed | Generate new token |
| 401 | `Missing sub or email` | JWT missing required fields | Include `sub` and `email` in payload |
| 401 | `User not found in DB` | User not synced via `/auth/upsert-user` | Call `/auth/upsert-user` first |
| 400 | `Missing product_key` | `product_key` not in request body | Include `product_key` in request |

## Configuration

### Environment Variables

Both systems need the same JWT secret:

**Frontend (Next.js)**:
```env
FASTAPI_JWT_SECRET=your_shared_secret_key
```

**Backend (FastAPI)**:
```env
JWT_SECRET_KEY=your_shared_secret_key
```

## Security Considerations

1. **Keep JWT_SECRET_KEY secure** - Never expose it in client-side code
2. **Use HTTPS** - Always use HTTPS in production
3. **Token expiration** - Set reasonable expiration times (7 days recommended)
4. **Validate tokens** - Always validate token signature and expiration
5. **User isolation** - Each user can only access their own data via their `sub` claim

## Support

For issues or questions, please contact support or check the API logs for detailed error messages.
