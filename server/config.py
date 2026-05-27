import os
import configparser
from urllib.parse import quote_plus

_conf = configparser.ConfigParser()
_conf.read(os.path.join(os.path.dirname(os.path.abspath(__file__)), "app.conf"), encoding="utf-8")

_section = "server"


def _conf_get(key, fallback=None):
    return _conf.get(_section, key, fallback=fallback)


def _conf_getint(key, fallback=0):
    return _conf.getint(_section, key, fallback=fallback)


class BaseConfig:
    SECRET_KEY = _conf_get("SECRET_KEY", "ironman-secret-key-change-in-production")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    PG_HOST = _conf_get("PG_HOST", "localhost")
    PG_PORT = _conf_get("PG_PORT", "5432")
    PG_USER = _conf_get("PG_USER", "postgres")
    PG_PASSWORD = _conf_get("PG_PASSWORD", "Test@123")
    PG_DATABASE = _conf_get("PG_DATABASE", "ironman")
    SQLALCHEMY_DATABASE_URI = (
        f"postgresql://{PG_USER}:{quote_plus(PG_PASSWORD)}@{PG_HOST}:{PG_PORT}/{PG_DATABASE}"
    )

    REDIS_HOST = _conf_get("REDIS_HOST", "localhost")
    REDIS_PORT = _conf_getint("REDIS_PORT", 6379)
    REDIS_PASSWORD = _conf_get("REDIS_PASSWORD", "Test@123")
    REDIS_DB = _conf_getint("REDIS_DB", 0)

    HOST = _conf_get("HOST", "0.0.0.0")
    PORT = _conf_getint("PORT", 888)

    DASHBOARD_MODE = _conf_get("DASHBOARD_MODE", "mock")


class DevConfig(BaseConfig):
    DEBUG = True


class ProdConfig(BaseConfig):
    DEBUG = False


class TestConfig(BaseConfig):
    TESTING = True
    _test_db = _conf_get("PG_DATABASE_TEST", "ironman_test")
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
    env = _conf_get("FLASK_ENV", "development")
    return config_map.get(env, DevConfig)
