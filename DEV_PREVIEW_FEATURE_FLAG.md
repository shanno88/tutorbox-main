# Dev Preview Feature Flag Implementation

## Overview
Implemented a simple URL-based feature flag system for Grammar Master that allows testing the new trial flow locally without affecting production behavior.

## Feature Flag Logic

### URL Parameters
- **Flag**: `?env=dev&token=lW730208730208`
- **When active**: Redirects to local test app instead of production
- **When inactive**: Normal production behavior

### Implementation

#### 1. `useDevPreview()` Hook
```typescript
function useDevPreview() {
  const searchParams = useSearchParams();
  const env = searchParams.get("env");
  const token = searchParams.get("token");
  return env === "dev" && token === "lW730208730208";
}
```

#### 2. Environment Variable
- **Variable**: `NEXT_PUBLIC_BASE_URL`
- **Local**: `http://localhost:3000` (set in `.env.local`)
- **Production**: `https://gm.tutorbox.cc` (default fallback)

#### 3. Conditional Redirect Logic
```typescript
const isDevPreview = useDevPreview();
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://gm.tutorbox.cc";

if (isDevPreview) {
  // Dev preview: redirect to local test app
  window.location.href = `${baseUrl}/app`;
} else {
  // Production: redirect to production app
  window.location.href = "https://gm.tutorbox.cc/app";
}
```

## Files Modified

### 1. `src/app/products/grammar-master/page.tsx`
- Added `useDevPreview()` hook
- Added dev preview badge (shows when flag is active)
- Updated `handleStartGrammarMaster()` with conditional redirect
- Reads `NEXT_PUBLIC_BASE_URL` from environment
- Disables external link health check in dev preview mode

### 2. `.env.example`
- Added `NEXT_PUBLIC_BASE_URL` with documentation
- Default: `http://localhost:3000`

### 3. `.env.local`
- Added `NEXT_PUBLIC_BASE_URL=http://localhost:3000`

## Usage

### Testing Dev Preview Mode

1. **Start local dev server**:
   ```bash
   npm run dev
   ```

2. **Access with feature flag**:
   ```
   http://localhost:3000/products/grammar-master?env=dev&token=lW730208730208
   ```

3. **Expected behavior**:
   - Blue "🚀 开发预览模式已启用" badge appears
   - Shows redirect URL: `http://localhost:3000`
   - Button text: "开始使用语法大师（开发模式）"
   - Clicking button redirects to: `http://localhost:3000/app`
   - External link health check is bypassed

### Normal Production Mode

1. **Access without flag**:
   ```
   http://localhost:3000/products/grammar-master
   ```

2. **Expected behavior**:
   - No dev preview badge
   - Normal button text: "开始使用语法大师"
   - External link health check is active
   - Clicking button redirects to: `https://gm.tutorbox.cc/app`

## Visual Indicators

### Dev Preview Badge
When flag is active, a blue badge appears at the top:
```
🚀 开发预览模式已启用
将重定向到: http://localhost:3000
```

### Button Text
- **Dev mode**: "开始使用语法大师（开发模式）"
- **Production**: "开始使用语法大师"

## Security Notes

1. **Token-based**: Requires specific token (`lW730208730208`) to activate
2. **Client-side only**: Feature flag is checked in browser, not server
3. **No production impact**: Production deployments ignore the flag
4. **Easy to disable**: Remove URL params to return to normal mode

## Configuration

### Change Redirect URL
Edit `.env.local`:
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3001  # Different port
NEXT_PUBLIC_BASE_URL=http://192.168.1.100:3000  # Network IP
```

### Change Token
Edit `useDevPreview()` hook in `page.tsx`:
```typescript
return env === "dev" && token === "YOUR_NEW_TOKEN";
```

## Testing Checklist

- [ ] Dev preview badge appears with flag
- [ ] Redirect URL shows correct base URL
- [ ] Button shows "(开发模式)" suffix
- [ ] Clicking redirects to local app
- [ ] Without flag, normal production behavior
- [ ] External link health check bypassed in dev mode
- [ ] Trial system works in both modes

## Future Enhancements

1. **Multiple environments**: Add `env=staging` support
2. **Token expiry**: Add time-based token validation
3. **User-specific flags**: Store flag in user preferences
4. **Admin panel**: Toggle flags via UI instead of URL

## Troubleshooting

### Flag not working
- Check URL params are exact: `env=dev&token=lW730208730208`
- Verify `NEXT_PUBLIC_BASE_URL` is set in `.env.local`
- Restart dev server after changing env vars

### Wrong redirect URL
- Check `NEXT_PUBLIC_BASE_URL` value
- Ensure no trailing slash in URL
- Verify env var is prefixed with `NEXT_PUBLIC_`

### Badge not showing
- Confirm URL params are present
- Check browser console for errors
- Verify `useSearchParams()` is working
