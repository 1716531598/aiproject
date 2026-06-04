from flask import Blueprint

from utils.permission import require_permission
from utils.response import success

issue_poc_bp = Blueprint("issue_poc", __name__, url_prefix="/api/issue/poc")


@issue_poc_bp.route("/query", methods=["POST"])
@require_permission("issue/bug_view")
def query():
    return success(data={"items": []})
