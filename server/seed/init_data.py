import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import bcrypt
from config import get_config
from utils.db import init_db, SessionLocal, Base
from utils.redis_client import init_redis
from models import User, Role, Permission, RolePermission


def seed():
    config = get_config()
    engine = init_db(config)
    Base.metadata.create_all(engine)
    init_redis(config)

    db = SessionLocal()
    try:
        # seed roles
        roles_data = [
            {"id": 1, "name": "超级管理员", "built_in": True, "description": "拥有所有权限"},
            {"id": 2, "name": "普通用户", "built_in": True, "description": "基本访问权限"},
            {"id": 3, "name": "审计角色", "built_in": True, "description": "审计日志查看权限"},
        ]
        for rd in roles_data:
            if not db.query(Role).filter(Role.id == rd["id"]).first():
                db.add(Role(**rd))
        db.flush()

        # seed permissions
        perms_data = [
            {"key": "common", "name": "系统配置", "parent_key": None, "sort_order": 0},
            {"key": "common/dashboard", "name": "主页面", "parent_key": "common", "sort_order": 1},
            {"key": "common/user", "name": "用户管理", "parent_key": "common", "sort_order": 2},
            {"key": "common/role", "name": "角色管理", "parent_key": "common", "sort_order": 3},
            {"key": "common/auditlog", "name": "审计日志", "parent_key": "common", "sort_order": 4},
        ]
        perm_map = {}
        for pd in perms_data:
            perm = db.query(Permission).filter(Permission.key == pd["key"]).first()
            if not perm:
                perm = Permission(**pd)
                db.add(perm)
                db.flush()
            perm_map[pd["key"]] = perm.id

        # seed role_permissions
        role_perms = {
            1: ["common", "common/dashboard", "common/user", "common/role", "common/auditlog"],
            2: ["common", "common/dashboard"],
            3: ["common", "common/auditlog"],
        }
        for role_id, keys in role_perms.items():
            for key in keys:
                pid = perm_map.get(key)
                if pid:
                    exists = db.query(RolePermission).filter(
                        RolePermission.role_id == role_id,
                        RolePermission.permission_id == pid,
                    ).first()
                    if not exists:
                        db.add(RolePermission(role_id=role_id, permission_id=pid))
        db.flush()

        # seed users
        users_data = [
            {"name": "admin", "role_id": 1, "parent_id": None},
            {"name": "user", "role_id": 2, "parent_id": None},
            {"name": "audit", "role_id": 3, "parent_id": None},
        ]
        for ud in users_data:
            if not db.query(User).filter(User.name == ud["name"]).first():
                pw_hash = bcrypt.hashpw("Test@123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
                db.add(User(
                    name=ud["name"],
                    password_hash=pw_hash,
                    role_id=ud["role_id"],
                    parent_id=ud.get("parent_id"),
                    is_login=1,
                    errcount=5,
                    timeout=30,
                ))

        db.commit()
        print("Seed data inserted successfully.")
    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
