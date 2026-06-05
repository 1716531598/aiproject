import uuid
from datetime import date

from flask import Blueprint, request

from blueprints.auth import get_current_user
from blueprints.issue_admin import notify_with_dedup
from models import (
    IssueBug,
    IssueBugComment,
    IssuePocComment,
    IssuePocProgress,
    IssuePocProject,
    IssueProduct,
    IssueProductMapping,
    IssueStaff,
    IssueTodo,
)
from utils.db import SessionLocal
from utils.issue_poc_import import parse_weekly_report
from utils.permission import require_permission
from utils.response import error, paginate, success

issue_poc_bp = Blueprint("issue_poc", __name__, url_prefix="/api/issue/poc")


@issue_poc_bp.route("/query", methods=["POST"])
@require_permission("issue/bug_view")
def query():
    data = request.get_json(force=True, silent=True) or {}
    page = data.get("page", 1)
    page_size = data.get("pageSize", 20)
    db = SessionLocal()
    try:
        query_obj = db.query(IssuePocProject)
        if data.get("product_id"):
            query_obj = query_obj.filter(IssuePocProject.product_id == data["product_id"])
        if data.get("has_risk") not in (None, ""):
            query_obj = query_obj.filter(IssuePocProject.has_risk == int(data["has_risk"]))
        if data.get("keyword"):
            keyword = f"%{data['keyword'].strip()}%"
            query_obj = query_obj.filter(IssuePocProject.customer_name.ilike(keyword))
        total = query_obj.count()
        projects = query_obj.order_by(IssuePocProject.updated_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return success(data=paginate([_project_to_dict(db, project) for project in projects], page, page_size, total))
    finally:
        db.close()


def _project_to_dict(db, project):
    product = db.get(IssueProduct, project.product_id) if project.product_id else None
    return {
        "id": project.id,
        "project_code": project.project_code,
        "customer_name": project.customer_name,
        "product_id": project.product_id,
        "product_name": product.name if product else "",
        "version": project.version,
        "sales_staff": project.sales_staff,
        "weekly_content": project.weekly_content,
        "risk_desc": project.risk_desc,
        "risk_category": project.risk_category,
        "bug_ids": project.bug_ids,
        "close_party": project.close_party,
        "current_status": project.current_status,
        "source_report": project.source_report,
        "has_risk": project.has_risk,
        "root_cause": project.root_cause,
        "next_step": project.next_step,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "updated_at": project.updated_at.isoformat() if project.updated_at else None,
    }


def _parse_date(value):
    if not value:
        return None
    if isinstance(value, date):
        return value
    return date.fromisoformat(value[:10])


def _split_bug_ids(value):
    return [item.strip() for item in (value or "").replace("，", ",").split(",") if item.strip()]


@issue_poc_bp.route("/detail", methods=["POST"])
@require_permission("issue/bug_view")
def detail():
    data = request.get_json(force=True, silent=True) or {}
    db = SessionLocal()
    try:
        project = db.get(IssuePocProject, data.get("id"))
        if not project:
            return error("项目不存在")
        item = _project_to_dict(db, project)
        bug_ids = _split_bug_ids(project.bug_ids)
        linked_bugs = db.query(IssueBug).filter(IssueBug.bug_id.in_(bug_ids)).all() if bug_ids else []
        item["linked_bugs"] = [
            {"id": bug.id, "bug_id": bug.bug_id, "title": bug.title, "severity": bug.severity, "status": bug.status}
            for bug in linked_bugs
        ]
        progresses = (
            db.query(IssuePocProgress)
            .filter(IssuePocProgress.project_id == project.id)
            .order_by(IssuePocProgress.date.desc(), IssuePocProgress.id.desc())
            .all()
        )
        item["progresses"] = [
            {
                "id": progress.id,
                "date": progress.date.isoformat() if progress.date else None,
                "description": progress.description,
                "status": progress.status,
                "source_report": progress.source_report,
            }
            for progress in progresses
        ]
        todos = db.query(IssueTodo).filter(IssueTodo.project_id == project.id).order_by(IssueTodo.id.desc()).all()
        item["todos"] = [_todo_to_dict(db, todo) for todo in todos]
        comments = db.query(IssuePocComment).filter(IssuePocComment.project_id == project.id).order_by(IssuePocComment.id.desc()).all()
        item["comments"] = [
            {
                "id": comment.id,
                "content": comment.content,
                "commenter": comment.commenter,
                "created_at": comment.created_at.isoformat() if comment.created_at else None,
            }
            for comment in comments
        ]
        return success(data=item)
    finally:
        db.close()


def _todo_to_dict(db, todo):
    staff = db.get(IssueStaff, todo.staff_id) if todo.staff_id else None
    return {
        "id": todo.id,
        "project_id": todo.project_id,
        "content": todo.content,
        "staff_id": todo.staff_id,
        "staff_name": staff.name if staff else "",
        "deadline": todo.deadline.isoformat() if todo.deadline else None,
        "status": todo.status,
        "creator_id": todo.creator_id,
        "created_at": todo.created_at.isoformat() if todo.created_at else None,
    }


@issue_poc_bp.route("/update", methods=["POST"])
@require_permission("issue/bug_edit")
def update():
    data = request.get_json(force=True, silent=True) or {}
    db = SessionLocal()
    try:
        project = db.get(IssuePocProject, data.get("id"))
        if not project:
            return error("项目不存在")
        for field in ("has_risk", "root_cause", "next_step", "risk_desc", "risk_category", "close_party", "current_status"):
            if field in data:
                setattr(project, field, data.get(field))
        db.commit()
        return success(msg="保存成功")
    finally:
        db.close()


@issue_poc_bp.route("/link-bug", methods=["POST"])
@require_permission("issue/bug_edit")
def link_bug():
    data = request.get_json(force=True, silent=True) or {}
    db = SessionLocal()
    try:
        project = db.get(IssuePocProject, data.get("project_id"))
        if not project:
            return error("项目不存在")
        bug_id = (data.get("bug_id") or "").strip()
        if bug_id and not db.query(IssueBug).filter(IssueBug.bug_id == bug_id).first():
            return error("Bug 不存在")
        bug_ids = _split_bug_ids(project.bug_ids)
        if data.get("action", "add") == "remove":
            bug_ids = [item for item in bug_ids if item != bug_id]
        elif bug_id and bug_id not in bug_ids:
            bug_ids.append(bug_id)
        project.bug_ids = ",".join(bug_ids)
        db.commit()
        return success(msg="关联更新成功")
    finally:
        db.close()


@issue_poc_bp.route("/manual-add", methods=["POST"])
@require_permission("issue/bug_edit")
def manual_add():
    data = request.get_json(force=True, silent=True) or {}
    db = SessionLocal()
    try:
        project = IssuePocProject(
            project_code=data.get("project_code") or f"MANUAL-{uuid.uuid4().hex[:8]}",
            customer_name=data.get("customer_name", ""),
            product_id=data.get("product_id"),
            version=data.get("version", ""),
            sales_staff=data.get("sales_staff", ""),
            weekly_content=data.get("weekly_content", ""),
            risk_desc=data.get("risk_desc", ""),
            risk_category=data.get("risk_category", ""),
            bug_ids=data.get("bug_ids", ""),
            close_party=data.get("close_party", ""),
            current_status=data.get("current_status", ""),
            has_risk=1 if data.get("risk_desc") or data.get("has_risk") else 0,
            source_report="手动录入",
        )
        db.add(project)
        db.commit()
        return success(data={"id": project.id}, msg="新增成功")
    finally:
        db.close()


@issue_poc_bp.route("/progress/add", methods=["POST"])
@require_permission("issue/bug_edit")
def add_progress():
    data = request.get_json(force=True, silent=True) or {}
    if not data.get("project_id") or not data.get("description"):
        return error("请填写进展内容")
    db = SessionLocal()
    try:
        if not db.get(IssuePocProject, data.get("project_id")):
            return error("项目不存在")
        db.add(
            IssuePocProgress(
                project_id=data["project_id"],
                date=_parse_date(data.get("date")) or date.today(),
                description=data.get("description", ""),
                status=data.get("status", ""),
                source_report="手动录入",
            )
        )
        db.commit()
        return success(msg="进展记录添加成功")
    finally:
        db.close()


@issue_poc_bp.route("/todo/add", methods=["POST"])
@require_permission("issue/bug_edit")
def add_todo():
    session = get_current_user() or {}
    data = request.get_json(force=True, silent=True) or {}
    if not data.get("content") or not data.get("staff_id"):
        return error("请填写待办内容和责任人")
    db = SessionLocal()
    try:
        todo = IssueTodo(
            project_id=data.get("project_id"),
            content=data["content"],
            staff_id=data["staff_id"],
            deadline=_parse_date(data.get("deadline")),
            status="待处理",
            creator_id=session.get("id") or session.get("userid"),
        )
        db.add(todo)
        db.commit()
        staff = db.get(IssueStaff, todo.staff_id)
        if staff and staff.email:
            notify_with_dedup("todo", str(todo.id), staff.email, "TODO 待办通知", todo.content)
        return success(msg="待办任务创建成功")
    finally:
        db.close()


@issue_poc_bp.route("/todo/update-status", methods=["POST"])
@require_permission("issue/bug_edit")
def update_todo_status():
    data = request.get_json(force=True, silent=True) or {}
    db = SessionLocal()
    try:
        todo = db.get(IssueTodo, data.get("id"))
        if not todo:
            return error("待办不存在")
        todo.status = data.get("status", todo.status)
        db.commit()
        return success(msg="状态更新成功")
    finally:
        db.close()


@issue_poc_bp.route("/todo/query-all", methods=["POST"])
@require_permission("issue/todo_manage")
def query_all_todos():
    data = request.get_json(force=True, silent=True) or {}
    page = data.get("page", 1)
    page_size = data.get("pageSize", 20)
    sort_field = data.get("sortField") or "deadline"
    sort_order = data.get("sortOrder") or "asc"

    db = SessionLocal()
    try:
        query_obj = db.query(IssueTodo)
        if data.get("status"):
            query_obj = query_obj.filter(IssueTodo.status == data["status"])
        if data.get("staff_id"):
            query_obj = query_obj.filter(IssueTodo.staff_id == data["staff_id"])
        sort_columns = {"deadline": IssueTodo.deadline, "created_at": IssueTodo.created_at}
        sort_column = sort_columns.get(sort_field, IssueTodo.deadline)
        query_obj = query_obj.order_by(sort_column.desc() if sort_order == "desc" else sort_column.asc())
        total = query_obj.count()
        todos = query_obj.offset((page - 1) * page_size).limit(page_size).all()
        result = []
        for todo in todos:
            item = _todo_to_dict(db, todo)
            project = db.get(IssuePocProject, todo.project_id) if todo.project_id else None
            item["project_code"] = project.project_code if project else ""
            item["customer_name"] = project.customer_name if project else ""
            result.append(item)
        return success(data=paginate(result, page, page_size, total))
    finally:
        db.close()


@issue_poc_bp.route("/todo/update", methods=["POST"])
@require_permission("issue/todo_manage")
def update_todo():
    data = request.get_json(force=True, silent=True) or {}
    db = SessionLocal()
    try:
        todo = db.get(IssueTodo, data.get("id"))
        if not todo:
            return error("待办不存在")
        for field in ("content", "staff_id", "status"):
            if field in data:
                setattr(todo, field, data.get(field))
        if "deadline" in data:
            todo.deadline = _parse_date(data.get("deadline"))
        db.commit()
        return success(msg="待办更新成功")
    finally:
        db.close()


@issue_poc_bp.route("/todo/delete", methods=["POST"])
@require_permission("issue/todo_manage")
def delete_todo():
    data = request.get_json(force=True, silent=True) or {}
    db = SessionLocal()
    try:
        todo = db.get(IssueTodo, data.get("id"))
        if not todo:
            return error("待办不存在")
        db.delete(todo)
        db.commit()
        return success(msg="待办删除成功")
    finally:
        db.close()


@issue_poc_bp.route("/comment/add", methods=["POST"])
@require_permission("issue/bug_edit")
def add_comment():
    session = get_current_user() or {}
    data = request.get_json(force=True, silent=True) or {}
    content = (data.get("content") or "").strip()
    if not data.get("project_id") or not content:
        return error("评论内容不能为空")
    db = SessionLocal()
    try:
        if not db.get(IssuePocProject, data.get("project_id")):
            return error("项目不存在")
        db.add(
            IssuePocComment(
                project_id=data["project_id"],
                content=content,
                commenter=session.get("name", ""),
            )
        )
        db.commit()
        return success(msg="评论添加成功")
    finally:
        db.close()


def _apply_project_fields(project, data, product_id, source_report):
    project.customer_name = data.get("customer_name", "")
    project.product_id = product_id
    project.version = data.get("version", "")
    project.sales_staff = data.get("sales_staff", "")
    project.weekly_content = data.get("weekly_content", "")
    project.risk_desc = data.get("risk_desc", "")
    project.risk_category = data.get("risk_category", "")
    project.bug_ids = data.get("bug_ids", "")
    project.close_party = data.get("close_party", "")
    project.current_status = data.get("current_status", "")
    project.has_risk = data.get("has_risk", 0)
    project.source_report = source_report


@issue_poc_bp.route("/import", methods=["POST"])
@require_permission("issue/poc_import")
def import_poc():
    upload = request.files.get("file")
    if not upload:
        return error("请上传文件")

    try:
        projects, quality_comments, errors = parse_weekly_report(upload.read())
    except Exception as exc:
        return error(f"周报解析失败: {exc}")

    db = SessionLocal()
    try:
        mappings = db.query(IssueProductMapping).filter(IssueProductMapping.source_type == "weekly").all()
        weekly_map = {mapping.source_name: mapping.product_id for mapping in mappings}
        source_report = upload.filename
        new_count = 0
        update_count = 0
        comment_count = 0

        for item in projects:
            project_code = item.get("project_code", "").strip() or f"MANUAL-{uuid.uuid4().hex[:8]}"
            product_id = weekly_map.get(item.get("product_raw", ""))
            project = db.query(IssuePocProject).filter(IssuePocProject.project_code == project_code).first()
            if project:
                if project.weekly_content:
                    db.add(
                        IssuePocProgress(
                            project_id=project.id,
                            date=date.today(),
                            description=project.weekly_content,
                            status=project.current_status,
                            source_report=project.source_report,
                        )
                    )
                _apply_project_fields(project, item, product_id, source_report)
                update_count += 1
            else:
                project = IssuePocProject(project_code=project_code)
                _apply_project_fields(project, item, product_id, source_report)
                db.add(project)
                new_count += 1

        for comment in quality_comments:
            bug_id = comment.get("bug_id", "").strip()
            comment_text = comment.get("comment_text", "").strip()
            if not bug_id or not comment_text:
                continue
            bug = db.query(IssueBug).filter(IssueBug.bug_id == bug_id).first()
            if not bug:
                continue
            content = f"[周报提取] {comment_text}"
            exists = (
                db.query(IssueBugComment)
                .filter(IssueBugComment.bug_id == bug.id)
                .filter(IssueBugComment.content == content)
                .filter(IssueBugComment.source == "周报提取")
                .first()
            )
            if not exists:
                db.add(IssueBugComment(bug_id=bug.id, content=content, commenter="", source="周报提取"))
                comment_count += 1

        db.commit()
        return success(
            data={
                "new_count": new_count,
                "update_count": update_count,
                "comment_count": comment_count,
                "errors": errors,
            },
            msg="导入完成",
        )
    except Exception as exc:
        db.rollback()
        return error(f"导入失败: {exc}")
    finally:
        db.close()
