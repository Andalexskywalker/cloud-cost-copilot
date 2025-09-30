from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Alert, Cost
from .anomaly import is_three_sigma_window, pct_vs_weekday_baseline


def evaluate_and_save_alerts(db: Session, lookback_days: int = 30, min_pct: float = 0.4):
    services = [r[0] for r in db.execute(select(Cost.service).distinct())]
    stmt = select(Cost.day).order_by(Cost.day.desc()).limit(1)
    latest = db.execute(stmt).scalar() or date.today()
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

        triggered = False
        parts = []

        if is_three_sigma_window(values):
            triggered = True
            parts.append("3-sigma spike vs rolling window")

        pct = pct_vs_weekday_baseline(wk)
        if pct and pct >= min_pct:
            triggered = True
            parts.append(f"{int(pct*100)}% above weekday baseline")

        if triggered:
            # choose severity however you like; example based on pct:
            sev = "info"
            if pct is not None:
                if pct >= 1.0:
                    sev = "critical"
                elif pct >= 0.5:
                    sev = "warning"
                elif pct >= 0.25:
                    sev = "notice"

            msg = f"{svc}: " + " & ".join(parts)

            a = Alert(
                created_at=datetime.now(timezone.utc).replace(tzinfo=None),
                rule_id="anomaly-basic",
                severity=sev,
                message=msg,
            )
            db.add(a)

            # Slack with deep link
            import os

            from .slack import send_slack_sync

            fe = os.getenv("FRONTEND_BASE", "http://localhost:3000")
            link = f"{fe}?service={svc}&from={start.isoformat()}&to={latest.isoformat()}"
            send_slack_sync(f":rotating_light: {msg}\nInspect: {link}")

            created += 1

    if created:
        db.commit()
    return created
