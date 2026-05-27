import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session

logger = logging.getLogger(__name__)

engine = None
_session_factory = None
Base = declarative_base()


def init_db(config):
    global engine, _session_factory
    try:
        engine = create_engine(config.SQLALCHEMY_DATABASE_URI, **config.SQLALCHEMY_ENGINE_OPTIONS)
        with engine.connect() as conn:
            conn.execute(__import__("sqlalchemy").text("SELECT 1"))
        logger.info("PostgreSQL connected: %s:%s/%s", config.PG_HOST, config.PG_PORT, config.PG_DATABASE)
    except Exception as e:
        logger.error("PostgreSQL connection FAILED: %s:%s/%s - %s", config.PG_HOST, config.PG_PORT, config.PG_DATABASE, e)
        raise
    _session_factory = scoped_session(sessionmaker(bind=engine))
    return engine


def get_session():
    if _session_factory is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    return _session_factory()


# backward compat - modules that import SessionLocal as a callable
SessionLocal = get_session
