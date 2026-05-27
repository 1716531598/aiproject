import bcrypt
from flask import Blueprint, request
from models import User, AuditLog
from utils.db import SessionLocal
from utils.response import success, error, paginate
from blueprints.auth import get_current_user, _create_audit_log

user_bp = Blueprint("user", __name__, url_prefix="/api/v1/users")


@user_bp.route("/query", methods=["POST"])
def query_users():
    session = get_current_user()
    if not session:
        return error("未登录", code=401)

    data = request.get_json(force=True, silent=True) or {}
    page = data.get("page", 1)
    page_size = data.get("pageSize", 10)
    search = data.get("sSearch", "")

    db = SessionLocal()
    try:
        q = db.query(User)
        if search:
            q = q.filter(User.name.ilike(f"%{search}%"))
        total = q.count()
        users = q.order_by(User.id).offset((page - 1) * page_size).limit(page_size).all()
        aa_data = [u.to_query_dict() for u in users]
        return success(paginate(aa_data, page, page_size, total))
    finally:
        db.close()


@user_bp.route("/add", methods=["POST"])
def add_user():
    session = get_current_user()
    if not session:
        return error("未登录", code=401)

    data = request.get_json(force=True, silent=True) or {}
    username = data.get("username", "")
    password = data.get("password", "")
    role_id = data.get("role_id") or data.get("role_type")
    is_login = data.get("isLogin", 1)
    errcount = data.get("errcount", 5)
    timeout = data.get("timeout", 30)

    if not username or len(username) < 4 or len(username) > 32:
        return error("用户名长度须为4-32位")
    if not password or len(password) < 8 or len(password) > 32:
        return error("密码长度须为8-32位")
    if role_id not in (1, 2, 3):
        return error("无效的角色类型")

    db = SessionLocal()
    try:
        if db.query(User).filter(User.name == username).first():
            return error("用户名已存在")

        pw_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        user = User(
            name=username,
            password_hash=pw_hash,
            role_id=role_id,
            parent_id=session["id"],
            is_login=is_login,
            errcount=errcount,
            timeout=timeout,
        )
        db.add(user)

        _create_audit_log(db, session["id"], session["name"], "新增",
                          request.remote_addr, f"新增用户 {username}", resource=username)
        db.commit()

        return success({}, msg="新建成功")
    finally:
        db.close()


@user_bp.route("/update", methods=["POST"])
def update_user():
    session = get_current_user()
    if not session:
        return error("未登录", code=401)

    data = request.get_json(force=True, silent=True) or {}
    user_id = data.get("id")
    if not user_id:
        return error("缺少用户ID")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return error("用户不存在")

        changes = []

        if "username" in data and data["username"] != user.name:
            changes.append(f"用户名: {user.name}→{data['username']}")
            user.name = data["username"]

        new_role = data.get("role_id") or data.get("role_type")
        if new_role is not None and new_role != user.role_id:
            role_map = {1: "超级管理员", 2: "普通用户", 3: "审计角色"}
            changes.append(f"角色: {role_map.get(user.role_id, user.role_id)}→{role_map.get(new_role, new_role)}")
            user.role_id = new_role

        if "isLogin" in data and data["isLogin"] != user.is_login:
            old_status = "启用" if user.is_login == 1 else "禁用"
            new_status = "启用" if data["isLogin"] == 1 else "禁用"
            changes.append(f"状态: {old_status}→{new_status}")

            log_type = "启用" if data["isLogin"] == 1 else "禁用"
            user.is_login = data["isLogin"]

            _create_audit_log(db, session["id"], session["name"], log_type,
                              request.remote_addr, f"{log_type}用户 {user.name}", resource=user.name)
            # if there are other changes too, log them separately below
            other_changes = [c for c in changes if not c.startswith("状态")]
            if other_changes:
                _create_audit_log(db, session["id"], session["name"], "修改",
                                  request.remote_addr, f"修改用户 {user.name}: {', '.join(other_changes)}", resource=user.name)
            db.commit()
            return success({}, msg="修改成功")

        if "errcount" in data and data["errcount"] != user.errcount:
            changes.append(f"最大错误次数: {user.errcount}→{data['errcount']}")
            user.errcount = data["errcount"]

        if "timeout" in data and data["timeout"] != user.timeout:
            changes.append(f"超时时间: {user.timeout}→{data['timeout']}")
            user.timeout = data["timeout"]

        if not changes:
            return success({}, msg="无变更")

        log_type = "权限变更" if any("角色" in c for c in changes) else "修改"
        _create_audit_log(db, session["id"], session["name"], log_type,
                          request.remote_addr, f"修改用户 {user.name}: {', '.join(changes)}", resource=user.name)
        db.commit()

        return success({}, msg="修改成功")
    finally:
        db.close()


@user_bp.route("/delete", methods=["POST"])
def delete_user():
    session = get_current_user()
    if not session:
        return error("未登录", code=401)

    data = request.get_json(force=True, silent=True) or {}
    user_id = data.get("id")
    if not user_id:
        return error("缺少用户ID")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return error("用户不存在")
        if user.id == session["id"]:
            return error("不能删除自己")

        username = user.name
        db.delete(user)

        _create_audit_log(db, session["id"], session["name"], "删除",
                          request.remote_addr, f"删除用户 {username}", resource=username)
        db.commit()

        return success({}, msg="删除用户成功")
    finally:
        db.close()


@user_bp.route("/reset-password", methods=["POST"])
def reset_password():
    session = get_current_user()
    if not session:
        return error("未登录", code=401)

    data = request.get_json(force=True, silent=True) or {}
    user_id = data.get("user_id")
    if not user_id:
        return error("缺少用户ID")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return error("用户不存在")

        default_pw = bcrypt.hashpw("Test@123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        user.password_hash = default_pw

        _create_audit_log(db, session["id"], session["name"], "密码重置",
                          request.remote_addr, f"重置用户 {user.name} 的密码", resource=user.name)
        db.commit()

        return success({}, msg="当前用户密码已重置")
    finally:
        db.close()
