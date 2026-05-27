# Web React CLAUDE.md

Umi Max + Ant Design Pro 前端 monorepo。

## 技术栈

| 依赖 | 版本 | 用途 |
|------|------|------|
| @umijs/max | 4.6.56 | Umi Max 框架，集成 routing/layout/model/request/access/i18n/antd/dva |
| React | 18.3.1 | |
| Ant Design | 5.29.3 | UI 组件 |
| ProComponents | 2.8.x | ProTable/ProForm/ProLayout |
| Node.js | 18.x | pnpm 10.13.1，`corepack enable && pnpm install` |

**状态管理**: Umi model (hooks) + dva (兼容旧 connect)

## Monorepo 结构

```
web_react/
├── common/              # 共享代码包 (@ray/common 别名)
│   └── src/
│       ├── pages/       # 通用页面：Login, Dashboard, User, Role, Auditlog
│       ├── components/  # 通用组件
│       ├── hooks/       # useRequest, useRequestBlob, useThemeColor
│       ├── utils/       # request.ts (带签名/锁机制), signature, validator
│       ├── constants/
│       └── locales/     # 国际化：zh-CN, en-US
├── lib/iconfont/        # 自定义图标包
├── products/demo/       # 主产品应用
│   ├── config/          # Umi 配置：config.ts, routes.ts, defaultSettings.ts
│   ├── mock/            # Mock 已禁用（export default {}）
│   └── src/
│       ├── requestErrorConfig.ts  # 全局请求错误处理管线
│       ├── services/api.ts        # 认证相关 API
│       └── app.tsx                # getInitialState + 全局布局
└── patches/             # 第三方包 patch
```

## 路由与权限

- 路由配置中用相对路径引用 common 页面：`../../../../common/src/pages/Login`
- 路径别名：`@/*` → `./src/*`，`@ray/common/*` → `../../common/src/*`
- 权限控制：路由 `access` 字段（canDashboard, canUser, canAuditlog）
- 布局：ProLayout `mix` 布局，菜单标题取自 `menu.xxx` locale key
- 新增一级菜单需同步：路由 name、locales（zh-CN/en-US menu.ts）、角色管理 MENU_TREE

## 请求层

### Umi Max request 插件（requestErrorConfig.ts）

- **errorThrower**：检查 `success || code === 200`，不通过抛 BizError
- **errorHandler**：全局捕获 BizError/网络错误，显示 message.error
- **响应拦截器**：仅添加 `success` 字段，**不**显示错误弹框（避免重复）

### 各页面请求方式

- **登录**：`skipErrorHandler: true`，组件自行处理错误消息，只弹 1 个提示
- **Dashboard**：`request()` 返回值需 `.data` 解包（后端包在统一响应 data 字段中）
- **ProTable 页面**（User/Role/Auditlog）：request 函数返回 `{data: aaData, success, total}`

## 配置

- **代理**：`config.ts` 中 proxy 将 `/api` → `http://localhost:888`
- **构建输出**：`outputPath: '../../dist'`
- **mfsu 已禁用**（`mfsu: false`），使用 `granularChunks` 策略
- **Prettier**：单引号、尾逗号、80 字符行宽
- **Husky + lint-staged**：提交时自动 lint + format

## 常用命令

```bash
pnpm install       # 安装依赖
pnpm dev:demo      # 启动开发服务器（localhost:8000）
pnpm build:demo    # 构建生产包
pnpm lint          # ESLint 检查并修复
```

## 注意事项

- **Mock 已禁用**：`products/demo/mock/` 下所有文件为 `export default {}`，请求走真实后端
- **新增页面**：通用页面放 `common/src/pages/`，产品专属放 `products/demo/src/pages/`
- **错误弹框**：响应拦截器不弹错误，由 errorHandler 或组件自行处理
