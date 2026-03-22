# Development Notes: TODOs, Risks, and Warnings

## Critical Issues (Do NOT Use in Production)

### 1. ⚠️ Webhook Handler Not Implemented

**File**: `app/routes/webhook_paddle.py`

**Status**: EMPTY - completely unimplemented

**Risk**: Without a webhook handler, payment events from Paddle are not processed. Users can pay but won't get access to products.

**What's Missing**:
- Webhook signature verification
- Event parsing (subscription.activated, subscription.canceled, transaction.completed)
- Database updates for subscription status
- Error handling and logging

**Reference**: See production handler at `src/app/api/webhooks/paddle/route.ts` for proper implementation.

**TODO**: Implement webhook handler with:
```python
@router.post("/webhook/paddle")
async def handle_paddle_webhook(request: Request, db: Session = Depends(get_db_session)):
    # 1. Verify signature using PADDLE_WEBHOOK_SECRET
    # 2. Parse event type and data
    # 3. Update subscriptions table based on event
    # 4. Log all events for debugging
    # 5. Return 200 OK to acknowledge receipt
```

---

### 2. ⚠️ Hardcoded JWT Secret

**File**: `app/config.py`

**Current Value**: `"your-secret-key-change-in-production"`

**Risk**: Anyone can forge JWT tokens and impersonate any user.

**TODO**: 
- Generate a strong random secret for production
- Load from environment variable (already set up in `.env`)
- Rotate secret periodically

---

### 3. ⚠️ Weak Password Hashing

**File**: `app/routes/auth.py`

**Current Implementation**: Plain SHA256 (no salt)

```python
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()
```

**Risk**: 
- Vulnerable to rainbow table attacks
- No salt means identical passwords hash to identical values
- SHA256 is not designed for password hashing

**TODO**: Replace with bcrypt or argon2:
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

---

### 4. ⚠️ Incomplete Paddle API Client

**File**: `app/services/paddle_client.py`

**Issues**:
- Uses pseudo-code structure
- Endpoint paths may not match actual Paddle API v2
- No error handling for API failures
- No retry logic
- No rate limiting

**Current Code**:
```python
url = f"{self.base_url}/transactions"  # May not be correct endpoint
```

**TODO**: 
- Verify against actual Paddle API documentation
- Add proper error handling
- Add retry logic with exponential backoff
- Add request/response logging

---

### 5. ⚠️ No Input Validation

**File**: Multiple route files

**Risk**: 
- No validation on email format
- No validation on password strength
- No validation on price IDs
- No rate limiting on registration/login

**TODO**: Add Pydantic validators:
```python
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
```

---

### 6. ⚠️ SQLite Database (Not Production-Ready)

**File**: `app/db.py`

**Current**: `sqlite:///./app.db`

**Limitations**:
- Single-threaded
- No concurrent write support
- No backup/recovery
- No replication
- Data loss on server crash

**TODO**: For production, migrate to PostgreSQL:
```python
DATABASE_URL = "postgresql://user:password@localhost/paddle_saas"
```

---

### 7. ⚠️ No Rate Limiting

**Risk**: 
- Brute force attacks on login endpoint
- Spam registration
- Webhook replay attacks

**TODO**: Add rate limiting middleware:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@router.post("/auth/login")
@limiter.limit("5/minute")
def login(...):
    pass
```

---

### 8. ⚠️ No Audit Logging

**Risk**: 
- No way to trace payment history
- No compliance audit trail
- Difficult to debug issues

**TODO**: Add logging for all payment events:
```python
import logging

logger = logging.getLogger(__name__)

logger.info(f"User {user_id} registered")
logger.info(f"Webhook received: {event_type}")
logger.warning(f"Invalid webhook signature from {ip_address}")
```

---

## Medium Priority Issues

### 9. ⚠️ Hardcoded Price IDs

**File**: `app/config.py`

**Current**:
```python
paddle_price_id_basic: str | None = None
paddle_price_id_pro: str | None = None
```

**Issue**: Only supports 2 price IDs (Basic, Pro). What about other products or currencies?

**Reference**: Production uses dynamic mapping from `src/lib/paddle-mappings.ts`

**TODO**: Implement dynamic price ID mapping:
```python
# Instead of hardcoded IDs, load from database or config
PRICE_ID_MAPPING = {
    "prompter_yearly_usd": "price_xxx",
    "prompter_yearly_cny": "price_yyy",
    "grammar_monthly_usd": "price_zzz",
    # ... etc
}
```

---

### 10. ⚠️ No Error Handling in Routes

**File**: Multiple route files

**Example**: `app/routes/billing.py`

```python
plan = db.query(models.Plan).filter(models.Plan.id == subscription.plan_id).first()
if not plan:
    raise HTTPException(...)  # Good
```

**Issue**: Some queries don't check for None before accessing attributes.

**TODO**: Add defensive checks throughout.

---

### 11. ⚠️ Mock Data in Pro Dashboard

**File**: `app/routes/dodo/__init__.py`

**Current**:
```python
"total_workflows": 5,
"active_projects": 2,
"api_calls_this_month": 1250,
```

**Issue**: Hardcoded mock data. Should query actual data from database.

**TODO**: Create database models for Workflow, Project, APICall and query real data:
```python
workflows = db.query(Workflow).filter(Workflow.user_id == user.id).count()
projects = db.query(Project).filter(Project.user_id == user.id).count()
api_calls = db.query(APICall).filter(
    APICall.user_id == user.id,
    APICall.created_at >= datetime.now() - timedelta(days=30)
).count()
```

---

### 12. ⚠️ No CORS Configuration

**File**: `app/main.py`

**Issue**: If frontend is on different domain, requests will fail.

**TODO**: Add CORS middleware:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### 13. ⚠️ No HTTPS Enforcement

**File**: All routes

**Issue**: Tokens and passwords sent over HTTP can be intercepted.

**TODO**: 
- Use HTTPS in production
- Add HSTS header
- Use secure cookies

---

### 14. ⚠️ Token Expiration Not Enforced

**File**: `app/config.py`

**Current**: `jwt_expire_minutes: int = 60 * 24  # 24 hours`

**Issue**: 24 hours is too long. If token is stolen, attacker has 24 hours of access.

**TODO**: 
- Reduce to 15-30 minutes
- Implement refresh token mechanism
- Add token revocation list

---

## Low Priority Issues

### 15. Missing Docstrings

**Files**: Multiple

**Issue**: Some functions lack documentation.

**TODO**: Add docstrings to all public functions.

---

### 16. No Type Hints

**Files**: Some routes

**Issue**: Makes code harder to understand and maintain.

**TODO**: Add type hints to all functions.

---

### 17. No Tests for Edge Cases

**Files**: `test_*.py`

**Current Tests**: Basic happy path tests

**TODO**: Add tests for:
- Invalid tokens
- Expired tokens
- Missing headers
- Malformed JSON
- SQL injection attempts
- XSS attempts

---

### 18. No Database Migrations

**File**: `app/db.py`

**Current**: `Base.metadata.create_all(bind=engine)`

**Issue**: No way to version schema changes.

**TODO**: Use Alembic for migrations:
```bash
alembic init migrations
alembic revision --autogenerate -m "Add users table"
alembic upgrade head
```

---

### 19. No Logging Configuration

**File**: `app/main.py`

**Issue**: No centralized logging setup.

**TODO**: Add logging configuration:
```python
import logging.config

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        },
    },
    "handlers": {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "level": "INFO",
        "handlers": ["default"],
    },
}

logging.config.dictConfig(LOGGING_CONFIG)
```

---

### 20. No Health Check Endpoint Details

**File**: `app/main.py`

**Current**:
```python
@app.get("/health")
def health_check():
    return {"status": "ok"}
```

**TODO**: Add database connectivity check:
```python
@app.get("/health")
def health_check(db: Session = Depends(get_db_session)):
    try:
        db.execute("SELECT 1")
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": "disconnected", "error": str(e)}, 503
```

---

## Testing Checklist

Before using this code for anything beyond local development:

- [ ] Implement webhook handler (`webhook_paddle.py`)
- [ ] Replace hardcoded JWT secret
- [ ] Replace SHA256 with bcrypt for passwords
- [ ] Verify Paddle API client against actual API docs
- [ ] Add input validation to all endpoints
- [ ] Migrate from SQLite to PostgreSQL
- [ ] Add rate limiting
- [ ] Add comprehensive logging
- [ ] Add CORS configuration
- [ ] Enforce HTTPS
- [ ] Reduce JWT expiration time
- [ ] Add database migrations (Alembic)
- [ ] Add comprehensive test suite
- [ ] Add security headers
- [ ] Perform security audit
- [ ] Load test for performance
- [ ] Set up monitoring and alerting

---

## Comparison: Experimental vs Production

| Aspect | Experimental (This Folder) | Production |
|--------|---------------------------|-----------|
| **Webhook Handler** | ❌ Not implemented | ✅ Fully implemented |
| **Password Hashing** | ❌ SHA256 (weak) | ✅ bcrypt (strong) |
| **JWT Secret** | ❌ Hardcoded | ✅ Environment variable |
| **Database** | ❌ SQLite | ✅ PostgreSQL |
| **Rate Limiting** | ❌ None | ✅ Implemented |
| **Logging** | ⚠️ Minimal | ✅ Comprehensive |
| **Input Validation** | ⚠️ Partial | ✅ Full |
| **Error Handling** | ⚠️ Basic | ✅ Robust |
| **CORS** | ❌ Not configured | ✅ Configured |
| **HTTPS** | ❌ Not enforced | ✅ Enforced |
| **Audit Trail** | ❌ None | ✅ Full audit log |

---

## Missing Information for Price Mappings

### Task 3: Price ID Mappings

A centralized billing price map module has been created at `src/lib/billing/priceMaps.ts` to map:
- Paddle/DoDo price IDs → product keys
- Product keys → plan slugs
- Plan slugs → plan details

**Current Status**: Placeholders with TODOs for actual price IDs

**Missing Information**:

1. **Actual Paddle Price IDs**
   - Need to get real price IDs from Paddle Dashboard
   - Currently using environment variables (not hardcoded)
   - Locations:
     - `NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD`
     - `NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY`
     - `NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD`
     - `NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY`
   - See `integrations/paddle-dodo/ENVIRONMENT.md` for how to get these

2. **DoDo Price ID Format and Mappings**
   - DoDo integration not yet implemented
   - Need to determine:
     - What is the DoDo price ID format?
     - How are DoDo products structured?
     - What products will be sold via DoDo?
   - Currently marked as TODO in `src/lib/billing/priceMaps.ts`

3. **Additional Products**
   - Planned products not yet implemented:
     - `en-cards` (English Cards)
     - `thinker-ai` (Thinker AI)
     - `flowforge` (FlowForge)
   - Need to define:
     - Product keys
     - Plan slugs
     - Pricing (yearly/monthly/onetime)
     - Currencies (USD/CNY)
     - Paddle price IDs

4. **Monthly Billing Plans**
   - Currently only yearly and onetime plans are defined
   - If monthly plans are added, need to:
     - Create new plan slugs (e.g., `grammar-master-monthly-usd`)
     - Add to `productKeyToPlanSlugs` mapping
     - Add to `planSlugToDetails` mapping
     - Get Paddle price IDs for monthly plans

### How to Complete Price Mappings

1. **Get Paddle Price IDs**:
   - Log in to Paddle Dashboard
   - Go to Products → [Product Name]
   - Find each price (yearly USD, yearly CNY, etc.)
   - Copy the price ID (format: `pri_xxxxx`)
   - Add to `.env.local` or production environment

2. **Update `src/lib/billing/priceMaps.ts`**:
   - Replace TODO comments with actual price IDs
   - Add DoDo price IDs once DoDo integration is planned
   - Add new products as they are implemented

3. **Test Mappings**:
   - Use `logAllMappings()` function to verify all mappings
   - Test webhook handler with real price IDs
   - Verify that `getProductKeyFromPriceId()` returns correct product keys

### Related Files

- **Billing Maps**: `src/lib/billing/priceMaps.ts` - Centralized mapping module
- **App Registry**: `src/config/apps.ts` - Product and price configuration
- **Paddle Mappings**: `src/lib/paddle-mappings.ts` - Dynamic mapping from appRegistry
- **Webhook Handler**: `src/app/api/webhooks/paddle/route.ts` - Uses mappings to process events
- **Environment Variables**: `integrations/paddle-dodo/ENVIRONMENT.md` - How to get price IDs

---

## References

- **Production Webhook**: `src/app/api/webhooks/paddle/route.ts`
- **Price Mappings**: `src/lib/paddle-mappings.ts`
- **Billing Maps**: `src/lib/billing/priceMaps.ts`
- **Paddle API Docs**: https://developer.paddle.com/
- **FastAPI Security**: https://fastapi.tiangolo.com/tutorial/security/
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/

---

## Questions?

If you have questions about any of these issues:

1. Check the production code for reference implementations
2. Review the PHASE guides for context
3. Look at test scripts for usage examples
4. Consult the original `readme.md` for background
5. See `src/lib/billing/priceMaps.ts` for centralized billing mappings

**Remember**: This is experimental code. Do NOT deploy to production without addressing all critical issues.
