# Server CLAUDE.md

后端 Python Flask 应用，提供管理平台所有 API 接口。

## 技术栈

Flask 3.1 / SQLAlchemy 2.0 / Redis 5.2 / bcrypt 4.3 / Pillow 11.3 / flask-cors

## 统一响应格式

使用 `utils/response.py` 中的函数：

```python
success(data=None, msg="操作成功")  # → {code: 200, success: true, data, msg, msgType: "success"}
error(msg, code=400)                # → {code: 400, success: false, data: {}, msg, msgType: "error"}，HTTP 状态码始终 200
paginate(data_list, page, page_size, total)  # → {aaData, page, pageSize, total}
```

**所有接口必须使用这三个函数返回响应**，不要直接 `jsonify`。

## API 端点

| Blueprint | 前缀 | 说明 |
|-----------|------|------|
| auth.py | /api/v1/auth | 登录/注销/验证码/当前用户 |
| user.py | /api/v1/users | 用户 CRUD + 重置密码 |
| role.py | /api/v1/roles | 角色 CRUD + 权限树 |
| audit_log.py | /api/v1/audit-logs | 审计日志查询（支持筛选 result/resource） |
| dashboard.py | /api/v1/dashboard | 仪表盘图表数据（mock/real 模式） |

## 关键辅助函数

- `get_current_user()`（`blueprints/auth.py`）：从 Cookie sid 解析 Redis session，**所有受保护端点必须调用**
- `_create_audit_log(db, userid, adminname, type, ip, msg, result="成功", resource="")`（`blueprints/auth.py`）：统一审计日志记录
- `SessionLocal()`（`utils/db.py`）：获取 SQLAlchemy session，必须在 try/finally 中关闭
- `get_redis()`（`utils/redis_client.py`）：懒初始化 Redis 连接

## 数据模型

| 模型 | 表名 | 关键字段 |
|------|------|---------|
| User | users | name, password_hash, role_id, parent_id, is_login, errcount, timeout |
| Role | roles | name, built_in, description |
| Permission | permissions | key, name, parent_key |
| RolePermission | role_permissions | role_id, permission_id（UniqueConstraint） |
| AuditLog | audit_logs | userid, adminname, type, ip, msg, result, resource, created_at |

## 认证流程

1. `POST /api/v1/auth/createcode` → 生成验证码存 Redis（5 分钟），返回 base64 图片
2. `POST /api/v1/auth/login` → 验证码校验 → 锁定检查 → bcrypt 校验 → Redis session → sid Cookie
3. 受保护端点 → `get_current_user()` 从 sid Cookie 解析 session

登录失败锁定：错误次数超过 `user.errcount` 后锁定 30 分钟（Redis key `lockout:{username}`）

## 审计日志规则

所有管理面用户操作**必须**记录审计日志。

### 必须记录的操作

| 类别 | 操作 | 审计类型（type） |
|------|------|-----------------|
| 登录注销 | 登录成功、登录失败（密码错误/用户不存在/验证码错误/账户禁用/账户锁定） | 登录 |
| 登录注销 | 退出登录 | 退出 |
| 用户管理 | 新增/删除用户 | 新增/删除 |
| 用户管理 | 修改用户属性 | 修改 |
| 用户管理 | 禁用用户（isLogin 1→0） | 禁用 |
| 用户管理 | 启用用户（isLogin 0→1） | 启用 |
| 用户管理 | 变更用户角色 | 权限变更 |
| 用户管理 | 重置用户密码 | 密码重置 |
| 角色管理 | 新增/删除角色 | 新增/删除 |
| 角色管理 | 修改角色权限（checkedKeys 变更） | 权限变更 |
| 角色管理 | 修改角色属性 | 修改 |
| 安全事件 | 登录错误超限触发锁定 | 锁定 |

### 日志字段

| 字段 | 模型列 | 说明 |
|------|--------|------|
| 事件时间 | created_at | UTC 时间 |
| 用户ID | userid | 操作者 ID（未登录为 0） |
| 用户名 | adminname | 操作者用户名 |
| 事件类型 | type | 见上表 |
| 来源IP | ip | request.remote_addr |
| 日志内容 | msg | 具体变更详情（如 "修改用户 test: 超时时间: 30→60"） |
| 事件结果 | result | "成功" 或 "失败" |
| 操作资源 | resource | 被操作资源标识（用户名/角色名） |

### 编码规范

- 使用 `_create_audit_log()` 函数，不要直接创建 AuditLog 对象
- 登录失败场景在 `return error()` 之前记录，`result="失败"`
- `msg` 应包含具体变更内容
- 新增接口涉及用户活动时，必须同步添加审计日志

## 数据库架构与初始化（严格规范）

**Schema 演进** 与 **初始数据（Seed）** 采用职责分离模式，所有新增功能需要建表时必须遵循。

### 职责分离

| 目录/文件 | 职责 | 禁止事项 |
|-----------|------|----------|
| `migrations/versions/*.py` | **Schema 定义与变更**（CREATE / ALTER / DROP TABLE、INDEX） | 禁止写入 INSERT / UPDATE / DELETE 等业务数据 |
| `seeds/*.sql` | **初始数据**（INSERT INTO） | 禁止写入 DDL（CREATE TABLE 等） |
| `seed/init_data.py` | **一键初始化入口**：先执行 Alembic upgrade，再按序执行 seeds | 禁止在此硬编码业务数据 |

### 目录结构

```
server/
├── alembic.ini                 # Alembic 配置（URL 由 env.py 动态读取）
├── migrations/
│   ├── env.py                  # Alembic 环境配置，引用 models.Base.metadata
│   └── versions/
│       └── f05542d1e42d_baseline.py   # 初始迁移（所有基表 DDL）
├── seeds/
│   ├── 001_roles.sql
│   ├── 002_permissions.sql
│   ├── 003_role_permissions.sql
│   └── 004_users.sql           # 含 {{ADMIN_PASSWORD_HASH}} 占位符
└── seed/
    └── init_data.py            # 初始化入口脚本
```

### 新建表的完整流程（必须遵循）

1. **定义模型**：在 `models/` 新增模型类，继承 `utils.db.Base`，并导入 `models/__init__.py`。
2. **生成迁移**：
   ```bash
   alembic revision --autogenerate -m "add xxx table"
   ```
3. **审阅迁移脚本**：打开 `migrations/versions/xxxx_add_xxx_table.py`，确认 `upgrade()` / `downgrade()` 正确，**删除其中自带的 INSERT / UPDATE 逻辑**（数据必须走 seeds）。
4. **执行迁移**：
   ```bash
   alembic upgrade head
   ```
5. **添加 Seed（如需要）**：
   - 在 `seeds/` 新建 `005_xxx.sql`（按序号排序）。
   - SQL 必须幂等：使用 `ON CONFLICT DO NOTHING` 或 `ON CONFLICT ON CONSTRAINT ... DO NOTHING`。
   - 若需动态值（如 bcrypt 密码），在 SQL 中使用占位符（如 `{{XXX_PASSWORD_HASH}}`），并在 `seed/init_data.py` 的 `_inject_password_hashes()` 中实现替换。
6. **验证**：
   ```bash
   python seed/init_data.py
   ```

### 改表结构（ALTER TABLE）

- **只允许通过 Alembic migration**，禁止手工执行 `ALTER TABLE`。
- 流程：`alembic revision --autogenerate -m "xxx"` → 审阅 → `alembic upgrade head`。
- **禁止**在 `app.py` 或任何业务代码中调用 `Base.metadata.create_all()`。

### 初始数据规范（Seed SQL）

- **文件命名**：`{序号}_{模块}.sql`，如 `001_roles.sql`。
- **字符编码**：UTF-8。
- **幂等性**：每条 INSERT 语句必须带 `ON CONFLICT DO NOTHING`，或显式指定唯一约束：
  ```sql
  INSERT INTO role_permissions (role_id, permission_id) VALUES (1, 1)
  ON CONFLICT ON CONSTRAINT role_permissions_role_id_permission_id_key DO NOTHING;
  ```
- **序列重置**：若显式插入 `id`，末尾必须更新序列：
  ```sql
  SELECT setval('roles_id_seq', COALESCE((SELECT MAX(id) FROM roles), 1));
  ```
- **禁止**在 seed SQL 中写 `CREATE TABLE`、`DROP TABLE`、`ALTER TABLE`。

### 首次部署 / 全新环境初始化

```bash
# 一键完成：建表 + 初始数据
python server/seed/init_data.py
```

内部执行顺序：
1. `alembic upgrade head` — 创建/更新表结构。
2. 按文件名排序执行 `seeds/*.sql` — 插入初始数据。

### 独立执行 Migration（不跑 Seed）

```bash
# 仅升级表结构
alembic upgrade head

# 查看当前版本
alembic current

# 回退一级（危险，生产环境慎用）
alembic downgrade -1
```

## 注意事项

- **密码编码**：PostgreSQL 密码含 `@` 等特殊字符，`config.py` 用 `urllib.parse.quote_plus()` 编码
- **session 管理**：使用 `SessionLocal()` 在 try/finally 中关闭，不使用全局变量
- **角色映射**：role_id → access：1=admin, 2=user, 3=audit
- **E2E 模式**：`E2E_MODE=true` 时 createcode 返回明文验证码，仅限测试
