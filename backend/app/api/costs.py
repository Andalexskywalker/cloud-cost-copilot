from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import distinct, func
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Cost
from ..schemas import CostOut

router = APIRouter(prefix="/costs", tags=["costs"])


@router.get("", response_model=list[CostOut])  # aceita /costs sem barra (evita 307)
@router.get("/", response_model=list[CostOut])
def list_costs(
    from_: date | None = Query(None, alias="from"),
    to: date | None = Query(None, alias="to"),
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
    to: date | None = Query(None, alias="to"),
    service: str | None = None,
):
    q = db.query(
        Cost.day.label("day"),
        Cost.service.label("service"),
        func.sum(Cost.amount).label("total"),
    )
    if from_:
        q = q.filter(Cost.day >= from_)
    if to:
        q = q.filter(Cost.day <= to)
    if service:
        q = q.filter(Cost.service == service)

    rows = q.group_by(Cost.day, Cost.service).order_by(Cost.day.asc(), Cost.service.asc()).all()
    return [{"day": str(r.day), "service": r.service, "total": float(r.total)} for r in rows]


@router.get("/services", response_model=list[str])
def list_services(
    from_: date | None = Query(None, alias="from"),
    to: date | None = Query(None, alias="to"),
    db: Session = Depends(get_db),
):
    q = db.query(distinct(Cost.service))
    if from_:
        q = q.filter(Cost.day >= from_)
    if to:
        q = q.filter(Cost.day <= to)
    return sorted([row[0] for row in q.all()])
