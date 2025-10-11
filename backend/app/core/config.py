from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./costs.db"  # <— ADICIONA isto
    API_DEMO_TOKEN: str = ""
    ALLOW_ORIGINS: list[str] = ["*"]


settings = Settings()
