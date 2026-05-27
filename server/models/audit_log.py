from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, Integer, String, DateTime, Index
from utils.db import Base

CST = timezone(timedelta(hours=8))


def _now_cst():
    return datetime.now(CST)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    userid = Column(Integer, nullable=False)
    adminname = Column(String(64), nullable=False)
    type = Column(String(32), nullable=False)
    ip = Column(String(64), nullable=False)
    msg = Column(String(512), nullable=False)
    result = Column(String(16), nullable=False, default="成功")
    resource = Column(String(128), nullable=False, default="")
    created_at = Column(DateTime, default=_now_cst)

    __table_args__ = (
        Index("idx_auditlogs_created_at", "created_at"),
        Index("idx_auditlogs_adminname", "adminname"),
        Index("idx_auditlogs_type", "type"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "userid": self.userid,
            "adminname": self.adminname,
            "type": self.type,
            "ip": self.ip,
            "msg": self.msg,
            "result": self.result,
            "resource": self.resource,
            "createtime": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else "",
        }
