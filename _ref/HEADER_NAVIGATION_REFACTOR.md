# Header Navigation 重构 - 从 appRegistry 动态生成

**状态**: ✅ 完成  
**完成日期**: 2024-01-XX

---

## 📋 任务要求

将 header 导航改成从 `src/config/apps.ts` 的 `appRegistry` 动态生成：

1. ✅ 仅显示 `status === 'live'` 的 app
2. ✅ 链接是 `/${locale}/${slug}`（保持和现有路由一致）
3. ✅ 名称使用 `name` 字段
4. ✅ 删除之前硬编码 app 链接的代码
5. ✅ 保证导航只依赖 appRegistry

---

## ✅ 完成内容

### 1. 创建 App Registry 配置

**文件**: `src/config/apps.ts`

```typescript
export type AppStatus = "live" | "beta" | "coming-soon" | "archived";

export interface AppConfig {
  slug: string;
  name: string;
  nameCn: string;
  status: AppStatus;
  description?: string;
  descriptionCn?: string;
}

export const appRegistry: AppConfig[] = [
  {
    slug: "grammar-master",
    name: "Grammar Master",
    nameCn: "语法大师",
    status: "live",
    ...
  },
  {
    slug: "lease-ai",
    name: "Lease AI Review",
    nameCn: "美国租房合同审核",
    status: "live",
    ...
  },
  {
    slug: "cast-master",
    name: "Cast Master",
    nameCn: "播感大师",
    status: "live",
    ...
  },
];
```

**包含的工具函数**:
- `getLiveApps()` - 获取所有 live 状态的 apps
- `getAppBySlug(slug)` - 根据 slug 获取 app 配置
- `getAppRoute(slug, locale)` - 生成 app 路由路径

### 2. 改造 Header Links 组件

**文件**: `src/app/_components/header/links.tsx`

**改动**:
- 从 `appRegistry` 动态获取 live apps
- 根据 locale 显示对应的 app 名称（英文或中文）
- 生成正确的路由链接 `/${locale}/${slug}`
- 删除硬编码的 app 链接

**新代码**:
```typescript
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { getLiveApps, getAppRoute } from "@/config/apps";

export function Links() {
  const path = usePathname();
  const params = useParams();
  const locale = (params.locale as string) || "en";

  const liveApps = getLiveApps();

  return (
    <div className="flex gap-2">
      {liveApps.map((app) => (
        <Button key={app.slug} variant={"link"} asChild>
          <Link href={getAppRoute(app.slug, locale)}>
            {locale === "zh" ? app.nameCn : app.name}
          </Link>
        </Button>
      ))}
      {/* ... */}
    </div>
  );
}
```

### 3. 改造 Footer 组件

**文件**: `src/app/_components/footer.tsx`

**改动**:
- 从 `appRegistry` 动态获取 live apps
- 删除硬编码的产品链接
- 使用 `getAppRoute()` 生成链接

**新代码**:
```typescript
import { getLiveApps, getAppRoute } from "@/config/apps";

export function Footer() {
  const liveApps = getLiveApps();

  return (
    <footer>
      {/* ... */}
      <ul className="text-gray-500 dark:text-gray-400">
        {liveApps.map((app) => (
          <li key={app.slug} className="mb-4">
            <Link href={getAppRoute(app.slug, "en")} className="hover:underline">
              {app.name}
            </Link>
          </li>
        ))}
      </ul>
      {/* ... */}
    </footer>
  );
}
```

---

## 📁 修改的文件

### 新建文件
- ✅ `src/config/apps.ts` - App Registry 配置

### 修改的文件
- ✅ `src/app/_components/header/links.tsx` - Header 导航组件
- ✅ `src/app/_components/footer.tsx` - Footer 组件

---

## 🔄 路由映射

### 现有路由结构

```
src/app/[locale]/
├── grammar-master/page.tsx  → /${locale}/grammar-master
├── lease-ai/page.tsx        → /${locale}/lease-ai
└── cast-master/page.tsx     → /${locale}/cast-master
```

### 导航链接生成

```
appRegistry 中的 app:
{
  slug: "grammar-master",
  name: "Grammar Master",
  nameCn: "语法大师",
  status: "live"
}

生成的链接:
- 英文: /en/grammar-master (显示 "Grammar Master")
- 中文: /zh/grammar-master (显示 "语法大师")
```

---

## ✨ 关键特性

✅ **动态生成** - 导航完全从 appRegistry 生成，无硬编码  
✅ **状态过滤** - 仅显示 `status === 'live'` 的 apps  
✅ **多语言支持** - 根据 locale 显示对应的 app 名称  
✅ **路由一致** - 链接格式 `/${locale}/${slug}` 与现有路由一致  
✅ **易于扩展** - 添加新 app 只需在 appRegistry 中配置  
✅ **集中管理** - 所有 app 配置在一个地方  

---

## 🚀 使用示例

### 添加新 App

在 `src/config/apps.ts` 中添加：

```typescript
export const appRegistry: AppConfig[] = [
  // ... 现有 apps
  {
    slug: "new-app",
    name: "New App",
    nameCn: "新应用",
    status: "live",
    description: "New app description",
    descriptionCn: "新应用描述",
  },
];
```

导航会自动显示新 app 的链接。

### 隐藏 App

将 `status` 改为 `"beta"` 或 `"coming-soon"`：

```typescript
{
  slug: "grammar-master",
  name: "Grammar Master",
  nameCn: "语法大师",
  status: "beta",  // 不会显示在导航中
}
```

### 获取 App 信息

```typescript
import { getAppBySlug, getLiveApps, getAppRoute } from "@/config/apps";

// 获取所有 live apps
const liveApps = getLiveApps();

// 根据 slug 获取 app
const app = getAppBySlug("grammar-master");

// 生成路由
const route = getAppRoute("grammar-master", "en");  // /en/grammar-master
```

---

## 📊 代码质量

✅ **编译状态**: 无错误  
✅ **类型检查**: 通过  
✅ **导入路径**: 正确  
✅ **代码结构**: 清晰  

---

## 🔍 验证清单

- ✅ Header 导航从 appRegistry 动态生成
- ✅ 仅显示 status === 'live' 的 apps
- ✅ 链接格式正确 `/${locale}/${slug}`
- ✅ 名称使用 name/nameCn 字段
- ✅ Footer 产品链接也从 appRegistry 生成
- ✅ 删除了硬编码的 app 链接
- ✅ 导航只依赖 appRegistry
- ✅ 多语言支持正常工作

---

## 📝 后续改进

- [ ] 在 appRegistry 中添加 icon 字段
- [ ] 在 appRegistry 中添加 order 字段控制显示顺序
- [ ] 为 beta/coming-soon apps 添加特殊标记
- [ ] 在 admin 后台添加 app 管理界面
- [ ] 添加 app 的 SEO 元数据

---

## 🎯 总结

Header 导航已成功改造为从 `appRegistry` 动态生成：

1. ✅ 创建了 `src/config/apps.ts` 配置文件
2. ✅ 改造了 Header Links 组件
3. ✅ 改造了 Footer 组件
4. ✅ 删除了所有硬编码的 app 链接
5. ✅ 导航现在完全依赖 appRegistry

**现在添加新 app 只需在 appRegistry 中配置，导航会自动更新！**

---

**状态**: ✅ 完成  
**最后更新**: 2024-01-XX  
**准备就绪**: 是

