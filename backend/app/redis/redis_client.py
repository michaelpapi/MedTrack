import os
import redis
from dotenv import load_dotenv
import json

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")


redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

def cache_data(key: str, value, ttl: int = 300):
    """Store data with TTL (in seconds)"""
    redis_client.set(key, json.dumps(value), ex=ttl)


def get_cached_data(key: str):
    """Get cached data by key."""
    data = redis_client.get(key)
    if data:
        return json.loads(data)
    
    return None


def delete_cache(key: str):
    """Delete cached key."""
    redis_client.delete(key)



