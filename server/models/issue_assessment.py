from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, Integer, DateTime, ForeignKey
from utils.db import Base

CST = timezone(timedelta(hours=8))
def _now_cst():
    return datetime.now(CST)

class IssueAssessment(Base):
    __tablename__ = "issue_assessments"
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("issue_products.id"), nullable=False)
    version_id = Column(Integer, ForeignKey("issue_versions.id"), nullable=False)
    created_at = Column(DateTime, default=_now_cst)
