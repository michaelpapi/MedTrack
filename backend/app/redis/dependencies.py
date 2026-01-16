from app.redis.redis_client import redis_client, REDIS_URL, delete_cache
import redis.asyncio as aioredis

def get_redis():
    """Return the redis client instance."""
    return redis_client


redis = aioredis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
