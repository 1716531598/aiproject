import os
import uuid
import bcrypt
from flask import Blueprint, request, make_response
from models import User, AuditLog
from utils.db import SessionLocal
from utils.redis_client import get_redis
from utils.response import success, error
from utils.captcha import generate_captcha

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")


def _get_session_id():
    return request.cookies.get("sid")


def _create_audit_log(db, userid, adminname, log_type, ip, msg, result="成功", resource=""):
    log = AuditLog(userid=userid, adminname=adminname, type=log_type, ip=ip, msg=msg, result=result, resource=resource)
    db.add(log)


def get_current_user():
    sid = _get_session_id()
    if not sid:
        return None
    r = get_redis()
    data = r.get(f"session:{sid}")
    if not data:
        return None
    import json
    return json.loads(data)


@auth_bp.route("/createcode", methods=["POST"])
def create_code():
    code, img_base64 = generate_captcha()
    r = get_redis()
    temp_sid = str(uuid.uuid4())
    r.setex(f"captcha:{temp_sid}", 300, code)
    response_data = {"imgCode": img_base64}
    if os.getenv("E2E_MODE") == "true":
        response_data["code"] = code
    resp = make_response(success(response_data, msg="创建验证码成功"))
    resp.set_cookie("temp_sid", temp_sid, httponly=True, samesite="Lax")
    return resp


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(force=True, silent=True) or {}
    username = data.get("username", "")
    password = data.get("password", "")
    img_code = data.get("imgCode", "")
    ip = request.remote_addr

    r = get_redis()

    # validate captcha
    temp_sid = request.cookies.get("temp_sid")
    if not temp_sid:
        return error("验证码已过期，请刷新验证码")
    cached_code = r.get(f"captcha:{temp_sid}")
    if not cached_code:
        return error("验证码已过期，请刷新验证码")
    if img_code.upper() != cached_code.upper():
        db = SessionLocal()
        try:
            _create_audit_log(db, 0, username, "登录", ip, f"验证码错误: {username}", result="失败", resource=username)
            db.commit()
        finally:
            db.close()
        return error("验证码错误")
    r.delete(f"captcha:{temp_sid}")

    # check lockout
    lockout = r.get(f"lockout:{username}")
    if lockout:
        db = SessionLocal()
        try:
            _create_audit_log(db, 0, username, "登录", ip, f"账户已锁定: {username}", result="失败", resource=username)
            db.commit()
        finally:
            db.close()
        return error("账户已锁定，请30分钟后重试")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.name == username).first()
        if not user:
            _create_audit_log(db, 0, username, "登录", ip, f"用户不存在: {username}", result="失败", resource=username)
            db.commit()
            return error("用户名或密码错误")

        if user.is_login != 1:
            _create_audit_log(db, user.id, username, "登录", ip, f"账户已禁用: {username}", result="失败", resource=username)
            db.commit()
            return error("账户已禁用")

        if not bcrypt.checkpw(password.encode("utf-8"), user.password_hash.encode("utf-8")):
            err_count = r.incr(f"login_err:{username}")
            r.expire(f"login_err:{username}", 1800)
            remaining = user.errcount - err_count
            if remaining <= 0:
                r.setex(f"lockout:{username}", 1800, "1")
                _create_audit_log(db, user.id, username, "锁定", ip, f"账户 {username} 登录错误次数过多，已锁定", result="成功", resource=username)
                db.commit()
                return error("登录错误次数过多，账户已锁定30分钟")
            _create_audit_log(db, user.id, username, "登录", ip, f"密码错误: {username}，还可尝试{remaining}次", result="失败", resource=username)
            db.commit()
            return error(f"用户名或密码错误, 还可尝试{remaining}次！")

        # login success - clear error count
        r.delete(f"login_err:{username}")

        # create session
        sid = str(uuid.uuid4())
        import json
        session_data = json.dumps({
            "id": user.id,
            "name": user.name,
            "role_id": user.role_id,
            "timeout": user.timeout,
        })
        r.setex(f"session:{sid}", user.timeout * 60, session_data)

        _create_audit_log(db, user.id, user.name, "登录", ip, f"用户 {user.name} 登录成功", result="成功", resource=user.name)
        db.commit()

        # map role_id to access string
        access_map = {1: "admin", 2: "user", 3: "audit"}
        resp = make_response(success({"access": access_map.get(user.role_id, "user")}))
        resp.set_cookie("sid", sid, httponly=True, samesite="Lax", max_age=user.timeout * 60)
        return resp
    finally:
        db.close()


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session = get_current_user()
    if session:
        r = get_redis()
        sid = _get_session_id()
        r.delete(f"session:{sid}")
        db = SessionLocal()
        try:
            _create_audit_log(db, session["id"], session["name"], "退出", request.remote_addr, f"用户 {session['name']} 退出登录", result="成功", resource=session["name"])
            db.commit()
        finally:
            db.close()
    resp = make_response(success({}))
    resp.delete_cookie("sid")
    return resp


@auth_bp.route("/current-user", methods=["GET"])
def current_user():
    session = get_current_user()
    if not session:
        return error("未登录", code=401)

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == session["id"]).first()
        if not user:
            return error("用户不存在", code=401)

        access_map = {1: "admin", 2: "user", 3: "audit"}
        return success({
            "name": user.name,
            "role_type": user.role_id,
            "avatar": "https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png",
            "userid": str(user.id).zfill(8),
            "email": "",
            "signature": "",
            "title": "",
            "group": "",
            "tags": [],
            "notifyCount": 0,
            "unreadCount": 0,
            "country": "China",
            "access": access_map.get(user.role_id, "user"),
            "geographic": {
                "province": {"label": "", "key": ""},
                "city": {"label": "", "key": ""},
            },
            "address": "",
            "phone": "",
        })
    finally:
        db.close()
