from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from ..db import get_db
from ..models import Cost
from ..schemas import CostOut

router = APIRouter(prefix="/costs", tags=["costs"])

@router.get("/", response_model=list[CostOut])
def list_costs(from_: date | None = None, to: date | None = None, service: str | None = None, db: Session = Depends(get_db)):
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
    group_by: str = Query("day,service"),
    db: Session = Depends(get_db),
    from_: date | None = None, to: date | None = None, service: str | None = None
):
    q = db.query(
        Cost.day.label("day"),
        Cost.service.label("service"),
        func.sum(Cost.amount).label("total")
    )
    if from_:
        q = q.filter(Cost.day >= from_)
    if to:
        q = q.filter(Cost.day <= to)
    if service:
        q = q.filter(Cost.service == service)
    q = q.group_by(Cost.day, Cost.service).order_by(Cost.day.asc(), Cost.service.asc())
    rows = q.all()
    return [{"day": str(r.day), "service": r.service, "total": float(r.total)} for r in rows]

