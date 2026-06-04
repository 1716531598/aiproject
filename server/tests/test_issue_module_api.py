from flask import Flask
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import IssueBug, IssueModule, IssueProduct
from utils.db import Base


def _json_body(response):
    if isinstance(response, tuple):
        return response[0].get_json()
    return response.get_json()


def _setup_session(monkeypatch):
    from blueprints import issue_module

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine)
    monkeypatch.setattr(issue_module, "SessionLocal", TestingSession)
    return issue_module, TestingSession


def test_module_crud_flow(monkeypatch):
    issue_module, TestingSession = _setup_session(monkeypatch)

    db = TestingSession()
    product = IssueProduct(name="RayScan", description="")
    db.add(product)
    db.commit()
    product_id = product.id
    db.close()

    app = Flask(__name__)

    with app.test_request_context(json={"product_id": product_id, "name": "扫描引擎"}):
        body = _json_body(issue_module.add.__wrapped__())
        assert body["code"] == 200

    with app.test_request_context(json={"product_id": product_id, "name": "扫描引擎"}):
        body = _json_body(issue_module.add.__wrapped__())
        assert body["code"] == 400
        assert body["msg"] == "模块名称已存在"

    with app.test_request_context(json={"page": 1, "pageSize": 20, "product_id": product_id}):
        body = _json_body(issue_module.query.__wrapped__())
        assert body["code"] == 200
        assert body["data"]["total"] == 1
        assert body["data"]["aaData"][0]["name"] == "扫描引擎"
        assert body["data"]["aaData"][0]["product_name"] == "RayScan"

    db = TestingSession()
    module = db.query(IssueModule).filter(IssueModule.name == "扫描引擎").first()
    module_id = module.id
    db.close()

    with app.test_request_context(json={"id": module_id, "name": "扫描核心"}):
        body = _json_body(issue_module.update.__wrapped__())
        assert body["code"] == 200

    with app.test_request_context(json={"product_id": product_id}):
        body = _json_body(issue_module.by_product.__wrapped__())
        assert body["code"] == 200
        assert body["data"][0]["name"] == "扫描核心"

    db = TestingSession()
    db.add(IssueBug(bug_id="BUG-MOD-1", product_id=product_id, module_id=module_id, title="module issue"))
    db.commit()
    db.close()

    with app.test_request_context(json={"id": module_id}):
        body = _json_body(issue_module.delete.__wrapped__())
        assert body["code"] == 400
        assert "不允许删除" in body["msg"]


def test_issue_module_blueprint_is_registered(monkeypatch):
    import app as app_module

    monkeypatch.setattr(app_module, "init_db", lambda config: None)
    monkeypatch.setattr(app_module, "init_redis", lambda config: None)

    flask_app = app_module.create_app()
    rules = {rule.rule for rule in flask_app.url_map.iter_rules()}

    assert "/api/issue/modules/query" in rules
    assert "/api/issue/modules/by-product" in rules
