# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

盛邦安全前端统一框架模板 — 基于 Umi Max + Ant Design Pro 的企业级前端 monorepo 模板项目。包含登录、仪表盘、用户管理、角色管理、审计日志等通用页面，作为新项目开发的参考脚手架。

## 环境版本要求

| 工具 | 版本 | 说明 |
|------|------|------|
| Node.js | 18.x | LTS 版本，推荐 18.20+ |
| pnpm | 10.13.1 | `packageManager` 字段已锁定，`corepack enable` 后自动使用正确版本 |

团队初始化：`corepack enable && pnpm install`

## 技术栈版本

| 依赖 | 版本 | 说明 |
|------|------|------|
| @umijs/max | 4.6.56 | Umi Max 框架，集成 routing/layout/model/request/access/i18n/antd/dva |
| React | 18.3.1 | react-dom 同版本 |
| Ant Design | 5.29.3 | antd 5.x |
| Ant Design Pro Components | 2.8.x | ProTable/ProForm/ProLayout 等 |
| TypeScript | 5.9.3 | |
| dayjs | 1.11.20 | 替代 moment，通过 moment2dayjs 插件兼容 |
| Less + styled-components + antd-style | — | 样式方案 |
| ECharts + @ant-design/plots | — | 图表 |

**状态管理**: Umi model (hooks 模式) + dva (兼容旧 connect 写法)

## Monorepo 结构

```
web_react/
├── common/              # 共享代码包 (@ray/common 别名)
│   └── src/
│       ├── pages/       # 通用页面：Login, Dashboard, User, Role, Auditlog
│       ├── components/  # 通用组件：Lease, PageHeader, PageHeaderWrapper
│       ├── hooks/       # useRequest, useRequestBlob, useThemeColor
│       ├── utils/       # request.ts (带签名/锁机制), signature, validator
│       ├── constants/
│       ├── locales/     # 国际化：zh-CN, en-US
│       └── assets/
├── lib/
│   └── iconfont/        # @ray/iconfont 自定义图标包
├── products/
│   └── demo/            # 主产品应用
│       ├── config/      # Umi 配置：config.ts, routes.ts, defaultSettings.ts
│       ├── mock/        # Mock 数据：login, user, auditlog, dashboard
│       ├── src/
│       │   ├── pages/       # 产品页面：preview/exception/404
│       │   ├── services/    # API 服务层
│       │   ├── components/  # 产品级组件：RightContent, HeaderDropdown
│       │   └── locales/     # 产品级国际化（菜单标题等）
│       └── tsconfig.json
└── patches/             # 第三方包 patch 文件
```

## 核心架构模式

- **路由引用 common 页面**：路由配置中使用相对路径 `'../../../../common/src/pages/Login'` 引用 common 包的页面组件，不是通过 npm 包引用
- **路径别名**：`@/*` → `./src/*`，`@ray/common/*` → `../../common/src/*`（在 config.ts 和 tsconfig.json 中同步配置）
- **请求层双轨制**：common 中 `utils/request.ts` 是自定义 fetch 封装（带请求签名、锁、错误码路由）；demo 中 `requestErrorConfig.ts` 是 Umi Max request 插件配置（带拦截器）。两套体系并存
- **错误码驱动跳转**：后端返回 error_code 决定前端行为（10000/10040 → 登录页, 10150 → license 异常, 10180 → 恢复出厂设置）
- **主题系统**：通过 localStorage 存储主题，`DEFAULT_THEME` / `THEME` 常量驱动，支持暗色/夜间/盛邦等多种主题
- **布局**: ProLayout `mix` 布局，国际化菜单标题取自 `menu.xxx` 的 locale key
- **权限控制**: 路由中通过 `access` 字段控制页面访问（`canDashboard`, `canUser`, `canAuditlog`）

## 提交规范

**每次 `git commit` 前必须执行 `pre-commit-review` skill 进行代码审查。** 该 skill 会检查 Hooks 规则、Antd Form 受控、Monorepo 跨层一致性、Mock 数据、类型安全、安全风险等项目特定问题。未通过审查不得提交。

## 常用命令

```bash
# 在 web_react/ 目录下执行
pnpm dev:demo          # 启动 demo 产品开发服务器
pnpm build:demo        # 构建 demo 产品
pnpm lint              # ESLint 检查并修复
pnpm install           # 安装所有 workspace 依赖
```

## 配置说明

- **代理配置**：`config.ts` 中 proxy 将 `/api` 代理到 `http://172.18.80.20:888`
- **构建输出**：`outputPath: '../../dist'`，产物在项目根目录的 dist/
- **mfsu 已禁用** (`mfsu: false`)，代码分割使用 `granularChunks` 策略
- **Prettier**：单引号、尾逗号、80 字符行宽
- **Husky + lint-staged**：提交时自动 lint + format（通过 `.lintstagedrc` 配置）

## 新增页面指南

- 通用页面放在 `common/src/pages/`，在路由中用 `../../../../common/src/pages/XXX` 引用
- 产品专属页面放在 `products/demo/src/pages/` 下，路由中用 `./xxx/YYY` 引用
- 路由菜单标题通过 `name` 字段 + locales 中的 `menu.xxx` key 实现国际化
- 新增一级菜单时需同步更新：路由 `name` 字段、`locales/zh-CN/menu.ts`、`locales/en-US/menu.ts`、角色管理页的 `MENU_TREE` 和 `groupMap`

## Mock 开发

Mock 文件位于 `products/demo/mock/`，Umi 自动加载该目录下的文件。每个文件通过 URL 模式匹配请求（如 `'POST /api/mock/user/query'`）。Mock 密码统一为 `Test@123`。
