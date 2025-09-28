from datetime import date, timedelta, datetime
from sqlalchemy.orm import Session
from sqlalchemy import select
import os
from sqlalchemy import select, func

from ..models import Cost, Alert
from .anomaly import is_three_sigma_window, pct_vs_weekday_baseline
from .slack import send_slack_sync

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
            msg = f"{svc}: " + " & ".join(parts)
            sev = "info"
            if pct is not None:
                if pct >= 1.0:    # ≥100% over baseline
                    sev = "critical"
                elif pct >= 0.5:  # ≥50%
                    sev = "warning"
                elif pct >= 0.25: # ≥25%
                    sev = "notice"

            a = Alert(
            created_at=datetime.now(datetime.timezone.utc),
            rule_id="anomaly-basic",
            severity=sev,
            message=msg,
            )
            recent = db.execute(
                select(func.count())
                .select_from(Alert)
                .where(
                    Alert.rule_id == "anomaly-basic",
                    Alert.severity == ("warning" if (pct or 0) < 1.0 else "critical"),
                    Alert.message == msg,
                    Alert.created_at >= datetime.now(datetime.timezone.utc) - timedelta(minutes=60),
                )
            ).scalar()

            if recent and recent > 0:
                continue  # skip duplicate

            db.add(a)
            created += 1

            # Slack deep link to your dashboard view
            fe = os.getenv("FRONTEND_BASE", "http://localhost:3000")
            link = f"{fe}?service={svc}&from={start.isoformat()}&to={latest.isoformat()}"
            send_slack_sync(f":rotating_light: {msg}\nInspect: {link}")

    if created:
        db.commit()
    return created
