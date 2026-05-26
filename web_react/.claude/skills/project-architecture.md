---
name: project-architecture
description: Use when adding new pages, components, routes, or services to understand this Umi Max monorepo's directory conventions, component patterns, and cross-layer wiring rules.
---

# 盛邦安全前端统一框架 — 项目架构规范

## 目录结构约定

```
web_react/
├── common/src/
│   ├── pages/{PageName}/          # 通用页面（跨产品复用）
│   │   ├── index.tsx              # 页面主组件
│   │   ├── service.ts|.js        # 页面 API 调用
│   │   ├── constant.ts           # 页面常量
│   │   ├── data.d.ts             # 类型定义
│   │   ├── style.less            # 页面样式
│   │   └── components/           # 页面子组件
│   ├── components/{Component}/   # 通用组件
│   ├── hooks/                    # 通用 hooks
│   ├── utils/                    # 工具函数
│   └── constants/                # 全局常量
├── products/demo/
│   ├── config/
│   │   ├── routes.ts             # 路由配置
│   │   └── config.ts             # Umi 构建配置
│   ├── mock/                     # Mock 数据
│   └── src/
│       ├── app.tsx               # 运行时配置（布局、权限、请求）
│       ├── services/             # 产品级 API
│       ├── components/           # 产品级组件
│       └── locales/              # 国际化
└── lib/iconfont/                 # 自定义图标包
```

## 组件设计原则

- 统一使用**函数组件 + Hooks**，不使用 class 组件
- 组件定义用箭头函数：`const MyPage = () => { ... }`，导出用 `export default`
- Props 类型在文件内用 `interface` 或 `type` 定义，命名格式 `{ComponentName}Props`
- 页面主组件默认导出，子组件放在 `components/` 子目录
- 使用 antd token 系统获取设计变量（`theme.useToken()`），不硬编码颜色
- 复杂样式用 `antd-style` 的 `createStyles`，简单样式用内联 `style`

## 路由与菜单约定

路由配置在 `products/demo/config/routes.ts`，使用变量引用 common 页面：

```typescript
const commonRelativeUrl = '../../../../common/src/pages';
// component: `${commonRelativeUrl}/PageName`
```

### 新增页面完整流程

新增一个页面需要修改以下文件：

| 步骤 | 文件 | 操作 |
|------|------|------|
| 1 | `common/src/pages/{PageName}/index.tsx` | 创建页面组件 |
| 2 | `products/demo/config/routes.ts` | 添加路由项（`name` + `path` + `component` + `access`） |
| 3 | `products/demo/src/locales/zh-CN/menu.ts` | 添加 `menu.{一级}.{二级}: '中文名'` |
| 4 | `products/demo/src/locales/en-US/menu.ts` | 添加 `menu.{一级}.{二级}: 'English Name'` |
| 5 | 角色管理页 `Role/index.tsx` | 同步更新 `MENU_TREE` 和 `groupMap` |

### 菜单标题映射规则

路由 `name: 'user'` + 父级 `path: '/common'` → locale key 为 `menu.common.user`

## 服务层约定

每个页面目录下有独立的 `service.ts`（或 `.js`），函数命名 `api{Action}{Entity}`：

```typescript
// common/src/pages/User/service.js
import request from '@ray/common/utils/request';

export async function apiUserQuery(params) {
  return request('/api/mock/user/query', { method: 'POST', body: params });
}
```

**两套请求体系：**
- `@ray/common/utils/request` — 自定义 fetch 封装（带签名、锁、错误码路由）
- `@umijs/max` 的 `request` / `useRequest` — Umi 标准请求（带拦截器）

根据后端接口要求选择，同一页面的 service 文件中应保持一致。

## 状态管理

- 页面内部状态：`useState` / `useRef`
- 跨页面全局状态：Umi model（`useModel('@@initialState')`）
- 兼容旧 dva 写法（`connect`），新代码不使用

## Mock 数据

位于 `products/demo/mock/`，Umi 自动加载。每个文件导出 URL 模式到处理函数的映射：

```typescript
export default {
  'POST /api/mock/user/query': (req, res) => { res.send({...}); },
};
```

新增页面时在 mock 目录创建同名文件，URL 路径格式：`/api/mock/{page}/{action}`

## 命名与文件规范

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 页面目录 | PascalCase | `User/`, `Auditlog/` |
| 组件文件 | PascalCase.tsx | `IntroduceRow.tsx` |
| 工具/hooks | camelCase | `useRequest.ts`, `validator.ts` |
| 样式文件 | 与页面同名 | `style.less` |
| 常量文件 | camelCase | `constant.ts` |
| 类型文件 | data.d.ts | `data.d.ts` |
| 服务文件 | service.ts/.js | `service.ts` |
| API 函数 | api + 动词 + 名词 | `apiUserQuery`, `apiUserMgrAdd` |
| 路由 key | kebab-case | `common/user/management` |
| 常量 | UPPER_SNAKE_CASE | `DEFAULT_ROLES`, `PAGINATION_PROPS` |
| 路径别名 | `@/*` → demo src, `@ray/common/*` → common src | — |
