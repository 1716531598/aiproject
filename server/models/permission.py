from sqlalchemy import Column, Integer, String
from utils.db import Base


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True)
    key = Column(String(128), unique=True, nullable=False)
    name = Column(String(64), nullable=False)
    parent_key = Column(String(128), nullable=True)
    sort_order = Column(Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "key": self.key,
            "name": self.name,
            "parent_key": self.parent_key,
            "sort_order": self.sort_order,
        }
