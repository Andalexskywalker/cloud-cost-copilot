from datetime import date, timedelta, datetime
from sqlalchemy.orm import Session
from sqlalchemy import select
from ..models import Cost, Alert
from .anomaly import is_three_sigma_window, pct_vs_weekday_baseline

def evaluate_and_save_alerts(db: Session, lookback_days: int = 30, min_pct: float = 0.4):
    services = [r[0] for r in db.execute(select(Cost.service).distinct())]
    latest = db.execute(select(Cost.day).order_by(Cost.day.desc()).limit(1)).scalar() or date.today()
    start = latest - timedelta(days=lookback_days)
    created = 0
    for svc in services:
        rows = db.execute(
            select(Cost.day, Cost.amount)
            .where(Cost.service == svc, Cost.day >= start, Cost.day <= latest)
            .order_by(Cost.day.asc())
        ).all()
        if not rows:
            continue
        values = [float(v) for _, v in rows]
        wk = [(d.weekday(), float(v)) for d, v in rows]
        triggered, parts = False, []
        if is_three_sigma_window(values):
            triggered = True; parts += ["3σ spike vs rolling window"]
        pct = pct_vs_weekday_baseline(wk)
        if pct and pct >= min_pct:
            triggered = True; parts += [f"{int(pct*100)}% above weekday baseline"]
        if triggered:
            db.add(Alert(
                created_at=datetime.utcnow(),
                rule_id="anomaly-basic",
                severity="warning" if (pct or 0) < 1.0 else "critical",
                message=f"{svc}: " + " & ".join(parts),
            ))
            created += 1
    if created:
        db.commit()
    return created
