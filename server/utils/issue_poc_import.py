from io import BytesIO

from docx import Document


def _cell_text(cell):
    return cell.text.strip()


def _find_column(headers, *keywords):
    for index, header in enumerate(headers):
        if any(keyword in header for keyword in keywords):
            return index
    return None


def _value(cells, index):
    return cells[index].strip() if index is not None and index < len(cells) else ""


def parse_weekly_report(file_content):
    document = Document(BytesIO(file_content))
    projects = []
    quality_comments = []
    errors = []

    for table in document.tables:
        if not table.rows:
            continue
        headers = [_cell_text(cell) for cell in table.rows[0].cells]
        if any("项目编码" in header for header in headers):
            projects.extend(_parse_poc_table(table, headers))
        elif any("质量" in header for header in headers) or any("备注" in header for header in headers):
            quality_comments.extend(_parse_quality_table(table, headers))

    return projects, quality_comments, errors


def _parse_poc_table(table, headers):
    columns = {
        "project_code": _find_column(headers, "项目编码"),
        "customer_name": _find_column(headers, "客户"),
        "product_raw": _find_column(headers, "产品", "网安"),
        "version": _find_column(headers, "版本"),
        "sales_staff": _find_column(headers, "销售", "支撑"),
        "weekly_content": _find_column(headers, "支撑内容", "本周"),
        "risk_desc": _find_column(headers, "风险描述", "问题"),
        "risk_category": _find_column(headers, "分类"),
        "bug_ids": _find_column(headers, "BugID", "Bug"),
        "close_party": _find_column(headers, "闭环"),
        "current_status": _find_column(headers, "状态"),
    }
    rows = []
    for row in table.rows[1:]:
        cells = [_cell_text(cell) for cell in row.cells]
        item = {key: _value(cells, index) for key, index in columns.items()}
        if not any(item.values()):
            continue
        item["has_risk"] = 1 if item.get("risk_desc") else 0
        rows.append(item)
    return rows


def _parse_quality_table(table, headers):
    bug_index = _find_column(headers, "BugID", "Bug")
    comment_index = _find_column(headers, "备注", "质量")
    if bug_index is None or comment_index is None:
        return []

    comments = []
    for row in table.rows[1:]:
        cells = [_cell_text(cell) for cell in row.cells]
        bug_id = _value(cells, bug_index)
        comment_text = _value(cells, comment_index)
        if bug_id and comment_text:
            comments.append({"bug_id": bug_id, "comment_text": comment_text})
    return comments
