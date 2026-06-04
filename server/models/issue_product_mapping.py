from sqlalchemy import Column, Integer, String, ForeignKey
from utils.db import Base

class IssueProductMapping(Base):
    __tablename__ = "issue_product_mappings"
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("issue_products.id"), nullable=False)
    source_type = Column(String(16), nullable=False, comment="来源类型: zentao/weekly")
    source_name = Column(String(256), nullable=False, comment="禅道或周报中的原始产品名")
