from datetime import datetime, timezone, timedelta

from flask import Flask
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import IssueAssessment, IssueBug, IssueProduct, IssueSyncLog, IssueType, IssueVersion
from utils.db import Base


def _json_body(response):
    if isinstance(response, tuple):
        return response[0].get_json()
    return response.get_json()


def _setup_session(monkeypatch):
    from blueprints import issue_admin

    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine)
    monkeypatch.setattr(issue_admin, "SessionLocal", TestingSession)
    return issue_admin, TestingSession


def test_issue_type_crud_disables_when_used_by_bug(monkeypatch):
    issue_admin, TestingSession = _setup_session(monkeypatch)
    app = Flask(__name__)

    with app.test_request_context(json={"name": "性能问题", "status": "启用", "sort_order": 2}):
        body = _json_body(issue_admin.type_add.__wrapped__())
        assert body["code"] == 200

    with app.test_request_context(json={"name": "性能问题", "status": "启用", "sort_order": 3}):
        body = _json_body(issue_admin.type_add.__wrapped__())
        assert body["code"] == 400
        assert body["msg"] == "问题类型已存在"

    with app.test_request_context(json={"page": 1, "pageSize": 20, "sSearch": "性能"}):
        body = _json_body(issue_admin.type_query.__wrapped__())
        assert body["code"] == 200
        assert body["data"]["total"] == 1
        assert body["data"]["aaData"][0]["name"] == "性能问题"

    db = TestingSession()
    issue_type = db.query(IssueType).filter(IssueType.name == "性能问题").first()
    issue_type_id = issue_type.id
    product = IssueProduct(name="RayScan", description="")
    db.add(product)
    db.commit()
    db.add(IssueBug(bug_id="BUG-TYPE-1", product_id=product.id, title="type issue", issue_type_id=issue_type_id))
    db.commit()
    db.close()

    with app.test_request_context(json={"id": issue_type_id, "name": "性能缺陷", "sort_order": 5}):
        body = _json_body(issue_admin.type_update.__wrapped__())
        assert body["code"] == 200

    with app.test_request_context(json={"name": "体验问题", "status": "启用"}):
        body = _json_body(issue_admin.type_add.__wrapped__())
        assert body["code"] == 200

    with app.test_request_context(json={"id": issue_type_id, "name": "体验问题"}):
        body = _json_body(issue_admin.type_update.__wrapped__())
        assert body["code"] == 400
        assert body["msg"] == "问题类型已存在"

    with app.test_request_context(json={"id": issue_type_id}):
        body = _json_body(issue_admin.type_delete.__wrapped__())
        assert body["code"] == 200

    db = TestingSession()
    disabled_type = db.get(IssueType, issue_type_id)
    assert disabled_type.name == "性能缺陷"
    assert disabled_type.status == "禁用"
    db.close()


def test_assessment_config_query_add_remove(monkeypatch):
    issue_admin, TestingSession = _setup_session(monkeypatch)

    db = TestingSession()
    product = IssueProduct(name="RayBox", description="")
    db.add(product)
    db.commit()
    version = IssueVersion(product_id=product.id, version="V1.0", status="规划中")
    db.add(version)
    db.commit()
    product_id = product.id
    version_id = version.id
    db.close()

    app = Flask(__name__)
    with app.test_request_context(json={"product_id": product_id, "version_id": version_id}):
        body = _json_body(issue_admin.assessment_add.__wrapped__())
        assert body["code"] == 200

    with app.test_request_context(json={"product_id": product_id, "version_id": version_id}):
        body = _json_body(issue_admin.assessment_add.__wrapped__())
        assert body["code"] == 400
        assert body["msg"] == "考核配置已存在"

    with app.test_request_context(json={"page": 1, "pageSize": 20, "product_id": product_id}):
        body = _json_body(issue_admin.assessment_query.__wrapped__())
        assert body["code"] == 200
        assert body["data"]["total"] == 1
        assert body["data"]["aaData"][0]["product_name"] == "RayBox"
        assert body["data"]["aaData"][0]["version"] == "V1.0"

    db = TestingSession()
    assessment_id = db.query(IssueAssessment).first().id
    db.close()

    with app.test_request_context(json={"id": assessment_id}):
        body = _json_body(issue_admin.assessment_remove.__wrapped__())
        assert body["code"] == 200

    db = TestingSession()
    assert db.query(IssueAssessment).count() == 0
    db.close()


def test_email_config_and_test_mail_log(monkeypatch, tmp_path):
    issue_admin, _ = _setup_session(monkeypatch)
    config_path = tmp_path / "email-config.json"
    log_path = tmp_path / "email-logs.json"
    monkeypatch.setattr(issue_admin, "EMAIL_CONFIG_PATH", config_path)
    monkeypatch.setattr(issue_admin, "EMAIL_LOG_PATH", log_path)

    sent_messages = []

    class DummySMTP:
        def __init__(self, host, port):
            self.host = host
            self.port = port

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def starttls(self):
            return None

        def login(self, sender, password):
            return None

        def send_message(self, message):
            sent_messages.append(message)

    monkeypatch.setattr(issue_admin.smtplib, "SMTP", DummySMTP)

    app = Flask(__name__)
    payload = {
        "smtp_host": "smtp.example.com",
        "smtp_port": 587,
        "smtp_sender": "noreply@example.com",
        "smtp_password": "secret",
        "notify_bug_new": True,
        "notify_responsibility": True,
        "notify_todo": False,
        "notify_bug_reopen": True,
    }
    with app.test_request_context(method="POST", json=payload):
        body = _json_body(issue_admin.email_config.__wrapped__())
        assert body["code"] == 200

    with app.test_request_context():
        body = _json_body(issue_admin.email_config.__wrapped__())
        assert body["code"] == 200
        assert body["data"]["smtp_password"] == "******"
        assert body["data"]["smtp_sender"] == "noreply@example.com"

    masked_payload = payload.copy()
    masked_payload["smtp_sender"] = "ops@example.com"
    masked_payload["smtp_password"] = "******"
    with app.test_request_context(method="POST", json=masked_payload):
        body = _json_body(issue_admin.email_config.__wrapped__())
        assert body["code"] == 200

    saved_config = issue_admin._load_json(config_path, {})
    assert saved_config["smtp_sender"] == "ops@example.com"
    assert saved_config["smtp_password"] == "secret"

    with app.test_request_context(method="POST", json={"to_email": "tester@example.com"}):
        body = _json_body(issue_admin.email_test.__wrapped__())
        assert body["code"] == 200
        assert len(sent_messages) == 1

    with app.test_request_context():
        body = _json_body(issue_admin.email_logs.__wrapped__())
        assert body["code"] == 200
        assert body["data"][0]["to_email"] == "tester@example.com"
        assert body["data"][0]["status"] == "成功"


def test_sync_log_query_filters_status(monkeypatch):
    issue_admin, TestingSession = _setup_session(monkeypatch)

    db = TestingSession()
    db.add(IssueSyncLog(trigger_type="手动", new_count=2, update_count=1, fail_count=0, status="成功"))
    db.add(IssueSyncLog(trigger_type="自动", new_count=0, update_count=0, fail_count=3, status="失败"))
    db.commit()
    db.close()

    app = Flask(__name__)
    with app.test_request_context(json={"page": 1, "pageSize": 20, "status": "失败"}):
        body = _json_body(issue_admin.sync_logs_query.__wrapped__())
        assert body["code"] == 200
        assert body["data"]["total"] == 1
        assert body["data"]["aaData"][0]["trigger_type"] == "自动"
        assert body["data"]["aaData"][0]["fail_count"] == 3


def test_issue_admin_routes_are_registered(monkeypatch):
    import app as app_module

    monkeypatch.setattr(app_module, "init_db", lambda config: None)
    monkeypatch.setattr(app_module, "init_redis", lambda config: None)

    flask_app = app_module.create_app()
    rules = {rule.rule for rule in flask_app.url_map.iter_rules()}

    assert "/api/issue/admin/types/query" in rules
    assert "/api/issue/admin/assessment/query" in rules
    assert "/api/issue/admin/email/config" in rules
    assert "/api/issue/admin/email/test" in rules
    assert "/api/issue/admin/email/logs" in rules
    assert "/api/issue/admin/sync-logs/query" in rules
