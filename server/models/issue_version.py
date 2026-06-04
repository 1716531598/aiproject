from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from utils.db import Base

CST = timezone(timedelta(hours=8))
def _now_cst():
    return datetime.now(CST)

class IssueVersion(Base):
    __tablename__ = "issue_versions"
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("issue_products.id"), nullable=False)
    version = Column(String(64), nullable=False, comment="版本号")
    plan_date = Column(Date, nullable=True, comment="计划时间")
    status = Column(String(16), default="规划中", comment="已发布/开发中/规划中")
    created_at = Column(DateTime, default=_now_cst)
    updated_at = Column(DateTime, default=_now_cst, onupdate=_now_cst)

    def to_dict(self):
        return {
            "id": self.id, "product_id": self.product_id, "version": self.version,
            "plan_date": self.plan_date.isoformat() if self.plan_date else None,
            "status": self.status,
        }
