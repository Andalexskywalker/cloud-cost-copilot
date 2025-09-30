from sqlalchemy import Column, Date, DateTime, Integer, Numeric, String, Text

from .db import Base


class Cost(Base):
    __tablename__ = "costs"
    id = Column(Integer, primary_key=True)
    provider = Column(String(20), index=True)
    service = Column(String(100), index=True)
    usage_type = Column(String(100), index=True)
    day = Column(Date, index=True)
    amount = Column(Numeric(12,2))
    currency = Column(String(3), default="USD")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime)
    rule_id = Column(String(50))
    severity = Column(String(10))
    message = Column(Text)
