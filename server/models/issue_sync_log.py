from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, Integer, String, Text, DateTime
from utils.db import Base

CST = timezone(timedelta(hours=8))
def _now_cst():
    return datetime.now(CST)

class IssueSyncLog(Base):
    __tablename__ = "issue_sync_logs"
    id = Column(Integer, primary_key=True)
    trigger_type = Column(String(16), default="手动", comment="手动/自动")
    new_count = Column(Integer, default=0)
    update_count = Column(Integer, default=0)
    fail_count = Column(Integer, default=0)
    status = Column(String(16), default="成功", comment="成功/失败/部分成功")
    error_detail = Column(Text, default="")
    created_at = Column(DateTime, default=_now_cst)
