from datetime import date

from flask import Blueprint, request

from models import IssueAssessment, IssueBug, IssueProduct, IssueVersion
from utils.db import SessionLocal
from utils.permission import require_permission
from utils.response import error, paginate, success

issue_version_bp = Blueprint("issue_version", __name__, url_prefix="/api/issue/versions")


def _parse_date(value):
    if not value:
        return None
    if isinstance(value, date):
        return value
    return date.fromisoformat(value)


def _version_to_dict(db, version):
    item = version.to_dict()
    product = db.query(IssueProduct).filter(IssueProduct.id == version.product_id).first()
    item["product_name"] = product.name if product else ""
    item["bug_count"] = db.query(IssueBug).filter(IssueBug.plan_version_id == version.id).count()
    return item


@issue_version_bp.route("/query", methods=["POST"])
@require_permission("issue/product_manage")
def query():
    data = request.get_json(force=True, silent=True) or {}
    page = data.get("page", 1)
    page_size = data.get("pageSize", 20)
    product_id = data.get("product_id")
    keyword = data.get("sSearch", "")

    db = SessionLocal()
    try:
        q = db.query(IssueVersion)
        if product_id:
            q = q.filter(IssueVersion.product_id == product_id)
        if keyword:
            q = q.filter(IssueVersion.version.ilike(f"%{keyword}%"))
        total = q.count()
        versions = q.order_by(IssueVersion.id).offset((page - 1) * page_size).limit(page_size).all()
        return success(data=paginate([_version_to_dict(db, item) for item in versions], page, page_size, total))
    finally:
        db.close()


@issue_version_bp.route("/add", methods=["POST"])
@require_permission("issue/product_manage")
def add():
    data = request.get_json(force=True, silent=True) or {}
    product_id = data.get("product_id")
    version_no = data.get("version", "").strip()
    if not product_id:
        return error("请选择产品")
    if not version_no:
        return error("版本号不能为空")

    db = SessionLocal()
    try:
        if not db.query(IssueProduct).filter(IssueProduct.id == product_id).first():
            return error("产品不存在")
        exists = (
            db.query(IssueVersion)
            .filter(IssueVersion.product_id == product_id)
            .filter(IssueVersion.version == version_no)
            .first()
        )
        if exists:
            return error("版本号已存在")
        db.add(
            IssueVersion(
                product_id=product_id,
                version=version_no,
                plan_date=_parse_date(data.get("plan_date")),
                status=data.get("status", "规划中"),
            )
        )
        db.commit()
        return success(msg="新增成功")
    finally:
        db.close()


@issue_version_bp.route("/update", methods=["POST"])
@require_permission("issue/product_manage")
def update():
    data = request.get_json(force=True, silent=True) or {}
    version_id = data.get("id")
    if not version_id:
        return error("缺少版本ID")

    db = SessionLocal()
    try:
        version = db.query(IssueVersion).filter(IssueVersion.id == version_id).first()
        if not version:
            return error("版本不存在")
        product_id = data.get("product_id")
        if product_id:
            if not db.query(IssueProduct).filter(IssueProduct.id == product_id).first():
                return error("产品不存在")
            version.product_id = product_id
        if data.get("version"):
            version.version = data["version"].strip()
        if "plan_date" in data:
            version.plan_date = _parse_date(data.get("plan_date"))
        if data.get("status"):
            version.status = data["status"]
        db.commit()
        return success(msg="更新成功")
    finally:
        db.close()


@issue_version_bp.route("/delete", methods=["POST"])
@require_permission("issue/product_manage")
def delete():
    data = request.get_json(force=True, silent=True) or {}
    version_id = data.get("id")
    if not version_id:
        return error("缺少版本ID")

    db = SessionLocal()
    try:
        version = db.query(IssueVersion).filter(IssueVersion.id == version_id).first()
        if not version:
            return error("版本不存在")
        bug_count = db.query(IssueBug).filter(IssueBug.plan_version_id == version.id).count()
        if bug_count > 0:
            return error(f"该版本已关联 {bug_count} 个问题，不允许删除")
        assessment = db.query(IssueAssessment).filter(IssueAssessment.version_id == version.id).first()
        if assessment:
            return error("该版本已配置为考核版本，不允许删除")
        db.delete(version)
        db.commit()
        return success(msg="删除成功")
    finally:
        db.close()


@issue_version_bp.route("/by-product", methods=["POST"])
@require_permission("issue/product_manage")
def by_product():
    data = request.get_json(force=True, silent=True) or {}
    product_id = data.get("product_id")
    if not product_id:
        return success(data=[])

    db = SessionLocal()
    try:
        versions = (
            db.query(IssueVersion)
            .filter(IssueVersion.product_id == product_id)
            .filter(IssueVersion.status.in_(("开发中", "规划中")))
            .order_by(IssueVersion.id)
            .all()
        )
        return success(data=[item.to_dict() for item in versions])
    finally:
        db.close()
