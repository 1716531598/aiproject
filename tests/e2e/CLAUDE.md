# E2E Tests CLAUDE.md

Playwright E2E 自动化测试，覆盖登录、仪表盘、用户管理、角色管理、审计日志。

## 技术栈

Playwright 1.52 + TypeScript 5.0，单 worker 执行（避免共享后端状态冲突）。

## 前置条件

测试前需手动启动：

```bash
# 1. 后端（E2E 模式，验证码明文返回）
#    方式一：通过环境变量（推荐，无需修改文件）
cd D:\code\ironman\server && E2E_MODE=true python app.py
#    方式二：在 app.conf 中设置 E2E_MODE = true

# 2. 前端
cd D:\code\ironman\web_react && pnpm dev:demo
```

## 目录结构

```
tests/e2e/
├── playwright.config.ts       # baseURL=localhost:8000, workers=1
├── fixtures/auth.fixture.ts   # API 登录 + Cookie 注入，提供 adminPage/userPage/auditPage
├── helpers/api.helper.ts      # loginAndGetSid(), createTestUser(), deleteTestUser()
├── pages/                     # Page Object Model
│   ├── login.page.ts
│   ├── dashboard.page.ts
│   ├── user-management.page.ts
│   ├── role-management.page.ts
│   └── audit-log.page.ts
└── specs/                     # 测试用例
    ├── login.spec.ts          # 7 个
    ├── dashboard.spec.ts      # 5 个
    ├── user-management.spec.ts # 10 个
    ├── role-management.spec.ts # 8 个
    └── audit-log.spec.ts      # 6 个
```

## Auth Fixture 机制

- 直接调用后端 API（端口 888）：createcode → 获取 E2E_MODE 明文验证码 → login → 提取 sid Cookie
- `context.addCookies()` 注入浏览器 → `goto('/common/dashboard')` 触发 getInitialState
- 提供 3 个角色 fixture：`adminPage`、`userPage`、`auditPage`

## 常用命令

```bash
npm install && npx playwright install chromium  # 首次安装
npx playwright test                              # 运行全部
npx playwright test --headed                     # 有头模式
npx playwright test specs/login.spec.ts          # 单文件
npx playwright test --ui                         # Playwright UI
npx playwright show-report                       # 查看报告
```

## 注意事项

- **workers=1**：共享后端状态，并行会导致测试冲突
- **验证码绕过**：通过 `E2E_MODE=true` 环境变量或 `app.conf` 配置启用，生产环境不受影响
- **测试数据清理**：用 `helpers/api.helper.ts` 的 createTestUser/deleteTestUser 管理临时数据
