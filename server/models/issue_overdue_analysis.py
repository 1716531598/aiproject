from datetime import datetime, timezone, timedelta

from sqlalchemy import Column, DateTime, Integer, String, Text, UniqueConstraint

from utils.db import Base

CST = timezone(timedelta(hours=8))


def _now_cst():
    return datetime.now(CST)


class IssueOverdueAnalysis(Base):
    __tablename__ = "issue_overdue_analyses"
    __table_args__ = (UniqueConstraint("product_id", "version", name="uq_issue_overdue_product_version"),)

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, nullable=False)
    version = Column(String(128), nullable=False)
    analysis = Column(Text, default="")
    improvement = Column(Text, default="")
    created_at = Column(DateTime, default=_now_cst)
    updated_at = Column(DateTime, default=_now_cst, onupdate=_now_cst)

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "version": self.version,
            "analysis": self.analysis,
            "improvement": self.improvement,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
