import json
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from pathlib import Path

from flask import Blueprint, request

from models import IssueAssessment, IssueBug, IssueProduct, IssueSyncLog, IssueType, IssueVersion
from utils.db import SessionLocal
from utils.permission import require_permission
from utils.response import error, paginate, success

issue_admin_bp = Blueprint("issue_admin", __name__, url_prefix="/api/issue/admin")

SERVER_DIR = Path(__file__).resolve().parents[1]
EMAIL_CONFIG_PATH = SERVER_DIR / "issue_email_config.json"
EMAIL_LOG_PATH = SERVER_DIR / "issue_email_logs.json"

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


def _load_json(path, default):
    if not path.exists():
        return default.copy() if isinstance(default, dict) else list(default)
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _save_json(path, data):
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


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
