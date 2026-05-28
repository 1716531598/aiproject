# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

盛邦安全统一管理平台 — 前后端分离的企业级管理系统。包含登录认证、仪表盘、用户管理、角色管理（RBAC 权限树）、审计日志等功能模块。前端基于 Umi Max + Ant Design Pro，后端基于 Python Flask + PostgreSQL + Redis。

## 项目结构

```
D:\code\ironman\
├── server/                  # Python Flask 后端（详见 server/CLAUDE.md）
│   ├── app.py               # Flask 入口，端口 888
│   ├── models/              # SQLAlchemy ORM：User, Role, Permission, RolePermission, AuditLog
│   ├── blueprints/          # API 路由：auth, user, role, audit_log, dashboard
│   ├── utils/               # 工具：db, redis_client, response, captcha
│   └── seed/                # 种子数据
├── web_react/               # React 前端（详见 web_react/CLAUDE.md）
│   ├── common/src/pages/    # 通用页面：Login, Dashboard, User, Role, Auditlog
│   └── products/demo/       # 主产品应用，proxy /api → localhost:888
└── tests/e2e/               # Playwright E2E 测试（详见 tests/e2e/CLAUDE.md）
```

## 运行环境

| 服务 | 地址 | 说明 |
|------|------|------|
| PostgreSQL | localhost:5432 | 数据库 ironman，用户 postgres，密码 Test@123 |
| Redis | localhost:6379 | 密码 Test@123 |
| Flask 后端 | localhost:888 | `python app.py` |
| Umi 前端 | localhost:8000 | `pnpm dev:demo`，proxy `/api` → 后端 |

## 跨系统约定

- **统一响应格式**：后端所有接口返回 `{code, success, data, msg, msgType}`，前端 `errorThrower` 检查 `success || code === 200`
- **认证方式**：Cookie `sid` → Redis session，后端 `get_current_user()` 解析，前端 `getInitialState` 获取
- **种子用户**：admin / user / audit，密码均为 `Test@123`
- **E2E 测试模式**：通过环境变量 `E2E_MODE=true` 或 `app.conf` 中 `E2E_MODE = true` 启动后端，验证码接口返回明文

## 常用命令

```bash
# 后端
cd D:\code\ironman\server && python app.py
# 前端
cd D:\code\ironman\web_react && pnpm dev:demo
# E2E 测试
cd D:\code\ironman\tests\e2e && npx playwright test
```
