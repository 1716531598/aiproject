from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from utils.db import Base

CST = timezone(timedelta(hours=8))


def _now_cst():
    return datetime.now(CST)


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    name = Column(String(64), unique=True, nullable=False)
    built_in = Column(Boolean, default=False, nullable=False)
    description = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=_now_cst)
    updated_at = Column(DateTime, default=_now_cst, onupdate=_now_cst)

    users = relationship("User", back_populates="role")
    permissions = relationship(
        "RolePermission", back_populates="role", cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "builtIn": self.built_in,
            "description": self.description or "",
        }

    def to_query_dict(self):
        checked_keys = [rp.permission.key for rp in self.permissions if rp.permission]
        return {
            "id": self.id,
            "name": self.name,
            "builtIn": self.built_in,
            "description": self.description or "",
            "checkedKeys": sorted(checked_keys),
        }
