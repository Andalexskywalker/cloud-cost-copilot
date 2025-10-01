from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    DEMO_MODE: int = 1
    SLACK_WEBHOOK_URL: str | None = None
    API_DEMO_TOKEN: str | None = None


settings = Settings()  # reads from env
