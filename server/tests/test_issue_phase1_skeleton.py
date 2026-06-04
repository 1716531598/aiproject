import re
from pathlib import Path


def test_issue_blueprints_are_registered(monkeypatch):
    import app as app_module

    monkeypatch.setattr(app_module, "init_db", lambda config: None)
    monkeypatch.setattr(app_module, "init_redis", lambda config: None)

    flask_app = app_module.create_app()
    rules = {rule.rule for rule in flask_app.url_map.iter_rules()}

    assert "/api/issue/products/query" in rules
    assert "/api/issue/staffs/query" in rules
    assert "/api/issue/bugs/query" in rules
    assert "/api/issue/responsibilities/query" in rules
    assert "/api/issue/poc/query" in rules
    assert "/api/issue/statistics/overview" in rules
    assert "/api/issue/admin/health" in rules


def test_issue_models_have_database_migration():
    migrations_dir = Path(__file__).resolve().parents[1] / "migrations" / "versions"
    migration_text = "\n".join(path.read_text(encoding="utf-8") for path in migrations_dir.glob("*.py"))

    for table_name in [
        "issue_products",
        "issue_product_mappings",
        "issue_modules",
        "issue_versions",
        "issue_staffs",
        "issue_issue_types",
        "issue_bugs",
        "issue_bug_comments",
        "issue_bug_histories",
        "issue_responsibilities",
        "issue_assessments",
        "issue_poc_projects",
        "issue_poc_progresses",
        "issue_poc_comments",
        "issue_todos",
        "issue_sync_logs",
    ]:
        assert re.search(rf"create_table\(\s*['\"]{table_name}['\"]", migration_text)


def test_issue_frontend_route_skeleton_exists():
    project_root = Path(__file__).resolve().parents[2]
    routes_file = project_root / "web_react" / "products" / "demo" / "config" / "routes.ts"
    routes_text = routes_file.read_text(encoding="utf-8")

    assert "path: '/issue'" in routes_text
    assert "问题管理" in routes_text
    assert "Issue/BugList" in routes_text
    assert "Issue/Responsibility" in routes_text
    assert "Issue/PocList" in routes_text
    assert "Issue/Statistic" in routes_text
    assert "Issue/Product" in routes_text
    assert "Issue/Staff" in routes_text
