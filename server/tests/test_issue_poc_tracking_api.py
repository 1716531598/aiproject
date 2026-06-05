from datetime import date

from flask import Flask
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import IssueBug, IssuePocComment, IssuePocProgress, IssuePocProject, IssueProduct, IssueStaff, IssueTodo
from utils.db import Base


def _json_body(response):
    if isinstance(response, tuple):
        return response[0].get_json()
    return response.get_json()


def _setup_session(monkeypatch):
    from blueprints import issue_poc

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine)
    monkeypatch.setattr(issue_poc, "SessionLocal", TestingSession)
    monkeypatch.setattr(issue_poc, "get_current_user", lambda: {"id": 1, "name": "tester", "role_id": 1})
    return issue_poc, TestingSession


def _seed(TestingSession):
    db = TestingSession()
    product = IssueProduct(name="RayScan", description="")
    staff = IssueStaff(name="张三", email="zhangsan@example.com")
    db.add_all([product, staff])
    db.commit()
    bug = IssueBug(bug_id="BUG-1", product_id=product.id, title="登录失败")
    project = IssuePocProject(
        project_code="POC-1",
        customer_name="客户A",
        product_id=product.id,
        version="V1.0",
        weekly_content="本周推进",
        risk_desc="存在风险",
        has_risk=1,
        current_status="进行中",
    )
    db.add_all([bug, project])
    db.commit()
    ids = {"project_id": project.id, "product_id": product.id, "staff_id": staff.id, "bug_db_id": bug.id}
    db.close()
    return ids


def test_poc_tracking_full_flow(monkeypatch):
    issue_poc, TestingSession = _setup_session(monkeypatch)
    ids = _seed(TestingSession)
    app = Flask(__name__)

    with app.test_request_context(json={"page": 1, "pageSize": 20, "has_risk": 1, "product_id": ids["product_id"]}):
        body = _json_body(issue_poc.query.__wrapped__())
    assert body["code"] == 200
    assert body["data"]["total"] == 1
    assert body["data"]["aaData"][0]["project_code"] == "POC-1"
    assert body["data"]["aaData"][0]["product_name"] == "RayScan"

    with app.test_request_context(json={"id": ids["project_id"], "root_cause": "资源不足", "next_step": "补人", "has_risk": 1}):
        body = _json_body(issue_poc.update.__wrapped__())
    assert body["code"] == 200

    with app.test_request_context(json={"project_id": ids["project_id"], "bug_id": "BUG-1", "action": "add"}):
        body = _json_body(issue_poc.link_bug.__wrapped__())
    assert body["code"] == 200

    with app.test_request_context(json={"project_id": ids["project_id"], "date": "2026-06-05", "description": "完成验证", "status": "推进中"}):
        body = _json_body(issue_poc.add_progress.__wrapped__())
    assert body["code"] == 200

    with app.test_request_context(json={"project_id": ids["project_id"], "content": "跟进客户", "staff_id": ids["staff_id"], "deadline": "2026-06-10"}):
        body = _json_body(issue_poc.add_todo.__wrapped__())
    assert body["code"] == 200

    db = TestingSession()
    todo_id = db.query(IssueTodo).first().id
    db.close()

    with app.test_request_context(json={"id": todo_id, "status": "已完成"}):
        body = _json_body(issue_poc.update_todo_status.__wrapped__())
    assert body["code"] == 200

    with app.test_request_context(json={"project_id": ids["project_id"], "content": "项目评论"}):
        body = _json_body(issue_poc.add_comment.__wrapped__())
    assert body["code"] == 200

    with app.test_request_context(json={"id": ids["project_id"]}):
        body = _json_body(issue_poc.detail.__wrapped__())
    assert body["code"] == 200
    assert body["data"]["root_cause"] == "资源不足"
    assert body["data"]["linked_bugs"][0]["bug_id"] == "BUG-1"
    assert body["data"]["progresses"][0]["description"] == "完成验证"
    assert body["data"]["todos"][0]["status"] == "已完成"
    assert body["data"]["comments"][0]["content"] == "项目评论"

    db = TestingSession()
    assert db.query(IssuePocProgress).count() == 1
    assert db.query(IssuePocComment).count() == 1
    db.close()


def test_poc_manual_add_and_route_registration(monkeypatch):
    issue_poc, TestingSession = _setup_session(monkeypatch)
    ids = _seed(TestingSession)
    app = Flask(__name__)

    with app.test_request_context(json={"customer_name": "客户B", "product_id": ids["product_id"], "version": "V2.0", "risk_desc": "新风险"}):
        body = _json_body(issue_poc.manual_add.__wrapped__())
    assert body["code"] == 200

    db = TestingSession()
    manual = db.query(IssuePocProject).filter(IssuePocProject.customer_name == "客户B").first()
    assert manual.project_code.startswith("MANUAL-")
    assert manual.has_risk == 1
    db.close()

    import app as app_module

    monkeypatch.setattr(app_module, "init_db", lambda config: None)
    monkeypatch.setattr(app_module, "init_redis", lambda config: None)
    flask_app = app_module.create_app()
    rules = {rule.rule for rule in flask_app.url_map.iter_rules()}
    assert "/api/issue/poc/detail" in rules
    assert "/api/issue/poc/update" in rules
    assert "/api/issue/poc/link-bug" in rules
    assert "/api/issue/poc/manual-add" in rules
    assert "/api/issue/poc/progress/add" in rules
    assert "/api/issue/poc/todo/add" in rules
    assert "/api/issue/poc/comment/add" in rules
