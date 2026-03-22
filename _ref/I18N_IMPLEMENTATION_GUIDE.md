# i18n Implementation Guide – Billing, License & Trial

**Status**: ✅ Ready for Implementation  
**Files Updated**: `messages/en.json`, `messages/zh.json`

---

## Quick Start

### 1. Use in Components

```typescript
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('billing'); // or 'license', 'trial'
  
  return <h1>{t('pageTitle')}</h1>;
}
```

### 2. With Placeholders

```typescript
const t = useTranslations('license');
const message = t('appUsage', { used: 5, limit: 10 });
// EN: "5 of 10 apps used"
// ZH: "已使用 5 / 10 个应用名额"
```

---

## Available Keys by Namespace

### `billing` – Subscription & Billing

| Key | EN | ZH |
|-----|----|----|
| `pageTitle` | Billing & Subscription | 订阅与账单 |
| `currentPlan` | Current plan | 当前套餐 |
| `noSubscription` | You don't have an active subscription yet. | 你还没有激活任何订阅。 |
| `nextBillingDate` | Next billing date | 下次扣费日期 |
| `manageOnStripe` | Manage your subscription on Stripe | 在 Stripe 中管理订阅 |
| `status.active` | Active | 已激活 |
| `status.trialing` | Trial | 试用中 |
| `status.canceled` | Canceled | 已取消 |
| `status.past_due` | Past due | 逾期未支付 |
| `actions.upgrade` | Upgrade plan | 升级套餐 |
| `actions.downgrade` | Downgrade plan | 降级套餐 |
| `actions.cancel` | Cancel subscription | 取消订阅 |

### `license` – App Limits & Quota

| Key | EN | ZH |
|-----|----|----|
| `appLimitTitle` | App limit for this plan | 当前套餐的应用数量上限 |
| `appUsage` | {used} of {limit} apps used | 已使用 {used} / {limit} 个应用名额 |
| `appLimitReached` | You've reached the maximum number of apps for this plan. | 你已用完当前套餐可用的应用数量。 |
| `appLimitHardBlocked` | You cannot create more apps on this plan. Please upgrade to continue. | 当前套餐无法再创建新应用，如需继续使用请升级套餐。 |
| `upgradeCta` | Upgrade to unlock more apps | 升级套餐，解锁更多应用名额 |
| `includedFeatures` | What's included in this plan | 该套餐包含的功能 |

### `trial` – Trial Period & Expiration

| Key | EN | ZH |
|-----|----|----|
| `bannerTitle` | Free trial in progress | 试用期进行中 |
| `timeLeft` | Time left: {minutes} minutes | 剩余时间：{minutes} 分钟 |
| `expiredTitle` | Your trial has ended | 试用已结束 |
| `expiredDescription` | New students can't start sessions until you subscribe. | 试用结束后，新学生将无法开始学习，请开通订阅以继续使用。 |
| `startNow` | Start your trial | 开始试用 |
| `upgradeNow` | Subscribe to keep your apps running | 开通订阅，继续使用应用 |

---

## Component Examples

### Billing Page Component

```typescript
// src/app/dashboard/billing/page.tsx
import { useTranslations } from 'next-intl';

export default function BillingPage() {
  const t = useTranslations('billing');
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">{t('pageTitle')}</h1>
      
      <Card className="p-8">
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">{t('currentPlan')}</p>
            <p className="text-2xl font-semibold">Grammar Master</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Status</p>
            <span className="badge">{t('status.active')}</span>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">{t('nextBillingDate')}</p>
            <p>2024-04-20</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

### Trial Banner Component

```typescript
// src/components/trial-banner.tsx
import { useTranslations } from 'next-intl';

export function TrialBanner({ minutesRemaining }: { minutesRemaining: number }) {
  const t = useTranslations('trial');
  
  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
      <div className="max-w-7xl mx-auto">
        <h3 className="font-semibold text-blue-900 mb-1">
          {t('bannerTitle')}
        </h3>
        <p className="text-sm text-blue-800">
          {t('timeLeft', { minutes: minutesRemaining })}
        </p>
      </div>
    </div>
  );
}
```

### License Limit Component

```typescript
// src/components/app-limit-display.tsx
import { useTranslations } from 'next-intl';

export function AppLimitDisplay({ 
  used, 
  limit 
}: { 
  used: number; 
  limit: number;
}) {
  const t = useTranslations('license');
  const isLimitReached = used >= limit;
  
  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">{t('appLimitTitle')}</h3>
      
      <p className="text-sm text-gray-600 mb-2">
        {t('appUsage', { used, limit })}
      </p>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full ${
            isLimitReached ? 'bg-red-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min((used / limit) * 100, 100)}%` }}
        />
      </div>
      
      {isLimitReached && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-800 mb-2">
            {t('appLimitHardBlocked')}
          </p>
          <button className="text-sm font-medium text-red-700 hover:text-red-900">
            {t('upgradeCta')}
          </button>
        </div>
      )}
    </Card>
  );
}
```

### Trial Expired Modal

```typescript
// src/components/trial-expired-modal.tsx
import { useTranslations } from 'next-intl';

export function TrialExpiredModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('trial');
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <Card className="p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold mb-2">
          {t('expiredTitle')}
        </h2>
        
        <p className="text-sm text-gray-600 mb-6">
          {t('expiredDescription')}
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Close
          </button>
          <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            {t('upgradeNow')}
          </button>
        </div>
      </Card>
    </div>
  );
}
```

---

## Placeholder Formatting

### Using `next-intl` with Placeholders

```typescript
import { useTranslations } from 'next-intl';

const t = useTranslations('license');

// Simple placeholder replacement
const message = t('appUsage', { used: 5, limit: 10 });
// Result: "5 of 10 apps used" (EN) or "已使用 5 / 10 个应用名额" (ZH)

// With trial countdown
const t2 = useTranslations('trial');
const timeMsg = t2('timeLeft', { minutes: 30 });
// Result: "Time left: 30 minutes" (EN) or "剩余时间：30 分钟" (ZH)
```

---

## Integration Checklist

- [ ] Import `useTranslations` from `next-intl` in components
- [ ] Use `t('namespace.key')` to access translations
- [ ] Pass placeholder values as second argument: `t('key', { var: value })`
- [ ] Test both EN and ZH versions
- [ ] Verify placeholder replacement works correctly
- [ ] Update existing hardcoded strings to use i18n keys
- [ ] Add new keys as needed for additional features

---

## Files Modified

✅ `messages/en.json` – Added 47 lines (3 namespaces)  
✅ `messages/zh.json` – Added 47 lines (3 namespaces)

---

## Next Steps

1. **Update Components** – Replace hardcoded strings with i18n keys
2. **Test Translations** – Verify EN/ZH display correctly
3. **Add More Keys** – Expand as needed for additional features
4. **Document Usage** – Keep this guide updated as you add more keys

---

## Support

For questions about `next-intl` usage, see:
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Placeholder Formatting](https://next-intl-docs.vercel.app/docs/usage/messages#formatting)
