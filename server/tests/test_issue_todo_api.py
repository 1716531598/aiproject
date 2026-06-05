from datetime import date

from flask import Flask
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import IssuePocProject, IssueProduct, IssueStaff, IssueTodo
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
    return issue_poc, TestingSession


def test_query_all_update_and_delete_todos(monkeypatch):
    issue_poc, TestingSession = _setup_session(monkeypatch)
    db = TestingSession()
    product = IssueProduct(name="RayScan", description="")
    staff = IssueStaff(name="张三", email="zhangsan@example.com")
    db.add_all([product, staff])
    db.commit()
    project = IssuePocProject(project_code="POC-1", customer_name="客户A", product_id=product.id)
    db.add(project)
    db.commit()
    todo = IssueTodo(project_id=project.id, content="跟进客户", staff_id=staff.id, deadline=date(2026, 6, 10), status="待处理")
    db.add(todo)
    db.commit()
    todo_id = todo.id
    staff_id = staff.id
    db.close()

    app = Flask(__name__)
    with app.test_request_context(json={"page": 1, "pageSize": 20, "status": "待处理", "staff_id": staff_id}):
        body = _json_body(issue_poc.query_all_todos.__wrapped__())
    assert body["code"] == 200
    assert body["data"]["total"] == 1
    assert body["data"]["aaData"][0]["project_code"] == "POC-1"
    assert body["data"]["aaData"][0]["staff_name"] == "张三"

    with app.test_request_context(json={"id": todo_id, "content": "已联系客户", "status": "进行中", "deadline": "2026-06-12"}):
        body = _json_body(issue_poc.update_todo.__wrapped__())
    assert body["code"] == 200

    db = TestingSession()
    assert db.get(IssueTodo, todo_id).content == "已联系客户"
    assert db.get(IssueTodo, todo_id).deadline == date(2026, 6, 12)
    db.close()

    with app.test_request_context(json={"id": todo_id}):
        body = _json_body(issue_poc.delete_todo.__wrapped__())
    assert body["code"] == 200

    db = TestingSession()
    assert db.get(IssueTodo, todo_id) is None
    db.close()


def test_todo_routes_are_registered(monkeypatch):
    import app as app_module

    monkeypatch.setattr(app_module, "init_db", lambda config: None)
    monkeypatch.setattr(app_module, "init_redis", lambda config: None)

    flask_app = app_module.create_app()
    rules = {rule.rule for rule in flask_app.url_map.iter_rules()}
    assert "/api/issue/poc/todo/query-all" in rules
    assert "/api/issue/poc/todo/update" in rules
    assert "/api/issue/poc/todo/delete" in rules
