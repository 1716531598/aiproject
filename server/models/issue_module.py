from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from utils.db import Base

CST = timezone(timedelta(hours=8))
def _now_cst():
    return datetime.now(CST)

class IssueModule(Base):
    __tablename__ = "issue_modules"
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("issue_products.id"), nullable=False)
    name = Column(String(64), nullable=False, comment="模块名称")
    created_at = Column(DateTime, default=_now_cst)
    updated_at = Column(DateTime, default=_now_cst, onupdate=_now_cst)

    def to_dict(self):
        return {
            "id": self.id, "product_id": self.product_id, "name": self.name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
