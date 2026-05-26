---
name: pre-commit-review
description: Use when about to commit code to git, before creating any commit. Runs a structured review checklist to catch issues that linting cannot detect.
---

# Pre-Commit Code Review

## When to Use

在执行 `git commit` **之前**，对即将提交的变更进行代码审查。本技能捕捉 lint 工具无法发现的问题。

## Review Checklist

执行 `git diff --staged`（或 `git diff` 查看未暂存变更）获取变更内容，逐项检查：

### 1. React Hooks 规则

- [ ] 所有 Hook 调用（`useState`、`useEffect`、`useRef`、`Form.useForm`、`Form.useWatch` 等）均在组件/自定义 Hook 的**顶层**，不在回调、循环、条件内
- [ ] `useEffect` 依赖数组完整，无遗漏、无多余
- [ ] 事件处理函数内不调用 Hook（如 `Form.useFormInstance()` 应替换为组件顶层创建的 form 实例）

### 2. Antd Form 受控问题

- [ ] `Tree`、`Transfer`、`Cascader` 等组件的 `value`/`onChange` 与 antd `Form.Item` 的 `value`/`onChange` 不匹配时，需手动同步 `checkedKeys`/`targetKeys` 等受控属性
- [ ] 使用 `Form.useWatch` 或 `Form.useForm` 获取表单值驱动受控属性，不使用不会响应变化的静态值

### 3. Monorepo 跨层一致性

新增或修改页面/菜单/路由时，检查以下文件是否同步更新：

- [ ] `products/demo/config/routes.ts` — 路由定义
- [ ] `products/demo/src/locales/zh-CN/menu.ts` — 中文菜单
- [ ] `products/demo/src/locales/en-US/menu.ts` — 英文菜单
- [ ] `common/src/pages/Role/index.tsx` — `MENU_TREE` 和 `groupMap`

### 4. Mock 数据一致性

- [ ] 新增 API 路径在 `products/demo/mock/` 中有对应 mock 文件
- [ ] mock 返回的 `data` 结构与页面 service 中使用的一致
- [ ] API URL 路径格式遵循 `/api/mock/{page}/{action}` 或 `/api/v1/{module}/{action}`

### 5. 类型安全

- [ ] 无新增 `any` 类型（必要时用 `unknown` + 类型收窄）
- [ ] 接口响应类型与实际使用匹配
- [ ] 新增 `interface` 或 `type` 命名符合项目约定（`{ComponentName}Props`）

### 6. 安全检查

- [ ] 无硬编码密码、Token、密钥（mock 文件中的测试密码除外）
- [ ] 无 `dangerouslySetInnerHTML` 或 `eval` 使用
- [ ] 用户输入经过校验，API 参数经过处理

### 7. 命名与文件规范

- [ ] 新文件命名符合约定：组件 PascalCase、工具 camelCase、路由 key kebab-case
- [ ] API 函数命名 `api{Action}{Entity}`（如 `apiUserQuery`、`apiUserMgrAdd`）
- [ ] 新增页面目录结构包含 `index.tsx` + `service.ts` + `style.less`

### 8. 死代码检查

- [ ] 无新增未使用的 import
- [ ] 无注释掉的代码块（应直接删除，理由写在 commit message 中）
- [ ] 无 `console.log`、`debugger` 等调试代码

## Review 流程

```
git diff --staged
  → 逐项检查 checklist
  → 发现问题 → 修复 → 重新 diff → 再次检查
  → 全部通过 → 允许 commit
```

## 输出格式

```
## Pre-Commit Review

**变更文件**: [列出变更文件]

**检查结果**:
- [x] React Hooks 规则 — 通过
- [x] Antd Form 受控 — 通过
- [!] 跨层一致性 — 发现问题：路由已更新但 locales/menu.ts 缺少对应 key
- ...

**需要修复**: [列出问题及建议]
或
**可以提交**: 所有检查项通过
```
