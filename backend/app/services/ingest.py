# backend/app/services/ingest.py
from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from sqlalchemy import insert
from sqlalchemy.orm import Session

from ..models import Cost

SERVICES = ("EC2", "Lambda", "RDS", "S3")


def seed_demo_costs(db: Session, days: int = 60) -> None:
    """Seed de dados demo: últimos `days` dias até ontem."""
    end = date.today() - timedelta(days=1)          # ontem
    start = end - timedelta(days=days - 1)

    payload: list[dict[str, Any]] = []

    import random

    for i in range(days):
        d = start + timedelta(days=i)
        for svc in SERVICES:
            base = {"EC2": 45.0, "Lambda": 5.0, "RDS": 20.0, "S3": 10.0}[svc]
            jitter = random.uniform(-0.15, 0.15)     # ±15%
            amount = round(base * (1.0 + jitter), 2)
            payload.append({"day": d, "service": svc, "amount": amount})

    if not payload:
        return

    # SQLAlchemy 2.0-friendly e “mypy-proof”
    db.execute(insert(Cost.__table__), payload)
    db.commit()
