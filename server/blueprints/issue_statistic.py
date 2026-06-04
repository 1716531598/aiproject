from flask import Blueprint

from utils.permission import require_permission
from utils.response import success

issue_statistic_bp = Blueprint("issue_statistic", __name__, url_prefix="/api/issue/statistics")


@issue_statistic_bp.route("/overview", methods=["POST"])
@require_permission("issue/stat_view")
def overview():
    return success(data={})
