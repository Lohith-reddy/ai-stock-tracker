import yfinance as yf
from models import Stock
import yfinance as yf
from models import Stock
import logging
from forecasting import engine
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_stock_in_db(db, stock_model):
    """
    Fetches latest data and updates the existing stock record.
    NOTE: PREDICTIONS are now handled separately by the Global Trainer in bulk.
    This function primarily updates price, history, and volatility.
    """
    try:
        t = yf.Ticker(stock_model.ticker)
        
        # history (fastest way for checking if valid)
        history_1d = t.history(period="1d")
        if history_1d.empty:
            logger.warning(f"No data found for {stock_model.ticker}")
            return
            
        current_price = history_1d["Close"].iloc[-1]
        history_full = t.history(period="5y")
        
        # Calculate changes
        def get_change(days_ago):
            if len(history_full) < days_ago: return 0.0
            old_price = history_full["Close"].iloc[-days_ago]
            return ((current_price - old_price) / old_price) * 100

        stock_model.price = float(current_price)
        stock_model.change1M = float(get_change(21))
        stock_model.change6M = float(get_change(126))
        stock_model.change1Y = float(get_change(252))
        stock_model.change3Y = float(get_change(252 * 3))
        
        chart_history = history_full["Close"].fillna(0).tolist()
        stock_model.history = [float(x) for x in chart_history]
        
        # Volatility
        if len(history_full) > 252:
             daily_returns = history_full["Close"].tail(252).pct_change().std()
        else:
             daily_returns = history_full["Close"].pct_change().std()
        
        # Annualized Vol
        annualized_vol = 0.0
        if daily_returns:
            annualized_vol = daily_returns * (252 ** 0.5) * 100
            
        if annualized_vol > 40:
            stock_model.volatility = "High"
        elif annualized_vol > 20:
            stock_model.volatility = "Medium"
        else:
            stock_model.volatility = "Low"
            
        if not stock_model.forecasts:
            stock_model.forecasts = {}

        # Update timestamp
        stock_model.last_updated = datetime.utcnow()

        db.commit()
        db.refresh(stock_model)
        
    except Exception as e:
        logger.error(f"Failed to update {stock_model.ticker}: {e}")

def add_stock(db, ticker: str, stack: str):
    """
    Adds a new stock to the database.
    """
    existing = db.query(Stock).filter(Stock.ticker == ticker).first()
    if existing: return existing

    try:
        t = yf.Ticker(ticker)
        history = t.history(period="1d")
        if history.empty: raise ValueError(f"Ticker {ticker} not found")
        name = t.info.get('shortName') or t.info.get('longName') or ticker
    except Exception as e:
        logger.error(f"Failed to verify ticker {ticker}: {e}")
        return None

    import uuid
    new_id = str(uuid.uuid4())
    
    new_stock = Stock(
        id=new_id,
        name=name,
        ticker=ticker,
        stack=stack,
        price=0.0,
        change1M=0.0,
        change6M=0.0,
        change1Y=0.0,
        change3Y=0.0,
        projectedGrowth=0.0,
        projectedGrowth1M=0.0,
        projectedGrowth6M=0.0,
        projectedGrowth1Y=0.0,
        riskScore="Med",
        volatility="Medium",
        history=[]
    )
    
    db.add(new_stock)
    db.commit()
    db.refresh(new_stock)
    
    update_stock_in_db(db, new_stock)
    return new_stock
