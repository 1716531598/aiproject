from flask import Blueprint, request

from models import IssueStaff, User
from utils.db import SessionLocal
from utils.permission import require_permission
from utils.response import error, paginate, success

issue_staff_bp = Blueprint("issue_staff", __name__, url_prefix="/api/issue/staffs")


def _staff_to_dict(db, staff):
    item = staff.to_dict()
    user = db.query(User).filter(User.id == staff.user_id).first() if staff.user_id else None
    item["user_name"] = user.name if user else ""
    return item


@issue_staff_bp.route("/query", methods=["POST"])
@require_permission("issue/product_manage")
def query():
    data = request.get_json(force=True, silent=True) or {}
    page = data.get("page", 1)
    page_size = data.get("pageSize", 20)
    keyword = data.get("sSearch", "")
    department = data.get("department")
    status = data.get("status")

    db = SessionLocal()
    try:
        q = db.query(IssueStaff)
        if keyword:
            q = q.filter(IssueStaff.name.ilike(f"%{keyword}%"))
        if department:
            q = q.filter(IssueStaff.department == department)
        if status:
            q = q.filter(IssueStaff.status == status)
        total = q.count()
        staffs = q.order_by(IssueStaff.id).offset((page - 1) * page_size).limit(page_size).all()
        return success(data=paginate([_staff_to_dict(db, item) for item in staffs], page, page_size, total))
    finally:
        db.close()


@issue_staff_bp.route("/add", methods=["POST"])
@require_permission("issue/product_manage")
def add():
    data = request.get_json(force=True, silent=True) or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    if not name:
        return error("姓名不能为空")
    if not email:
        return error("邮箱不能为空")

    db = SessionLocal()
    try:
        if db.query(IssueStaff).filter(IssueStaff.email == email).first():
            return error("邮箱已存在")
        user_id = data.get("user_id")
        if user_id and not db.query(User).filter(User.id == user_id).first():
            return error("关联账号不存在")
        db.add(
            IssueStaff(
                name=name,
                department=data.get("department", ""),
                job_role=data.get("job_role", ""),
                email=email,
                phone=data.get("phone", ""),
                user_id=user_id,
                status=data.get("status", "启用"),
            )
        )
        db.commit()
        return success(msg="新增成功")
    finally:
        db.close()


@issue_staff_bp.route("/update", methods=["POST"])
@require_permission("issue/product_manage")
def update():
    data = request.get_json(force=True, silent=True) or {}
    staff_id = data.get("id")
    if not staff_id:
        return error("缺少人员ID")

    db = SessionLocal()
    try:
        staff = db.query(IssueStaff).filter(IssueStaff.id == staff_id).first()
        if not staff:
            return error("人员档案不存在")
        email = data.get("email")
        if email and email != staff.email:
            exists = db.query(IssueStaff).filter(IssueStaff.email == email).first()
            if exists:
                return error("邮箱已存在")
            staff.email = email.strip()
        user_id = data.get("user_id")
        if user_id and not db.query(User).filter(User.id == user_id).first():
            return error("关联账号不存在")

        if data.get("name"):
            staff.name = data["name"].strip()
        if "department" in data:
            staff.department = data.get("department", "")
        if "job_role" in data:
            staff.job_role = data.get("job_role", "")
        if "phone" in data:
            staff.phone = data.get("phone", "")
        if "user_id" in data:
            staff.user_id = user_id
        if data.get("status"):
            staff.status = data["status"]
        db.commit()
        return success(msg="更新成功")
    finally:
        db.close()


@issue_staff_bp.route("/delete", methods=["POST"])
@require_permission("issue/product_manage")
def delete():
    data = request.get_json(force=True, silent=True) or {}
    staff_id = data.get("id")
    if not staff_id:
        return error("缺少人员ID")

    db = SessionLocal()
    try:
        staff = db.query(IssueStaff).filter(IssueStaff.id == staff_id).first()
        if not staff:
            return error("人员档案不存在")
        staff.status = "禁用"
        db.commit()
        return success(msg="禁用成功")
    finally:
        db.close()


@issue_staff_bp.route("/all-active", methods=["GET"])
@require_permission("issue/product_manage")
def all_active():
    db = SessionLocal()
    try:
        staffs = db.query(IssueStaff).filter(IssueStaff.status == "启用").order_by(IssueStaff.id).all()
        return success(data=[_staff_to_dict(db, item) for item in staffs])
    finally:
        db.close()
