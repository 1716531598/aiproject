# 盛邦安全统一管理平台 — 环境配置说明

本文档面向团队新成员，介绍从零开始搭建本地开发环境的完整步骤。

---

## 1. 前置依赖

| 依赖 | 最低版本 | 推荐版本 | 说明 |
|------|---------|---------|------|
| Python | 3.8+ | 3.11 | 后端运行环境 |
| Node.js | 18+ | 20 LTS | 前端构建运行 |
| pnpm | 10+ | 10.x | 前端包管理器（通过 corepack 启用） |
| PostgreSQL | 14+ | 16 | 关系型数据库 |
| Redis | 6+ | 7 | 缓存与 Session 存储 |

> **操作系统**：Windows 10/11、macOS、Linux 均可。以下以 Windows 为例。

---

## 2. PostgreSQL 配置

### 2.1 安装与启动

1. 安装 PostgreSQL（推荐使用 [EDB 安装包](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads) 或 `choco install postgresql`）。
2. 确保 PostgreSQL 服务已启动，默认监听 `localhost:5432`。

### 2.2 创建数据库

```sql
-- 使用 psql 或 pgAdmin 执行
CREATE DATABASE ironman;
```

如需运行测试，额外创建测试数据库：

```sql
CREATE DATABASE ironman_test;
```

### 2.3 默认连接信息

| 参数 | 值 |
|------|------|
| 主机 | localhost |
| 端口 | 5432 |
| 用户名 | postgres |
| 密码 | Test@123 |
| 数据库名 | ironman |

> 可通过环境变量覆盖，见第 6 节。

---

## 3. Redis 配置

### 3.1 安装与启动

- **Windows**：推荐使用 [Memurai](https://www.memurai.com/) 或 WSL 中安装 Redis。
- **macOS**：`brew install redis && brew services start redis`
- **Linux**：`sudo apt install redis-server && sudo systemctl start redis`

确保 Redis 监听 `localhost:6379`。

### 3.2 设置密码

在 `redis.conf` 中配置：

```
requirepass Test@123
```

---

## 4. 后端配置（Flask）

### 4.1 安装依赖

```bash
cd server
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 4.2 配置文件

首次运行前，复制配置模板并按需修改：

```bash
cp app.conf.example app.conf
```

配置文件 `app.conf` 采用 INI 格式，所有配置项均有默认值，开箱即用。主要配置项见第 7 节。

种子数据包含 3 个内置角色和 3 个测试用户：

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | Test@123 | 超级管理员（全部权限） |
| user | Test@123 | 普通用户（仅仪表盘） |
| audit | Test@123 | 审计角色（仅审计日志） |

### 4.3 启动后端

```bash
python app.py
```

启动成功后，后端监听 `http://localhost:888`。

### 4.4 后端依赖清单

```
flask==3.1.*
flask-cors==5.0.*
flask-migrate==4.1.*
psycopg2-binary==2.9.*
redis==5.2.*
sqlalchemy==2.0.*
bcrypt==4.3.*
pillow==11.*
```

---

## 5. 前端配置（Umi Max + React）

### 5.1 启用 pnpm

```bash
corepack enable
```

### 5.2 安装依赖

```bash
cd web_react
pnpm install
```

### 5.3 启动开发服务器

```bash
pnpm dev:demo
```

启动成功后，前端访问 `http://localhost:8000`，API 请求自动代理至后端 `localhost:888`。

### 5.4 其他命令

| 命令 | 说明 |
|------|------|
| `pnpm build:demo` | 构建生产包 |
| `pnpm lint` | ESLint + Prettier 检查 |

### 5.5 前端核心依赖

| 依赖 | 版本 |
|------|------|
| @umijs/max | 4.5.3 |
| react | 18.x |
| antd | 5.29.x |
| @ant-design/pro-components | 2.8.x |
| typescript | 5.0.x |

---

## 6. E2E 测试（Playwright）

### 6.1 安装依赖

```bash
cd tests/e2e
npm install
npx playwright install
```

### 6.2 运行测试

需要先以 E2E 模式启动后端（验证码返回明文）。有两种方式：

```bash
# 方式一：环境变量（推荐，无需修改文件）
cd server && E2E_MODE=true python app.py

# 方式二：在 app.conf 中设置 E2E_MODE = true，然后
cd server && python app.py
```

然后执行测试：

```bash
cd tests/e2e
npx playwright test
```

> 测试使用单线程执行（`workers: 1`），以避免后端状态冲突。

---

## 7. 配置文件

后端通过 `server/app.conf`（INI 格式）管理所有配置，模板文件为 `app.conf.example`。

首次使用时复制模板：

```bash
cd server
cp app.conf.example app.conf
```

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `FLASK_ENV` | development | 运行环境：development / production / testing |
| `SECRET_KEY` | ironman-secret-key-change-in-production | 加密密钥（生产环境务必修改） |
| `PG_HOST` | localhost | PostgreSQL 主机 |
| `PG_PORT` | 5432 | PostgreSQL 端口 |
| `PG_USER` | postgres | PostgreSQL 用户名 |
| `PG_PASSWORD` | Test@123 | PostgreSQL 密码 |
| `PG_DATABASE` | ironman | 数据库名 |
| `PG_DATABASE_TEST` | ironman_test | 测试环境数据库名 |
| `REDIS_HOST` | localhost | Redis 主机 |
| `REDIS_PORT` | 6379 | Redis 端口 |
| `REDIS_PASSWORD` | Test@123 | Redis 密码 |
| `REDIS_DB` | 0 | Redis 数据库编号 |
| `HOST` | 0.0.0.0 | Flask 监听地址 |
| `PORT` | 888 | Flask 监听端口 |
| `DASHBOARD_MODE` | mock | 仪表盘数据模式：mock（模拟）/ real（真实） |
| `E2E_MODE` | - | 设为 true 启用测试模式，仅限测试环境 |

完整配置示例见 `server/app.conf.example`。

---

## 8. 常见问题

### Q: `pip install` 报错 psycopg2-binary 安装失败？
Windows 下 psycopg2-binary 通常正常安装。如遇问题，确认已安装 [Visual C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)。

### Q: `pnpm install` 报错找不到 pnpm？
运行 `corepack enable` 启用 corepack，或通过 `npm install -g pnpm` 全局安装。

### Q: 前端启动后接口报 404？
确认后端已在 `localhost:888` 运行。前端通过 proxy 配置将 `/api` 请求转发至后端。

### Q: Redis 连接被拒绝？
确认 Redis 服务已启动且设置了密码 `Test@123`。可用 `redis-cli -a Test@123 ping` 验证。

### Q: 数据库初始化失败？
确认 PostgreSQL 服务已启动，`ironman` 数据库已创建，且连接信息与 config.py 中的默认值一致。

---

## 9. 快速启动清单

```
1. 启动 PostgreSQL（确保 ironman 数据库存在）
2. 启动 Redis（密码 Test@123）
3. 后端：cd server && cp app.conf.example app.conf  # 仅首次，按需修改
4. 后端：cd server && python seed/init_data.py      # 仅首次
5. 后端：cd server && python app.py
6. 前端：cd web_react && pnpm install                # 仅首次
7. 前端：cd web_react && pnpm dev:demo
8. 浏览器访问 http://localhost:8000，使用 admin / Test@123 登录
```
