from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Stock
import json

# Setup DB connection
SQLALCHEMY_DATABASE_URL = "sqlite:///./stocks.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

stocks = db.query(Stock).all()
print(f"Found {len(stocks)} stocks.")

for stock in stocks:
    print(f"Ticker: {stock.ticker}")
    print(f"Forecasts (Raw): {stock.forecasts}")
    if stock.forecasts:
        try:
             # It might be a string if not automatically cast by SQLAlchemy for some versions, 
             # but usually JSON type handles it.
             data = stock.forecasts
             if isinstance(data, str):
                 data = json.loads(data)
             
             print(f"  TimesFM Keys: {data.get('timesfm', {}).keys()}")
             print(f"  Chronos Keys: {data.get('chronos', {}).keys()}")
        except Exception as e:
            print(f"  Error parsing forecast: {e}")
    else:
        print("  No forecasts found.")
    print("-" * 20)
