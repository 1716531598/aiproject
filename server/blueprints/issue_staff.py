from flask import Blueprint

from utils.permission import require_permission
from utils.response import success

issue_staff_bp = Blueprint("issue_staff", __name__, url_prefix="/api/issue/staffs")


@issue_staff_bp.route("/query", methods=["POST"])
@require_permission("issue/product_manage")
def query():
    return success(data={"items": []})
