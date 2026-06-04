from flask import Blueprint, request

from models import IssueBug, IssueProduct, IssueProductMapping
from utils.db import SessionLocal
from utils.permission import require_permission
from utils.response import error, paginate, success

issue_product_bp = Blueprint("issue_product", __name__, url_prefix="/api/issue/products")


@issue_product_bp.route("/query", methods=["POST"])
@require_permission("issue/product_manage")
def query():
    data = request.get_json(force=True, silent=True) or {}
    page = data.get("page", 1)
    page_size = data.get("pageSize", 20)
    keyword = data.get("sSearch", "")

    db = SessionLocal()
    try:
        q = db.query(IssueProduct)
        if keyword:
            q = q.filter(IssueProduct.name.ilike(f"%{keyword}%"))
        total = q.count()
        products = q.order_by(IssueProduct.id).offset((page - 1) * page_size).limit(page_size).all()

        result = []
        for product in products:
            item = product.to_dict()
            item["bug_count"] = db.query(IssueBug).filter(IssueBug.product_id == product.id).count()
            item["mappings"] = [
                {
                    "id": mapping.id,
                    "source_type": mapping.source_type,
                    "source_name": mapping.source_name,
                }
                for mapping in db.query(IssueProductMapping)
                .filter(IssueProductMapping.product_id == product.id)
                .order_by(IssueProductMapping.id)
                .all()
            ]
            result.append(item)
        return success(data=paginate(result, page, page_size, total))
    finally:
        db.close()


@issue_product_bp.route("/add", methods=["POST"])
@require_permission("issue/product_manage")
def add():
    data = request.get_json(force=True, silent=True) or {}
    name = data.get("name", "").strip()
    if not name:
        return error("产品名称不能为空")

    db = SessionLocal()
    try:
        if db.query(IssueProduct).filter(IssueProduct.name == name).first():
            return error("产品名称已存在")
        product = IssueProduct(name=name, description=data.get("description", ""))
        db.add(product)
        db.commit()
        return success(msg="新增成功")
    finally:
        db.close()


@issue_product_bp.route("/update", methods=["POST"])
@require_permission("issue/product_manage")
def update():
    data = request.get_json(force=True, silent=True) or {}
    product_id = data.get("id")
    if not product_id:
        return error("缺少产品ID")

    db = SessionLocal()
    try:
        product = db.query(IssueProduct).filter(IssueProduct.id == product_id).first()
        if not product:
            return error("产品不存在")
        name = data.get("name")
        if name:
            product.name = name.strip()
        product.description = data.get("description", product.description)
        db.commit()
        return success(msg="更新成功")
    finally:
        db.close()


@issue_product_bp.route("/delete", methods=["POST"])
@require_permission("issue/product_manage")
def delete():
    data = request.get_json(force=True, silent=True) or {}
    product_id = data.get("id")
    if not product_id:
        return error("缺少产品ID")

    db = SessionLocal()
    try:
        product = db.query(IssueProduct).filter(IssueProduct.id == product_id).first()
        if not product:
            return error("产品不存在")

        bug_count = db.query(IssueBug).filter(IssueBug.product_id == product.id).count()
        if bug_count > 0:
            return error(f"该产品已关联 {bug_count} 个问题，不允许删除")

        db.query(IssueProductMapping).filter(IssueProductMapping.product_id == product.id).delete()
        db.delete(product)
        db.commit()
        return success(msg="删除成功")
    finally:
        db.close()


@issue_product_bp.route("/mapping/update", methods=["POST"])
@require_permission("issue/product_manage")
def update_mapping():
    data = request.get_json(force=True, silent=True) or {}
    product_id = data.get("product_id")
    mappings = data.get("mappings", [])
    if not product_id:
        return error("缺少产品ID")

    db = SessionLocal()
    try:
        product = db.query(IssueProduct).filter(IssueProduct.id == product_id).first()
        if not product:
            return error("产品不存在")

        db.query(IssueProductMapping).filter(IssueProductMapping.product_id == product_id).delete()
        for mapping in mappings:
            source_type = mapping.get("source_type")
            source_name = mapping.get("source_name")
            if source_type and source_name:
                db.add(
                    IssueProductMapping(
                        product_id=product_id,
                        source_type=source_type,
                        source_name=source_name,
                    )
                )
        db.commit()
        return success(msg="映射规则更新成功")
    finally:
        db.close()
