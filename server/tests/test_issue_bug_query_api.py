from datetime import datetime

from flask import Flask
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import IssueBug, IssueModule, IssueProduct, IssueStaff, IssueType, IssueVersion
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
    return issue_bug, TestingSession


def test_bug_query_filters_sorts_paginates_and_returns_related_names(monkeypatch):
    issue_bug, TestingSession = _setup_session(monkeypatch)

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
    product_id = product.id
    module_id = module.id
    staff_id = staff.id
    version_id = version.id
    issue_type_id = issue_type.id
    db.add_all(
        [
            IssueBug(
                bug_id="BUG-1",
                product_id=product_id,
                module_id=module_id,
                staff_id=staff_id,
                plan_version_id=version_id,
                issue_type_id=issue_type_id,
                title="登录失败",
                severity=1,
                status="激活",
                affect_version="V1.0",
                created_date=datetime(2026, 6, 1, 10, 0, 0),
            ),
            IssueBug(
                bug_id="BUG-2",
                product_id=product_id,
                title="页面样式异常",
                severity=3,
                status="已解决",
                created_date=datetime(2026, 6, 2, 10, 0, 0),
            ),
        ]
    )
    db.commit()
    db.close()

    app = Flask(__name__)
    with app.test_request_context(
        json={
            "page": 1,
            "pageSize": 20,
            "keyword": "登录",
            "product_id": product_id,
            "severity": 1,
            "status": "激活",
            "issue_type_id": issue_type_id,
            "module_id": module_id,
            "staff_id": staff_id,
            "affect_version": "V1.0",
            "sortField": "created_date",
            "sortOrder": "desc",
        }
    ):
        body = _json_body(issue_bug.query.__wrapped__())

    assert body["code"] == 200
    assert body["data"]["total"] == 1
    item = body["data"]["aaData"][0]
    assert item["bug_id"] == "BUG-1"
    assert item["product_name"] == "RayScan"
    assert item["module_name"] == "登录"
    assert item["staff_name"] == "张三"
    assert item["plan_version"] == "V1.0"
    assert item["issue_type_name"] == "功能问题"

    with app.test_request_context(json={"page": 1, "pageSize": 1, "sortField": "created_date", "sortOrder": "desc"}):
        body = _json_body(issue_bug.query.__wrapped__())

    assert body["data"]["total"] == 2
    assert body["data"]["aaData"][0]["bug_id"] == "BUG-2"


def test_issue_bug_query_route_is_registered(monkeypatch):
    import app as app_module

    monkeypatch.setattr(app_module, "init_db", lambda config: None)
    monkeypatch.setattr(app_module, "init_redis", lambda config: None)

    flask_app = app_module.create_app()
    rules = {rule.rule for rule in flask_app.url_map.iter_rules()}

    assert "/api/issue/bugs/query" in rules
