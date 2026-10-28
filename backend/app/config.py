import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/farmlink_db")
    SQLITE_FALLBACK_URL: str = os.getenv("SQLITE_FALLBACK_URL", "sqlite:///./farmlink.db")
    
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super_secret_farmlink_jwt_key_2026_xyz987")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_FarmlinkDev2026")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "secret_FarmlinkDevSecret99")
    RAZORPAY_WEBHOOK_SECRET: str = os.getenv("RAZORPAY_WEBHOOK_SECRET", "webhook_FarmlinkSecretWebhook123")
    
    OFFER_EXPIRY_HOURS: int = int(os.getenv("OFFER_EXPIRY_HOURS", "24"))
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
