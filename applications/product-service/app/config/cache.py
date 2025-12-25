import redis
import json
from typing import Optional, Any
from app.config.settings import get_settings

settings = get_settings()


class RedisCache:
    def __init__(self):
        self.client = None
        if settings.redis_url:
            try:
                self.client = redis.from_url(
                    settings.redis_url,
                    decode_responses=True
                )
                self.client.ping()
                print("Connected to Redis cache")
            except Exception as e:
                print(f"Redis unavailable, caching disabled: {e}")
                self.client = None

    def get(self, key: str) -> Optional[Any]:
        if not self.client:
            return None
        try:
            data = self.client.get(key)
            return json.loads(data) if data else None
        except Exception:
            return None

    def set(self, key: str, value: Any, ttl: int = None) -> bool:
        if not self.client:
            return False
        try:
            ttl = ttl or settings.cache_ttl
            self.client.setex(key, ttl, json.dumps(value))
            return True
        except Exception:
            return False

    def delete(self, key: str) -> bool:
        if not self.client:
            return False
        try:
            self.client.delete(key)
            return True
        except Exception:
            return False

    def delete_pattern(self, pattern: str) -> bool:
        """Delete all keys matching pattern"""
        if not self.client:
            return False
        try:
            keys = self.client.keys(pattern)
            if keys:
                self.client.delete(*keys)
            return True
        except Exception:
            return False


cache = RedisCache()
