import yfinance as yf
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ticker = "NVDA"
print(f"Fetching data for {ticker}...")
try:
    t = yf.Ticker(ticker)
    hist = t.history(period="1y")
    print(f"Rows fetched: {len(hist)}")
    if not hist.empty:
        print(f"Sample: {hist.tail(1)}")
    else:
        print("Empty history.")
except Exception as e:
    print(f"Error: {e}")
