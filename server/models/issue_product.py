from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, Integer, String, Text, DateTime
from utils.db import Base

CST = timezone(timedelta(hours=8))
def _now_cst():
    return datetime.now(CST)

class IssueProduct(Base):
    __tablename__ = "issue_products"
    id = Column(Integer, primary_key=True)
    name = Column(String(64), unique=True, nullable=False, comment="产品名称")
    description = Column(Text, default="", comment="产品描述")
    created_at = Column(DateTime, default=_now_cst)
    updated_at = Column(DateTime, default=_now_cst, onupdate=_now_cst)

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
