import torch
import torch.nn as nn
import numpy as np
import logging
import os
import yfinance as yf
from typing import List, Dict

logger = logging.getLogger(__name__)

class StockLSTM(nn.Module):
    def __init__(self, input_size=1, hidden_size=64, num_layers=2, output_size=1):
        super(StockLSTM, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, dropout=0.2)
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        out, _ = self.lstm(x, (h0, c0))
        out = self.fc(out[:, -1, :])
        return out

class GlobalPredictor:
    def __init__(self):
        self.model = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model_path = "global_model.pth"
        self.is_training = False
        
        # Try to load existing model
        try:
           self.load_model()
        except:
           pass

    def load_model(self):
        if os.path.exists(self.model_path):
            self.model = StockLSTM().to(self.device)
            self.model.load_state_dict(torch.load(self.model_path, map_location=self.device))
            self.model.eval()
            logger.info("Loaded persisted global model.")
            
    def save_model(self):
        if self.model:
            torch.save(self.model.state_dict(), self.model_path)
            logger.info("Saved global model.")

    def auto_train(self, ai_histories: List[List[float]]):
        """
        Orchestrates the full Transfer Learning pipeline:
        1. Pre-train on Market Index (SPY) + Top Caps
        2. Fine-tune on specific AI Portfolio
        """
        self.is_training = True
        try:
             # Stage 1: Pre-training (Transfer Learning Base)
             logger.info("Starting Stage 1: Pre-training on Broad Market (SPY, QQQ, AAPL...)")
             market_tickers = ["SPY", "QQQ", "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "BRK-B", "LLY", "JPM"]
             market_data = []
             
             for t in market_tickers:
                 try:
                     ticker = yf.Ticker(t)
                     hist = ticker.history(period="10y")["Close"].tolist()
                     if len(hist) > 200:
                         market_data.append(hist)
                 except Exception as e:
                     logger.warning(f"Failed to fetch market data for {t}: {e}")
             
             if not self.model:
                  self.model = StockLSTM().to(self.device)
             
             # Train Base Model
             self._train_cycle(market_data, epochs=30, learning_rate=0.005)
             logger.info("Stage 1 Complete.")
             
             # Stage 2: Fine-tuning on AI Portfolio
             logger.info(f"Starting Stage 2: Fine-tuning on {len(ai_histories)} AI stocks...")
             self._train_cycle(ai_histories, epochs=20, learning_rate=0.001) # Lower LR for fine-tuning
             logger.info("Stage 2 Complete.")
             
             self.save_model()
             
        except Exception as e:
            logger.error(f"Training failed: {e}")
        finally:
            self.is_training = False

    def _train_cycle(self, histories: List[List[float]], epochs: int, learning_rate: float):
        if not histories: return

        X_all, y_all = [], []
        seq_length = 60
        
        for history in histories:
            if len(history) < seq_length + 20: continue
            data = np.array(history).reshape(-1, 1)
            min_val = np.min(data)
            max_val = np.max(data)
            if max_val == min_val: continue
            
            scaled_data = (data - min_val) / (max_val - min_val)
            for i in range(len(scaled_data) - seq_length):
                X_all.append(scaled_data[i:i+seq_length])
                y_all.append(scaled_data[i+seq_length])
        
        if not X_all: return

        X_tensor = torch.tensor(np.array(X_all), dtype=torch.float32).to(self.device)
        y_tensor = torch.tensor(np.array(y_all), dtype=torch.float32).to(self.device)
        
        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(self.model.parameters(), lr=learning_rate)
        
        self.model.train()
        for i in range(epochs):
            optimizer.zero_grad()
            outputs = self.model(X_tensor)
            loss = criterion(outputs, y_tensor)
            loss.backward()
            optimizer.step()

    def predict(self, history: List[float]) -> Dict[str, float]:
        """
        Returns predictions for 1M (30d), 6M (180d), 1Y (252d).
        """
        if not self.model or len(history) < 60:
            return {"1M": 0.0, "6M": 0.0, "1Y": 0.0}
            
        seq_length = 60
        data = np.array(history).reshape(-1, 1)
        min_val = np.min(data)
        max_val = np.max(data)
        
        if max_val == min_val:
            return {"1M": 0.0, "6M": 0.0, "1Y": 0.0}

        scaled_data = (data - min_val) / (max_val - min_val)
        
        self.model.eval()
        try:
             current_seq = torch.tensor(scaled_data[-seq_length:].reshape(1, seq_length, 1), dtype=torch.float32).to(self.device)
        except Exception:
             return {"1M": 0.0, "6M": 0.0, "1Y": 0.0}
        
        future_preds = []
        max_horizon = 252 
        
        with torch.no_grad():
            for _ in range(max_horizon):
                pred = self.model(current_seq)
                future_preds.append(pred.item())
                input_val = pred.unsqueeze(1)
                current_seq = torch.cat((current_seq[:, 1:, :], input_val), dim=1)
        
        def get_growth(days):
            if days > len(future_preds): return 0.0
            idx = days - 1
            pred_price = future_preds[idx] * (max_val - min_val) + min_val
            curr_price = history[-1]
            return ((pred_price - curr_price) / curr_price) * 100

        return {
            "1M": get_growth(30),
            "6M": get_growth(180),
            "1Y": get_growth(252)
        }

# Singleton instance
predictor = GlobalPredictor()
