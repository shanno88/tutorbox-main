# PageAgent Integration Guide

This document explains how Alibaba's PageAgent is integrated into Tutorbox as a site-wide AI copilot.

## Overview

PageAgent is an intelligent in-site assistant that helps users understand products, trials, pricing, and billing. It appears as a floating button on key pages and can perform actions like starting trials, checking account status, and navigating to relevant pages.

## Architecture

### Components

1. **PageAgent Script** (`src/app/layout.tsx`)
   - Loads the PageAgent library from CDN
   - Initializes on page load

2. **PageAgentProvider** (`src/components/page-agent-provider.tsx`)
   - React component that initializes PageAgent with Tutorbox context
   - Manages environment updates as user navigates
   - Defines available actions

3. **System Prompt** (`src/lib/page-agent/system-prompt.md`)
   - Defines PageAgent's personality and knowledge
   - Specifies what it can and cannot do
   - Includes product information and pricing

4. **API Route** (`src/app/api/page-agent/system-prompt/route.ts`)
   - Serves the system prompt to the client
   - Allows for dynamic updates without redeploying

### Data Flow

```
User visits page
  ↓
PageAgent script loads
  ↓
PageAgentProvider initializes
  ↓
Fetches system prompt from /api/page-agent/system-prompt
  ↓
Builds environment object (user, route, locale, etc.)
  ↓
Registers available actions
  ↓
PageAgent ready to chat
  ↓
User asks question
  ↓
PageAgent calls action (e.g., get_trial_status)
  ↓
Action fetches data from our APIs
  ↓
PageAgent responds with context-aware answer
```

## Environment Context

For each page, PageAgent receives an environment object with:

```typescript
{
  locale: "zh" | "en",           // User's language
  route: "/zh/grammar-master",   // Current page path
  user: {
    id?: string,                 // NextAuth user ID
    email?: string,              // User email
    name?: string,               // User name
    isLoggedIn: boolean,         // Auth status
  },
  products?: Array<{             // User's products (fetched on-demand)
    key: string,
    name: string,
    status: "owned" | "trial" | "available",
    trialDaysRemaining?: number,
  }>,
  billingContext?: {             // On billing pages
    currentPlan?: string,
    nextBillingDate?: string,
    paymentPending?: boolean,
  },
}
```

## Available Actions

PageAgent can call these actions:

### Authentication

**`check_auth_status()`**
- Returns: `{ isLoggedIn: boolean, user: User | null }`
- Use: Check if user is logged in

**`go_to_login()`**
- Returns: `{ success: boolean }`
- Use: Navigate to login page

**`go_to_account()`**
- Returns: `{ success: boolean }`
- Use: Navigate to account/dashboard

### Trials & Products

**`start_trial(productKey: string)`**
- Args: `{ productKey: "grammar-master" | "lease-review" | "cast-master" }`
- Returns: `{ success: boolean, trial: TrialData, message: string }`
- Use: Start a 7-day trial for a product

**`get_trial_status(productKey: string)`**
- Args: `{ productKey: string }`
- Returns: `{ success: boolean, trial: TrialData | null, message: string }`
- Use: Check if user has active trial and days remaining

**`list_my_products()`**
- Returns: `{ success: boolean, products: Product[] }`
- Use: Get user's owned products and active trials

### Billing & Checkout

**`open_checkout(productKey?: string, priceId?: string)`**
- Args: `{ productKey?: string, priceId?: string }`
- Returns: `{ success: boolean }`
- Use: Open Paddle checkout for a product

**`open_billing_portal()`**
- Returns: `{ success: boolean }`
- Use: Open user's billing management page

### Navigation

**`navigate(path: string)`**
- Args: `{ path: "/" | "/zh/grammar-master" | "/pricing" | ... }`
- Returns: `{ success: boolean }`
- Use: Navigate to key pages

## Knowledge Sources

PageAgent's responses are grounded in:

### 1. System Prompt (`src/lib/page-agent/system-prompt.md`)
- Defines PageAgent's role and personality
- Lists available actions
- Includes product descriptions
- Specifies trial rules and pricing
- Provides response guidelines

### 2. Live API Data
- User authentication status
- Active trials and remaining days
- Owned products
- Billing information

### 3. Static Documentation
- Product features and benefits
- Pricing information
- Trial eligibility rules
- Authentication flow details

## Pages Where PageAgent Appears

By default, PageAgent shows on:

- Homepage: `/`, `/zh`, `/en`
- Product pages: `/zh/grammar-master`, `/en/grammar-master`, etc.
- Billing pages: `/billing`, `/checkout`, `/dashboard/billing`
- Pricing page: `/pricing`

To hide PageAgent on specific pages, modify the `shouldShowPageAgent()` function in `PageAgentProvider`.

## Configuration

### Environment Variables

Add to `.env.local`:

```env
# PageAgent API Key (get from https://alibaba.github.io/page-agent/)
NEXT_PUBLIC_PAGE_AGENT_API_KEY=your_api_key_here

# Optional: Specify model (defaults to gpt-4-turbo)
NEXT_PUBLIC_PAGE_AGENT_MODEL=gpt-4-turbo

# Optional: Enable/disable PageAgent
NEXT_PUBLIC_PAGE_AGENT_ENABLED=true
```

### Customization

To customize PageAgent behavior:

1. **Change appearance**: Modify UI config in `PageAgentProvider.initializePageAgent()`
2. **Add new actions**: Add to `buildActions()` in `PageAgentProvider`
3. **Update knowledge**: Edit `src/lib/page-agent/system-prompt.md`
4. **Change visible pages**: Modify `shouldShowPageAgent()` in `PageAgentProvider`

## Adding New Features

### Add a New Action

1. Define the action in `buildActions()` in `PageAgentProvider`:

```typescript
my_new_action: async (args: { param1: string }) => {
  try {
    // Implement action logic
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

2. Document the action in `src/lib/page-agent/system-prompt.md`:

```markdown
**`my_new_action(param1: string)`**
- Args: `{ param1: string }`
- Returns: `{ success: boolean, data: any }`
- Use: Description of what this action does
```

### Add a New Product

1. Update the system prompt with product info:

```markdown
- **New Product**: Description of the product
```

2. Add product key to trial actions:

```typescript
start_trial: async (args: { productKey: string }) => {
  // productKey can now be "new-product"
}
```

### Add a New Page

1. Add the page path to `shouldShowPageAgent()`:

```typescript
const showOnPatterns = [
  // ... existing patterns
  "/new-page",
  "/zh/new-page",
];
```

2. If the page needs special context, update `buildEnvironment()` to fetch relevant data.

## Safety & Limitations

### What PageAgent Cannot Do

- ❌ Modify user data directly (only through explicit actions)
- ❌ Access payment information beyond what's in our APIs
- ❌ Perform arbitrary DOM manipulation
- ❌ Make API calls outside of defined actions
- ❌ Invent features or prices

### What PageAgent Can Do

- ✅ Answer questions about products and features
- ✅ Check user authentication status
- ✅ Start trials and check trial status
- ✅ Navigate users to relevant pages
- ✅ Open checkout and billing portals
- ✅ Provide personalized recommendations

## Troubleshooting

### PageAgent Not Showing

1. Check that `NEXT_PUBLIC_PAGE_AGENT_API_KEY` is set in `.env.local`
2. Verify the page is in `shouldShowPageAgent()` patterns
3. Check browser console for errors
4. Ensure PageAgent script loaded: Check Network tab for `page-agent.min.js`

### Actions Not Working

1. Check browser console for error messages
2. Verify the action is defined in `buildActions()`
3. Check that required APIs are accessible (e.g., `/api/trial/start`)
4. Verify user has proper authentication if action requires it

### Incorrect Responses

1. Check the system prompt in `src/lib/page-agent/system-prompt.md`
2. Verify the environment context is being passed correctly
3. Check that API responses are being returned to PageAgent
4. Review PageAgent logs in browser console

## Performance Considerations

- PageAgent script is loaded asynchronously (non-blocking)
- System prompt is fetched once on initialization
- Environment updates are debounced to avoid excessive re-initialization
- Actions use existing API routes (no additional backend needed)

## Future Enhancements

Potential improvements:

1. **Conversation History**: Store and use conversation context for better responses
2. **User Preferences**: Remember user preferences (e.g., language, preferred products)
3. **Analytics**: Track which questions users ask and which actions they use
4. **Multi-language**: Improve language-specific responses
5. **Advanced Actions**: Add more complex actions like subscription management
6. **Knowledge Base**: Integrate with a vector database for better document retrieval

## References

- [PageAgent Documentation](https://alibaba.github.io/page-agent/)
- [PageAgent Quick Start](https://alibaba.github.io/page-agent/docs/introduction/quick-start/)
- [Tutorbox System Prompt](../src/lib/page-agent/system-prompt.md)
- [External Auth Integration](./EXTERNAL_AUTH_INTEGRATION.md)
