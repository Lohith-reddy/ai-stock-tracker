from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from database import get_db, engine, Base
from models import Stock
import service
import uvicorn
from contextlib import asynccontextmanager
from datetime import datetime, timedelta

# Create tables
Base.metadata.create_all(bind=engine)

# Initial Seed Data - Top Companies per 5 Layers of AI Stack
INITIAL_STOCKS = [
  # 1. Hardware & Semiconductors
  {"id": "hw-1", "name": "Nvidia", "ticker": "NVDA", "stack": "Hardware", "riskScore": "Med"},
  {"id": "hw-2", "name": "TSMC", "ticker": "TSM", "stack": "Hardware", "riskScore": "Low"},
  {"id": "hw-3", "name": "AMD", "ticker": "AMD", "stack": "Hardware", "riskScore": "Med"},
  {"id": "hw-4", "name": "Broadcom", "ticker": "AVGO", "stack": "Hardware", "riskScore": "Low"},
  {"id": "hw-5", "name": "Micron", "ticker": "MU", "stack": "Hardware", "riskScore": "High"},
  {"id": "hw-6", "name": "Intel", "ticker": "INTC", "stack": "Hardware", "riskScore": "High"},
  {"id": "hw-7", "name": "ARM Holdings", "ticker": "ARM", "stack": "Hardware", "riskScore": "Med"},
  {"id": "hw-8", "name": "Super Micro", "ticker": "SMCI", "stack": "Hardware", "riskScore": "High"},
  {"id": "hw-9", "name": "ASML", "ticker": "ASML", "stack": "Hardware", "riskScore": "Med"},
  {"id": "hw-10", "name": "Qualcomm", "ticker": "QCOM", "stack": "Hardware", "riskScore": "Med"},
  {"id": "hw-11", "name": "KLA Corp", "ticker": "KLAC", "stack": "Hardware", "riskScore": "Med"},
  {"id": "hw-12", "name": "Lam Research", "ticker": "LRCX", "stack": "Hardware", "riskScore": "Med"},
  {"id": "hw-13", "name": "Applied Materials", "ticker": "AMAT", "stack": "Hardware", "riskScore": "Med"},
  {"id": "hw-14", "name": "Texas Instruments", "ticker": "TXN", "stack": "Hardware", "riskScore": "Low"},

  # 2. Cloud & Infrastructure
  {"id": "cloud-1", "name": "Microsoft", "ticker": "MSFT", "stack": "Cloud & Infra", "riskScore": "Low"},
  {"id": "cloud-2", "name": "Amazon", "ticker": "AMZN", "stack": "Cloud & Infra", "riskScore": "Low"},
  {"id": "cloud-3", "name": "Google", "ticker": "GOOGL", "stack": "Cloud & Infra", "riskScore": "Low"},
  {"id": "cloud-4", "name": "Oracle", "ticker": "ORCL", "stack": "Cloud & Infra", "riskScore": "Med"},
  {"id": "cloud-5", "name": "Arista", "ticker": "ANET", "stack": "Cloud & Infra", "riskScore": "Med"},
  {"id": "cloud-6", "name": "Dell", "ticker": "DELL", "stack": "Cloud & Infra", "riskScore": "Med"},
  {"id": "cloud-7", "name": "IBM", "ticker": "IBM", "stack": "Cloud & Infra", "riskScore": "Low"},
  {"id": "cloud-8", "name": "Hewlett Packard", "ticker": "HPE", "stack": "Cloud & Infra", "riskScore": "Med"},
  {"id": "cloud-9", "name": "Cisco", "ticker": "CSCO", "stack": "Cloud & Infra", "riskScore": "Low"},
  {"id": "cloud-10", "name": "Cloudflare", "ticker": "NET", "stack": "Cloud & Infra", "riskScore": "High"},

  # 3. Data & MLOps
  {"id": "data-1", "name": "Snowflake", "ticker": "SNOW", "stack": "Data & MLOps", "riskScore": "High"},
  {"id": "data-2", "name": "Datadog", "ticker": "DDOG", "stack": "Data & MLOps", "riskScore": "High"},
  {"id": "data-3", "name": "MongoDB", "ticker": "MDB", "stack": "Data & MLOps", "riskScore": "High"},
  {"id": "data-4", "name": "Palantir", "ticker": "PLTR", "stack": "Data & MLOps", "riskScore": "High"},
  {"id": "data-5", "name": "Elastic", "ticker": "ESTC", "stack": "Data & MLOps", "riskScore": "High"},
  {"id": "data-6", "name": "Dynatrace", "ticker": "DT", "stack": "Data & MLOps", "riskScore": "Med"},
  {"id": "data-7", "name": "Teradata", "ticker": "TDC", "stack": "Data & MLOps", "riskScore": "Med"},
  {"id": "data-8", "name": "Confluent", "ticker": "CFLT", "stack": "Data & MLOps", "riskScore": "High"},

  # 4. Models & Platforms (Foundational)
  {"id": "model-1", "name": "Meta", "ticker": "META", "stack": "Models", "riskScore": "Med"},
  {"id": "model-2", "name": "Tesla", "ticker": "TSLA", "stack": "Models", "riskScore": "High"}, # FSD
  {"id": "model-3", "name": "Apple", "ticker": "AAPL", "stack": "Models", "riskScore": "Low"}, # Apple Intelligence

  # 5. AI Applications
  {"id": "app-1", "name": "Salesforce", "ticker": "CRM", "stack": "Applications", "riskScore": "Med"},
  {"id": "app-2", "name": "Adobe", "ticker": "ADBE", "stack": "Applications", "riskScore": "Med"},
  {"id": "app-3", "name": "ServiceNow", "ticker": "NOW", "stack": "Applications", "riskScore": "Med"},
  {"id": "app-4", "name": "Intuit", "ticker": "INTU", "stack": "Applications", "riskScore": "Low"},
  {"id": "app-5", "name": "CrowdStrike", "ticker": "CRWD", "stack": "Applications", "riskScore": "High"},
  {"id": "app-6", "name": "Palo Alto", "ticker": "PANW", "stack": "Applications", "riskScore": "Med"},
  {"id": "app-7", "name": "UiPath", "ticker": "PATH", "stack": "Applications", "riskScore": "High"},
  {"id": "app-8", "name": "SAP", "ticker": "SAP", "stack": "Applications", "riskScore": "Low"},
  {"id": "app-9", "name": "Workday", "ticker": "WDAY", "stack": "Applications", "riskScore": "Med"},
  {"id": "app-10", "name": "Atlassian", "ticker": "TEAM", "stack": "Applications", "riskScore": "Med"},
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed DB if empty
    db = next(get_db())
    if db.query(Stock).count() == 0:
        print("Seeding database...")
        for s in INITIAL_STOCKS:
            stock = Stock(
                id=s['id'], name=s['name'], ticker=s['ticker'], stack=s['stack'], riskScore=s['riskScore'],
                price=0.0, change1M=0.0, change6M=0.0, change1Y=0.0, change3Y=0.0, projectedGrowth=0.0, volatility="Low", history=[]
            )
            db.add(stock)
        db.commit()
        
        # Initial fetch in background
        print("Triggering initial data fetch...")
        for stock in db.query(Stock).all():
            service.update_stock_in_db(db, stock)
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/api/stocks")
def read_stocks(db: Session = Depends(get_db)):
    return db.query(Stock).all()

from schemas import StockCreate

@app.post("/api/stocks")
def create_stock(stock: StockCreate, db: Session = Depends(get_db)):
    db_stock = service.add_stock(db, stock.ticker, stock.stack)
    if not db_stock:
        raise HTTPException(status_code=400, detail="Invalid ticker or fetch error")
    return db_stock

@app.get("/api/forecasts/{ticker}")
def get_forecasts(ticker: str, db: Session = Depends(get_db)):
    """
    Returns the raw forecast data (TimesFM & Chronos) for a specific stock.
    Keys: timesfm, chronos
    Horizons: 1d, 1w, 1m, 6m, 1y
    """
    stock = db.query(Stock).filter(Stock.ticker == ticker.upper()).first()
    if not stock:
         raise HTTPException(status_code=404, detail="Stock not found")
    return stock.forecasts

@app.post("/api/admin/retrain")
def retrain_model(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Triggers the expensive Transfer Learning pipeline in the background.
    1. Pre-trains on SPY/Market Index
    2. Fine-tunes on current AI Portfolio
    """
    stocks = db.query(Stock).all()
    histories = []
    for stock in stocks:
         # Ensure we have data
         if stock.history and len(stock.history) > 60:
             histories.append(stock.history)
             
    if not histories:
        raise HTTPException(status_code=400, detail="Not enough data to train")
        
    background_tasks.add_task(service.predictor.auto_train, histories)
    return {"message": "Transfer learning pipeline started. This may take a few minutes."}

@app.get("/api/needs-refresh")
def check_needs_refresh(db: Session = Depends(get_db)):
    """
    Check if data is stale (>24 hours old).
    Returns: { "needs_refresh": bool, "last_updated": str | null }
    """
    stock = db.query(Stock).first()
    if not stock or not stock.last_updated:
        return {"needs_refresh": True, "last_updated": None}
    
    age = datetime.utcnow() - stock.last_updated
    needs_refresh = age > timedelta(hours=24)
    
    return {
        "needs_refresh": needs_refresh,
        "last_updated": stock.last_updated.isoformat(),
        "age_hours": round(age.total_seconds() / 3600, 1)
    }

@app.post("/api/refresh")
def refresh_all(
    db: Session = Depends(get_db),
    run_inference: bool = Query(default=False, description="Run ML inference (slow, ~5min)")
):
    """
    Refreshes stock data from Yahoo Finance.
    Only runs Foundation Model inference if run_inference=true.
    """
    stocks = db.query(Stock).all()
    histories = {}
    
    # 1. Update Data from Yahoo Finance
    for stock in stocks:
        service.update_stock_in_db(db, stock)
        if stock.history and len(stock.history) > 60:
            histories[stock.ticker] = stock.history
    
    # 2. Only run Foundation Models if explicitly requested
    if run_inference and histories:
        forecast_results = service.engine.predict_all(histories)
        
        # 3. Update DB with forecasts
        for stock in stocks:
            if stock.ticker in forecast_results:
                stock.forecasts = forecast_results[stock.ticker]
                # Update legacy fields with TimesFM 1M result as default
                try:
                    stock.projectedGrowth1M = stock.forecasts["timesfm"]["1m"]
                    stock.projectedGrowth6M = stock.forecasts["timesfm"]["6m"]
                    stock.projectedGrowth1Y = stock.forecasts["timesfm"]["1y"]
                    stock.projectedGrowth = stock.projectedGrowth1M
                except:
                    pass
        
        db.commit()
        return {"message": "Data updated and Foundation Model Inference completed"}
    
    db.commit()
    return {"message": "Stock data updated (no inference run)"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
