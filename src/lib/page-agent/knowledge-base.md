# Tutorbox Knowledge Base for PageAgent

This document contains key information that PageAgent uses to answer user questions accurately.

## Company Information

**Tutorbox** is an independent AI product studio building tools for Chinese speakers living abroad.

- **Website**: https://tutorbox.cc
- **Email**: support@tutorbox.cc
- **Founded**: 2024
- **Focus**: AI tools for non-native English speakers and international students

## Products

### Grammar Master

**What it is**: An English writing assistant that helps non-native speakers write natural, idiomatic English.

**Key Features**:
- Real-time grammar and style suggestions
- Eliminates "Chinglish" and awkward phrasing
- Explains why something is wrong and how to fix it
- Works with emails, essays, cover letters, and more

**Who should use it**:
- Non-native English speakers
- International students
- Professionals writing in English
- Anyone wanting to improve their English writing

**Pricing**:
- **USD**: $49/year (one-time purchase, no auto-renewal)
- **CNY**: 199 RMB/year (one-time purchase, no auto-renewal)

**Trial**: 7 days free, full access to all features

**Status**: Available now

---

### Lease AI Review

**What it is**: AI-powered lease agreement analysis tool.

**Key Features**:
- Analyzes lease agreements for potential issues
- Highlights unfavorable terms
- Provides explanations and recommendations
- Helps renters understand their rights

**Who should use it**:
- Renters reviewing lease agreements
- International students signing leases
- Anyone wanting to understand lease terms

**Pricing**: TBD

**Trial**: 7 days free

**Status**: In development

---

### Cast Master (Broadcast Master)

**What it is**: A broadcast/prompter assistant tool for content creators.

**Key Features**:
- Helps with script writing and editing
- Provides real-time prompting
- Suggests improvements for clarity and engagement
- Supports multiple languages

**Who should use it**:
- Content creators and streamers
- Podcast hosts
- Video producers
- Anyone doing live broadcasts

**Pricing**: TBD

**Trial**: 7 days free

**Status**: In development

---

## Trial System

### How Trials Work

- **Duration**: 7 days
- **Access**: Full access to all product features
- **Cost**: Free
- **Eligibility**: Available to all users (logged in or anonymous)
- **Renewal**: After trial expires, users can purchase a subscription or start a new trial (if eligible)

### Starting a Trial

1. Visit the product page (e.g., Grammar Master)
2. Click "Start 7-day free trial"
3. If not logged in, you'll be prompted to log in or create an account
4. Trial starts immediately
5. You can use the product for 7 days

### Checking Trial Status

- Log in to your account
- Go to the product page
- You'll see how many days remain in your trial
- Or check your dashboard for all active trials

### After Trial Expires

- You can purchase a subscription to continue using the product
- Or start a new trial if eligible
- Your data is saved even after trial expires

---

## Pricing & Plans

### Grammar Master

| Plan | Price | Duration | Renewal | Features |
|------|-------|----------|---------|----------|
| Trial | Free | 7 days | One-time | Full access |
| Annual | $49 USD / 199 CNY | 1 year | No auto-renewal | Full access |

### Other Products

Pricing for Lease AI Review and Cast Master coming soon.

---

## Authentication & Account

### How to Log In

1. Go to https://tutorbox.cc
2. Click "Sign in"
3. Enter your email address
4. Check your email for a magic link
5. Click the link to log in
6. No password needed!

### Account Features

- View all your active trials
- Manage subscriptions
- View billing history
- Update profile information
- Access your purchased products

### Privacy & Security

- We use NextAuth for secure authentication
- Passwords are not required (magic links only)
- Your data is encrypted and secure
- We never share your data with third parties

---

## Billing & Payments

### Payment Methods

- Credit/debit cards (Visa, Mastercard, American Express)
- PayPal
- WeChat Pay (for CNY pricing)
- Alipay (for CNY pricing)

### Billing Information

- Invoices are sent to your email
- You can view billing history in your dashboard
- Refunds are available within 30 days of purchase
- No auto-renewal for annual plans

### Subscription Management

- View current plan in dashboard
- Change plan or cancel anytime
- Billing portal: https://tutorbox.cc/dashboard/billing

---

## Common Questions

### Q: Do I need to pay for a trial?
**A**: No, trials are completely free. You only pay if you want to continue after the trial ends.

### Q: Can I use multiple trials?
**A**: Yes, you can start a trial for each product. Each product has its own 7-day trial.

### Q: What happens after my trial ends?
**A**: Your trial access ends, but your data is saved. You can purchase a subscription to continue using the product.

### Q: Can I get a refund?
**A**: Yes, we offer refunds within 30 days of purchase. Contact support@tutorbox.cc for assistance.

### Q: Is my data secure?
**A**: Yes, we use industry-standard encryption and security practices. Your data is never shared with third parties.

### Q: What languages does Tutorbox support?
**A**: Currently, we support English and Chinese (Simplified). More languages coming soon.

### Q: How do I contact support?
**A**: Email support@tutorbox.cc or use the chat assistant on our website.

---

## Product Comparison

| Feature | Grammar Master | Lease Review | Cast Master |
|---------|---|---|---|
| AI-powered | ✅ | ✅ | ✅ |
| Real-time suggestions | ✅ | ❌ | ✅ |
| Free trial | ✅ | ✅ | ✅ |
| Available now | ✅ | 🔄 | 🔄 |
| Pricing | $49/year | TBD | TBD |

---

## Recommendations

### For Students
- **Grammar Master**: Perfect for essays, assignments, and applications
- **Lease Review**: Helpful when signing your first lease abroad
- **Cast Master**: Great for presentations and class projects

### For Professionals
- **Grammar Master**: Essential for emails, reports, and professional writing
- **Lease Review**: Useful when relocating for work
- **Cast Master**: Helpful for presentations and client meetings

### For Content Creators
- **Grammar Master**: Improve script quality and clarity
- **Cast Master**: Get real-time prompting and suggestions
- **Lease Review**: Understand your rental agreement

---

## Integration Information

For developers integrating with Tutorbox APIs:

- **Auth**: NextAuth + JWT (see EXTERNAL_AUTH_INTEGRATION.md)
- **Trial API**: `/api/trial/start`, `/api/trial/status/[productKey]`
- **Products API**: `/api/me/products`
- **Billing API**: `/api/me/billing`

See `docs/EXTERNAL_AUTH_INTEGRATION.md` for complete API documentation.

---

## Updates & Changelog

### Latest Updates
- Grammar Master: Now available in English and Chinese
- Lease Review: Beta testing with select users
- Cast Master: In active development

### Coming Soon
- More language support
- Advanced analytics dashboard
- Team collaboration features
- API access for enterprise customers

---

## Contact & Support

- **Email**: support@tutorbox.cc
- **Website**: https://tutorbox.cc
- **Chat**: Use the PageAgent assistant on our website
- **Feedback**: We'd love to hear from you!

---

*Last updated: 2024*
*For the latest information, visit https://tutorbox.cc*
