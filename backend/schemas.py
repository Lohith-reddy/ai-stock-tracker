from pydantic import BaseModel

class StockCreate(BaseModel):
    ticker: str
    stack: str
    change3Y: float = 0.0
    projectedGrowth: float = 0.0
    projectedGrowth1M: float = 0.0
    projectedGrowth6M: float = 0.0
    projectedGrowth1Y: float = 0.0
    riskScore: str = "Med"
    forecasts: dict = {}
