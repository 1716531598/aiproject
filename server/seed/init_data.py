import sys
import os
import glob
import bcrypt

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from alembic.config import Config as AlembicConfig
from alembic import command
from sqlalchemy import text

from config import get_config
from utils.db import init_db, get_session
from utils.redis_client import init_redis

SEEDS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "seeds")
DEFAULT_PASSWORD = "Test@123"


def _hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _get_seed_sql_files() -> list:
    """Return sorted list of .sql files under seeds directory."""
    pattern = os.path.join(SEEDS_DIR, "*.sql")
    files = sorted(glob.glob(pattern))
    issue_pattern = os.path.join(SEEDS_DIR, "issue_seeds", "*.sql")
    files.extend(sorted(glob.glob(issue_pattern)))
    return files


def _inject_password_hashes(sql_content: str) -> str:
    """Replace password placeholders with bcrypt hashes."""
    placeholders = {
        "{{ADMIN_PASSWORD_HASH}}": _hash_password(DEFAULT_PASSWORD),
        "{{USER_PASSWORD_HASH}}": _hash_password(DEFAULT_PASSWORD),
        "{{AUDIT_PASSWORD_HASH}}": _hash_password(DEFAULT_PASSWORD),
    }
    for placeholder, hashed in placeholders.items():
        sql_content = sql_content.replace(placeholder, hashed)
    return sql_content


def run_migrations():
    """Run Alembic migrations to head revision."""
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    alembic_ini = os.path.join(project_root, "alembic.ini")
    if not os.path.exists(alembic_ini):
        raise FileNotFoundError(f"alembic.ini not found at {alembic_ini}")
    alembic_cfg = AlembicConfig(alembic_ini)
    command.upgrade(alembic_cfg, "head")
    print("Database migrations applied (head).")


def run_seeds(session):
    """Execute seed SQL files in order within the given session."""
    sql_files = _get_seed_sql_files()
    if not sql_files:
        print("No seed SQL files found.")
        return

    for file_path in sql_files:
        filename = os.path.basename(file_path)
        print(f"Applying seed: {filename} ...")
        with open(file_path, "r", encoding="utf-8") as f:
            raw_sql = f.read()

        # Inject dynamic values (e.g., password hashes)
        sql = _inject_password_hashes(raw_sql)

        # Execute SQL safely via SQLAlchemy text()
        session.execute(text(sql))

    print("Seed data inserted successfully.")


def seed():
    config = get_config()

    # 1. Ensure DB connection & Redis
    init_db(config)
    init_redis(config)

    # 2. Run schema migrations (Alembic)
    run_migrations()

    # 3. Run seed data (SQL files)
    session = get_session()
    try:
        run_seeds(session)
        session.commit()
    except Exception as e:
        session.rollback()
        print(f"Seed error: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed()
