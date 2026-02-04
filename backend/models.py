from sqlalchemy import Column, Integer, String, Float, JSON, DateTime
from database import Base
from datetime import datetime

class Stock(Base):
    __tablename__ = "stocks"

    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    ticker = Column(String, index=True)
    stack = Column(String)
    price = Column(Float)
    change1M = Column(Float)
    change6M = Column(Float)
    change1Y = Column(Float)
    change3Y = Column(Float)
    projectedGrowth = Column(Float) # Deprecated, keeping for compat until migration
    projectedGrowth1M = Column(Float, default=0.0)
    projectedGrowth6M = Column(Float, default=0.0)
    projectedGrowth1Y = Column(Float, default=0.0)
    riskScore = Column(String)
    volatility = Column(String)
    history = Column(JSON)
    forecasts = Column(JSON, default={}) # Stores { timesfm: {...}, chronos: {...} }
    last_updated = Column(DateTime, default=datetime.utcnow)

