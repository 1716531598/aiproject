from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from utils.db import Base

CST = timezone(timedelta(hours=8))
def _now_cst():
    return datetime.now(CST)

class IssueBugComment(Base):
    __tablename__ = "issue_bug_comments"
    id = Column(Integer, primary_key=True)
    bug_id = Column(Integer, ForeignKey("issue_bugs.id"), nullable=False)
    content = Column(Text, nullable=False)
    commenter = Column(String(64), default="", comment="评论人")
    source = Column(String(16), default="手动评论", comment="手动评论/周报提取")
    created_at = Column(DateTime, default=_now_cst)
