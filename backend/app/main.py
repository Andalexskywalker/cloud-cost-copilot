from fastapi import FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from .api import alerts, costs
from .core.config import settings
from .db import Base, engine
from .services.ingest import seed_demo_costs
from fastapi import Depends, HTTPException, status, Header
from .core.config import settings

def require_token(authorization: str | None = Header(default=None)):
    token = settings.API_DEMO_TOKEN
    if token and authorization != f"Bearer {token}":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


app = FastAPI(title="Cloud Cost Copilot")


@app.on_event("startup")
def init_db():
    Base.metadata.create_all(bind=engine)
    if settings.DEMO_MODE:
        with Session(engine) as db:
            # if empty, seed demo data
            if not db.execute(text("SELECT 1 FROM costs LIMIT 1")).fetchone():
                seed_demo_costs(db)


app.include_router(costs.router)
app.include_router(alerts.router)


@app.get("/health")
def health():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"status": "ok"}

app.include_router(costs.router, dependencies=[Depends(require_token)])
app.include_router(alerts.router, dependencies=[Depends(require_token)])