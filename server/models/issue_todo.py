from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
from utils.db import Base

CST = timezone(timedelta(hours=8))
def _now_cst():
    return datetime.now(CST)

class IssueTodo(Base):
    __tablename__ = "issue_todos"
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("issue_poc_projects.id"), nullable=True)
    content = Column(Text, nullable=False)
    staff_id = Column(Integer, ForeignKey("issue_staffs.id"), nullable=False)
    deadline = Column(Date, nullable=True)
    status = Column(String(16), default="待处理", comment="待处理/进行中/已完成")
    creator_id = Column(Integer, nullable=True, comment="创建人 user id")
    created_at = Column(DateTime, default=_now_cst)
