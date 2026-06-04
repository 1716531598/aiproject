from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
from utils.db import Base

CST = timezone(timedelta(hours=8))
def _now_cst():
    return datetime.now(CST)

class IssuePocProgress(Base):
    __tablename__ = "issue_poc_progresses"
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("issue_poc_projects.id"), nullable=False)
    date = Column(Date, nullable=False)
    description = Column(Text, default="")
    status = Column(String(64), default="")
    source_report = Column(String(128), default="")
    created_at = Column(DateTime, default=_now_cst)
