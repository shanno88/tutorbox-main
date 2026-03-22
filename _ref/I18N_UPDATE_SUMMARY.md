# i18n Messages Update – Billing, License & Trial Namespaces

**Date**: March 20, 2026  
**Status**: ✅ COMPLETE

---

## Summary

Successfully added three new top-level namespaces to both `messages/en.json` and `messages/zh.json`:
- **`billing`** – Subscription and billing related strings
- **`license`** – App limits and quota related strings
- **`trial`** – Trial period and expiration related strings

All existing content preserved. JSON syntax validated.

---

## Changes Made

### Files Updated
1. ✅ `messages/en.json` – Added 3 namespaces with English translations
2. ✅ `messages/zh.json` – Added 3 namespaces with Chinese translations

### New Namespaces

#### 1. `billing` Namespace
**Purpose**: Subscription and billing page strings

**Keys**:
- `pageTitle` – Page heading
- `currentPlan` – Current plan label
- `noSubscription` – Message when no subscription
- `nextBillingDate` – Next billing date label
- `manageOnStripe` – Link text to manage subscription
- `status.active` – Active status label
- `status.trialing` – Trial status label
- `status.canceled` – Canceled status label
- `status.past_due` – Past due status label
- `actions.upgrade` – Upgrade button text
- `actions.downgrade` – Downgrade button text
- `actions.cancel` – Cancel subscription button text

**Usage Example**:
```typescript
import { useTranslations } from 'next-intl';

export function BillingPage() {
  const t = useTranslations('billing');
  return <h1>{t('pageTitle')}</h1>;
}
```

---

#### 2. `license` Namespace
**Purpose**: App limits, quota, and plan feature strings

**Keys**:
- `appLimitTitle` – App limit heading
- `appUsage` – Usage display (supports `{used}` and `{limit}` placeholders)
- `appLimitReached` – Message when limit reached
- `appLimitHardBlocked` – Message when hard blocked
- `upgradeCta` – Upgrade call-to-action
- `includedFeatures` – Features list heading

**Usage Example**:
```typescript
const t = useTranslations('license');
const message = t('appUsage', { used: 5, limit: 10 });
// EN: "5 of 10 apps used"
// ZH: "已使用 5 / 10 个应用名额"
```

---

#### 3. `trial` Namespace
**Purpose**: Trial period, countdown, and expiration strings

**Keys**:
- `bannerTitle` – Trial banner heading
- `timeLeft` – Time remaining display (supports `{minutes}` placeholder)
- `expiredTitle` – Expiration heading
- `expiredDescription` – Expiration message
- `startNow` – Start trial button
- `upgradeNow` – Subscribe button

**Usage Example**:
```typescript
const t = useTranslations('trial');
const timeMsg = t('timeLeft', { minutes: 30 });
// EN: "Time left: 30 minutes"
// ZH: "剩余时间：30 分钟"
```

---

## English Translations (en.json)

```json
"billing": {
  "pageTitle": "Billing & Subscription",
  "currentPlan": "Current plan",
  "noSubscription": "You don't have an active subscription yet.",
  "nextBillingDate": "Next billing date",
  "manageOnStripe": "Manage your subscription on Stripe",
  "status": {
    "active": "Active",
    "trialing": "Trial",
    "canceled": "Canceled",
    "past_due": "Past due"
  },
  "actions": {
    "upgrade": "Upgrade plan",
    "downgrade": "Downgrade plan",
    "cancel": "Cancel subscription"
  }
},
"license": {
  "appLimitTitle": "App limit for this plan",
  "appUsage": "{used} of {limit} apps used",
  "appLimitReached": "You've reached the maximum number of apps for this plan.",
  "appLimitHardBlocked": "You cannot create more apps on this plan. Please upgrade to continue.",
  "upgradeCta": "Upgrade to unlock more apps",
  "includedFeatures": "What's included in this plan"
},
"trial": {
  "bannerTitle": "Free trial in progress",
  "timeLeft": "Time left: {minutes} minutes",
  "expiredTitle": "Your trial has ended",
  "expiredDescription": "New students can't start sessions until you subscribe.",
  "startNow": "Start your trial",
  "upgradeNow": "Subscribe to keep your apps running"
}
```

---

## Chinese Translations (zh.json)

```json
"billing": {
  "pageTitle": "订阅与账单",
  "currentPlan": "当前套餐",
  "noSubscription": "你还没有激活任何订阅。",
  "nextBillingDate": "下次扣费日期",
  "manageOnStripe": "在 Stripe 中管理订阅",
  "status": {
    "active": "已激活",
    "trialing": "试用中",
    "canceled": "已取消",
    "past_due": "逾期未支付"
  },
  "actions": {
    "upgrade": "升级套餐",
    "downgrade": "降级套餐",
    "cancel": "取消订阅"
  }
},
"license": {
  "appLimitTitle": "当前套餐的应用数量上限",
  "appUsage": "已使用 {used} / {limit} 个应用名额",
  "appLimitReached": "你已用完当前套餐可用的应用数量。",
  "appLimitHardBlocked": "当前套餐无法再创建新应用，如需继续使用请升级套餐。",
  "upgradeCta": "升级套餐，解锁更多应用名额",
  "includedFeatures": "该套餐包含的功能"
},
"trial": {
  "bannerTitle": "试用期进行中",
  "timeLeft": "剩余时间：{minutes} 分钟",
  "expiredTitle": "试用已结束",
  "expiredDescription": "试用结束后，新学生将无法开始学习，请开通订阅以继续使用。",
  "startNow": "开始试用",
  "upgradeNow": "开通订阅，继续使用应用"
}
```

---

## Validation

✅ **JSON Syntax**: Both files are valid JSON  
✅ **Comma Placement**: All commas correctly placed  
✅ **Existing Content**: All original namespaces preserved  
✅ **Placeholder Support**: Keys with `{variable}` placeholders ready for i18n formatting  

---

## Next Steps

1. **Update Components** – Use new i18n keys in billing/trial/license components
2. **Add Formatting** – Implement placeholder replacement for `{used}`, `{limit}`, `{minutes}`
3. **Test Translations** – Verify both EN and ZH display correctly
4. **Add More Keys** – Expand as needed for additional billing features

---

## Component Integration Examples

### Billing Page
```typescript
import { useTranslations } from 'next-intl';

export function BillingPage() {
  const t = useTranslations('billing');
  
  return (
    <div>
      <h1>{t('pageTitle')}</h1>
      <p>{t('currentPlan')}</p>
      <span className="badge">{t('status.active')}</span>
    </div>
  );
}
```

### Trial Banner
```typescript
import { useTranslations } from 'next-intl';

export function TrialBanner({ minutesLeft }) {
  const t = useTranslations('trial');
  
  return (
    <div>
      <h2>{t('bannerTitle')}</h2>
      <p>{t('timeLeft', { minutes: minutesLeft })}</p>
    </div>
  );
}
```

### License Limit Display
```typescript
import { useTranslations } from 'next-intl';

export function AppLimitDisplay({ used, limit }) {
  const t = useTranslations('license');
  
  return (
    <div>
      <h3>{t('appLimitTitle')}</h3>
      <p>{t('appUsage', { used, limit })}</p>
    </div>
  );
}
```

---

## Summary

✅ Three new namespaces added to both en.json and zh.json  
✅ All existing content preserved  
✅ Valid JSON syntax  
✅ Ready for component integration  
✅ Supports placeholder formatting for dynamic values
