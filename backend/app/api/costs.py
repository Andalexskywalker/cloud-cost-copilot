from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, distinct
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Cost
from ..schemas import CostOut

router = APIRouter(prefix="/costs", tags=["costs"])

# Helpers
def get_bounds(db: Session):
    return db.query(func.min(Cost.day), func.max(Cost.day)).one()

@router.get("", response_model=list[CostOut])
@router.get("/", response_model=list[CostOut])
def list_costs(
    from_: date | None = Query(None, alias="from"),
    to:     date | None = Query(None, alias="to"),
    service: str | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(Cost)
    if from_:
        q = q.filter(Cost.day >= from_)
    if to:
        q = q.filter(Cost.day <= to)
    if service:
        q = q.filter(Cost.service == service)
    return q.order_by(Cost.day.asc()).limit(5000).all()

@router.get("/aggregate")
def aggregate_costs(
    db: Session = Depends(get_db),
    from_: date | None = Query(None, alias="from"),
    to:     date | None = Query(None, alias="to"),
    service: str | None = None,
    fill: str = Query("clamp", pattern="^(clamp|zero)$"),
):
    min_day, max_day = get_bounds(db)
    if not max_day:
        # sem dados na DB
        return []

    # janela para query à DB (nunca depois do último dia com dados)
    q_from = from_ or min_day
    q_to   = min(to or max_day, max_day)
    rows: list[dict] = []

    if q_from <= q_to:
        q = db.query(
            Cost.day.label("day"),
            Cost.service.label("service"),
            func.sum(Cost.amount).label("total"),
        ).filter(Cost.day >= q_from, Cost.day <= q_to)
        if service:
            q = q.filter(Cost.service == service)
        base = (
            q.group_by(Cost.day, Cost.service)
             .order_by(Cost.day.asc(), Cost.service.asc())
             .all()
        )
        rows.extend({"day": str(r.day), "service": r.service, "total": float(r.total)} for r in base)

    # preencher zeros para dias depois do último registo (se pedido)
    if fill == "zero" and to and to > max_day:
        if service:
            services = [service]
        else:
            services = [s for (s,) in db.query(distinct(Cost.service)).all()]
        start = max(max_day + timedelta(days=1), from_ or max_day + timedelta(days=1))
        d = start
        while d <= to:
            ds = d.isoformat()
            for svc in services:
                rows.append({"day": ds, "service": svc, "total": 0.0})
            d += timedelta(days=1)

    return rows

@router.get("/services", response_model=list[str])
def list_services(
    from_: date | None = Query(None, alias="from"),
    to:     date | None = Query(None, alias="to"),
    db: Session = Depends(get_db),
):
    q = db.query(distinct(Cost.service))
    if from_:
        q = q.filter(Cost.day >= from_)
    if to:
        q = q.filter(Cost.day <= to)
    result = [row[0] for row in q.all()]
    if not result:
        # fallback: serviços históricos (útil quando range está só em dias sem dados)
        result = [s for (s,) in db.query(distinct(Cost.service)).all()]
    return sorted(result)
