"""add issue tracking tables

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-04 18:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "issue_products",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_table(
        "issue_issue_types",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "issue_poc_projects",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("project_code", sa.String(length=128), nullable=False),
        sa.Column("customer_name", sa.String(length=256), nullable=True),
        sa.Column("product_id", sa.Integer(), nullable=True),
        sa.Column("version", sa.String(length=64), nullable=True),
        sa.Column("sales_staff", sa.String(length=256), nullable=True),
        sa.Column("weekly_content", sa.Text(), nullable=True),
        sa.Column("risk_desc", sa.Text(), nullable=True),
        sa.Column("risk_category", sa.String(length=64), nullable=True),
        sa.Column("bug_ids", sa.String(length=256), nullable=True),
        sa.Column("close_party", sa.String(length=128), nullable=True),
        sa.Column("current_status", sa.String(length=64), nullable=True),
        sa.Column("source_report", sa.String(length=128), nullable=True),
        sa.Column("has_risk", sa.Integer(), nullable=True),
        sa.Column("root_cause", sa.Text(), nullable=True),
        sa.Column("next_step", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("project_code"),
    )
    op.create_table(
        "issue_staffs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("department", sa.String(length=128), nullable=True),
        sa.Column("job_role", sa.String(length=64), nullable=True),
        sa.Column("email", sa.String(length=128), nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=16), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_table(
        "issue_modules",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["product_id"], ["issue_products.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "issue_product_mappings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("source_type", sa.String(length=16), nullable=False),
        sa.Column("source_name", sa.String(length=256), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["issue_products.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "issue_versions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("version", sa.String(length=64), nullable=False),
        sa.Column("plan_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(length=16), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["product_id"], ["issue_products.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "issue_assessments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("version_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["product_id"], ["issue_products.id"]),
        sa.ForeignKeyConstraint(["version_id"], ["issue_versions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "issue_bugs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("bug_id", sa.String(length=32), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column("severity", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=True),
        sa.Column("resolver", sa.String(length=64), nullable=True),
        sa.Column("resolution", sa.String(length=64), nullable=True),
        sa.Column("confirmed", sa.String(length=16), nullable=True),
        sa.Column("steps", sa.Text(), nullable=True),
        sa.Column("created_date", sa.DateTime(), nullable=True),
        sa.Column("resolved_date", sa.DateTime(), nullable=True),
        sa.Column("created_by", sa.String(length=64), nullable=True),
        sa.Column("stage", sa.String(length=16), nullable=True),
        sa.Column("affect_version", sa.String(length=128), nullable=True),
        sa.Column("module_id", sa.Integer(), nullable=True),
        sa.Column("root_cause", sa.Text(), nullable=True),
        sa.Column("impact_scope", sa.Text(), nullable=True),
        sa.Column("plan_version_id", sa.Integer(), nullable=True),
        sa.Column("issue_type_id", sa.Integer(), nullable=True),
        sa.Column("escape_analysis", sa.Text(), nullable=True),
        sa.Column("staff_id", sa.Integer(), nullable=True),
        sa.Column("assign_time", sa.DateTime(), nullable=True),
        sa.Column("remark", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("imported_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["issue_type_id"], ["issue_issue_types.id"]),
        sa.ForeignKeyConstraint(["module_id"], ["issue_modules.id"]),
        sa.ForeignKeyConstraint(["plan_version_id"], ["issue_versions.id"]),
        sa.ForeignKeyConstraint(["product_id"], ["issue_products.id"]),
        sa.ForeignKeyConstraint(["staff_id"], ["issue_staffs.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("bug_id"),
    )
    op.create_table(
        "issue_poc_progresses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=64), nullable=True),
        sa.Column("source_report", sa.String(length=128), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["project_id"], ["issue_poc_projects.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "issue_poc_comments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("commenter", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["project_id"], ["issue_poc_projects.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "issue_bug_comments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("bug_id", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("commenter", sa.String(length=64), nullable=True),
        sa.Column("source", sa.String(length=16), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["bug_id"], ["issue_bugs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "issue_bug_histories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("bug_id", sa.Integer(), nullable=False),
        sa.Column("field_name", sa.String(length=64), nullable=False),
        sa.Column("old_value", sa.String(length=512), nullable=True),
        sa.Column("new_value", sa.String(length=512), nullable=True),
        sa.Column("operator", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["bug_id"], ["issue_bugs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "issue_responsibilities",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("bug_id", sa.Integer(), nullable=False),
        sa.Column("staff_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(length=64), nullable=True),
        sa.Column("ratio", sa.Float(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["bug_id"], ["issue_bugs.id"]),
        sa.ForeignKeyConstraint(["staff_id"], ["issue_staffs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "issue_todos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("staff_id", sa.Integer(), nullable=False),
        sa.Column("deadline", sa.Date(), nullable=True),
        sa.Column("status", sa.String(length=16), nullable=True),
        sa.Column("creator_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["project_id"], ["issue_poc_projects.id"]),
        sa.ForeignKeyConstraint(["staff_id"], ["issue_staffs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "issue_sync_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("trigger_type", sa.String(length=16), nullable=True),
        sa.Column("new_count", sa.Integer(), nullable=True),
        sa.Column("update_count", sa.Integer(), nullable=True),
        sa.Column("fail_count", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=16), nullable=True),
        sa.Column("error_detail", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("issue_sync_logs")
    op.drop_table("issue_todos")
    op.drop_table("issue_responsibilities")
    op.drop_table("issue_bug_histories")
    op.drop_table("issue_bug_comments")
    op.drop_table("issue_poc_comments")
    op.drop_table("issue_poc_progresses")
    op.drop_table("issue_bugs")
    op.drop_table("issue_assessments")
    op.drop_table("issue_versions")
    op.drop_table("issue_product_mappings")
    op.drop_table("issue_modules")
    op.drop_table("issue_staffs")
    op.drop_table("issue_poc_projects")
    op.drop_table("issue_issue_types")
    op.drop_table("issue_products")
