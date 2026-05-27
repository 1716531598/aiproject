import os
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()


class BaseConfig:
    SECRET_KEY = os.getenv("SECRET_KEY", "ironman-secret-key-change-in-production")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    PG_HOST = os.getenv("PG_HOST", "localhost")
    PG_PORT = os.getenv("PG_PORT", "5432")
    PG_USER = os.getenv("PG_USER", "postgres")
    PG_PASSWORD = os.getenv("PG_PASSWORD", "Test@123")
    PG_DATABASE = os.getenv("PG_DATABASE", "ironman")
    SQLALCHEMY_DATABASE_URI = (
        f"postgresql://{PG_USER}:{quote_plus(PG_PASSWORD)}@{PG_HOST}:{PG_PORT}/{PG_DATABASE}"
    )

    REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "Test@123")
    REDIS_DB = int(os.getenv("REDIS_DB", "0"))

    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "888"))

    DASHBOARD_MODE = os.getenv("DASHBOARD_MODE", "mock")


class DevConfig(BaseConfig):
    DEBUG = True


class ProdConfig(BaseConfig):
    DEBUG = False


class TestConfig(BaseConfig):
    TESTING = True
    _test_db = os.getenv("PG_DATABASE", "ironman_test")
    SQLALCHEMY_DATABASE_URI = (
        f"postgresql://{BaseConfig.PG_USER}:{quote_plus(BaseConfig.PG_PASSWORD)}"
        f"@{BaseConfig.PG_HOST}:{BaseConfig.PG_PORT}/{_test_db}"
    )


config_map = {
    "development": DevConfig,
    "production": ProdConfig,
    "testing": TestConfig,
}


def get_config():
    env = os.getenv("FLASK_ENV", "development")
    return config_map.get(env, DevConfig)
