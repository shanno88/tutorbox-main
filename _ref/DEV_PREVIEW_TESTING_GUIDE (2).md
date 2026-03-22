# Dev Preview Feature Flag - Testing Guide

## Quick Start

### 1. Verify Environment Setup

Check that `.env.local` has the new variable:
```bash
cat .env.local | grep NEXT_PUBLIC_BASE_URL
```

Expected output:
```
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 2. Start Development Server

```bash
npm run dev
```

Wait for the server to start on `http://localhost:3000`

## Test Scenarios

### Scenario 1: Dev Preview Mode (Feature Flag Active)

**URL**: 
```
http://localhost:3000/products/grammar-master?env=dev&token=lW730208730208
```

**Expected Results**:
- ✅ Blue badge appears: "🚀 开发预览模式已启用"
- ✅ Badge shows: "将重定向到: http://localhost:3000"
- ✅ Button text: "开始使用语法大师（开发模式）"
- ✅ Green badge: "新版试用系统已启用：匿名 30 分钟 + 注册后 3 天完整试用"
- ✅ No external link health check warning
- ✅ Anonymous trial banner appears (30-minute countdown)

**Click Button**:
- ✅ Console log: `[Dev Preview] Redirecting to: http://localhost:3000/app`
- ✅ Redirects to: `http://localhost:3000/app`

---

### Scenario 2: Production Mode (No Feature Flag)

**URL**: 
```
http://localhost:3000/products/grammar-master
```

**Expected Results**:
- ✅ NO blue dev preview badge
- ✅ Button text: "开始使用语法大师" (no "开发模式" suffix)
- ✅ Green badge: "新版试用系统已启用：匿名 30 分钟 + 注册后 3 天完整试用"
- ✅ External link health check runs
- ✅ Anonymous trial banner appears (30-minute countdown)

**Click Button**:
- ✅ No dev preview console log
- ✅ Redirects to: `https://gm.tutorbox.cc/app`

---

### Scenario 3: Invalid Token (Should Not Activate)

**URL**: 
```
http://localhost:3000/products/grammar-master?env=dev&token=WRONG_TOKEN
```

**Expected Results**:
- ✅ NO blue dev preview badge
- ✅ Normal production behavior
- ✅ Redirects to production URL

---

### Scenario 4: Missing Token Parameter

**URL**: 
```
http://localhost:3000/products/grammar-master?env=dev
```

**Expected Results**:
- ✅ NO blue dev preview badge
- ✅ Normal production behavior

---

### Scenario 5: Different Base URL

**Edit `.env.local`**:
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

**Restart server**:
```bash
# Stop server (Ctrl+C)
npm run dev
```

**URL**: 
```
http://localhost:3000/products/grammar-master?env=dev&token=lW730208730208
```

**Expected Results**:
- ✅ Badge shows: "将重定向到: http://localhost:3001"
- ✅ Clicking button redirects to: `http://localhost:3001/app`

---

## Visual Checklist

### Dev Preview Mode UI Elements

```
┌─────────────────────────────────────────────────────┐
│ 🚀 开发预览模式已启用                                │
│ 将重定向到: http://localhost:3000                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ ✓ 新版试用系统已启用：匿名 30 分钟 + 注册后 3 天完整试用 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ ⏱️ 试用剩余时间: 30 分钟                             │
│ [立即注册获得 3 天完整试用]                          │
└─────────────────────────────────────────────────────┘

                    语法大师
        AI 驱动的英语语法检查和纠正工具

        [开始使用语法大师（开发模式）]
```

### Production Mode UI Elements

```
┌─────────────────────────────────────────────────────┐
│ ✓ 新版试用系统已启用：匿名 30 分钟 + 注册后 3 天完整试用 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ ⏱️ 试用剩余时间: 30 分钟                             │
│ [立即注册获得 3 天完整试用]                          │
└─────────────────────────────────────────────────────┘

                    语法大师
        AI 驱动的英语语法检查和纠正工具

            [开始使用语法大师]
```

---

## Browser Console Checks

### Dev Preview Mode
Open browser console (F12) and look for:
```
[Dev Preview] Redirecting to: http://localhost:3000/app
```

### Production Mode
Should NOT see any dev preview logs.

---

## API Testing

### Check Access API

**Dev Preview Mode**:
```bash
curl http://localhost:3000/api/grammar/access
```

**Expected Response**:
```json
{
  "ok": true,
  "code": "ANONYMOUS_TRIAL_STARTED",
  "message": "Anonymous trial started. 30 minutes remaining.",
  "minutesRemaining": 30
}
```

---

## Troubleshooting

### Issue: Dev preview badge not showing

**Check**:
1. URL has exact params: `?env=dev&token=lW730208730208`
2. No typos in token
3. Browser didn't cache old version (hard refresh: Ctrl+Shift+R)

**Fix**:
```bash
# Clear browser cache and hard refresh
# Or open in incognito mode
```

---

### Issue: Wrong redirect URL

**Check**:
1. `.env.local` has `NEXT_PUBLIC_BASE_URL`
2. Server was restarted after changing env vars
3. No trailing slash in URL

**Fix**:
```bash
# Restart dev server
npm run dev
```

---

### Issue: Button disabled

**Check**:
1. External link health check might be failing
2. Dev preview mode should bypass health check

**Fix**:
- Use dev preview mode: `?env=dev&token=lW730208730208`
- Or check network tab for `/api/external-links/health` errors

---

## Production Deployment

### Before Deploying

1. **Remove dev preview code** (optional):
   - If you don't want the feature flag in production
   - Remove `useDevPreview()` hook
   - Remove conditional logic

2. **Set production env var**:
   ```env
   NEXT_PUBLIC_BASE_URL=https://gm.tutorbox.cc
   ```

3. **Test locally with production build**:
   ```bash
   npm run build
   npm run start
   ```

### After Deploying

1. **Test production URL**:
   ```
   https://your-domain.com/products/grammar-master
   ```

2. **Verify**:
   - No dev preview badge
   - Redirects to `https://gm.tutorbox.cc/app`
   - Trial system works correctly

---

## Security Notes

- ✅ Token is required to activate dev preview
- ✅ Feature flag is client-side only
- ✅ No server-side changes needed
- ✅ Production is not affected
- ⚠️ Token is visible in URL (use HTTPS in production)
- ⚠️ Anyone with the token can activate dev mode

---

## Next Steps

After testing is complete:

1. **Keep the feature flag** if you want to test in production
2. **Remove the feature flag** if it was only for local testing
3. **Update the token** if you want to change it
4. **Add more environments** (staging, etc.) if needed

---

## Summary

The dev preview feature flag allows you to:
- ✅ Test new trial flow locally
- ✅ Redirect to local test app
- ✅ No impact on production behavior
- ✅ Easy to enable/disable via URL
- ✅ Visual confirmation when active
