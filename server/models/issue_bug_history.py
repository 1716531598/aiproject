from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from utils.db import Base

CST = timezone(timedelta(hours=8))
def _now_cst():
    return datetime.now(CST)

class IssueBugHistory(Base):
    __tablename__ = "issue_bug_histories"
    id = Column(Integer, primary_key=True)
    bug_id = Column(Integer, ForeignKey("issue_bugs.id"), nullable=False)
    field_name = Column(String(64), nullable=False)
    old_value = Column(String(512), default="")
    new_value = Column(String(512), default="")
    operator = Column(String(64), default="")
    created_at = Column(DateTime, default=_now_cst)
