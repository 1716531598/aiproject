from flask import Blueprint, request
from models import Role, Permission, RolePermission, AuditLog
from utils.db import SessionLocal
from utils.response import success, error, paginate
from blueprints.auth import get_current_user, _create_audit_log

role_bp = Blueprint("role", __name__, url_prefix="/api/v1/roles")


@role_bp.route("/query", methods=["POST"])
def query_roles():
    session = get_current_user()
    if not session:
        return error("未登录", code=401)

    db = SessionLocal()
    try:
        roles = db.query(Role).order_by(Role.id).all()
        aa_data = [r.to_query_dict() for r in roles]
        return success({"aaData": aa_data})
    finally:
        db.close()


@role_bp.route("/add", methods=["POST"])
def add_role():
    session = get_current_user()
    if not session:
        return error("未登录", code=401)

    data = request.get_json(force=True, silent=True) or {}
    name = data.get("name", "")
    description = data.get("description", "")
    checked_keys = data.get("checkedKeys", [])

    if not name:
        return error("角色名称不能为空")

    db = SessionLocal()
    try:
        if db.query(Role).filter(Role.name == name).first():
            return error("角色名称已存在")

        role = Role(name=name, description=description)
        db.add(role)
        db.flush()

        for key in checked_keys:
            perm = db.query(Permission).filter(Permission.key == key).first()
            if perm:
                db.add(RolePermission(role_id=role.id, permission_id=perm.id))

        perm_names = []
        for key in checked_keys:
            perm = db.query(Permission).filter(Permission.key == key).first()
            if perm:
                perm_names.append(perm.name or key)

        msg = f"新增角色 {name}"
        if perm_names:
            msg += f"，权限: {', '.join(perm_names)}"

        _create_audit_log(db, session["id"], session["name"], "新增",
                          request.remote_addr, msg, resource=name)
        db.commit()

        return success({}, msg="新建角色成功")
    finally:
        db.close()


@role_bp.route("/update", methods=["POST"])
def update_role():
    session = get_current_user()
    if not session:
        return error("未登录", code=401)

    data = request.get_json(force=True, silent=True) or {}
    role_id = data.get("id")
    if not role_id:
        return error("缺少角色ID")

    db = SessionLocal()
    try:
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            return error("角色不存在")

        old_name = role.name
        changes = []

        if "name" in data and data["name"] != role.name:
            changes.append(f"名称: {role.name}→{data['name']}")
            role.name = data["name"]

        if "description" in data and data["description"] != role.description:
            changes.append("描述")

        if "checkedKeys" in data:
            old_perms = set()
            for rp in db.query(RolePermission).filter(RolePermission.role_id == role_id).all():
                perm = db.query(Permission).filter(Permission.id == rp.permission_id).first()
                if perm:
                    old_perms.add(perm.key)

            new_perms = set(data["checkedKeys"])

            if old_perms != new_perms:
                added = new_perms - old_perms
                removed = old_perms - new_perms

                # Update permissions
                db.query(RolePermission).filter(RolePermission.role_id == role_id).delete()
                for key in data["checkedKeys"]:
                    perm = db.query(Permission).filter(Permission.key == key).first()
                    if perm:
                        db.add(RolePermission(role_id=role.id, permission_id=perm.id))

                detail_parts = []
                if added:
                    added_names = []
                    for k in added:
                        p = db.query(Permission).filter(Permission.key == k).first()
                        added_names.append(p.name if p else k)
                    detail_parts.append(f"添加: {', '.join(added_names)}")
                if removed:
                    removed_names = []
                    for k in removed:
                        p = db.query(Permission).filter(Permission.key == k).first()
                        removed_names.append(p.name if p else k)
                    detail_parts.append(f"移除: {', '.join(removed_names)}")

                perm_msg = f"修改角色 {old_name} 权限: {'; '.join(detail_parts)}"
                _create_audit_log(db, session["id"], session["name"], "权限变更",
                                  request.remote_addr, perm_msg, resource=old_name)

                if changes:
                    _create_audit_log(db, session["id"], session["name"], "修改",
                                      request.remote_addr, f"修改角色 {old_name}: {', '.join(changes)}", resource=old_name)
                db.commit()
                return success({}, msg="修改角色成功")

        if not changes:
            return success({}, msg="无变更")

        _create_audit_log(db, session["id"], session["name"], "修改",
                          request.remote_addr, f"修改角色 {old_name}: {', '.join(changes)}", resource=old_name)
        db.commit()

        return success({}, msg="修改角色成功")
    finally:
        db.close()


@role_bp.route("/delete", methods=["POST"])
def delete_role():
    session = get_current_user()
    if not session:
        return error("未登录", code=401)

    data = request.get_json(force=True, silent=True) or {}
    role_id = data.get("id")
    if not role_id:
        return error("缺少角色ID")

    db = SessionLocal()
    try:
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            return error("角色不存在")
        if role.built_in:
            return error("内置角色不能删除")

        from models import User
        if db.query(User).filter(User.role_id == role_id).count() > 0:
            return error("该角色下还有用户，不能删除")

        role_name = role.name
        db.query(RolePermission).filter(RolePermission.role_id == role_id).delete()
        db.delete(role)

        _create_audit_log(db, session["id"], session["name"], "删除",
                          request.remote_addr, f"删除角色 {role_name}", resource=role_name)
        db.commit()

        return success({}, msg="删除角色成功")
    finally:
        db.close()
