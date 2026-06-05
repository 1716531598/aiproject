import uuid
from datetime import date

from flask import Blueprint, request

from models import IssueBug, IssueBugComment, IssuePocProgress, IssuePocProject, IssueProductMapping
from utils.db import SessionLocal
from utils.issue_poc_import import parse_weekly_report
from utils.permission import require_permission
from utils.response import error, success

issue_poc_bp = Blueprint("issue_poc", __name__, url_prefix="/api/issue/poc")


@issue_poc_bp.route("/query", methods=["POST"])
@require_permission("issue/bug_view")
def query():
    return success(data={"items": []})


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
