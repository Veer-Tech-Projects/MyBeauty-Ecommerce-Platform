import redis
from app.shared.config import settings

class RedisClient:
    _client = None

    @classmethod
    def get_client(cls) -> redis.Redis:
        """
        Returns a singleton Redis client.
        Safe to call repeatedly.
        """
        if cls._client is None:
            cls._client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True, # Critical: Returns str instead of bytes
                socket_timeout=5,
                retry_on_timeout=True
            )
        return cls._client

    @classmethod
    def get_sync_client(cls) -> redis.Redis:
        """Alias for get_client for clarity"""
        return cls.get_client()