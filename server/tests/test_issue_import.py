from utils.issue_import import (
    extract_affect_version,
    extract_stage,
    parse_datetime,
    parse_severity,
    parse_status,
    parse_zentao_csv,
)


def test_parse_zentao_csv_normalizes_required_fields_and_utf8_bom():
    content = (
        "\ufeffBug 编号,Bug 标题,所属产品,严重程度,状态,解决者,解决方案,是否确认,重现步骤,创建日期,解决日期,由谁创建,关键词\n"
        "BUG-1,登录失败,禅道产品A,P1,已解决,张三,已修复,已确认,<p>影响版本：V1.0</p>,2026-06-01 10:20:30,2026-06-02,李四,售前\n"
    ).encode("utf-8")

    rows = parse_zentao_csv(content)

    assert len(rows) == 1
    assert rows[0]["bug_id"] == "BUG-1"
    assert rows[0]["title"] == "登录失败"
    assert rows[0]["source_product_name"] == "禅道产品A"
    assert rows[0]["severity"] == 1
    assert rows[0]["status"] == "已解决"
    assert rows[0]["affect_version"] == "V1.0"
    assert rows[0]["stage"] == "售前"


def test_parse_zentao_csv_missing_required_column_raises_error():
    content = "Bug 编号,Bug 标题,所属产品\nBUG-1,标题,产品\n".encode("utf-8")

    try:
        parse_zentao_csv(content)
    except ValueError as exc:
        assert "缺少必要列" in str(exc)
        assert "严重程度" in str(exc)
    else:
        raise AssertionError("missing required column should fail")


def test_field_parsers_handle_common_zentao_values():
    assert parse_severity("P2") == 2
    assert parse_severity("3") == 3
    assert parse_severity("未知") == 4
    assert parse_status("active") == "激活"
    assert parse_status("resolved") == "已解决"
    assert parse_status("closed") == "已关闭"
    assert parse_status("reopened") == "重新打开"
    assert extract_stage("售前,客户现场") == "售前"
    assert extract_stage("线上反馈") == "售后"
    assert extract_affect_version("影响版本: V2.3<br/>其它内容") == "V2.3"
    assert parse_datetime("2026-06-01 10:20:30").year == 2026
    assert parse_datetime("").__class__.__name__ == "NoneType"
