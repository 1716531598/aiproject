import csv
import json
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from io import StringIO
from pathlib import Path
from urllib import request as urlrequest

from flask import Blueprint, request

from models import IssueAssessment, IssueBug, IssueProduct, IssueSyncLog, IssueType, IssueVersion
from utils.db import SessionLocal
from utils.issue_import import import_zentao_csv
from utils.permission import require_permission
from utils.response import error, paginate, success

issue_admin_bp = Blueprint("issue_admin", __name__, url_prefix="/api/issue/admin")

SERVER_DIR = Path(__file__).resolve().parents[1]
EMAIL_CONFIG_PATH = SERVER_DIR / "issue_email_config.json"
EMAIL_LOG_PATH = SERVER_DIR / "issue_email_logs.json"
SYNC_CONFIG_PATH = SERVER_DIR / "issue_sync_config.json"

DEFAULT_EMAIL_CONFIG = {
    "smtp_host": "",
    "smtp_port": 587,
    "smtp_sender": "",
    "smtp_password": "",
    "notify_bug_new": True,
    "notify_responsibility": True,
    "notify_todo": True,
    "notify_bug_reopen": True,
}

DEFAULT_SYNC_CONFIG = {
    "zentao_url": "",
    "zentao_token": "",
    "auto_sync_enabled": False,
    "sync_interval_minutes": 60,
}


def _load_json(path, default):
    if not path.exists():
        return default.copy() if isinstance(default, dict) else list(default)
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _save_json(path, data):
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _safe_sync_config(config):
    safe_config = config.copy()
    if safe_config.get("zentao_token"):
        safe_config["zentao_token"] = "******"
    return safe_config


def _zentao_request_json(config, path):
    base_url = (config.get("zentao_url") or "").rstrip("/")
    if not base_url:
        raise ValueError("请先配置禅道地址")
    token = config.get("zentao_token") or ""
    req = urlrequest.Request(f"{base_url}{path}")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
        req.add_header("Token", token)
    with urlrequest.urlopen(req, timeout=15) as response:
        body = response.read().decode("utf-8")
    return json.loads(body) if body else {}


def _zentao_bugs_to_csv_bytes(payload):
    bugs = payload.get("bugs") or payload.get("data") or payload.get("items") or []
    if isinstance(bugs, dict):
        bugs = bugs.get("bugs") or bugs.get("data") or []
    output = StringIO()
    headers = [
        "Bug 编号",
        "Bug 标题",
        "产品",
        "严重程度",
        "状态",
        "解决者",
        "解决方案",
        "是否确认",
        "重现步骤",
        "创建日期",
        "解决日期",
        "由谁创建",
        "关键词",
    ]
    writer = csv.DictWriter(output, fieldnames=headers)
    writer.writeheader()
    for bug in bugs:
        writer.writerow(
            {
                "Bug 编号": bug.get("bug_id") or bug.get("id") or bug.get("code") or "",
                "Bug 标题": bug.get("title") or bug.get("name") or "",
                "产品": bug.get("product_name") or bug.get("product") or "",
                "严重程度": bug.get("severity") or bug.get("pri") or "",
                "状态": bug.get("status") or "",
                "解决者": bug.get("resolver") or bug.get("resolvedBy") or "",
                "解决方案": bug.get("resolution") or "",
                "是否确认": bug.get("confirmed") or "",
                "重现步骤": bug.get("steps") or bug.get("repro_steps") or "",
                "创建日期": bug.get("created_date") or bug.get("openedDate") or "",
                "解决日期": bug.get("resolved_date") or bug.get("resolvedDate") or "",
                "由谁创建": bug.get("created_by") or bug.get("openedBy") or "",
                "关键词": bug.get("keywords") or "",
            }
        )
    return output.getvalue().encode("utf-8-sig")


def _fetch_zentao_csv(config):
    payload = _zentao_request_json(config, "/api.php/v1/bugs")
    return _zentao_bugs_to_csv_bytes(payload)


def _type_to_dict(issue_type):
    return issue_type.to_dict()


def _assessment_to_dict(db, assessment):
    product = db.query(IssueProduct).filter(IssueProduct.id == assessment.product_id).first()
    version = db.query(IssueVersion).filter(IssueVersion.id == assessment.version_id).first()
    return {
        "id": assessment.id,
        "product_id": assessment.product_id,
        "product_name": product.name if product else "",
        "version_id": assessment.version_id,
        "version": version.version if version else "",
        "plan_date": version.plan_date.isoformat() if version and version.plan_date else None,
        "status": version.status if version else "",
        "created_at": assessment.created_at.isoformat() if assessment.created_at else None,
    }


def _sync_log_to_dict(sync_log):
    return {
        "id": sync_log.id,
        "trigger_type": sync_log.trigger_type,
        "new_count": sync_log.new_count,
        "update_count": sync_log.update_count,
        "fail_count": sync_log.fail_count,
        "status": sync_log.status,
        "error_detail": sync_log.error_detail,
        "created_at": sync_log.created_at.isoformat() if sync_log.created_at else None,
    }


@issue_admin_bp.route("/health", methods=["GET"])
@require_permission("issue/product_manage")
def health():
    return success(data={"status": "ok"})


@issue_admin_bp.route("/types/query", methods=["POST"])
@require_permission("issue/product_manage")
def type_query():
    data = request.get_json(force=True, silent=True) or {}
    page = data.get("page", 1)
    page_size = data.get("pageSize", 20)
    keyword = data.get("sSearch", "")
    status = data.get("status")

    db = SessionLocal()
    try:
        q = db.query(IssueType)
        if keyword:
            q = q.filter(IssueType.name.ilike(f"%{keyword}%"))
        if status:
            q = q.filter(IssueType.status == status)
        total = q.count()
        items = q.order_by(IssueType.sort_order, IssueType.id).offset((page - 1) * page_size).limit(page_size).all()
        return success(data=paginate([_type_to_dict(item) for item in items], page, page_size, total))
    finally:
        db.close()


@issue_admin_bp.route("/types/add", methods=["POST"])
@require_permission("issue/product_manage")
def type_add():
    data = request.get_json(force=True, silent=True) or {}
    name = data.get("name", "").strip()
    if not name:
        return error("问题类型不能为空")

    db = SessionLocal()
    try:
        if db.query(IssueType).filter(IssueType.name == name).first():
            return error("问题类型已存在")
        db.add(IssueType(name=name, status=data.get("status", "启用"), sort_order=data.get("sort_order", 0)))
        db.commit()
        return success(msg="新增成功")
    finally:
        db.close()


@issue_admin_bp.route("/types/update", methods=["POST"])
@require_permission("issue/product_manage")
def type_update():
    data = request.get_json(force=True, silent=True) or {}
    type_id = data.get("id")
    if not type_id:
        return error("缺少问题类型ID")

    db = SessionLocal()
    try:
        issue_type = db.query(IssueType).filter(IssueType.id == type_id).first()
        if not issue_type:
            return error("问题类型不存在")
        if data.get("name"):
            new_name = data["name"].strip()
            exists = db.query(IssueType).filter(IssueType.name == new_name, IssueType.id != type_id).first()
            if exists:
                return error("问题类型已存在")
            issue_type.name = new_name
        if data.get("status"):
            issue_type.status = data["status"]
        if "sort_order" in data:
            issue_type.sort_order = data.get("sort_order", 0)
        db.commit()
        return success(msg="更新成功")
    finally:
        db.close()


@issue_admin_bp.route("/types/delete", methods=["POST"])
@require_permission("issue/product_manage")
def type_delete():
    data = request.get_json(force=True, silent=True) or {}
    type_id = data.get("id")
    if not type_id:
        return error("缺少问题类型ID")

    db = SessionLocal()
    try:
        issue_type = db.query(IssueType).filter(IssueType.id == type_id).first()
        if not issue_type:
            return error("问题类型不存在")
        bug_count = db.query(IssueBug).filter(IssueBug.issue_type_id == issue_type.id).count()
        if bug_count > 0:
            issue_type.status = "禁用"
            db.commit()
            return success(msg="已关联问题，已禁用")
        db.delete(issue_type)
        db.commit()
        return success(msg="删除成功")
    finally:
        db.close()


@issue_admin_bp.route("/assessment/query", methods=["POST"])
@require_permission("issue/assessment")
def assessment_query():
    data = request.get_json(force=True, silent=True) or {}
    page = data.get("page", 1)
    page_size = data.get("pageSize", 20)
    product_id = data.get("product_id")

    db = SessionLocal()
    try:
        q = db.query(IssueAssessment)
        if product_id:
            q = q.filter(IssueAssessment.product_id == product_id)
        total = q.count()
        items = q.order_by(IssueAssessment.id).offset((page - 1) * page_size).limit(page_size).all()
        return success(data=paginate([_assessment_to_dict(db, item) for item in items], page, page_size, total))
    finally:
        db.close()


@issue_admin_bp.route("/assessment/add", methods=["POST"])
@require_permission("issue/assessment")
def assessment_add():
    data = request.get_json(force=True, silent=True) or {}
    product_id = data.get("product_id")
    version_id = data.get("version_id")
    if not product_id or not version_id:
        return error("请选择产品和版本")

    db = SessionLocal()
    try:
        version = db.query(IssueVersion).filter(IssueVersion.id == version_id).first()
        if not version or version.product_id != product_id:
            return error("版本不存在或不属于该产品")
        exists = (
            db.query(IssueAssessment)
            .filter(IssueAssessment.product_id == product_id)
            .filter(IssueAssessment.version_id == version_id)
            .first()
        )
        if exists:
            return error("考核配置已存在")
        db.add(IssueAssessment(product_id=product_id, version_id=version_id))
        db.commit()
        return success(msg="新增成功")
    finally:
        db.close()


@issue_admin_bp.route("/assessment/remove", methods=["POST"])
@require_permission("issue/assessment")
def assessment_remove():
    data = request.get_json(force=True, silent=True) or {}
    assessment_id = data.get("id")
    if not assessment_id:
        return error("缺少考核配置ID")

    db = SessionLocal()
    try:
        assessment = db.query(IssueAssessment).filter(IssueAssessment.id == assessment_id).first()
        if not assessment:
            return error("考核配置不存在")
        db.delete(assessment)
        db.commit()
        return success(msg="移除成功")
    finally:
        db.close()


@issue_admin_bp.route("/email/config", methods=["GET", "POST"])
@require_permission("issue/product_manage")
def email_config():
    if request.method == "GET":
        config = _load_json(EMAIL_CONFIG_PATH, DEFAULT_EMAIL_CONFIG)
        safe_config = config.copy()
        if safe_config.get("smtp_password"):
            safe_config["smtp_password"] = "******"
        return success(data=safe_config)

    data = request.get_json(force=True, silent=True) or {}
    current_config = _load_json(EMAIL_CONFIG_PATH, DEFAULT_EMAIL_CONFIG)
    config = DEFAULT_EMAIL_CONFIG.copy()
    config.update({key: data.get(key, config[key]) for key in config})
    if data.get("smtp_password") in ("", None, "******"):
        config["smtp_password"] = current_config.get("smtp_password", "")
    try:
        config["smtp_port"] = int(config.get("smtp_port") or 587)
    except ValueError:
        return error("SMTP 端口必须为数字")
    _save_json(EMAIL_CONFIG_PATH, config)
    return success(msg="保存成功")


def _append_email_log(entry):
    logs = _load_json(EMAIL_LOG_PATH, [])
    logs.insert(0, entry)
    _save_json(EMAIL_LOG_PATH, logs[:200])


@issue_admin_bp.route("/email/test", methods=["POST"])
@require_permission("issue/product_manage")
def email_test():
    data = request.get_json(force=True, silent=True) or {}
    to_email = data.get("to_email", "").strip()
    if not to_email:
        return error("测试收件人不能为空")

    config = _load_json(EMAIL_CONFIG_PATH, DEFAULT_EMAIL_CONFIG)
    if not config.get("smtp_host") or not config.get("smtp_sender"):
        return error("请先配置 SMTP 服务器和发件人")

    msg = MIMEText("问题管理系统测试邮件", "html", "utf-8")
    msg["Subject"] = "问题管理系统测试邮件"
    msg["From"] = config["smtp_sender"]
    msg["To"] = to_email

    try:
        with smtplib.SMTP(config["smtp_host"], int(config.get("smtp_port") or 587)) as server:
            if config.get("smtp_password"):
                server.starttls()
                server.login(config["smtp_sender"], config["smtp_password"])
            server.send_message(msg)
        _append_email_log(
            {
                "to_email": to_email,
                "subject": msg["Subject"],
                "status": "成功",
                "error": "",
                "created_at": datetime.now().isoformat(),
            }
        )
        return success(msg="测试邮件发送成功")
    except Exception as exc:
        _append_email_log(
            {
                "to_email": to_email,
                "subject": msg["Subject"],
                "status": "失败",
                "error": str(exc),
                "created_at": datetime.now().isoformat(),
            }
        )
        return error(f"测试邮件发送失败: {exc}")


@issue_admin_bp.route("/email/logs", methods=["GET"])
@require_permission("issue/product_manage")
def email_logs():
    return success(data=_load_json(EMAIL_LOG_PATH, []))


@issue_admin_bp.route("/sync/config", methods=["GET", "POST"])
@require_permission("issue/bug_import")
def sync_config():
    if request.method == "GET":
        return success(data=_safe_sync_config(_load_json(SYNC_CONFIG_PATH, DEFAULT_SYNC_CONFIG)))

    data = request.get_json(force=True, silent=True) or {}
    current_config = _load_json(SYNC_CONFIG_PATH, DEFAULT_SYNC_CONFIG)
    config = DEFAULT_SYNC_CONFIG.copy()
    config.update({key: data.get(key, config[key]) for key in config})
    if data.get("zentao_token") in ("", None, "******"):
        config["zentao_token"] = current_config.get("zentao_token", "")
    try:
        config["sync_interval_minutes"] = int(config.get("sync_interval_minutes") or 60)
    except ValueError:
        return error("同步间隔必须为数字")
    _save_json(SYNC_CONFIG_PATH, config)
    return success(data=_safe_sync_config(config), msg="保存成功")


@issue_admin_bp.route("/sync/test", methods=["POST"])
@require_permission("issue/bug_import")
def sync_test():
    data = request.get_json(force=True, silent=True) or {}
    config = _load_json(SYNC_CONFIG_PATH, DEFAULT_SYNC_CONFIG)
    config.update({key: value for key, value in data.items() if value not in ("", None, "******")})
    try:
        payload = _zentao_request_json(config, "/api.php/v1/tokens")
        return success(data={"connected": True, "response": payload}, msg="连接成功")
    except Exception as exc:
        return error(f"连接失败: {exc}")


@issue_admin_bp.route("/sync/trigger", methods=["POST"])
@require_permission("issue/bug_import")
def sync_trigger():
    config = _load_json(SYNC_CONFIG_PATH, DEFAULT_SYNC_CONFIG)
    db = SessionLocal()
    try:
        csv_bytes = _fetch_zentao_csv(config)
        result = import_zentao_csv(db, csv_bytes)
        db.commit()
        return success(data=result, msg="同步完成")
    except Exception as exc:
        db.rollback()
        db.add(
            IssueSyncLog(
                trigger_type="手动",
                new_count=0,
                update_count=0,
                fail_count=1,
                status="失败",
                error_detail=str(exc),
            )
        )
        db.commit()
        return error(f"同步失败: {exc}")
    finally:
        db.close()


@issue_admin_bp.route("/sync-logs/query", methods=["POST"])
@require_permission("issue/product_manage")
def sync_logs_query():
    data = request.get_json(force=True, silent=True) or {}
    page = data.get("page", 1)
    page_size = data.get("pageSize", 20)
    status = data.get("status")
    start_date = data.get("start_date")
    end_date = data.get("end_date")

    db = SessionLocal()
    try:
        q = db.query(IssueSyncLog)
        if status:
            q = q.filter(IssueSyncLog.status == status)
        if start_date:
            q = q.filter(IssueSyncLog.created_at >= start_date)
        if end_date:
            q = q.filter(IssueSyncLog.created_at <= end_date)
        total = q.count()
        items = q.order_by(IssueSyncLog.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return success(data=paginate([_sync_log_to_dict(item) for item in items], page, page_size, total))
    finally:
        db.close()
