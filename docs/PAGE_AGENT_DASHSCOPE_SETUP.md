# PageAgent + DashScope Setup Guide

This guide explains how to set up PageAgent with Alibaba's DashScope (Qwen LLM) for Tutorbox.

## Overview

PageAgent is now integrated with DashScope's Qwen LLM models for intelligent conversations. The assistant:
- Understands Tutorbox products, trials, and pricing
- Provides context-aware responses based on user state
- Can perform actions like starting trials and checking account status
- Uses the `qwen-plus-2025-07-28` model for high-quality responses

## Prerequisites

1. **DashScope Account**: https://dashscope.aliyuncs.com
2. **API Key**: Get from DashScope console
3. **Model Access**: `qwen-plus-2025-07-28` (or similar Qwen model)

## Setup Steps

### 1. Get DashScope API Key

1. Go to https://dashscope.aliyuncs.com
2. Sign in with your Alibaba Cloud account (or create one)
3. Navigate to "API Keys" section
4. Create a new API key
5. Copy the key (starts with `sk_`)

### 2. Configure Environment Variables

Add to `.env.local`:

```env
# DashScope Configuration
DASHSCOPE_API_KEY=sk_your_api_key_here
DASHSCOPE_MODEL=qwen-plus-2025-07-28
```

**Important**: 
- `DASHSCOPE_API_KEY` is a **server-side secret** (not prefixed with `NEXT_PUBLIC_`)
- `DASHSCOPE_MODEL` can be public (not sensitive)

### 3. Verify Installation

The following files should be in place:

- ✅ `src/lib/dashscope-client.ts` - DashScope API client
- ✅ `src/app/api/page-agent/chat/route.ts` - Chat API endpoint
- ✅ `src/components/page-agent-provider.tsx` - PageAgent UI provider
- ✅ `src/lib/page-agent/system-prompt.md` - System prompt
- ✅ `src/lib/page-agent/knowledge-base.md` - Knowledge base

### 4. Start the App

```bash
npm run dev
```

### 5. Test PageAgent

1. Open http://localhost:3000
2. Look for the purple chat bubble in the bottom-right corner
3. Click it to open the chat
4. Try asking:
   - "What is Grammar Master?"
   - "How do I start a trial?"
   - "What's the pricing?"

## Architecture

### Data Flow

```
User sends message
  ↓
PageAgentProvider captures message
  ↓
POST /api/page-agent/chat
  ↓
API Route loads system prompt
  ↓
Builds enhanced prompt with user context
  ↓
Calls DashScope API with Qwen model
  ↓
DashScope returns response
  ↓
Response displayed in chat UI
  ↓
Conversation history updated
```

### Components

1. **DashScope Client** (`src/lib/dashscope-client.ts`)
   - Handles API calls to DashScope
   - Manages authentication
   - Formats requests and responses

2. **Chat API Route** (`src/app/api/page-agent/chat/route.ts`)
   - Receives chat messages from frontend
   - Loads system prompt
   - Builds context from environment
   - Calls DashScope client
   - Returns response

3. **PageAgent Provider** (`src/components/page-agent-provider.tsx`)
   - Creates floating chat UI
   - Manages conversation history
   - Calls chat API
   - Handles user interactions

## Configuration

### Change Model

To use a different Qwen model:

```env
# Options: qwen-turbo, qwen-plus, qwen-max, qwen-plus-2025-07-28, etc.
DASHSCOPE_MODEL=qwen-max
```

### Adjust Response Quality

Edit `src/app/api/page-agent/chat/route.ts`:

```typescript
const response = await client.chat(
  userMessage,
  enhancedSystemPrompt,
  messages,
  {
    temperature: 0.7,  // Lower = more focused, Higher = more creative
    topP: 0.9,         // Nucleus sampling parameter
    maxTokens: 2048,   // Max response length
  }
);
```

### Customize System Prompt

Edit `src/lib/page-agent/system-prompt.md` to:
- Change product descriptions
- Update pricing
- Modify response guidelines
- Add new products

## Available Actions

PageAgent can perform these actions:

### Authentication
- `check_auth_status()` - Check if user is logged in
- `go_to_login()` - Navigate to login page
- `go_to_account()` - Navigate to account dashboard

### Trials & Products
- `start_trial(productKey)` - Start a 7-day trial
- `get_trial_status(productKey)` - Check trial status
- `list_my_products()` - Get user's products

### Billing
- `open_checkout(productKey | priceId)` - Open checkout
- `open_billing_portal()` - Open billing page

### Navigation
- `navigate(path)` - Navigate to pages

## Troubleshooting

### Chat Not Working

**Problem**: Chat button appears but messages don't send

**Solutions**:
1. Check browser console for errors
2. Verify `DASHSCOPE_API_KEY` is set in `.env.local`
3. Verify `DASHSCOPE_MODEL` is set
4. Check Network tab for `/api/page-agent/chat` requests

### API Key Error

**Problem**: "DASHSCOPE_API_KEY is not configured"

**Solutions**:
1. Verify key is in `.env.local` (not `.env.example`)
2. Restart dev server after adding key
3. Check key format (should start with `sk_`)
4. Verify key is valid in DashScope console

### Model Not Found

**Problem**: "Model not found" error from DashScope

**Solutions**:
1. Verify model name is correct
2. Check model is available in your DashScope account
3. Try a different model: `qwen-turbo`, `qwen-plus`, `qwen-max`
4. Check DashScope documentation for available models

### Slow Responses

**Problem**: Chat responses are slow

**Solutions**:
1. Check internet connection
2. Try a faster model: `qwen-turbo` instead of `qwen-plus`
3. Reduce `maxTokens` in chat API
4. Check DashScope API status

### Incorrect Responses

**Problem**: PageAgent gives wrong information

**Solutions**:
1. Update system prompt with correct info
2. Check knowledge base is accurate
3. Verify API responses are being passed correctly
4. Review conversation history in browser console

## Performance

- **Chat initialization**: ~100ms
- **API call to DashScope**: ~500-2000ms (depends on model and response length)
- **Total response time**: ~1-3 seconds
- **Conversation history**: Stored in browser memory (cleared on page reload)

## Security

- ✅ API key is server-side only (not exposed to client)
- ✅ Chat messages are sent to DashScope (review privacy policy)
- ✅ No sensitive user data in system prompt
- ✅ User context is sanitized before sending

## Monitoring

### Check Logs

Open browser DevTools → Console and look for:

```
[PageAgent] Initialized successfully with DashScope
[PageAgent Chat API] Processing message...
[DashScope] API call successful
```

### Monitor API Calls

Open browser DevTools → Network tab and look for:

```
POST /api/page-agent/chat
```

Check response for:
- `success: true`
- `response: "..."` (the assistant's message)
- `model: "qwen-plus-2025-07-28"`

## Cost Estimation

DashScope pricing varies by model. For `qwen-plus-2025-07-28`:
- Input tokens: ~0.001 CNY per 1K tokens
- Output tokens: ~0.002 CNY per 1K tokens

Typical conversation:
- System prompt: ~500 tokens
- User message: ~50 tokens
- Response: ~200 tokens
- **Cost per message**: ~0.001 CNY (~$0.00015)

## Advanced Configuration

### Custom System Prompt

Create a custom system prompt file:

```typescript
// src/lib/page-agent/custom-prompt.md
You are a specialized assistant for [specific use case]...
```

Then update the API route to use it:

```typescript
const systemPrompt = await loadCustomPrompt();
```

### Conversation Persistence

To save conversations:

```typescript
// Save to localStorage
localStorage.setItem("pageAgentHistory", JSON.stringify(conversationHistory));

// Load on init
const saved = localStorage.getItem("pageAgentHistory");
if (saved) {
  setConversationHistory(JSON.parse(saved));
}
```

### Multi-language Support

The system prompt already supports both Chinese and English. PageAgent automatically detects user's locale and responds accordingly.

## Testing Checklist

- [ ] Chat button appears on homepage
- [ ] Chat button appears on product pages
- [ ] Can open/close chat window
- [ ] Can send messages
- [ ] Responses appear in chat
- [ ] Responses are accurate
- [ ] No console errors
- [ ] API calls succeed
- [ ] Conversation history works
- [ ] Performance is acceptable

## Next Steps

1. ✅ Set up DashScope account and get API key
2. ✅ Add `DASHSCOPE_API_KEY` and `DASHSCOPE_MODEL` to `.env.local`
3. ✅ Start dev server: `npm run dev`
4. ✅ Test chat on homepage
5. ✅ Customize system prompt if needed
6. ✅ Deploy to production

## Support

- [DashScope Documentation](https://dashscope.aliyuncs.com/docs)
- [Qwen Model Documentation](https://dashscope.aliyuncs.com/docs/qwen)
- [PageAgent Integration Guide](./PAGE_AGENT_INTEGRATION.md)
- [System Prompt](../src/lib/page-agent/system-prompt.md)

## FAQ

**Q: Can I use a different LLM?**
A: Currently configured for DashScope/Qwen. To use OpenAI or Claude, you'd need to update the client implementation.

**Q: Is my data secure?**
A: Chat messages are sent to DashScope servers. Review their privacy policy. No sensitive data should be in system prompt.

**Q: Can I save conversations?**
A: Currently conversations are stored in browser memory. You can implement localStorage or database persistence.

**Q: How much does it cost?**
A: DashScope pricing is very affordable (~0.001 CNY per message). Check their pricing page for current rates.

**Q: Can I use this offline?**
A: No, PageAgent requires internet connection to call DashScope API.

**Q: How do I update the knowledge base?**
A: Edit `src/lib/page-agent/system-prompt.md` and `src/lib/page-agent/knowledge-base.md`. Changes take effect on next page load.

---

*Last updated: 2024*
