from flask import Blueprint, request
from datetime import datetime, timedelta
from models import AuditLog
from utils.db import SessionLocal
from utils.response import success, error, paginate
from blueprints.auth import get_current_user

audit_log_bp = Blueprint("audit_log", __name__, url_prefix="/api/v1/audit-logs")


@audit_log_bp.route("/query", methods=["POST"])
def query_audit_logs():
    session = get_current_user()
    if not session:
        return error("未登录", code=401)

    data = request.get_json(force=True, silent=True) or {}
    page = data.get("page", 1)
    page_size = data.get("pageSize", 10)
    adminname = data.get("adminname", "")
    log_type = data.get("type", "")
    ip = data.get("ip", "")
    msg = data.get("msg", "")
    createtime = data.get("createtime", "")
    result = data.get("result", "")
    resource = data.get("resource", "")

    db = SessionLocal()
    try:
        q = db.query(AuditLog)
        if adminname:
            q = q.filter(AuditLog.adminname.ilike(f"%{adminname}%"))
        if log_type:
            q = q.filter(AuditLog.type == log_type)
        if ip:
            q = q.filter(AuditLog.ip.ilike(f"%{ip}%"))
        if msg:
            q = q.filter(AuditLog.msg.ilike(f"%{msg}%"))
        if result:
            q = q.filter(AuditLog.result == result)
        if resource:
            q = q.filter(AuditLog.resource.ilike(f"%{resource}%"))
        if createtime:
            if isinstance(createtime, str) and "~" in createtime:
                start, end = createtime.split("~")
                if start.strip():
                    q = q.filter(AuditLog.created_at >= start.strip())
                if end.strip():
                    end_date = datetime.strptime(end.strip(), "%Y-%m-%d") + timedelta(days=1)
                    q = q.filter(AuditLog.created_at < end_date)

        total = q.count()
        logs = q.order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        aa_data = [log.to_dict() for log in logs]
        return success(paginate(aa_data, page, page_size, total))
    finally:
        db.close()
