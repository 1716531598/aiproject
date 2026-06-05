from flask import Blueprint, request

from models import IssueBug, IssueModule, IssueProduct, IssueStaff, IssueType, IssueVersion
from utils.db import SessionLocal
from utils.issue_import import import_zentao_csv
from utils.permission import require_permission
from utils.response import error, paginate, success

issue_bug_bp = Blueprint("issue_bug", __name__, url_prefix="/api/issue/bugs")


@issue_bug_bp.route("/query", methods=["POST"])
@require_permission("issue/bug_view")
def query():
    data = request.get_json(force=True, silent=True) or {}
    page = data.get("page", 1)
    page_size = data.get("pageSize", 20)
    sort_field = data.get("sortField") or "created_date"
    sort_order = data.get("sortOrder") or "desc"

    db = SessionLocal()
    try:
        q = db.query(IssueBug)
        if data.get("bug_id"):
            q = q.filter(IssueBug.bug_id == data["bug_id"].strip())
        if data.get("keyword"):
            q = q.filter(IssueBug.title.ilike(f"%{data['keyword'].strip()}%"))
        if data.get("product_id"):
            q = q.filter(IssueBug.product_id == data["product_id"])
        if data.get("severity"):
            q = q.filter(IssueBug.severity == data["severity"])
        if data.get("status"):
            q = q.filter(IssueBug.status == data["status"])
        if data.get("issue_type_id"):
            q = q.filter(IssueBug.issue_type_id == data["issue_type_id"])
        if data.get("module_id"):
            q = q.filter(IssueBug.module_id == data["module_id"])
        if data.get("staff_id"):
            q = q.filter(IssueBug.staff_id == data["staff_id"])

        total = q.count()
        sort_columns = {
            "bug_id": IssueBug.bug_id,
            "severity": IssueBug.severity,
            "status": IssueBug.status,
            "created_date": IssueBug.created_date,
            "updated_at": IssueBug.updated_at,
        }
        sort_column = sort_columns.get(sort_field, IssueBug.created_date)
        q = q.order_by(sort_column.asc() if sort_order == "asc" else sort_column.desc())
        bugs = q.offset((page - 1) * page_size).limit(page_size).all()

        result = []
        for bug in bugs:
            item = bug.to_dict()
            item["product_name"] = ""
            item["module_name"] = ""
            item["staff_name"] = ""
            item["plan_version"] = ""
            item["issue_type_name"] = ""
            if bug.product_id:
                product = db.get(IssueProduct, bug.product_id)
                item["product_name"] = product.name if product else ""
            if bug.module_id:
                module = db.get(IssueModule, bug.module_id)
                item["module_name"] = module.name if module else ""
            if bug.staff_id:
                staff = db.get(IssueStaff, bug.staff_id)
                item["staff_name"] = staff.name if staff else ""
            if bug.plan_version_id:
                version = db.get(IssueVersion, bug.plan_version_id)
                item["plan_version"] = version.version if version else ""
            if bug.issue_type_id:
                issue_type = db.get(IssueType, bug.issue_type_id)
                item["issue_type_name"] = issue_type.name if issue_type else ""
            result.append(item)

        return success(data=paginate(result, page, page_size, total))
    finally:
        db.close()


@issue_bug_bp.route("/import", methods=["POST"])
@require_permission("issue/bug_import")
def import_bugs():
    upload = request.files.get("file")
    if not upload or not upload.filename.lower().endswith(".csv"):
        return error("请上传 CSV 文件")

    db = SessionLocal()
    try:
        result = import_zentao_csv(db, upload.read())
        db.commit()
        return success(data=result, msg="导入完成")
    except ValueError as exc:
        db.rollback()
        return error(str(exc))
    except Exception as exc:
        db.rollback()
        return error(f"导入失败: {exc}")
    finally:
        db.close()
