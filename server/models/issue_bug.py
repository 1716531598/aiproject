from datetime import datetime, timezone, timedelta
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from utils.db import Base

CST = timezone(timedelta(hours=8))
def _now_cst():
    return datetime.now(CST)

class IssueBug(Base):
    __tablename__ = "issue_bugs"
    id = Column(Integer, primary_key=True)
    bug_id = Column(String(32), unique=True, nullable=False, comment="禅道 Bug 编号")
    product_id = Column(Integer, ForeignKey("issue_products.id"), nullable=True)
    title = Column(String(512), nullable=False)
    severity = Column(Integer, default=4, comment="1=P1,2=P2,3=P3,4=P4")
    status = Column(String(32), default="激活", comment="激活/已解决/已关闭/重新打开")
    resolver = Column(String(64), default="", comment="禅道解决者")
    resolution = Column(String(64), default="", comment="解决方案")
    confirmed = Column(String(16), default="", comment="已确认/未确认")
    steps = Column(Text, default="", comment="重现步骤")
    created_date = Column(DateTime, nullable=True, comment="禅道创建日期")
    resolved_date = Column(DateTime, nullable=True, comment="禅道解决日期")
    created_by = Column(String(64), default="", comment="由谁创建")
    stage = Column(String(16), default="售后", comment="问题所属阶段: 售前/售后")
    # 系统扩展字段
    affect_version = Column(String(128), default="", comment="影响版本")
    module_id = Column(Integer, ForeignKey("issue_modules.id"), nullable=True)
    root_cause = Column(Text, default="", comment="根因分析")
    impact_scope = Column(Text, default="", comment="影响范围")
    plan_version_id = Column(Integer, ForeignKey("issue_versions.id"), nullable=True, comment="计划解决版本 FK")
    issue_type_id = Column(Integer, ForeignKey("issue_issue_types.id"), nullable=True)
    escape_analysis = Column(Text, default="", comment="逃逸分析")
    staff_id = Column(Integer, ForeignKey("issue_staffs.id"), nullable=True, comment="解决人员")
    assign_time = Column(DateTime, nullable=True, comment="指派时间")
    remark = Column(Text, default="", comment="备注")
    # 版本控制（乐观锁）
    updated_at = Column(DateTime, default=_now_cst, onupdate=_now_cst)
    imported_at = Column(DateTime, default=_now_cst, comment="最后导入时间")

    def to_dict(self):
        return {
            "id": self.id, "bug_id": self.bug_id, "product_id": self.product_id,
            "title": self.title, "severity": self.severity, "status": self.status,
            "resolver": self.resolver, "resolution": self.resolution,
            "confirmed": self.confirmed, "steps": self.steps,
            "created_date": self.created_date.isoformat() if self.created_date else None,
            "resolved_date": self.resolved_date.isoformat() if self.resolved_date else None,
            "created_by": self.created_by, "stage": self.stage,
            "affect_version": self.affect_version, "module_id": self.module_id,
            "root_cause": self.root_cause, "impact_scope": self.impact_scope,
            "plan_version_id": self.plan_version_id, "issue_type_id": self.issue_type_id,
            "escape_analysis": self.escape_analysis, "staff_id": self.staff_id,
            "assign_time": self.assign_time.isoformat() if self.assign_time else None,
            "remark": self.remark,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
