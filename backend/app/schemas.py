from datetime import date, datetime

from pydantic import BaseModel


class CostOut(BaseModel):
    id: int
    provider: str
    service: str
    usage_type: str
    day: date
    amount: float
    currency: str

    class Config:
        from_attributes = True


class AlertOut(BaseModel):
    id: int
    created_at: datetime
    rule_id: str
    severity: str
    message: str

    class Config:
        from_attributes = True
