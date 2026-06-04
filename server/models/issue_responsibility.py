from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from utils.db import Base

CST = timezone(timedelta(hours=8))
def _now_cst():
    return datetime.now(CST)

class IssueResponsibility(Base):
    __tablename__ = "issue_responsibilities"
    id = Column(Integer, primary_key=True)
    bug_id = Column(Integer, ForeignKey("issue_bugs.id"), nullable=False)
    staff_id = Column(Integer, ForeignKey("issue_staffs.id"), nullable=False)
    role = Column(String(64), default="", comment="岗位角色")
    ratio = Column(Float, default=0.0, comment="责任占比 0-1")
    description = Column(Text, default="", comment="责任分配说明")
    year = Column(Integer, nullable=False, comment="考核年度")
    created_at = Column(DateTime, default=_now_cst)
