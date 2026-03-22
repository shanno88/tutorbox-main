# Auth Migration Roadmap - JWT Standardization

## Current State (Transition Phase)

### What We Have Now
- **Frontend**: Next.js with next-auth (JWT strategy)
- **Backend**: FastAPI with custom JWT validation
- **Compatibility Layer**: `get_current_user` accepts both:
  1. Standard JWT tokens (signed with `settings.jwt_secret_key`)
  2. Simple user IDs (for local development/transition)

### Why This Approach
- ✅ Enables immediate front-end/back-end integration
- ✅ Grammar Master trial flow works end-to-end
- ✅ Minimal changes to existing code
- ⚠️ Not production-ready for external customers
- ⚠️ Security concerns with bare user ID tokens

### Current Implementation
**File**: `integrations/paddle-dodo/app/deps.py`

```python
def get_current_user(...):
    # Try JWT decode first
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, ...)
        user_id = int(payload.get("sub"))
    except jwt.InvalidTokenError:
        # Fallback: try as simple user ID
        try:
            user_id = int(token)
        except ValueError:
            raise HTTPException(401, "Invalid token format")
```

---

## Phase 1: Current (Transition)

**Duration**: Now - until Grammar Master trial is fully tested
**Goal**: Validate trial system works end-to-end
**Status**: ✅ In Progress

### Tasks
- [x] Implement trial system (models, schemas, routes)
- [x] Create useTrial hook
- [x] Add Grammar Master protected endpoint
- [x] Enable user ID fallback in get_current_user
- [ ] Complete end-to-end testing
- [ ] Verify all trial flows work

### Deliverables
- Grammar Master trial fully functional
- Test scripts passing
- Documentation of current state

---

## Phase 2: Standardization (Planned)

**Duration**: After Grammar Master is stable
**Goal**: Design production-ready JWT authentication
**Status**: 📋 Planned

### Option A: Next.js API Route Proxy (Recommended)

**Architecture**:
```
Frontend (Next.js)
  ↓
useTrial hook
  ↓
fetch('/api/trial/start')  ← Next.js API Route
  ↓
Next.js validates session (next-auth)
  ↓
Next.js generates FastAPI JWT token
  ↓
fetch('http://fastapi:8000/trial/start', {
  Authorization: 'Bearer <JWT>'
})
  ↓
FastAPI validates JWT
  ↓
Return response to frontend
```

**Pros**:
- ✅ Clean separation of concerns
- ✅ Next.js handles session validation
- ✅ FastAPI only sees standard JWT
- ✅ Easy to add middleware/logging
- ✅ Can add rate limiting at Next.js layer

**Cons**:
- ⚠️ Extra network hop (minor performance impact)
- ⚠️ More code to maintain

**Implementation Steps**:
1. Create `/api/trial/start` and `/api/trial/status/[productKey]` routes
2. Validate next-auth session in each route
3. Generate JWT token with user ID
4. Call FastAPI endpoint
5. Return response to frontend
6. Update useTrial to call `/api/trial/*` instead of FastAPI directly

### Option B: Shared JWT Secret

**Architecture**:
```
Frontend (Next.js)
  ↓
next-auth generates JWT with shared secret
  ↓
useTrial hook sends JWT to FastAPI
  ↓
FastAPI validates JWT with same secret
  ↓
Return response
```

**Pros**:
- ✅ Direct communication (no proxy needed)
- ✅ Fewer network hops
- ✅ Simpler architecture

**Cons**:
- ⚠️ Requires sharing secret between systems
- ⚠️ Harder to rotate secrets
- ⚠️ Less flexibility for middleware

**Implementation Steps**:
1. Ensure next-auth and FastAPI use same JWT secret
2. Ensure JWT format is compatible
3. Update useTrial to send next-auth JWT directly
4. Remove user ID fallback from get_current_user

---

## Phase 3: Production Hardening (Future)

**Duration**: Before external product launch
**Goal**: Make auth system production-ready and sellable
**Status**: 📋 Future

### Tasks
- [ ] Choose between Option A or B
- [ ] Implement chosen solution
- [ ] Add comprehensive tests
- [ ] Document auth flow for customers
- [ ] Security audit
- [ ] Performance testing
- [ ] Add monitoring/logging
- [ ] Create deployment guide

### Deliverables
- Standard JWT authentication
- No user ID fallback
- Production-ready code
- Customer documentation
- Security best practices guide

---

## Migration Checklist

### Before Phase 2 Starts
- [ ] Grammar Master trial fully tested and stable
- [ ] All test scripts passing
- [ ] No known issues with current implementation
- [ ] Team agreement on Option A vs B

### During Phase 2
- [ ] Implement chosen solution
- [ ] Update useTrial hook
- [ ] Update FastAPI get_current_user
- [ ] Add new tests
- [ ] Update documentation

### After Phase 2 Complete
- [ ] Remove user ID fallback from get_current_user
- [ ] All tests still passing
- [ ] No breaking changes to existing features
- [ ] Documentation updated

---

## Files to Update (Phase 2)

### If Option A (Recommended)
**New Files**:
- `src/app/api/trial/start/route.ts`
- `src/app/api/trial/status/[productKey]/route.ts`

**Modified Files**:
- `src/hooks/use-trial.ts` - Change endpoint from FastAPI to Next.js API
- `integrations/paddle-dodo/app/deps.py` - Remove user ID fallback

### If Option B
**Modified Files**:
- `src/lib/auth.ts` - Ensure JWT format compatible with FastAPI
- `integrations/paddle-dodo/app/config.py` - Use same JWT secret as next-auth
- `integrations/paddle-dodo/app/deps.py` - Remove user ID fallback
- `src/hooks/use-trial.ts` - Ensure sending correct JWT format

---

## Current Limitations (To Address in Phase 2)

1. **Security**: User ID is not cryptographically signed
2. **Scalability**: No token expiration/refresh mechanism
3. **Auditability**: No way to track token usage
4. **Flexibility**: Can't add custom claims to token
5. **Standards**: Not following JWT best practices

---

## Timeline Estimate

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1 (Current) | 1-2 weeks | Now | ~End of this week |
| Phase 2 (Standardization) | 2-3 weeks | After Phase 1 | ~2 weeks later |
| Phase 3 (Hardening) | 1-2 weeks | Before launch | ~1 week before |

---

## Notes for Future Reference

### Why We Did This
- Next-auth and FastAPI use different JWT systems
- Needed quick solution for local development
- User ID fallback was pragmatic compromise
- Allows testing without full JWT integration

### Why We Need to Change
- Not secure enough for production
- Can't be sold to external customers
- Doesn't follow industry standards
- No token expiration/refresh
- Difficult to audit and monitor

### Key Decision Points
1. **Option A vs B**: Recommend Option A for flexibility
2. **Timeline**: Don't rush Phase 2, ensure Phase 1 is solid first
3. **Testing**: Add comprehensive tests before removing fallback
4. **Documentation**: Document both old and new approaches

---

## Related Files

- `integrations/paddle-dodo/app/deps.py` - Current get_current_user
- `src/hooks/use-trial.ts` - Frontend trial hook
- `src/lib/auth.ts` - Next-auth configuration
- `integrations/paddle-dodo/app/config.py` - FastAPI config
- `integrations/paddle-dodo/app/routes/trial.py` - Trial endpoints

---

## Questions for Future Planning

1. Should we add token expiration to user ID tokens?
2. Should we implement refresh token mechanism?
3. Should we add audit logging for all auth attempts?
4. Should we support multiple auth methods (API keys, OAuth, etc.)?
5. Should we implement role-based access control (RBAC)?

---

**Last Updated**: Today
**Status**: Transition Phase - User ID Fallback Active
**Next Review**: After Grammar Master trial is fully tested
