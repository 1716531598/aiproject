from io import BytesIO

from flask import Flask
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import IssueBug, IssueProduct, IssueProductMapping, IssueSyncLog
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


def test_import_bugs_adds_updates_failures_and_sync_log(monkeypatch):
    issue_bug, TestingSession = _setup_session(monkeypatch)

    db = TestingSession()
    product = IssueProduct(name="系统产品A", description="")
    db.add(product)
    db.commit()
    db.add(IssueProductMapping(product_id=product.id, source_type="zentao", source_name="禅道产品A"))
    db.add(
        IssueBug(
            bug_id="BUG-2",
            product_id=product.id,
            title="旧标题",
            root_cause="保留根因",
            impact_scope="保留影响范围",
            remark="保留备注",
        )
    )
    db.commit()
    product_id = product.id
    db.close()

    csv_content = (
        "Bug 编号,Bug 标题,所属产品,严重程度,状态,解决者,解决方案,是否确认,重现步骤,创建日期,解决日期,由谁创建,关键词\n"
        "BUG-1,新增问题,禅道产品A,P1,激活,张三,,已确认,影响版本：V1.0,2026-06-01 10:20:30,,李四,售前\n"
        "BUG-2,更新问题,禅道产品A,P2,已解决,王五,已修复,已确认,影响版本：V2.0,2026-05-01,2026-05-02,赵六,售后\n"
        "BUG-3,映射失败,未知产品,P3,激活,,,,2026-05-01,,赵六,\n"
        ",编号为空,禅道产品A,P4,激活,,,,2026-05-01,,赵六,\n"
    ).encode("utf-8")

    app = Flask(__name__)
    with app.test_request_context(
        method="POST",
        data={"file": (BytesIO(csv_content), "zentao.csv")},
        content_type="multipart/form-data",
    ):
        body = _json_body(issue_bug.import_bugs.__wrapped__())

    assert body["code"] == 200
    assert body["data"]["new_count"] == 1
    assert body["data"]["update_count"] == 1
    assert body["data"]["fail_count"] == 2
    assert body["data"]["failed"][0]["bug_id"] == "BUG-3"
    assert body["data"]["parse_failed"][0]["row"] == 4

    db = TestingSession()
    new_bug = db.query(IssueBug).filter(IssueBug.bug_id == "BUG-1").first()
    updated_bug = db.query(IssueBug).filter(IssueBug.bug_id == "BUG-2").first()
    sync_log = db.query(IssueSyncLog).first()

    assert new_bug.product_id == product_id
    assert new_bug.title == "新增问题"
    assert new_bug.severity == 1
    assert new_bug.stage == "售前"
    assert new_bug.affect_version == "V1.0"
    assert new_bug.created_date.year == 2026

    assert updated_bug.title == "更新问题"
    assert updated_bug.severity == 2
    assert updated_bug.affect_version == "V2.0"
    assert updated_bug.root_cause == "保留根因"
    assert updated_bug.impact_scope == "保留影响范围"
    assert updated_bug.remark == "保留备注"

    assert sync_log.trigger_type == "手动"
    assert sync_log.new_count == 1
    assert sync_log.update_count == 1
    assert sync_log.fail_count == 2
    assert sync_log.status == "部分成功"
    db.close()


def test_import_bugs_rejects_missing_or_non_csv_file(monkeypatch):
    issue_bug, _ = _setup_session(monkeypatch)
    app = Flask(__name__)

    with app.test_request_context(method="POST", data={}, content_type="multipart/form-data"):
        body = _json_body(issue_bug.import_bugs.__wrapped__())
        assert body["code"] == 400
        assert body["msg"] == "请上传 CSV 文件"

    with app.test_request_context(
        method="POST",
        data={"file": (BytesIO(b"test"), "zentao.txt")},
        content_type="multipart/form-data",
    ):
        body = _json_body(issue_bug.import_bugs.__wrapped__())
        assert body["code"] == 400
        assert body["msg"] == "请上传 CSV 文件"


def test_issue_bug_import_route_is_registered(monkeypatch):
    import app as app_module

    monkeypatch.setattr(app_module, "init_db", lambda config: None)
    monkeypatch.setattr(app_module, "init_redis", lambda config: None)

    flask_app = app_module.create_app()
    rules = {rule.rule for rule in flask_app.url_map.iter_rules()}

    assert "/api/issue/bugs/import" in rules
