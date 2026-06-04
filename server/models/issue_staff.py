from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, Integer, String, ForeignKey, SmallInteger, DateTime
from utils.db import Base

CST = timezone(timedelta(hours=8))
def _now_cst():
    return datetime.now(CST)

class IssueStaff(Base):
    __tablename__ = "issue_staffs"
    id = Column(Integer, primary_key=True)
    name = Column(String(64), nullable=False, comment="姓名")
    department = Column(String(128), default="", comment="所属部门")
    job_role = Column(String(64), default="", comment="岗位角色")
    email = Column(String(128), unique=True, nullable=False, comment="邮箱")
    phone = Column(String(32), default="", comment="联系电话")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, comment="关联 Ironman 系统账号")
    status = Column(String(16), default="启用", comment="启用/禁用")
    created_at = Column(DateTime, default=_now_cst)
    updated_at = Column(DateTime, default=_now_cst, onupdate=_now_cst)

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "department": self.department,
            "job_role": self.job_role, "email": self.email, "phone": self.phone,
            "user_id": self.user_id, "has_account": self.user_id is not None,
            "status": self.status,
        }
