from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./costs.db"  # default para dev offline
    API_DEMO_TOKEN: str = ""
    # CSV (ex.: "http://localhost:3000,https://o-teu-dominio") ou "*" em dev
    ALLOW_ORIGINS: str = "*"

    @property
    def allow_origins_list(self) -> list[str]:
        if self.ALLOW_ORIGINS.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.ALLOW_ORIGINS.split(",") if o.strip()]

settings = Settings()
