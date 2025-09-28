from fastapi import FastAPI
from sqlalchemy import text, select
from .db import engine, Base
from .core.config import settings
from .api import costs, alerts
from .services.ingest import seed_demo_costs
from sqlalchemy.orm import Session

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
