from flask import Flask
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import IssueStaff, User
from utils.db import Base


def _json_body(response):
    if isinstance(response, tuple):
        return response[0].get_json()
    return response.get_json()


def _setup_session(monkeypatch):
    from blueprints import issue_staff

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine)
    monkeypatch.setattr(issue_staff, "SessionLocal", TestingSession)
    return issue_staff, TestingSession


def test_staff_crud_disables_on_delete_and_lists_active(monkeypatch):
    issue_staff, TestingSession = _setup_session(monkeypatch)

    db = TestingSession()
    user = User(name="zhangsan", password_hash="hash", role_id=2)
    db.add(user)
    db.commit()
    user_id = user.id
    db.close()

    app = Flask(__name__)

    with app.test_request_context(
        json={
            "name": "张三",
            "department": "研发部",
            "job_role": "开发",
            "email": "zhangsan@example.com",
            "phone": "123",
            "user_id": user_id,
            "status": "启用",
        }
    ):
        body = _json_body(issue_staff.add.__wrapped__())
        assert body["code"] == 200

    with app.test_request_context(
        json={
            "name": "张三2",
            "department": "研发部",
            "job_role": "开发",
            "email": "zhangsan@example.com",
            "status": "启用",
        }
    ):
        body = _json_body(issue_staff.add.__wrapped__())
        assert body["code"] == 400
        assert body["msg"] == "邮箱已存在"

    with app.test_request_context(json={"page": 1, "pageSize": 20, "sSearch": "张", "department": "研发部"}):
        body = _json_body(issue_staff.query.__wrapped__())
        assert body["code"] == 200
        assert body["data"]["total"] == 1
        assert body["data"]["aaData"][0]["name"] == "张三"
        assert body["data"]["aaData"][0]["user_name"] == "zhangsan"

    db = TestingSession()
    staff = db.query(IssueStaff).filter(IssueStaff.email == "zhangsan@example.com").first()
    staff_id = staff.id
    db.close()

    with app.test_request_context(json={"id": staff_id, "department": "质量部", "phone": "456"}):
        body = _json_body(issue_staff.update.__wrapped__())
        assert body["code"] == 200

    with app.test_request_context():
        body = _json_body(issue_staff.all_active.__wrapped__())
        assert body["code"] == 200
        assert body["data"][0]["department"] == "质量部"

    with app.test_request_context(json={"id": staff_id}):
        body = _json_body(issue_staff.delete.__wrapped__())
        assert body["code"] == 200

    db = TestingSession()
    assert db.get(IssueStaff, staff_id).status == "禁用"
    db.close()

    with app.test_request_context():
        body = _json_body(issue_staff.all_active.__wrapped__())
        assert body["code"] == 200
        assert body["data"] == []


def test_issue_staff_blueprint_routes_are_registered(monkeypatch):
    import app as app_module

    monkeypatch.setattr(app_module, "init_db", lambda config: None)
    monkeypatch.setattr(app_module, "init_redis", lambda config: None)

    flask_app = app_module.create_app()
    rules = {rule.rule for rule in flask_app.url_map.iter_rules()}

    assert "/api/issue/staffs/query" in rules
    assert "/api/issue/staffs/add" in rules
    assert "/api/issue/staffs/update" in rules
    assert "/api/issue/staffs/delete" in rules
    assert "/api/issue/staffs/all-active" in rules
