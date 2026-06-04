from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, Integer, String, Text, DateTime
from utils.db import Base

CST = timezone(timedelta(hours=8))
def _now_cst():
    return datetime.now(CST)

class IssuePocProject(Base):
    __tablename__ = "issue_poc_projects"
    id = Column(Integer, primary_key=True)
    project_code = Column(String(128), unique=True, nullable=False, comment="项目编码")
    customer_name = Column(String(256), default="")
    product_id = Column(Integer, nullable=True)
    version = Column(String(64), default="")
    sales_staff = Column(String(256), default="")
    weekly_content = Column(Text, default="", comment="本周支撑内容")
    risk_desc = Column(Text, default="", comment="问题或风险描述")
    risk_category = Column(String(64), default="")
    bug_ids = Column(String(256), default="", comment="关联 BugID，逗号分隔")
    close_party = Column(String(128), default="", comment="闭环方")
    current_status = Column(String(64), default="")
    source_report = Column(String(128), default="", comment="导入来源周报")
    has_risk = Column(Integer, default=0, comment="是否有风险 0/1")
    root_cause = Column(Text, default="")
    next_step = Column(Text, default="")
    created_at = Column(DateTime, default=_now_cst)
    updated_at = Column(DateTime, default=_now_cst, onupdate=_now_cst)
