import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from flask_cors import CORS
from config import get_config
from utils.db import init_db
from utils.redis_client import init_redis


def create_app():
    config = get_config()
    app = Flask(__name__)
    app.config.from_object(config)
    CORS(app, supports_credentials=True, origins=["http://localhost:8000", "http://localhost:8001"])

    init_db(config)
    init_redis(config)

    from blueprints.auth import auth_bp
    from blueprints.user import user_bp
    from blueprints.role import role_bp
    from blueprints.audit_log import audit_log_bp
    from blueprints.dashboard import dashboard_bp
    from blueprints.issue_admin import issue_admin_bp
    from blueprints.issue_bug import issue_bug_bp
    from blueprints.issue_poc import issue_poc_bp
    from blueprints.issue_product import issue_product_bp
    from blueprints.issue_responsibility import issue_responsibility_bp
    from blueprints.issue_staff import issue_staff_bp
    from blueprints.issue_statistic import issue_statistic_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(role_bp)
    app.register_blueprint(audit_log_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(issue_product_bp)
    app.register_blueprint(issue_staff_bp)
    app.register_blueprint(issue_bug_bp)
    app.register_blueprint(issue_responsibility_bp)
    app.register_blueprint(issue_poc_bp)
    app.register_blueprint(issue_statistic_bp)
    app.register_blueprint(issue_admin_bp)

    return app


if __name__ == "__main__":
    import logging

    log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app.log")

    file_handler = logging.FileHandler(log_path, mode="w", encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(logging.Formatter(
        "[%(asctime)s] %(levelname)s in %(module)s: %(message)s"
    ))

    app = create_app()
    app.logger.addHandler(file_handler)

    werkzeug_logger = logging.getLogger("werkzeug")
    werkzeug_logger.addHandler(file_handler)

    config = get_config()
    app.logger.info("Backend starting on %s:%s", config.HOST, config.PORT)
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG if hasattr(config, "DEBUG") else True)
