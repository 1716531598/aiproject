from datetime import datetime

from flask import Flask
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import (
    IssueBug,
    IssueBugComment,
    IssueBugHistory,
    IssueModule,
    IssueProduct,
    IssueStaff,
    IssueType,
    IssueVersion,
)
from utils.db import Base


def _json_body(response):
    if isinstance(response, tuple):
        return response[0].get_json()
    return response.get_json()


def _setup_session(monkeypatch):
    from blueprints import issue_bug

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine)
    monkeypatch.setattr(issue_bug, "SessionLocal", TestingSession)
    monkeypatch.setattr(issue_bug, "get_current_user", lambda: {"name": "tester", "role_id": 1})
    return issue_bug, TestingSession


def _seed_bug(TestingSession):
    db = TestingSession()
    product = IssueProduct(name="RayScan", description="")
    db.add(product)
    db.commit()
    module = IssueModule(product_id=product.id, name="登录")
    staff = IssueStaff(name="张三", email="zhangsan@example.com")
    version = IssueVersion(product_id=product.id, version="V1.0", status="规划中")
    issue_type = IssueType(name="功能问题", status="启用")
    db.add_all([module, staff, version, issue_type])
    db.commit()
    bug = IssueBug(
        bug_id="BUG-1",
        product_id=product.id,
        title="登录失败",
        severity=1,
        status="激活",
        steps="影响版本：V0.9",
        root_cause="旧根因",
        created_date=datetime(2026, 6, 1, 10, 0, 0),
    )
    db.add(bug)
    db.commit()
    db.add(IssueBugComment(bug_id=bug.id, content="已有评论", commenter="张三"))
    db.commit()
    ids = {
        "bug_id": bug.id,
        "module_id": module.id,
        "staff_id": staff.id,
        "version_id": version.id,
        "issue_type_id": issue_type.id,
    }
    db.close()
    return ids


def test_bug_detail_update_ext_comment_and_history(monkeypatch):
    issue_bug, TestingSession = _setup_session(monkeypatch)
    ids = _seed_bug(TestingSession)
    app = Flask(__name__)

    with app.test_request_context(json={"id": ids["bug_id"]}):
        body = _json_body(issue_bug.detail.__wrapped__())

    assert body["code"] == 200
    assert body["data"]["bug_id"] == "BUG-1"
    assert body["data"]["product_name"] == "RayScan"
    assert body["data"]["comments"][0]["content"] == "已有评论"
    updated_at = body["data"]["updated_at"]

    payload = {
        "id": ids["bug_id"],
        "updated_at": updated_at,
        "affect_version": "V1.0",
        "root_cause": "新根因",
        "impact_scope": "影响登录",
        "escape_analysis": "缺少回归",
        "remark": "备注",
        "module_id": ids["module_id"],
        "plan_version_id": ids["version_id"],
        "issue_type_id": ids["issue_type_id"],
        "staff_id": ids["staff_id"],
    }
    with app.test_request_context(json=payload):
        body = _json_body(issue_bug.update_ext.__wrapped__())
        assert body["code"] == 200

    db = TestingSession()
    bug = db.get(IssueBug, ids["bug_id"])
    histories = db.query(IssueBugHistory).filter(IssueBugHistory.bug_id == bug.id).all()
    assert bug.root_cause == "新根因"
    assert bug.staff_id == ids["staff_id"]
    assert bug.assign_time is not None
    assert {h.field_name for h in histories} >= {"影响版本", "根因分析", "解决人员"}
    assert histories[0].operator == "tester"
    db.close()

    with app.test_request_context(json={"bug_id": ids["bug_id"], "content": "新增评论"}):
        body = _json_body(issue_bug.add_comment.__wrapped__())
        assert body["code"] == 200

    with app.test_request_context(json={"bug_id": ids["bug_id"], "page": 1, "pageSize": 10}):
        body = _json_body(issue_bug.list_comments.__wrapped__())
        assert body["code"] == 200
        assert body["data"]["total"] == 2
        assert body["data"]["aaData"][0]["content"] == "新增评论"

    with app.test_request_context(json={"bug_id": ids["bug_id"]}):
        body = _json_body(issue_bug.history.__wrapped__())
        assert body["code"] == 200
        assert len(body["data"]) >= 3


def test_update_ext_rejects_stale_updated_at(monkeypatch):
    issue_bug, TestingSession = _setup_session(monkeypatch)
    ids = _seed_bug(TestingSession)
    app = Flask(__name__)

    with app.test_request_context(json={"id": ids["bug_id"], "updated_at": "2000-01-01T00:00:00", "root_cause": "冲突"}):
        body = _json_body(issue_bug.update_ext.__wrapped__())

    assert body["code"] == 409
    assert "已被他人修改" in body["msg"]


def test_issue_bug_detail_routes_are_registered(monkeypatch):
    import app as app_module

    monkeypatch.setattr(app_module, "init_db", lambda config: None)
    monkeypatch.setattr(app_module, "init_redis", lambda config: None)

    flask_app = app_module.create_app()
    rules = {rule.rule for rule in flask_app.url_map.iter_rules()}

    assert "/api/issue/bugs/detail" in rules
    assert "/api/issue/bugs/update-ext" in rules
    assert "/api/issue/bugs/comment/add" in rules
    assert "/api/issue/bugs/comment/list" in rules
    assert "/api/issue/bugs/history" in rules
