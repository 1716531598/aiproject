from flask import Blueprint

from utils.permission import require_permission
from utils.response import success

issue_product_bp = Blueprint("issue_product", __name__, url_prefix="/api/issue/products")


@issue_product_bp.route("/query", methods=["POST"])
@require_permission("issue/product_manage")
def query():
    return success(data={"items": []})
