import json
import asyncio
from functools import wraps
from datetime import datetime, date
from app.redis.dependencies import redis_client

def cache(ttl: int = 300):
    """
    Async decorator for caching FastAPI endpoint results in Redis.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
             # Remove non-serializable objects (like db sessions)
            serializable_kwargs = {
                k: v for k, v in kwargs.items() if k not in {"db", "request", "response"}
            }

            # Make a key based only on the kwargs
            key = f"{func.__name__}:{json.dumps(serializable_kwargs, sort_keys=True)}"
            redis = redis_client

            cached = await asyncio.to_thread(redis.get, key)
            if cached:
                return json.loads(cached)

            # Call the original function
            
            result = await func(*args, **kwargs)  # <-- force keyword args
             # ---  Convert ORM objects to serializable form ---
            # --- Convert objects recursively to JSON-safe ---
            def make_json_safe(obj):
                if isinstance(obj, list):
                    return [make_json_safe(i) for i in obj]
                elif isinstance(obj, dict):
                    return {k: make_json_safe(v) for k, v in obj.items()}
                elif hasattr(obj, "__dict__"):  # ORM object
                    return {
                        k: make_json_safe(v)
                        for k, v in vars(obj).items()
                        if not k.startswith("_")
                    }
                elif isinstance(obj, (datetime, date)):  # ✅ Fix for datetime
                    return obj.isoformat()
                return obj

            safe_result = make_json_safe(result)

            # Save in Redis (off main thread)
            await asyncio.to_thread(redis.setex, key, ttl, json.dumps(safe_result))
            return result
        
        return wrapper
    return decorator
