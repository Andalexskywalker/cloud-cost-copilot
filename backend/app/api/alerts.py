from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Alert

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("/")
def list_alerts(db: Session = Depends(get_db)):
    rows = db.query(Alert).order_by(Alert.created_at.desc()).limit(100).all()
    return [
        {
            "id": a.id,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "rule_id": a.rule_id,
            "severity": a.severity,
            "message": a.message,
        }
        for a in rows
    ]
