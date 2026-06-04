from flask import Blueprint

from utils.permission import require_permission
from utils.response import success

issue_bug_bp = Blueprint("issue_bug", __name__, url_prefix="/api/issue/bugs")


@issue_bug_bp.route("/query", methods=["POST"])
@require_permission("issue/bug_view")
def query():
    return success(data={"items": []})
