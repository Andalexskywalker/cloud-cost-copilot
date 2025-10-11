from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from .api import alerts, costs
from .core.config import settings
from .db import Base, engine
from .services.ingest import seed_demo_costs
from sqlalchemy import text
from .db import engine


def require_token(
    authorization: Optional[str] = Header(default=None),
    x_api_token: Optional[str] = Header(default=None),
    x_api_key: Optional[str] = Header(default=None),
):
    token = settings.API_DEMO_TOKEN
    if not token:
        return
    provided = None
    if authorization:
        low = authorization.lower()
        if low.startswith("bearer "):
            provided = authorization[7:]
        else:
            provided = authorization.replace("Bearer ", "", 1)
    provided = provided or x_api_token or x_api_key
    if provided != token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


app = FastAPI(title="Cloud Cost Copilot")

# CORS (adjust origins for prod)
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from .core.config import settings
from .db import engine

app = FastAPI(title="Cloud Cost Copilot")

# CORS (usa valores das settings)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allow_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def init_db():
    Base.metadata.create_all(bind=engine)
    if settings.DEMO_MODE:
        with Session(engine) as db:
            if not db.execute(text("SELECT 1 FROM costs LIMIT 1")).fetchone():
                seed_demo_costs(db)


def get_db():
    db = Session()
    try:
        yield db
    finally:
        db.close()


@app.get("/healthz")  # liveness: app up (no DB check)
def healthz():
    return {"status": "ok"}


# Readyz (db ping)
@app.get("/readyz")
def readyz():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"db": "ok"}


@app.get("/health")  # compatibility alias
def health():
    return {"status": "ok"}


# Protected routers (no token required if API_DEMO_TOKEN is empty)
app.include_router(costs.router, dependencies=[Depends(require_token)])
app.include_router(alerts.router, dependencies=[Depends(require_token)])
