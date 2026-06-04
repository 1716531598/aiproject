from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from utils.db import Base

CST = timezone(timedelta(hours=8))
def _now_cst():
    return datetime.now(CST)

class IssuePocComment(Base):
    __tablename__ = "issue_poc_comments"
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("issue_poc_projects.id"), nullable=False)
    content = Column(Text, nullable=False)
    commenter = Column(String(64), default="")
    created_at = Column(DateTime, default=_now_cst)
