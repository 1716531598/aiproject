from datetime import datetime

from flask import Flask
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import IssueBug, IssuePocProject, IssueProduct, IssueStaff, IssueType
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
    monkeypatch.setattr(issue_statistic, "get_current_user", lambda: {"id": 1, "name": "admin", "role_id": 1})
    return issue_statistic, TestingSession


def _seed_statistics_data(TestingSession):
    db = TestingSession()
    product_a = IssueProduct(name="产品A")
    product_b = IssueProduct(name="产品B")
    staff_a = IssueStaff(name="张三", email="zhangsan-stat@example.com")
    staff_b = IssueStaff(name="李四", email="lisi-stat@example.com")
    type_a = IssueType(name="功能缺陷")
    type_b = IssueType(name="界面问题")
    db.add_all([product_a, product_b, staff_a, staff_b, type_a, type_b])
    db.commit()

    db.add_all(
        [
            IssueBug(
                bug_id="BUG-STAT-1",
                product_id=product_a.id,
                title="登录失败",
                status="激活",
                affect_version="V1.0",
                staff_id=staff_a.id,
                issue_type_id=type_a.id,
                created_date=datetime(2026, 6, 1, 9, 0, 0),
            ),
            IssueBug(
                bug_id="BUG-STAT-2",
                product_id=product_a.id,
                title="样式异常",
                status="已解决",
                affect_version="V1.0",
                staff_id=staff_a.id,
                issue_type_id=type_b.id,
                created_date=datetime(2026, 6, 2, 9, 0, 0),
            ),
            IssueBug(
                bug_id="BUG-STAT-3",
                product_id=product_a.id,
                title="历史遗留",
                status="已关闭",
                affect_version="",
                staff_id=staff_b.id,
                issue_type_id=type_a.id,
                created_date=datetime(2026, 5, 1, 9, 0, 0),
            ),
            IssueBug(
                bug_id="BUG-STAT-4",
                product_id=product_b.id,
                title="安装失败",
                status="激活",
                affect_version="V2.0",
                staff_id=staff_b.id,
                issue_type_id=type_a.id,
                created_date=datetime(2026, 6, 3, 9, 0, 0),
            ),
        ]
    )
    db.add_all(
        [
            IssuePocProject(project_code="POC-STAT-1", customer_name="客户A", current_status="已完成"),
            IssuePocProject(project_code="POC-STAT-2", customer_name="客户B", current_status="处理中"),
        ]
    )
    db.commit()
    product_a_id = product_a.id
    db.close()
    return product_a_id


def test_overview_by_product_and_by_version(monkeypatch):
    issue_statistic, TestingSession = _setup_session(monkeypatch)
    product_a_id = _seed_statistics_data(TestingSession)
    app = Flask(__name__)

    filters = {"start_date": "2026-06-01", "end_date": "2026-06-30"}
    with app.test_request_context(json=filters):
        body = _json_body(issue_statistic.overview.__wrapped__())
    assert body["code"] == 200
    assert body["data"] == {
        "bug_total": 3,
        "bug_resolved": 1,
        "bug_active": 2,
        "resolve_rate": 0.3333,
        "poc_total": 2,
        "poc_closed": 1,
        "poc_active": 1,
    }

    with app.test_request_context(json=filters):
        body = _json_body(issue_statistic.by_product.__wrapped__())
    assert body["code"] == 200
    product_a = next(item for item in body["data"] if item["product_name"] == "产品A")
    assert product_a["total"] == 2
    assert product_a["resolved"] == 1
    assert product_a["active"] == 1
    assert product_a["resolve_rate"] == 0.5

    with app.test_request_context(json={"product_id": product_a_id}):
        body = _json_body(issue_statistic.by_version.__wrapped__())
    assert body["code"] == 200
    by_version = {item["version"]: item for item in body["data"]}
    assert by_version["V1.0"]["total"] == 2
    assert by_version["V1.0"]["resolved"] == 1
    assert by_version["未填写影响版本"]["total"] == 1


def test_resolver_type_and_resolve_trend(monkeypatch):
    issue_statistic, TestingSession = _setup_session(monkeypatch)
    _seed_statistics_data(TestingSession)
    app = Flask(__name__)
    filters = {"start_date": "2026-06-01", "end_date": "2026-06-30"}

    with app.test_request_context(json=filters):
        body = _json_body(issue_statistic.by_resolver.__wrapped__())
    assert body["code"] == 200
    by_resolver = {item["staff_name"]: item for item in body["data"]}
    assert by_resolver["张三"]["total"] == 2
    assert by_resolver["张三"]["resolved"] == 1
    assert by_resolver["李四"]["active"] == 1

    with app.test_request_context(json=filters):
        body = _json_body(issue_statistic.by_type.__wrapped__())
    assert body["code"] == 200
    by_type = {item["type_name"]: item for item in body["data"]}
    assert by_type["功能缺陷"]["total"] == 2
    assert by_type["功能缺陷"]["ratio"] == 0.6667
    assert by_type["界面问题"]["total"] == 1

    with app.test_request_context(json=filters):
        body = _json_body(issue_statistic.resolve_trend.__wrapped__())
    assert body["code"] == 200
    trend = {(item["month"], item["product_name"]): item for item in body["data"]}
    assert trend[("2026-06", "产品A")]["total"] == 2
    assert trend[("2026-06", "产品A")]["resolve_rate"] == 0.5
    assert trend[("2026-06", "产品B")]["total"] == 1


def test_issue_statistics_routes_are_registered(monkeypatch):
    import app as app_module

    monkeypatch.setattr(app_module, "init_db", lambda config: None)
    monkeypatch.setattr(app_module, "init_redis", lambda config: None)

    flask_app = app_module.create_app()
    rules = {rule.rule for rule in flask_app.url_map.iter_rules()}
    assert "/api/issue/statistics/overview" in rules
    assert "/api/issue/statistics/by-product" in rules
    assert "/api/issue/statistics/by-version" in rules
    assert "/api/issue/statistics/by-resolver" in rules
    assert "/api/issue/statistics/by-type" in rules
    assert "/api/issue/statistics/resolve-trend" in rules
