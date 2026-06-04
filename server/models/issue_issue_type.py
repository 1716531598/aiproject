from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, Integer, String, SmallInteger, DateTime
from utils.db import Base

CST = timezone(timedelta(hours=8))
def _now_cst():
    return datetime.now(CST)

class IssueType(Base):
    __tablename__ = "issue_issue_types"
    id = Column(Integer, primary_key=True)
    name = Column(String(64), nullable=False, comment="类型名称")
    status = Column(String(16), default="启用", comment="启用/禁用")
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=_now_cst)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "status": self.status, "sort_order": self.sort_order}
