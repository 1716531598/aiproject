import csv
import html
import json
import re
from datetime import datetime
from io import StringIO

from models import IssueBug, IssueProductMapping, IssueSyncLog

REQUIRED_COLUMNS = {
    "bug_id": ("Bug 编号", "Bug编号", "编号", "ID"),
    "title": ("Bug 标题", "Bug标题", "标题"),
    "source_product_name": ("所属产品", "产品"),
    "severity": ("严重程度", "严重级别", "优先级"),
}

OPTIONAL_COLUMNS = {
    "status": ("状态", "Bug 状态", "Bug状态"),
    "resolver": ("解决者", "指派给", "处理人"),
    "resolution": ("解决方案", "解决方式"),
    "confirmed": ("是否确认", "确认状态"),
    "steps": ("重现步骤", "复现步骤", "步骤"),
    "created_date": ("创建日期", "创建时间"),
    "resolved_date": ("解决日期", "解决时间"),
    "created_by": ("由谁创建", "创建者", "创建人"),
    "keywords": ("关键词", "关键字"),
}


def _decode_csv(file_bytes):
    for encoding in ("utf-8-sig", "gb18030"):
        try:
            return file_bytes.decode(encoding)
        except UnicodeDecodeError:
            continue
    return file_bytes.decode("utf-8-sig", errors="replace")


def _normalize_text(value):
    if value is None:
        return ""
    return str(value).strip()


def _column_map(fieldnames):
    normalized = {_normalize_text(name): name for name in fieldnames or []}
    result = {}
    missing = []
    for target, aliases in REQUIRED_COLUMNS.items():
        source = next((normalized[alias] for alias in aliases if alias in normalized), None)
        if not source:
            missing.append(aliases[0])
        result[target] = source
    if missing:
        raise ValueError(f"缺少必要列: {', '.join(missing)}")

    for target, aliases in OPTIONAL_COLUMNS.items():
        result[target] = next((normalized[alias] for alias in aliases if alias in normalized), None)
    return result


def _get(row, columns, key):
    source = columns.get(key)
    return _normalize_text(row.get(source)) if source else ""


def parse_severity(value):
    text = _normalize_text(value).upper()
    match = re.search(r"[1-4]", text)
    return int(match.group(0)) if match else 4


def parse_status(value):
    text = _normalize_text(value).lower()
    mapping = {
        "active": "激活",
        "resolved": "已解决",
        "closed": "已关闭",
        "reopened": "重新打开",
        "open": "激活",
    }
    if text in mapping:
        return mapping[text]
    if "关闭" in text:
        return "已关闭"
    if "解决" in text:
        return "已解决"
    if "重新" in text or "reopen" in text:
        return "重新打开"
    return "激活"


def parse_datetime(value):
    text = _normalize_text(value)
    if not text:
        return None
    text = text.replace("/", "-")
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue
    return None


def _clean_html(value):
    text = html.unescape(_normalize_text(value))
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    return text.strip()


def extract_affect_version(steps):
    text = _clean_html(steps)
    match = re.search(r"(?:影响版本|版本)\s*[:：]\s*([^\s,，;；\n\r]+)", text)
    return match.group(1).strip() if match else ""


def extract_stage(keywords):
    return "售前" if "售前" in _normalize_text(keywords) else "售后"


def parse_zentao_csv(file_bytes):
    content = _decode_csv(file_bytes)
    reader = csv.DictReader(StringIO(content))
    columns = _column_map(reader.fieldnames)
    rows = []
    for index, row in enumerate(reader, start=1):
        steps = _get(row, columns, "steps")
        rows.append(
            {
                "row": index,
                "bug_id": _get(row, columns, "bug_id"),
                "title": _get(row, columns, "title"),
                "source_product_name": _get(row, columns, "source_product_name"),
                "severity": parse_severity(_get(row, columns, "severity")),
                "status": parse_status(_get(row, columns, "status")),
                "resolver": _get(row, columns, "resolver"),
                "resolution": _get(row, columns, "resolution"),
                "confirmed": _get(row, columns, "confirmed"),
                "steps": steps,
                "created_date": parse_datetime(_get(row, columns, "created_date")),
                "resolved_date": parse_datetime(_get(row, columns, "resolved_date")),
                "created_by": _get(row, columns, "created_by"),
                "stage": extract_stage(_get(row, columns, "keywords")),
                "affect_version": extract_affect_version(steps),
            }
        )
    return rows


def _apply_bug_fields(bug, row, product_id):
    bug.product_id = product_id
    bug.title = row["title"]
    bug.severity = row["severity"]
    bug.status = row["status"]
    bug.resolver = row["resolver"]
    bug.resolution = row["resolution"]
    bug.confirmed = row["confirmed"]
    bug.steps = row["steps"]
    bug.created_date = row["created_date"]
    bug.resolved_date = row["resolved_date"]
    bug.created_by = row["created_by"]
    bug.stage = row["stage"]
    bug.affect_version = row["affect_version"]
    bug.imported_at = datetime.now()


def import_zentao_csv(db, file_bytes):
    rows = parse_zentao_csv(file_bytes)
    new_count = 0
    update_count = 0
    new_bug_ids = []
    updated_bug_ids = []
    failed = []
    parse_failed = []

    for row in rows:
        if not row["bug_id"]:
            parse_failed.append({"row": row["row"], "reason": "Bug 编号为空"})
            continue
        if not row["title"]:
            parse_failed.append({"row": row["row"], "bug_id": row["bug_id"], "reason": "Bug 标题为空"})
            continue

        mapping = (
            db.query(IssueProductMapping)
            .filter(IssueProductMapping.source_type == "zentao")
            .filter(IssueProductMapping.source_name == row["source_product_name"])
            .first()
        )
        if not mapping:
            failed.append(
                {
                    "row": row["row"],
                    "bug_id": row["bug_id"],
                    "product_name": row["source_product_name"],
                    "reason": "产品映射不存在",
                }
            )
            continue

        bug = db.query(IssueBug).filter(IssueBug.bug_id == row["bug_id"]).first()
        if bug:
            _apply_bug_fields(bug, row, mapping.product_id)
            update_count += 1
            updated_bug_ids.append(row["bug_id"])
        else:
            bug = IssueBug(bug_id=row["bug_id"])
            _apply_bug_fields(bug, row, mapping.product_id)
            db.add(bug)
            new_count += 1
            new_bug_ids.append(row["bug_id"])

    fail_count = len(failed) + len(parse_failed)
    if fail_count and (new_count or update_count):
        status = "部分成功"
    elif fail_count:
        status = "失败"
    else:
        status = "成功"

    result = {
        "new_count": new_count,
        "update_count": update_count,
        "fail_count": fail_count,
        "failed": failed,
        "parse_failed": parse_failed,
        "new_bug_ids": new_bug_ids,
        "updated_bug_ids": updated_bug_ids,
    }
    db.add(
        IssueSyncLog(
            trigger_type="手动",
            new_count=new_count,
            update_count=update_count,
            fail_count=fail_count,
            status=status,
            error_detail=json.dumps({"failed": failed, "parse_failed": parse_failed}, ensure_ascii=False) if fail_count else "",
        )
    )
    return result
