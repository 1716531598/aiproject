from flask import Blueprint

from utils.permission import require_permission
from utils.response import success

issue_admin_bp = Blueprint("issue_admin", __name__, url_prefix="/api/issue/admin")


@issue_admin_bp.route("/health", methods=["GET"])
@require_permission("issue/product_manage")
def health():
    return success(data={"status": "ok"})
