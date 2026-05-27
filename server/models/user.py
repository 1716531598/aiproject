from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, Integer, String, SmallInteger, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from utils.db import Base

CST = timezone(timedelta(hours=8))


def _now_cst():
    return datetime.now(CST)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(64), unique=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_login = Column(SmallInteger, default=1, nullable=False)
    errcount = Column(SmallInteger, default=5, nullable=False)
    timeout = Column(SmallInteger, default=30, nullable=False)
    created_at = Column(DateTime, default=_now_cst)
    updated_at = Column(DateTime, default=_now_cst, onupdate=_now_cst)

    role = relationship("Role", back_populates="users")
    parent = relationship("User", remote_side=[id], backref="children")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "role_id": self.role_id,
            "parent_id": self.parent_id,
            "is_login": self.is_login,
            "errcount": self.errcount,
            "timeout": self.timeout,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def to_query_dict(self):
        result = {
            "id": self.id,
            "name": self.name,
            "role_type": self.role_id,
            "is_login": self.is_login,
            "errcount": self.errcount,
            "timeout": self.timeout,
        }
        if self.role:
            result["role_name"] = self.role.name
        if self.parent:
            result["parentName"] = self.parent.name
        return result
