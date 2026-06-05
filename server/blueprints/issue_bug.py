from datetime import datetime
from urllib.parse import quote

from flask import Blueprint, Response, request

from blueprints.auth import get_current_user
from models import (
    IssueBug,
    IssueBugComment,
    IssueBugHistory,
    IssueModule,
    IssueProduct,
    IssueStaff,
    IssueType,
    IssueVersion,
)
from utils.db import SessionLocal
from utils.issue_export import export_bugs_to_excel
from utils.issue_import import import_zentao_csv
from utils.permission import require_permission
from utils.response import error, paginate, success

issue_bug_bp = Blueprint("issue_bug", __name__, url_prefix="/api/issue/bugs")


def _comment_to_dict(comment):
    return {
        "id": comment.id,
        "content": comment.content,
        "commenter": comment.commenter,
        "source": comment.source,
        "created_at": comment.created_at.isoformat() if comment.created_at else None,
    }


def _history_to_dict(history_record):
    return {
        "id": history_record.id,
        "field_name": history_record.field_name,
        "old_value": history_record.old_value,
        "new_value": history_record.new_value,
        "operator": history_record.operator,
        "created_at": history_record.created_at.isoformat() if history_record.created_at else None,
    }


def _bug_to_dict_with_names(db, bug):
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
    return item


def _apply_bug_filters(query, data):
    if data.get("bug_id"):
        query = query.filter(IssueBug.bug_id == data["bug_id"].strip())
    if data.get("keyword"):
        query = query.filter(IssueBug.title.ilike(f"%{data['keyword'].strip()}%"))
    if data.get("product_id"):
        query = query.filter(IssueBug.product_id == data["product_id"])
    if data.get("severity"):
        query = query.filter(IssueBug.severity == data["severity"])
    if data.get("status"):
        query = query.filter(IssueBug.status == data["status"])
    if data.get("issue_type_id"):
        query = query.filter(IssueBug.issue_type_id == data["issue_type_id"])
    if data.get("module_id"):
        query = query.filter(IssueBug.module_id == data["module_id"])
    if data.get("staff_id"):
        query = query.filter(IssueBug.staff_id == data["staff_id"])
    return query


def _apply_bug_sort(query, sort_field, sort_order):
    sort_columns = {
        "bug_id": IssueBug.bug_id,
        "severity": IssueBug.severity,
        "status": IssueBug.status,
        "created_date": IssueBug.created_date,
        "updated_at": IssueBug.updated_at,
    }
    sort_column = sort_columns.get(sort_field, IssueBug.created_date)
    return query.order_by(sort_column.asc() if sort_order == "asc" else sort_column.desc())


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
        q = _apply_bug_filters(db.query(IssueBug), data)
        total = q.count()
        q = _apply_bug_sort(q, sort_field, sort_order)
        bugs = q.offset((page - 1) * page_size).limit(page_size).all()

        result = [_bug_to_dict_with_names(db, bug) for bug in bugs]

        return success(data=paginate(result, page, page_size, total))
    finally:
        db.close()


@issue_bug_bp.route("/batch-assign", methods=["POST"])
@require_permission("issue/bug_import")
def batch_assign():
    data = request.get_json(force=True, silent=True) or {}
    bug_ids = data.get("ids", [])
    staff_id = data.get("staff_id")
    if not bug_ids or not staff_id:
        return error("请选择 Bug 和解决人员")

    db = SessionLocal()
    try:
        staff = db.query(IssueStaff).filter(IssueStaff.id == staff_id, IssueStaff.status == "启用").first()
        if not staff:
            return error("解决人员不存在或已禁用")
        now = datetime.now()
        updated = 0
        bugs = db.query(IssueBug).filter(IssueBug.id.in_(bug_ids)).all()
        for bug in bugs:
            bug.staff_id = staff_id
            bug.assign_time = now
            updated += 1
        db.commit()
        return success(msg=f"成功指派 {updated} 个问题")
    finally:
        db.close()


@issue_bug_bp.route("/export", methods=["POST"])
@require_permission("issue/bug_export")
def export_bugs():
    data = request.get_json(force=True, silent=True) or {}
    sort_field = data.get("sortField") or "created_date"
    sort_order = data.get("sortOrder") or "desc"
    columns = data.get("columns")

    db = SessionLocal()
    try:
        q = _apply_bug_filters(db.query(IssueBug), data)
        q = _apply_bug_sort(q, sort_field, sort_order)
        bugs = q.limit(10000).all()
        excel_bytes = export_bugs_to_excel([_bug_to_dict_with_names(db, bug) for bug in bugs], columns)
    finally:
        db.close()

    filename = "网上问题报表.xlsx"
    quoted_filename = quote(filename)
    return Response(
        excel_bytes,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quoted_filename}"},
    )


@issue_bug_bp.route("/detail", methods=["POST"])
@require_permission("issue/bug_view")
def detail():
    data = request.get_json(force=True, silent=True) or {}
    db = SessionLocal()
    try:
        bug = db.query(IssueBug).filter(IssueBug.id == data.get("id")).first()
        if not bug:
            return error("问题不存在")
        item = _bug_to_dict_with_names(db, bug)
        comments = (
            db.query(IssueBugComment)
            .filter(IssueBugComment.bug_id == bug.id)
            .order_by(IssueBugComment.created_at.desc())
            .all()
        )
        item["comments"] = [_comment_to_dict(comment) for comment in comments]
        return success(data=item)
    finally:
        db.close()


@issue_bug_bp.route("/update-ext", methods=["POST"])
@require_permission("issue/bug_edit")
def update_ext():
    data = request.get_json(force=True, silent=True) or {}
    db = SessionLocal()
    try:
        bug = db.query(IssueBug).filter(IssueBug.id == data.get("id")).first()
        if not bug:
            return error("问题不存在")

        client_updated = data.get("updated_at")
        if client_updated and bug.updated_at and str(client_updated)[:19] != bug.updated_at.isoformat()[:19]:
            return error("该问题已被他人修改，请刷新后重新编辑", code=409)

        current_user = get_current_user()
        operator = current_user.get("name", "") if current_user else ""
        text_fields = {
            "affect_version": "影响版本",
            "root_cause": "根因分析",
            "impact_scope": "影响范围",
            "escape_analysis": "逃逸分析",
            "remark": "备注",
        }
        fk_fields = {
            "module_id": "问题模块",
            "plan_version_id": "计划解决版本",
            "issue_type_id": "问题类型",
            "staff_id": "解决人员",
        }

        for field, label in text_fields.items():
            if field in data:
                old_value = getattr(bug, field) or ""
                new_value = data.get(field) or ""
                if str(old_value) != str(new_value):
                    db.add(IssueBugHistory(bug_id=bug.id, field_name=label, old_value=str(old_value), new_value=str(new_value), operator=operator))
                    setattr(bug, field, new_value)

        for field, label in fk_fields.items():
            if field in data:
                old_value = getattr(bug, field) or ""
                new_value = data.get(field) or ""
                if str(old_value) != str(new_value):
                    db.add(IssueBugHistory(bug_id=bug.id, field_name=label, old_value=str(old_value), new_value=str(new_value), operator=operator))
                    setattr(bug, field, new_value if new_value else None)

        if "staff_id" in data and data.get("staff_id") and not bug.assign_time:
            bug.assign_time = datetime.now()

        db.commit()
        return success(msg="保存成功")
    finally:
        db.close()


@issue_bug_bp.route("/comment/add", methods=["POST"])
@require_permission("issue/bug_edit")
def add_comment():
    data = request.get_json(force=True, silent=True) or {}
    content = (data.get("content") or "").strip()
    if not data.get("bug_id") or not content:
        return error("评论内容不能为空")

    current_user = get_current_user()
    db = SessionLocal()
    try:
        bug = db.query(IssueBug).filter(IssueBug.id == data.get("bug_id")).first()
        if not bug:
            return error("问题不存在")
        db.add(
            IssueBugComment(
                bug_id=bug.id,
                content=content,
                commenter=current_user.get("name", "") if current_user else "",
                source="手动评论",
            )
        )
        db.commit()
        return success(msg="评论添加成功")
    finally:
        db.close()


@issue_bug_bp.route("/comment/list", methods=["POST"])
@require_permission("issue/bug_view")
def list_comments():
    data = request.get_json(force=True, silent=True) or {}
    page = data.get("page", 1)
    page_size = data.get("pageSize", 20)
    db = SessionLocal()
    try:
        q = db.query(IssueBugComment).filter(IssueBugComment.bug_id == data.get("bug_id"))
        total = q.count()
        comments = q.order_by(IssueBugComment.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return success(data=paginate([_comment_to_dict(comment) for comment in comments], page, page_size, total))
    finally:
        db.close()


@issue_bug_bp.route("/history", methods=["POST"])
@require_permission("issue/bug_view")
def history():
    data = request.get_json(force=True, silent=True) or {}
    db = SessionLocal()
    try:
        records = (
            db.query(IssueBugHistory)
            .filter(IssueBugHistory.bug_id == data.get("bug_id"))
            .order_by(IssueBugHistory.created_at.desc())
            .limit(100)
            .all()
        )
        return success(data=[_history_to_dict(record) for record in records])
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
