import logging
import redis
from config import get_config

logger = logging.getLogger(__name__)

_redis_client = None


def init_redis(config=None):
    global _redis_client
    if config is None:
        config = get_config()
    try:
        _redis_client = redis.Redis(
            host=config.REDIS_HOST,
            port=config.REDIS_PORT,
            password=config.REDIS_PASSWORD,
            db=config.REDIS_DB,
            decode_responses=True,
        )
        _redis_client.ping()
        logger.info("Redis connected: %s:%s", config.REDIS_HOST, config.REDIS_PORT)
    except Exception as e:
        logger.error("Redis connection FAILED: %s:%s - %s", config.REDIS_HOST, config.REDIS_PORT, e)
        raise
    return _redis_client


def get_redis():
    global _redis_client
    if _redis_client is None:
        _redis_client = init_redis()
    return _redis_client
