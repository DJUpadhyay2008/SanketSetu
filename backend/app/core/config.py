from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PROJECT_NAME: str = "Sanket Setu API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    # Supabase Configuration
    SUPABASE_URL: str = Field(default="https://placeholder-project.supabase.co")
    SUPABASE_KEY: str = Field(default="placeholder-key")
    DATABASE_URL: str = Field(default="postgresql://postgres:postgres@localhost:5432/postgres")

    # Authentication Config
    GOOGLE_CLIENT_ID: str = Field(default="")
    GOOGLE_CLIENT_SECRET: str = Field(default="")
    JWT_SECRET: str = Field(default="super-secret-key-change-in-production-1234567890!")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 11520  # 8 days

    # AI configuration (centralized)
    GEMINI_API_KEY: str = Field(default="")
    OPENROUTER_API_KEY: str = Field(default="")
    OPENROUTER_MODEL: str = Field(default="z-ai/glm-5.2:free")

    # CORS Origins (Allowed for Dev)
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

settings = Settings()
