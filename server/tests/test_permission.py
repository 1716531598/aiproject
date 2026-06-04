import json
from unittest.mock import patch, MagicMock

import pytest
from flask import Flask

from utils.permission import require_permission


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def app():
    """Create a minimal Flask app to provide application context for jsonify."""
    app = Flask(__name__)
    return app


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_view_func():
    """Return a simple view function that returns a success marker."""

    @require_permission("some.permission")
    def view():
        return json.dumps({"ok": True})

    return view


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestRequirePermission:
    """Unit tests for @require_permission decorator."""

    @patch("utils.permission.get_current_user", return_value=None)
    def test_no_session_returns_401(self, _mock_user, app):
        """When get_current_user() returns None the decorator should return
        a 401 error response."""
        view = _make_view_func()
        with app.app_context():
            resp = view()

        # error() returns a (Response, 200) tuple; get the JSON body
        body = resp[0].get_json() if isinstance(resp, tuple) else resp.get_json()
        assert body["code"] == 401
        assert body["success"] is False
        assert body["msg"] == "未登录"

    @patch("utils.permission.SessionLocal")
    @patch("utils.permission.get_current_user", return_value={"id": 1, "name": "test", "role_id": None})
    def test_no_role_id_returns_403(self, _mock_user, mock_session_local, app):
        """When the session has no role_id the decorator should return 403
        without querying the database."""
        view = _make_view_func()
        with app.app_context():
            resp = view()

        body = resp[0].get_json() if isinstance(resp, tuple) else resp.get_json()
        assert body["code"] == 403
        assert body["success"] is False
        assert body["msg"] == "无访问权限"
        # DB session should never be created
        mock_session_local.assert_not_called()

    @patch("utils.permission.SessionLocal")
    @patch("utils.permission.get_current_user", return_value={"id": 1, "name": "admin", "role_id": 1})
    def test_has_permission_passes_through(self, _mock_user, mock_session_local, app):
        """When the user's role has the required permission the decorated
        function should be called normally."""
        # Setup mock DB session
        mock_db = MagicMock()
        mock_session_local.return_value = mock_db

        # Mock the query chain: db.query(Permission).join(...).filter(...).filter(...).first()
        mock_perm = MagicMock()
        mock_query = MagicMock()
        mock_query.join.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = mock_perm
        mock_db.query.return_value = mock_query

        view = _make_view_func()
        with app.app_context():
            resp = view()

        # The view function should have been called (returns JSON string)
        assert resp == json.dumps({"ok": True})
        mock_db.close.assert_called_once()

    @patch("utils.permission.SessionLocal")
    @patch("utils.permission.get_current_user", return_value={"id": 2, "name": "user", "role_id": 2})
    def test_missing_permission_returns_403(self, _mock_user, mock_session_local, app):
        """When the user's role does NOT have the required permission the
        decorator should return 403."""
        # Setup mock DB session
        mock_db = MagicMock()
        mock_session_local.return_value = mock_db

        # Mock the query chain to return None (permission not found)
        mock_query = MagicMock()
        mock_query.join.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = None
        mock_db.query.return_value = mock_query

        view = _make_view_func()
        with app.app_context():
            resp = view()

        body = resp[0].get_json() if isinstance(resp, tuple) else resp.get_json()
        assert body["code"] == 403
        assert body["success"] is False
        assert body["msg"] == "无操作权限"
        mock_db.close.assert_called_once()

    @patch("utils.permission.SessionLocal")
    @patch("utils.permission.get_current_user", return_value={"id": 2, "name": "user", "role_id": 2})
    def test_db_session_closed_on_permission_check_pass(self, _mock_user, mock_session_local, app):
        """DB session should always be closed, even when permission check passes."""
        mock_db = MagicMock()
        mock_session_local.return_value = mock_db

        mock_perm = MagicMock()
        mock_query = MagicMock()
        mock_query.join.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = mock_perm
        mock_db.query.return_value = mock_query

        view = _make_view_func()
        with app.app_context():
            view()

        mock_db.close.assert_called_once()
