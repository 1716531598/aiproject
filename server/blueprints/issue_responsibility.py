from flask import Blueprint

from utils.permission import require_permission
from utils.response import success

issue_responsibility_bp = Blueprint(
    "issue_responsibility", __name__, url_prefix="/api/issue/responsibilities"
)


@issue_responsibility_bp.route("/query", methods=["POST"])
@require_permission("issue/resp_assign")
def query():
    return success(data={"items": []})
