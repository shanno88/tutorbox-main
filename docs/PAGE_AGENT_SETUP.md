# PageAgent Setup Guide

Quick start guide for setting up and configuring PageAgent in Tutorbox.

## Prerequisites

- Alibaba PageAgent API key (get from https://alibaba.github.io/page-agent/)
- Next.js 14+ app running
- NextAuth configured for authentication

## Installation

### 1. Get PageAgent API Key

1. Visit https://alibaba.github.io/page-agent/
2. Sign up for an account
3. Create a new project
4. Copy your API key

### 2. Configure Environment Variables

Add to `.env.local`:

```env
# Required
NEXT_PUBLIC_PAGE_AGENT_API_KEY=your_api_key_here

# Optional
NEXT_PUBLIC_PAGE_AGENT_MODEL=gpt-4-turbo
NEXT_PUBLIC_PAGE_AGENT_ENABLED=true
```

### 3. Verify Installation

The following files should already be in place:

- ✅ `src/components/page-agent-provider.tsx` - Main provider component
- ✅ `src/app/api/page-agent/system-prompt/route.ts` - API route for system prompt
- ✅ `src/lib/page-agent/system-prompt.md` - System prompt
- ✅ `src/lib/page-agent/knowledge-base.md` - Knowledge base
- ✅ `src/app/_components/root-providers.tsx` - Updated with PageAgent
- ✅ `src/app/layout.tsx` - Updated with PageAgent script

### 4. Start the App

```bash
npm run dev
```

### 5. Test PageAgent

1. Open http://localhost:3000
2. Look for the PageAgent floating button in the bottom-right corner
3. Click it to open the chat
4. Try asking: "What is Grammar Master?"

## Configuration

### Change Visible Pages

Edit `shouldShowPageAgent()` in `src/components/page-agent-provider.tsx`:

```typescript
const shouldShowPageAgent = (): string[] => {
  const showOnPatterns = [
    "/",
    "/zh",
    "/en",
    "/zh/grammar-master",
    // Add more pages here
  ];
  return showOnPatterns;
};
```

### Customize System Prompt

Edit `src/lib/page-agent/system-prompt.md` to:
- Change product descriptions
- Update pricing information
- Modify response guidelines
- Add new products

### Change UI Position

Edit the UI config in `PageAgentProvider.initializePageAgent()`:

```typescript
ui: {
  position: "bottom-right", // or "bottom-left", "top-right", "top-left"
  theme: "light", // or "dark"
  showOnPages: shouldShowPageAgent(),
}
```

## Adding New Actions

### Example: Add a "Contact Support" Action

1. Add to `buildActions()` in `PageAgentProvider`:

```typescript
contact_support: async () => {
  window.location.href = "mailto:support@tutorbox.cc";
  return { success: true };
}
```

2. Document in `src/lib/page-agent/system-prompt.md`:

```markdown
**`contact_support()`**
- Returns: `{ success: boolean }`
- Use: Open email to contact support
```

## Adding New Products

### Example: Add "Lease Review" Product

1. Update system prompt with product info:

```markdown
- **Lease AI Review**: AI-powered lease agreement analysis tool.
```

2. Update trial actions to support the new product:

```typescript
start_trial: async (args: { productKey: string }) => {
  // productKey can now be "lease-review"
}
```

3. Add product page to visible pages:

```typescript
const showOnPatterns = [
  // ... existing
  "/zh/lease-review",
  "/en/lease-review",
];
```

## Troubleshooting

### PageAgent Not Showing

**Problem**: Floating button doesn't appear

**Solutions**:
1. Check API key is set: `echo $NEXT_PUBLIC_PAGE_AGENT_API_KEY`
2. Check browser console for errors
3. Verify page is in `shouldShowPageAgent()` patterns
4. Check Network tab - should see `page-agent.min.js` loaded

### Actions Not Working

**Problem**: Clicking action buttons shows errors

**Solutions**:
1. Check browser console for error messages
2. Verify API endpoints exist (e.g., `/api/trial/start`)
3. Check user is authenticated if action requires it
4. Verify environment variables are set

### Incorrect Responses

**Problem**: PageAgent gives wrong information

**Solutions**:
1. Update system prompt with correct information
2. Check that API responses are being returned
3. Verify environment context is being passed
4. Check PageAgent logs in browser console

### Performance Issues

**Problem**: Page loads slowly with PageAgent

**Solutions**:
1. PageAgent script is loaded asynchronously (shouldn't block)
2. Check browser Network tab for slow requests
3. Verify API endpoints are responding quickly
4. Consider disabling PageAgent on heavy pages

## Testing Checklist

- [ ] PageAgent button appears on homepage
- [ ] PageAgent button appears on product pages
- [ ] PageAgent button does NOT appear on auth pages
- [ ] Can ask "What is Grammar Master?"
- [ ] Can start a trial (if logged in)
- [ ] Can check trial status
- [ ] Can navigate to different pages
- [ ] Can open checkout
- [ ] Responses are accurate and helpful
- [ ] No console errors

## Monitoring

### Check PageAgent Logs

Open browser DevTools → Console and look for:

```
[PageAgent] Initialized successfully
[PageAgent] Action called: start_trial
[PageAgent] Response: { success: true, ... }
```

### Monitor API Calls

Open browser DevTools → Network tab and look for:

```
GET /api/page-agent/system-prompt
POST /api/trial/start
GET /api/trial/status/grammar-master
GET /api/me/products
```

## Performance Optimization

### Lazy Load PageAgent

If you want to delay PageAgent initialization:

```typescript
useEffect(() => {
  // Wait 2 seconds before initializing
  const timer = setTimeout(() => {
    initializePageAgent();
  }, 2000);
  
  return () => clearTimeout(timer);
}, []);
```

### Cache System Prompt

The system prompt is fetched once and cached. To update it:

1. Edit `src/lib/page-agent/system-prompt.md`
2. Hard refresh browser (Ctrl+Shift+R)
3. Or clear browser cache

## Advanced Configuration

### Custom Model

To use a different LLM model:

```env
NEXT_PUBLIC_PAGE_AGENT_MODEL=gpt-4
# or
NEXT_PUBLIC_PAGE_AGENT_MODEL=claude-3-opus
```

### Disable PageAgent

To temporarily disable PageAgent:

```env
NEXT_PUBLIC_PAGE_AGENT_ENABLED=false
```

Then check in `PageAgentProvider`:

```typescript
if (!process.env.NEXT_PUBLIC_PAGE_AGENT_ENABLED) {
  return null;
}
```

## Next Steps

1. ✅ Set up environment variables
2. ✅ Test PageAgent on homepage
3. ✅ Test PageAgent on product pages
4. ✅ Customize system prompt with your content
5. ✅ Add more actions as needed
6. ✅ Monitor performance and user feedback
7. ✅ Deploy to production

## Support

- [PageAgent Documentation](https://alibaba.github.io/page-agent/)
- [Tutorbox PageAgent Integration](./PAGE_AGENT_INTEGRATION.md)
- [System Prompt](../src/lib/page-agent/system-prompt.md)
- [Knowledge Base](../src/lib/page-agent/knowledge-base.md)

## FAQ

**Q: Can I use PageAgent without an API key?**
A: No, you need a valid PageAgent API key to use the service.

**Q: Does PageAgent work offline?**
A: No, PageAgent requires internet connection to communicate with the LLM.

**Q: Can I customize the appearance?**
A: Yes, you can change position, theme, and other UI settings in the provider.

**Q: How much does PageAgent cost?**
A: Check Alibaba's pricing page for current rates.

**Q: Can I use a different LLM?**
A: Yes, PageAgent supports multiple models. Check their documentation.

**Q: Is user data secure?**
A: PageAgent conversations are sent to Alibaba's servers. Review their privacy policy.

---

*Last updated: 2024*
