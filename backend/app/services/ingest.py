import pandas as pd
from datetime import date, timedelta
from sqlalchemy.orm import Session
from ..models import Cost
import random

MOCK_SERVICES = ["EC2", "S3", "RDS", "Lambda"]

def seed_demo_costs(db: Session, days: int = 60):
    rng = random.Random(42)
    start = date.today() - timedelta(days=days)
    rows = []
    for d in range(days):
        day = start + timedelta(days=d)
        for svc in MOCK_SERVICES:
            base = {"EC2": 45, "S3": 10, "RDS": 20, "Lambda": 5}[svc]
            noise = rng.normalvariate(0, base*0.1)
            rows.append({
                "provider": "aws",
                "service": svc,
                "usage_type": "OnDemand",
                "day": day,
                "amount": max(0.0, base + noise),
                "currency": "USD",
            })
    df = pd.DataFrame(rows)
    if len(df) > 10:
        df.loc[df.sample(1, random_state=1).index, "amount"] *= 3
    db.bulk_insert_mappings(Cost, df.to_dict(orient="records"))
    db.commit()
