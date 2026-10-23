from typing import List, Optional, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
import os


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_PREFIX: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./foodguardian.db"
    SYNC_DATABASE_URL: str = "sqlite:///./foodguardian.db"
    
    # Redis
    REDIS_URL: Optional[str] = "redis://localhost:6379/0"
    USE_REDIS_CACHE: bool = False
    CACHE_DEFAULT_TTL: int = 3600
    
    # Ollama Local AI Model
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"
    USE_OLLAMA: bool = True
    
    # Security
    API_SECRET: str = "dev-secret-key-change-in-production-min-32-chars-long"
    JWT_SECRET: str = "dev-jwt-secret-key-change-in-production-min-32-chars-long"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["*"]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Versions
    API_VERSION: str = "v1"
    REGULATORY_DATA_VERSION: str = "2026-08"
    SCORING_METHODOLOGY_VERSION: str = "1.0"
    LAST_REGULATORY_UPDATE: str = "2026-08-19"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]


settings = Settings()
