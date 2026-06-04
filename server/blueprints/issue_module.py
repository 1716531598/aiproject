from flask import Blueprint, request

from models import IssueBug, IssueModule, IssueProduct
from utils.db import SessionLocal
from utils.permission import require_permission
from utils.response import error, paginate, success

issue_module_bp = Blueprint("issue_module", __name__, url_prefix="/api/issue/modules")


def _module_to_dict(db, module):
    item = module.to_dict()
    product = db.query(IssueProduct).filter(IssueProduct.id == module.product_id).first()
    item["product_name"] = product.name if product else ""
    item["bug_count"] = db.query(IssueBug).filter(IssueBug.module_id == module.id).count()
    return item


@issue_module_bp.route("/query", methods=["POST"])
@require_permission("issue/product_manage")
def query():
    data = request.get_json(force=True, silent=True) or {}
    page = data.get("page", 1)
    page_size = data.get("pageSize", 20)
    product_id = data.get("product_id")
    keyword = data.get("sSearch", "")

    db = SessionLocal()
    try:
        q = db.query(IssueModule)
        if product_id:
            q = q.filter(IssueModule.product_id == product_id)
        if keyword:
            q = q.filter(IssueModule.name.ilike(f"%{keyword}%"))
        total = q.count()
        modules = q.order_by(IssueModule.id).offset((page - 1) * page_size).limit(page_size).all()
        return success(data=paginate([_module_to_dict(db, item) for item in modules], page, page_size, total))
    finally:
        db.close()


@issue_module_bp.route("/add", methods=["POST"])
@require_permission("issue/product_manage")
def add():
    data = request.get_json(force=True, silent=True) or {}
    product_id = data.get("product_id")
    name = data.get("name", "").strip()
    if not product_id:
        return error("请选择产品")
    if not name:
        return error("模块名称不能为空")

    db = SessionLocal()
    try:
        if not db.query(IssueProduct).filter(IssueProduct.id == product_id).first():
            return error("产品不存在")
        exists = (
            db.query(IssueModule)
            .filter(IssueModule.product_id == product_id)
            .filter(IssueModule.name == name)
            .first()
        )
        if exists:
            return error("模块名称已存在")
        db.add(IssueModule(product_id=product_id, name=name))
        db.commit()
        return success(msg="新增成功")
    finally:
        db.close()


@issue_module_bp.route("/update", methods=["POST"])
@require_permission("issue/product_manage")
def update():
    data = request.get_json(force=True, silent=True) or {}
    module_id = data.get("id")
    if not module_id:
        return error("缺少模块ID")

    db = SessionLocal()
    try:
        module = db.query(IssueModule).filter(IssueModule.id == module_id).first()
        if not module:
            return error("模块不存在")
        product_id = data.get("product_id")
        if product_id:
            if not db.query(IssueProduct).filter(IssueProduct.id == product_id).first():
                return error("产品不存在")
            module.product_id = product_id
        name = data.get("name")
        if name:
            module.name = name.strip()
        db.commit()
        return success(msg="更新成功")
    finally:
        db.close()


@issue_module_bp.route("/delete", methods=["POST"])
@require_permission("issue/product_manage")
def delete():
    data = request.get_json(force=True, silent=True) or {}
    module_id = data.get("id")
    if not module_id:
        return error("缺少模块ID")

    db = SessionLocal()
    try:
        module = db.query(IssueModule).filter(IssueModule.id == module_id).first()
        if not module:
            return error("模块不存在")
        bug_count = db.query(IssueBug).filter(IssueBug.module_id == module.id).count()
        if bug_count > 0:
            return error(f"该模块已关联 {bug_count} 个问题，不允许删除")
        db.delete(module)
        db.commit()
        return success(msg="删除成功")
    finally:
        db.close()


@issue_module_bp.route("/by-product", methods=["POST"])
@require_permission("issue/product_manage")
def by_product():
    data = request.get_json(force=True, silent=True) or {}
    product_id = data.get("product_id")
    if not product_id:
        return success(data=[])

    db = SessionLocal()
    try:
        modules = (
            db.query(IssueModule)
            .filter(IssueModule.product_id == product_id)
            .order_by(IssueModule.id)
            .all()
        )
        return success(data=[item.to_dict() for item in modules])
    finally:
        db.close()
