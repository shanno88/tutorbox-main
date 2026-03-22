# Task 5: NextAuth ↔ FastAPI User Sync via Upsert Pattern

## Overview

Implemented a user synchronization mechanism between NextAuth (frontend) and FastAPI (backend) using the upsert pattern. This allows seamless user management across both systems.

## Changes Made

### 1. FastAPI Backend (`integrations/paddle-dodo/`)

#### `app/models.py`
- Added `name` field to User model (optional, nullable)
- User.id remains String type (matches NextAuth)

```python
class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=True)  # NEW
    created_at = Column(DateTime, default=datetime.utcnow)
```

#### `app/deps.py`
- Updated `get_current_user()` error message to guide users to call `/auth/upsert-user`
- Added new `get_current_user_or_upsert()` dependency for upsert endpoint
  - Decodes JWT (requires `sub`, `email`, optional `name`)
  - Upserts user: creates if not exists, updates if exists
  - Returns user object

```python
def get_current_user_or_upsert(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db_session),
) -> models.User:
    """
    Decode JWT and upsert user to database.
    If user exists: update email/name
    If user doesn't exist: create new record
    """
    # ... JWT decode logic ...
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if user:
        # Update existing
        user.email = email
        if name:
            user.name = name
        db.commit()
    else:
        # Create new
        user = models.User(
            id=user_id,
            email=email,
            hashed_password="",
            name=name,
        )
        db.add(user)
        db.commit()
    
    return user
```

#### `app/routes/auth.py`
- Added new endpoint: `POST /auth/upsert-user`
- Uses `get_current_user_or_upsert` dependency
- Returns UserOut schema with user data

```python
@router.post("/upsert-user", response_model=schemas.UserOut)
def upsert_user(
    user: models.User = Depends(get_current_user_or_upsert),
):
    """Upsert user from JWT token"""
    return user
```

#### `app/schemas.py`
- Updated `UserOut` to include `name` field (optional)
- Updated `SubscriptionOut.user_id` type: `int` → `str`
- Updated `TrialOut.user_id` type: `int` → `str`

### 2. Next.js Frontend (`src/app/api/`)

#### `src/app/api/trial/start/route.ts`
- Updated JWT payload to include `email` and `name` fields
- Added upsert-user call before trial/start
- Flow: Generate JWT → Upsert user → Start trial

```typescript
const token = jwt.sign(
  {
    sub: String(session.user.id),
    email: session.user.email,      // NEW
    name: session.user.name,        // NEW
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  },
  jwtSecret,
  { algorithm: "HS256" }
);

// NEW: Upsert user first
const upsertResponse = await fetch(`${fastApiUrl}/auth/upsert-user`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
});

if (!upsertResponse.ok) {
  // Return error if upsert fails
  return new Response(JSON.stringify(errorData), {
    status: upsertResponse.status,
    headers: { "Content-Type": "application/json" },
  });
}

// Then proceed with trial/start
const response = await fetch(`${fastApiUrl}/trial/start`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ product_key }),
});
```

#### `src/app/api/trial/status/[productKey]/route.ts`
- Same changes as trial/start
- Upsert user before checking trial status

## Database Migration

Since FastAPI uses SQLAlchemy with SQLite:

```bash
# 1. Delete old database (has old schema)
rm integrations/paddle-dodo/app.db

# 2. Restart FastAPI (recreates tables with new schema)
cd integrations/paddle-dodo
python -m uvicorn app.main:app --reload --port 8000
```

The `Base.metadata.create_all(bind=engine)` in `main.py` will automatically create tables with the new schema.

## API Endpoints

### POST /auth/upsert-user

Sync/create user in FastAPI database.

**Request**:
```bash
POST /auth/upsert-user
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**JWT Payload** (required):
```json
{
  "sub": "user_id_string",
  "email": "user@example.com",
  "name": "User Name",
  "exp": 1234567890
}
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
- `401 Unauthorized`: Invalid token or missing `sub`/`email`

## User Flow

```
1. User logs in via NextAuth
   ↓
2. Frontend generates JWT with sub, email, name
   ↓
3. Frontend calls POST /api/trial/start
   ↓
4. API Route generates same JWT
   ↓
5. API Route calls POST /auth/upsert-user
   ├─ If user exists: update email/name
   └─ If user doesn't exist: create new record
   ↓
6. API Route calls POST /trial/start with JWT
   ↓
7. FastAPI get_current_user finds user in DB ✅
   ↓
8. Trial starts successfully
```

## Verification Checklist

- [ ] Deleted `integrations/paddle-dodo/app.db`
- [ ] Restarted FastAPI with new schema
- [ ] New user logs in via NextAuth
- [ ] POST /api/trial/start returns 200
  - [ ] Network shows POST /auth/upsert-user 200
  - [ ] Network shows POST /trial/start 200
- [ ] No "User not found" errors
- [ ] GET /api/trial/status/grammar-master returns 200
- [ ] FastAPI logs show successful user upsert
- [ ] Can see trial status with remaining days

## Files Modified

### Backend (FastAPI)
1. `integrations/paddle-dodo/app/models.py` - Added name field
2. `integrations/paddle-dodo/app/deps.py` - Added get_current_user_or_upsert
3. `integrations/paddle-dodo/app/routes/auth.py` - Added /auth/upsert-user endpoint
4. `integrations/paddle-dodo/app/schemas.py` - Updated UserOut, SubscriptionOut, TrialOut

### Frontend (Next.js)
1. `src/app/api/trial/start/route.ts` - Added upsert-user call
2. `src/app/api/trial/status/[productKey]/route.ts` - Added upsert-user call

### Documentation
1. `docs/EXTERNAL_AUTH_INTEGRATION.md` - Integration guide for external systems

## Key Design Decisions

1. **Upsert Pattern**: User is created/updated on first API call, not on login
   - Simplifies integration with external auth systems
   - No need for separate user creation endpoint
   - Handles user info updates automatically

2. **JWT Payload**: Includes `email` and `name` for user sync
   - Allows updating user info without database query
   - Supports external auth systems with different user models

3. **Error Messages**: Clear guidance when user not found
   - "User not found in DB. Did you call /auth/upsert-user first?"
   - Helps developers debug integration issues

4. **Backward Compatibility**: Kept `get_current_user_for_trial` alias
   - Existing code continues to work
   - No breaking changes to trial/subscription endpoints

## Testing

### Manual Test Flow

1. **New user login**:
   ```bash
   # 1. Login via NextAuth (creates session)
   # 2. Navigate to /zh/grammar-master
   # 3. Click "开始试用"
   # 4. Check Network tab:
   #    - POST /api/trial/start
   #    - POST /auth/upsert-user (200)
   #    - POST /trial/start (200)
   # 5. See trial status with remaining days
   ```

2. **Existing user**:
   ```bash
   # 1. Refresh page
   # 2. GET /api/trial/status/grammar-master
   # 3. Should return 200 with trial info
   ```

3. **FastAPI logs**:
   ```bash
   # Should see:
   # - JWT decode successful
   # - User upsert: created/updated
   # - No ValueError or user lookup errors
   ```

## Next Steps

- Monitor production for any user sync issues
- Collect feedback from external integration partners
- Consider adding user profile update endpoint if needed
- Add rate limiting to /auth/upsert-user if needed
