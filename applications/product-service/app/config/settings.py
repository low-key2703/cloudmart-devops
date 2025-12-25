from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    # App info
    app_name: str = "Product Service"
    debug: bool = False

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/cloudmart"

    # Redis
    redis_url: Optional[str] = None
    cache_ttl: int = 300

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
