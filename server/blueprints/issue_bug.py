from flask import Blueprint, request

from utils.db import SessionLocal
from utils.issue_import import import_zentao_csv
from utils.permission import require_permission
from utils.response import error, success

issue_bug_bp = Blueprint("issue_bug", __name__, url_prefix="/api/issue/bugs")


@issue_bug_bp.route("/query", methods=["POST"])
@require_permission("issue/bug_view")
def query():
    return success(data={"items": []})


@issue_bug_bp.route("/import", methods=["POST"])
@require_permission("issue/bug_import")
def import_bugs():
    upload = request.files.get("file")
    if not upload or not upload.filename.lower().endswith(".csv"):
        return error("请上传 CSV 文件")

    db = SessionLocal()
    try:
        result = import_zentao_csv(db, upload.read())
        db.commit()
        return success(data=result, msg="导入完成")
    except ValueError as exc:
        db.rollback()
        return error(str(exc))
    except Exception as exc:
        db.rollback()
        return error(f"导入失败: {exc}")
    finally:
        db.close()
