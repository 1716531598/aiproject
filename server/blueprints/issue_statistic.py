from datetime import datetime

from flask import Blueprint, request

from blueprints.auth import get_current_user
from models import IssueBug, IssueResponsibility, IssueStaff, IssueTodo
from utils.db import SessionLocal
from utils.permission import require_permission
from utils.response import success

issue_statistic_bp = Blueprint("issue_statistic", __name__, url_prefix="/api/issue/statistics")

SEVERITY_SCORE = {1: 0.1, 2: 0.05, 3: 0.02, 4: 0}


@issue_statistic_bp.route("/overview", methods=["POST"])
@require_permission("issue/stat_view")
def overview():
    return success(data={})


@issue_statistic_bp.route("/my-summary", methods=["POST"])
@require_permission("issue/bug_view")
def my_summary():
    data = request.get_json(force=True, silent=True) or {}
    year = data.get("year") or datetime.now().year
    session = get_current_user() or {}
    user_id = session.get("id") or session.get("userid")

    db = SessionLocal()
    try:
        staff = db.query(IssueStaff).filter(IssueStaff.user_id == user_id).first() if user_id else None
        if not staff:
            return success(data={"bugs": [], "todos": [], "score": {"total": 0, "bug_count": 0}, "bug_stats": {"total": 0, "resolved": 0, "pending": 0}})

        active_bugs = (
            db.query(IssueBug)
            .filter(IssueBug.staff_id == staff.id, IssueBug.status == "激活")
            .order_by(IssueBug.created_date.desc())
            .limit(20)
            .all()
        )
        all_bugs = db.query(IssueBug).filter(IssueBug.staff_id == staff.id).all()
        bug_stats = {
            "total": len(all_bugs),
            "resolved": len([bug for bug in all_bugs if bug.status in ("已解决", "已关闭")]),
            "pending": len([bug for bug in all_bugs if bug.status == "激活"]),
        }

        todos = (
            db.query(IssueTodo)
            .filter(IssueTodo.staff_id == staff.id, IssueTodo.status != "已完成")
            .order_by(IssueTodo.deadline.asc())
            .limit(20)
            .all()
        )
        records = (
            db.query(IssueResponsibility)
            .filter(IssueResponsibility.staff_id == staff.id, IssueResponsibility.year == year)
            .all()
        )
        total_score = 0
        for record in records:
            bug = db.get(IssueBug, record.bug_id)
            total_score += SEVERITY_SCORE.get(bug.severity, 0) * record.ratio if bug else 0

        return success(
            data={
                "bugs": [bug.to_dict() for bug in active_bugs],
                "bug_stats": bug_stats,
                "todos": [
                    {
                        "id": todo.id,
                        "content": todo.content,
                        "deadline": todo.deadline.isoformat() if todo.deadline else None,
                        "status": todo.status,
                        "project_id": todo.project_id,
                    }
                    for todo in todos
                ],
                "score": {"total": min(round(total_score, 4), 0.3), "bug_count": len(records)},
            }
        )
    finally:
        db.close()


@issue_statistic_bp.route("/score-ranking", methods=["POST"])
@require_permission("issue/bug_view")
def score_ranking():
    data = request.get_json(force=True, silent=True) or {}
    year = data.get("year") or datetime.now().year

    db = SessionLocal()
    try:
        staff_scores = {}
        records = db.query(IssueResponsibility).filter(IssueResponsibility.year == year).all()
        for record in records:
            bug = db.get(IssueBug, record.bug_id)
            score = SEVERITY_SCORE.get(bug.severity, 0) * record.ratio if bug else 0
            staff_scores.setdefault(record.staff_id, 0)
            staff_scores[record.staff_id] += score

        result = []
        for staff_id, score in sorted(staff_scores.items(), key=lambda item: item[1], reverse=True)[:10]:
            staff = db.get(IssueStaff, staff_id)
            result.append({"staff_id": staff_id, "staff_name": staff.name if staff else "", "total_score": min(round(score, 4), 0.3)})
        return success(data=result)
    finally:
        db.close()
