# --- add/keep at top ---
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from .api import alerts, costs
from .core.config import settings
from .db import Base, engine
from .services.ingest import seed_demo_costs

def require_token(
    authorization: Optional[str] = Header(default=None),
    x_api_token:  Optional[str] = Header(default=None),
    x_api_key:    Optional[str] = Header(default=None),
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

# CORS: allow Authorization and custom headers from the browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.on_event("startup")
def init_db():
    Base.metadata.create_all(bind=engine)
    if settings.DEMO_MODE:
        with Session(engine) as db:
            if not db.execute(text("SELECT 1 FROM costs LIMIT 1")).fetchone():
                seed_demo_costs(db)

@app.get("/health")
def health():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"status":"ok"}

app.include_router(costs.router, dependencies=[Depends(require_token)])
app.include_router(alerts.router, dependencies=[Depends(require_token)])
