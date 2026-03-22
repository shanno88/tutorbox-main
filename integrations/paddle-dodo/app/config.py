from typing import Optional
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "dev"
    database_url: str = "sqlite:///./app.db"

    # JWT 配置
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24  # 24 小时

    paddle_env: str = "sandbox"
    paddle_api_key: str
    paddle_vendor_id: Optional[str] = None
    paddle_webhook_secret: Optional[str] = None

    paddle_price_id_basic: Optional[str] = None
    paddle_price_id_pro: Optional[str] = None

    # 试用配置
    trial_days: int = 7

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()
