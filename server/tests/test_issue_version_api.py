from datetime import date

from flask import Flask
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import IssueAssessment, IssueBug, IssueProduct, IssueVersion
from utils.db import Base


def _json_body(response):
    if isinstance(response, tuple):
        return response[0].get_json()
    return response.get_json()


def _setup_session(monkeypatch):
    from blueprints import issue_version

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine)
    monkeypatch.setattr(issue_version, "SessionLocal", TestingSession)
    return issue_version, TestingSession


def test_version_crud_flow(monkeypatch):
    issue_version, TestingSession = _setup_session(monkeypatch)

    db = TestingSession()
    product = IssueProduct(name="RayScan", description="")
    db.add(product)
    db.commit()
    product_id = product.id
    db.close()

    app = Flask(__name__)

    with app.test_request_context(
        json={"product_id": product_id, "version": "V1.0", "plan_date": "2026-07-01", "status": "开发中"}
    ):
        body = _json_body(issue_version.add.__wrapped__())
        assert body["code"] == 200

    with app.test_request_context(
        json={"product_id": product_id, "version": "V1.0", "plan_date": "2026-07-01", "status": "开发中"}
    ):
        body = _json_body(issue_version.add.__wrapped__())
        assert body["code"] == 400
        assert body["msg"] == "版本号已存在"

    with app.test_request_context(json={"page": 1, "pageSize": 20, "product_id": product_id}):
        body = _json_body(issue_version.query.__wrapped__())
        assert body["code"] == 200
        assert body["data"]["total"] == 1
        assert body["data"]["aaData"][0]["version"] == "V1.0"
        assert body["data"]["aaData"][0]["product_name"] == "RayScan"
        assert body["data"]["aaData"][0]["bug_count"] == 0

    db = TestingSession()
    version = db.query(IssueVersion).filter(IssueVersion.version == "V1.0").first()
    version_id = version.id
    db.close()

    with app.test_request_context(json={"id": version_id, "version": "V1.1", "status": "规划中"}):
        body = _json_body(issue_version.update.__wrapped__())
        assert body["code"] == 200

    with app.test_request_context(json={"product_id": product_id}):
        body = _json_body(issue_version.by_product.__wrapped__())
        assert body["code"] == 200
        assert body["data"][0]["version"] == "V1.1"

    db = TestingSession()
    db.add(IssueBug(bug_id="BUG-VER-1", product_id=product_id, plan_version_id=version_id, title="version issue"))
    db.commit()
    db.close()

    with app.test_request_context(json={"id": version_id}):
        body = _json_body(issue_version.delete.__wrapped__())
        assert body["code"] == 400
        assert "不允许删除" in body["msg"]


def test_assessment_version_cannot_be_deleted(monkeypatch):
    issue_version, TestingSession = _setup_session(monkeypatch)

    db = TestingSession()
    product = IssueProduct(name="RayBox", description="")
    db.add(product)
    db.commit()
    version = IssueVersion(product_id=product.id, version="V2.0", plan_date=date(2026, 8, 1), status="规划中")
    db.add(version)
    db.commit()
    db.add(IssueAssessment(product_id=product.id, version_id=version.id))
    db.commit()
    version_id = version.id
    db.close()

    app = Flask(__name__)
    with app.test_request_context(json={"id": version_id}):
        body = _json_body(issue_version.delete.__wrapped__())
        assert body["code"] == 400
        assert "考核版本" in body["msg"]


def test_issue_version_blueprint_is_registered(monkeypatch):
    import app as app_module

    monkeypatch.setattr(app_module, "init_db", lambda config: None)
    monkeypatch.setattr(app_module, "init_redis", lambda config: None)

    flask_app = app_module.create_app()
    rules = {rule.rule for rule in flask_app.url_map.iter_rules()}

    assert "/api/issue/versions/query" in rules
    assert "/api/issue/versions/by-product" in rules
