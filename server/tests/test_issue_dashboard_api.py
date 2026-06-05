from datetime import date

from flask import Flask
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import IssueBug, IssueResponsibility, IssueStaff, IssueTodo, User
from utils.db import Base


def _json_body(response):
    if isinstance(response, tuple):
        return response[0].get_json()
    return response.get_json()


def _setup_session(monkeypatch):
    from blueprints import issue_statistic

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine)
    monkeypatch.setattr(issue_statistic, "SessionLocal", TestingSession)
    monkeypatch.setattr(issue_statistic, "get_current_user", lambda: {"id": 1, "name": "zhangsan", "role_id": 1})
    return issue_statistic, TestingSession


def test_my_summary_and_score_ranking(monkeypatch):
    issue_statistic, TestingSession = _setup_session(monkeypatch)
    db = TestingSession()
    user = User(id=1, name="zhangsan", password_hash="hash", role_id=1)
    staff = IssueStaff(name="张三", email="zhangsan@example.com", user_id=user.id, department="研发")
    staff2 = IssueStaff(name="李四", email="lisi@example.com", department="测试")
    db.add_all([user, staff, staff2])
    db.commit()
    bug1 = IssueBug(bug_id="BUG-1", title="登录失败", staff_id=staff.id, severity=1, status="激活")
    bug2 = IssueBug(bug_id="BUG-2", title="样式异常", staff_id=staff.id, severity=2, status="已解决")
    db.add_all([bug1, bug2])
    db.commit()
    db.add(IssueTodo(content="跟进客户", staff_id=staff.id, deadline=date(2026, 6, 10), status="待处理"))
    db.add(IssueResponsibility(bug_id=bug1.id, staff_id=staff.id, role="开发", ratio=0.5, year=2026))
    db.add(IssueResponsibility(bug_id=bug2.id, staff_id=staff2.id, role="测试", ratio=1, year=2026))
    db.commit()
    db.close()

    app = Flask(__name__)
    with app.test_request_context(json={"year": 2026}):
        body = _json_body(issue_statistic.my_summary.__wrapped__())
    assert body["code"] == 200
    assert body["data"]["bug_stats"] == {"total": 2, "resolved": 1, "pending": 1}
    assert body["data"]["bugs"][0]["bug_id"] == "BUG-1"
    assert body["data"]["todos"][0]["content"] == "跟进客户"
    assert body["data"]["score"]["total"] == 0.05

    with app.test_request_context(json={"year": 2026}):
        body = _json_body(issue_statistic.score_ranking.__wrapped__())
    assert body["code"] == 200
    assert body["data"][0]["staff_name"] in ("张三", "李四")


def test_issue_dashboard_routes_are_registered(monkeypatch):
    import app as app_module

    monkeypatch.setattr(app_module, "init_db", lambda config: None)
    monkeypatch.setattr(app_module, "init_redis", lambda config: None)

    flask_app = app_module.create_app()
    rules = {rule.rule for rule in flask_app.url_map.iter_rules()}
    assert "/api/issue/statistics/my-summary" in rules
    assert "/api/issue/statistics/score-ranking" in rules
