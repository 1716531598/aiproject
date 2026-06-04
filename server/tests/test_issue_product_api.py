from flask import Flask
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import IssueBug, IssueProduct
from utils.db import Base


def _json_body(response):
    if isinstance(response, tuple):
        return response[0].get_json()
    return response.get_json()


def test_product_crud_flow(monkeypatch):
    from blueprints import issue_product

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine)
    monkeypatch.setattr(issue_product, "SessionLocal", TestingSession)

    app = Flask(__name__)

    with app.test_request_context(json={"name": "RayScan", "description": "scanner"}):
        body = _json_body(issue_product.add.__wrapped__())
        assert body["code"] == 200

    with app.test_request_context(json={"name": "RayScan", "description": "duplicated"}):
        body = _json_body(issue_product.add.__wrapped__())
        assert body["code"] == 400
        assert body["msg"] == "产品名称已存在"

    db = TestingSession()
    product = db.query(IssueProduct).filter(IssueProduct.name == "RayScan").first()
    product_id = product.id
    db.add(IssueBug(bug_id="BUG-1", product_id=product.id, title="online issue"))
    db.commit()
    db.close()

    with app.test_request_context(json={"page": 1, "pageSize": 20, "sSearch": "Ray"}):
        body = _json_body(issue_product.query.__wrapped__())
        assert body["code"] == 200
        assert body["data"]["total"] == 1
        assert body["data"]["aaData"][0]["name"] == "RayScan"
        assert body["data"]["aaData"][0]["bug_count"] == 1

    with app.test_request_context(json={"id": product_id, "description": "updated"}):
        body = _json_body(issue_product.update.__wrapped__())
        assert body["code"] == 200

    db = TestingSession()
    assert db.get(IssueProduct, product_id).description == "updated"
    db.close()

    with app.test_request_context(json={"id": product_id}):
        body = _json_body(issue_product.delete.__wrapped__())
        assert body["code"] == 400
        assert "不允许删除" in body["msg"]


def test_product_mapping_update_replaces_existing_mappings(monkeypatch):
    from blueprints import issue_product
    from models import IssueProductMapping

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine)
    monkeypatch.setattr(issue_product, "SessionLocal", TestingSession)

    db = TestingSession()
    product = IssueProduct(name="RayBox", description="")
    db.add(product)
    db.commit()
    product_id = product.id
    db.close()

    app = Flask(__name__)
    payload = {
        "product_id": product_id,
        "mappings": [
            {"source_type": "zentao", "source_name": "RayBox-ZT"},
            {"source_type": "weekly", "source_name": "RayBox 周报"},
        ],
    }
    with app.test_request_context(json=payload):
        body = _json_body(issue_product.update_mapping.__wrapped__())
        assert body["code"] == 200

    db = TestingSession()
    mappings = db.query(IssueProductMapping).filter(IssueProductMapping.product_id == product_id).all()
    assert [(m.source_type, m.source_name) for m in mappings] == [
        ("zentao", "RayBox-ZT"),
        ("weekly", "RayBox 周报"),
    ]
    db.close()
