# Header Navigation 快速测试指南

## 🚀 快速开始

### 1. 启动开发服务器

```bash
npm run dev
```

### 2. 访问首页

```
http://localhost:3000/en
http://localhost:3000/zh
```

---

## 🧪 测试项目

### 测试 1: Header 导航显示

**步骤**:
1. 访问 `http://localhost:3000/en`
2. 查看 header 导航栏

**预期结果**:
- 应该显示 3 个 app 链接：
  - Grammar Master
  - Lease AI Review
  - Cast Master
- 每个链接都应该是可点击的

**验证**:
```
Header 导航应该显示:
[Shanno Studio] [Grammar Master] [Lease AI Review] [Cast Master] [About]
```

### 测试 2: 中文导航

**步骤**:
1. 访问 `http://localhost:3000/zh`
2. 查看 header 导航栏

**预期结果**:
- 应该显示 3 个 app 链接（中文名称）：
  - 语法大师
  - 美国租房合同审核
  - 播感大师

**验证**:
```
Header 导航应该显示:
[Shanno Studio] [语法大师] [美国租房合同审核] [播感大师] [关于]
```

### 测试 3: 导航链接正确性

**步骤**:
1. 在 header 中点击 "Grammar Master"
2. 检查 URL 和页面

**预期结果**:
- URL 应该是 `/en/grammar-master`
- 页面应该加载 Grammar Master 产品页面

**验证**:
```
点击 "Grammar Master" → URL: /en/grammar-master
点击 "Lease AI Review" → URL: /en/lease-ai
点击 "Cast Master" → URL: /en/cast-master
```

### 测试 4: Footer 产品链接

**步骤**:
1. 访问 `http://localhost:3000/en`
2. 滚动到页面底部
3. 查看 Footer 的"产品"部分

**预期结果**:
- 应该显示 3 个产品链接：
  - Lease AI Review
  - Grammar Master
  - Cast Master

**验证**:
```
Footer 产品部分应该显示:
- Lease AI Review
- Grammar Master
- Cast Master
```

### 测试 5: 添加新 App

**步骤**:
1. 编辑 `src/config/apps.ts`
2. 添加新 app：
   ```typescript
   {
     slug: "test-app",
     name: "Test App",
     nameCn: "测试应用",
     status: "live",
   }
   ```
3. 保存文件
4. 刷新浏览器

**预期结果**:
- Header 导航应该自动显示新 app 链接
- Footer 产品列表应该自动包含新 app

**验证**:
```
Header 导航应该显示:
[Shanno Studio] [Grammar Master] [Lease AI Review] [Cast Master] [Test App] [About]
```

### 测试 6: 隐藏 App

**步骤**:
1. 编辑 `src/config/apps.ts`
2. 将某个 app 的 status 改为 "beta"：
   ```typescript
   {
     slug: "grammar-master",
     name: "Grammar Master",
     nameCn: "语法大师",
     status: "beta",  // 改为 beta
   }
   ```
3. 保存文件
4. 刷新浏览器

**预期结果**:
- Header 导航应该不显示 Grammar Master 链接
- Footer 产品列表应该不包含 Grammar Master

**验证**:
```
Header 导航应该显示:
[Shanno Studio] [Lease AI Review] [Cast Master] [About]
```

---

## 🔍 代码验证

### 验证 appRegistry 配置

```bash
# 检查 src/config/apps.ts 是否存在
ls -la src/config/apps.ts

# 检查 appRegistry 是否包含 3 个 live apps
grep -c "status: \"live\"" src/config/apps.ts
# 应该输出: 3
```

### 验证 Header Links 组件

```bash
# 检查 Links 组件是否导入 appRegistry
grep -n "getLiveApps\|getAppRoute" src/app/_components/header/links.tsx

# 应该看到:
# import { getLiveApps, getAppRoute } from "@/config/apps";
```

### 验证 Footer 组件

```bash
# 检查 Footer 组件是否导入 appRegistry
grep -n "getLiveApps\|getAppRoute" src/app/_components/footer.tsx

# 应该看到:
# import { getLiveApps, getAppRoute } from "@/config/apps";
```

---

## 📊 浏览器开发者工具验证

### 检查 HTML 结构

1. 打开浏览器开发者工具 (F12)
2. 检查 Header 导航的 HTML：
   ```html
   <div class="flex gap-2">
     <button>
       <a href="/en/grammar-master">Grammar Master</a>
     </button>
     <button>
       <a href="/en/lease-ai">Lease AI Review</a>
     </button>
     <button>
       <a href="/en/cast-master">Cast Master</a>
     </button>
     <button>
       <a href="#about">About</a>
     </button>
   </div>
   ```

### 检查网络请求

1. 打开浏览器开发者工具 → Network 标签
2. 刷新页面
3. 检查是否有任何 404 错误
4. 所有链接应该都能正确加载

---

## ✅ 完整测试清单

- [ ] Header 导航显示 3 个 app 链接（英文）
- [ ] Header 导航显示 3 个 app 链接（中文）
- [ ] 所有导航链接都能正确跳转
- [ ] Footer 产品列表显示 3 个 app
- [ ] Footer 产品链接都能正确跳转
- [ ] 添加新 app 后导航自动更新
- [ ] 隐藏 app 后导航自动移除
- [ ] 没有 404 错误
- [ ] 没有控制台错误

---

## 🐛 常见问题

### Q: Header 导航不显示 app 链接

**A**: 检查以下几点：
1. 确保 `src/config/apps.ts` 存在
2. 确保 appRegistry 中的 apps 的 status 是 "live"
3. 检查浏览器控制台是否有错误
4. 重启开发服务器

### Q: 导航链接指向错误的 URL

**A**: 检查以下几点：
1. 确保 `getAppRoute()` 函数正确生成路由
2. 确保 locale 参数正确传递
3. 检查 app 的 slug 是否与路由文件夹名称一致

### Q: 中文导航显示英文名称

**A**: 检查以下几点：
1. 确保 locale 参数正确识别为 "zh"
2. 确保 appRegistry 中的 app 有 nameCn 字段
3. 检查 Links 组件中的 locale 判断逻辑

---

## 📝 测试报告模板

```
测试日期: 2024-01-XX
测试环境: 开发环境 (npm run dev)
测试浏览器: Chrome/Firefox/Safari

测试结果:
- [ ] Header 导航: ✅ 通过 / ❌ 失败
- [ ] Footer 产品: ✅ 通过 / ❌ 失败
- [ ] 导航链接: ✅ 通过 / ❌ 失败
- [ ] 多语言: ✅ 通过 / ❌ 失败
- [ ] 动态更新: ✅ 通过 / ❌ 失败

问题描述:
(如有失败，请描述问题)

备注:
(其他观察或建议)
```

---

**准备好测试了吗？** 现在就启动开发服务器吧！

```bash
npm run dev
```

然后访问 `http://localhost:3000/en` 查看效果。

