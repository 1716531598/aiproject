import functools

from blueprints.auth import get_current_user
from models import Permission, RolePermission
from utils.db import SessionLocal
from utils.response import error


def require_permission(permission_key: str):
    """Decorator that checks if the current user's role has the specified permission."""

    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            session = get_current_user()
            if not session:
                return error("未登录", code=401)

            role_id = session.get("role_id")
            if not role_id:
                return error("无访问权限", code=403)

            db = SessionLocal()
            try:
                perm = (
                    db.query(Permission)
                    .join(RolePermission, RolePermission.permission_id == Permission.id)
                    .filter(RolePermission.role_id == role_id)
                    .filter(Permission.key == permission_key)
                    .first()
                )
                if not perm:
                    return error("无操作权限", code=403)
            finally:
                db.close()

            return func(*args, **kwargs)

        return wrapper

    return decorator
