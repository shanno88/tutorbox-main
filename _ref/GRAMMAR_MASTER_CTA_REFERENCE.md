# Grammar Master CTA - Quick Reference

## Visual Markers (Temporary - For Verification)

### Main Button Text
```
开始使用语法大师（新试用系统）
```
**English**: "Start Grammar Master (new trial system)"

### Green Badge Below Button
```
✓ 新版试用系统已启用：匿名 30 分钟 + 注册后 3 天完整试用
```
**Translation**: "✓ New trial system enabled: 30-min anonymous + 3-day account trial after signup"

## User Flows

### Flow 1: Anonymous User (0-30 minutes)
```
Visit page → Auto-start trial → See banner "剩余 X 分钟" → Click button → Redirect to app
```
**Access**: ✅ YES

### Flow 2: Anonymous User (30+ minutes)
```
Visit page → See expired modal → Click "Sign Up" → Login → Get 3-day trial
```
**Access**: ❌ NO (must sign up)

### Flow 3: Logged-In User (0-3 days)
```
Visit page → No banner → Click button → Redirect to app
```
**Access**: ✅ YES

### Flow 4: Logged-In User (3+ days)
```
Visit page → Click button → See "试用已结束" → Click "查看定价方案" → Go to /#pricing
```
**Access**: ❌ NO (must upgrade)

## All URLs Changed

| Old URL (Broken) | New URL (Working) | Purpose |
|------------------|-------------------|---------|
| `/en/pricing` | `/#pricing` | Upgrade prompts |
| `/billing` | `/#pricing` | Upgrade prompts |
| `https://tutorbox.cc/en/pricing` | `https://tutorbox.cc/products/grammar-master` | Trial page |

## Files Modified

1. ✅ `src/app/products/grammar-master/page.tsx` - Added visual markers, fixed links
2. ✅ `src/app/api/grammar/access/route.ts` - Changed upgradeUrl
3. ✅ `src/app/api/teleprompter/access/route.ts` - Changed upgradeUrl
4. ✅ `src/config/external-links.ts` - Updated URLs (previous fix)
5. ✅ `src/components/trial-guard.tsx` - Updated redirect (previous fix)

## Quick Test Commands

```bash
# Check external link health
curl http://localhost:3000/api/external-links/health

# Check anonymous trial state
curl http://localhost:3000/api/anonymous-trial/state

# Trigger health check
curl -X POST http://localhost:3000/api/external-links/check

# View admin dashboard
open http://localhost:3000/admin/external-links
```

## Verification Checklist

- [ ] Button text includes "(新试用系统)"
- [ ] Green badge visible below button
- [ ] Anonymous trial banner appears for non-logged-in users
- [ ] No 404 errors when clicking any link
- [ ] External app health check working
- [ ] Trial expired modal appears after 30 minutes
- [ ] Account trial works after signup

## Remove Visual Markers Later

After confirming the system works in production:

1. Change button text from:
   ```
   "开始使用语法大师（新试用系统）"
   ```
   to:
   ```
   "开始使用语法大师"
   ```

2. Remove green badge:
   ```tsx
   // Delete this line:
   <p className="text-green-600">✓ 新版试用系统已启用...</p>
   ```

Keep everything else - the trial system and health checks should remain.
