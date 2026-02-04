import torch
import numpy as np
import logging
from typing import List, Dict, Any
import os
import gc

# Configure logging
logger = logging.getLogger(__name__)

# Fix for HF Cache permissions in restricted environments
os.environ['HF_HOME'] = os.path.join(os.getcwd(), 'hf_cache')
# Set local TMPDIR to avoid some MPS Cache Permission Errors (though system warnings may persist)
local_tmp = os.path.join(os.getcwd(), 'tmp_cache')
os.makedirs(local_tmp, exist_ok=True)
os.environ['TMPDIR'] = local_tmp


def get_device() -> str:
    """
    Auto-detect best available device: CUDA > MPS > CPU
    """
    if torch.cuda.is_available():
        return "cuda"
    elif torch.backends.mps.is_available():
        return "mps"
    else:
        return "cpu"


class ForecastingEngine:
    """
    Forecasting engine with sequential model loading to minimize RAM usage.
    Auto-detects best available device (CUDA > MPS > CPU).
    Models are loaded one at a time, used for inference, then unloaded.
    """
    
    def __init__(self):
        self.device = get_device()
        logger.info(f"Initializing Forecasting Engine on {self.device}...")
        
        # Horizons in trading days: 1d, 1w (5d), 1m (21d), 6m (126d), 1y (252d)
        self.horizons = {
            "1d": 1,
            "1w": 5,
            "1m": 21,
            "6m": 126,
            "1y": 252
        }
        self.max_horizon = 252

    def _cleanup_memory(self):
        """Force memory cleanup after unloading a model."""
        gc.collect()
        if self.device == "mps":
            torch.mps.empty_cache()

    def _run_timesfm_inference(self, stock_histories: Dict[str, List[float]]) -> Dict[str, Dict[str, float]]:
        """
        Load TimesFM, run inference on all stocks, unload model.
        Returns: { ticker: { "1d": val, "1w": val, ... } }
        """
        results = {}
        
        try:
            logger.info(f"Loading Google TimesFM-2.5-200m on {self.device}...")
            import timesfm
            
            model = timesfm.TimesFM_2p5_200M_torch.from_pretrained(
                "google/timesfm-2.5-200m-pytorch",
                device=self.device
            )
            
            model.compile(
                timesfm.ForecastConfig(
                    max_context=1024,
                    max_horizon=self.max_horizon,
                    normalize_inputs=True,
                    use_continuous_quantile_head=True,
                    force_flip_invariance=True,
                    infer_is_positive=True,
                    fix_quantile_crossing=True,
                )
            )
            
            logger.info("TimesFM loaded. Running inference...")
            
            for ticker, history in stock_histories.items():
                if len(history) < 30:
                    logger.warning(f"Skipping {ticker}: Insufficient history ({len(history)} points)")
                    continue
                
                try:
                    context = history[-512:]  # Max context
                    
                    tfm_forecast_raw = model.forecast(
                        inputs=[context],
                        horizon=self.max_horizon
                    )
                    
                    # Handle return signature variations
                    if isinstance(tfm_forecast_raw, tuple):
                        pred_curve = tfm_forecast_raw[0][0]
                    else:
                        pred_curve = tfm_forecast_raw[0]
                    
                    # Calculate growth for each horizon
                    last_price = history[-1]
                    ticker_results = {}
                    for h_name, h_days in self.horizons.items():
                        if h_days <= len(pred_curve):
                            pred_price = float(pred_curve[h_days-1])
                            growth = ((pred_price - last_price) / last_price) * 100
                            ticker_results[h_name] = growth
                    
                    results[ticker] = ticker_results
                    logger.info(f"  TimesFM {ticker}: Success")
                    
                except Exception as e:
                    logger.error(f"  TimesFM failed for {ticker}: {e}")
            
            # Unload model
            del model
            logger.info("TimesFM unloaded.")
            
        except Exception as e:
            logger.error(f"Failed to load/run TimesFM: {e}")
        
        self._cleanup_memory()
        return results

    def _run_chronos_inference(self, stock_histories: Dict[str, List[float]]) -> Dict[str, Dict[str, float]]:
        """
        Load Chronos, run inference on all stocks, unload model.
        Uses 2-pass inference:
        1. Daily data for short-term (1d, 1w, 1m)
        2. Weekly resampled data for long-term (6m, 1y) to keep prediction_length <= 64.
        
        CRITICAL: Forces CPU usage for Chronos to avoid MPS 'searchsorted' validation errors.
        """
        results = {}
        
        try:
            # FORCE CPU for Chronos to avoid persistent MPS validation errors
            inference_device = "cpu"
            logger.info(f"Loading Amazon Chronos-T5-Large on {inference_device} (forced for stability)...")
            from chronos import ChronosPipeline
            
            model = ChronosPipeline.from_pretrained(
                "amazon/chronos-t5-large",
                device_map=inference_device,
                dtype=torch.float32
            )
            
            logger.info("Chronos loaded. Running 2-pass inference (Daily + Weekly)...")
            
            for ticker, history in stock_histories.items():
                if len(history) < 30:
                    continue
                
                ticker_results = {}
                try:
                    # PASS 1: Short-term (Daily) for 1d, 1w, 1m
                    # Max horizon needed: 1m = 21 days. Pred len 24 is safe.
                    ctx_daily = torch.tensor(history[-128:], dtype=torch.float32).unsqueeze(0) # Context ~6 months
                    
                    forecast_daily = model.predict(
                        ctx_daily,
                        prediction_length=24,
                        num_samples=20
                    )
                    median_daily = torch.median(forecast_daily[0], dim=0).values.numpy() # already on CPU
                    last_price = history[-1]
                    
                    # Store Daily Results
                    for h_name in ["1d", "1w", "1m"]:
                        h_days = self.horizons[h_name]
                        if h_days <= len(median_daily):
                            pred = float(median_daily[h_days-1])
                            ticker_results[h_name] = ((pred - last_price) / last_price) * 100

                    # PASS 2: Long-term (Weekly) for 6m, 1y
                    # Resample history to weekly (take every 5th point from end)
                    # 1y = 252 days = ~52 weeks. Pred len 52.
                    history_weekly = history[::-5][::-1]
                    ctx_weekly = torch.tensor(history_weekly[-128:], dtype=torch.float32).unsqueeze(0)
                    
                    forecast_weekly = model.predict(
                        ctx_weekly,
                        prediction_length=54, # ~1 year + buffer
                        num_samples=20
                    )
                    median_weekly = torch.median(forecast_weekly[0], dim=0).values.numpy()
                    
                    # Store Weekly Results (6m=26w, 1y=52w)
                    # 6m = 126 days approx 25 index
                    # 1y = 252 days approx 50 index
                    
                    if 25 < len(median_weekly):
                        pred_6m = float(median_weekly[25])
                        ticker_results["6m"] = ((pred_6m - last_price) / last_price) * 100
                    
                    if 50 < len(median_weekly):
                        pred_1y = float(median_weekly[50])
                        ticker_results["1y"] = ((pred_1y - last_price) / last_price) * 100

                    results[ticker] = ticker_results
                    logger.info(f"  Chronos {ticker}: Success")
                    
                except Exception as e:
                    logger.error(f"  Chronos failed for {ticker}: {e}")
            
            # Unload model
            del model
            logger.info("Chronos unloaded.")
            
        except Exception as e:
            logger.error(f"Failed to load/run Chronos: {e}")
        
        self._cleanup_memory()
        return results

    def predict_all(self, stock_histories: Dict[str, List[float]]) -> Dict[str, Dict[str, Dict[str, float]]]:
        """
        Runs inference for all stocks using both models SEQUENTIALLY.
        Models are loaded one at a time to minimize RAM usage.
        
        Returns: { ticker: { "timesfm": { "1d": val, ... }, "chronos": { ... } } }
        """
        logger.info(f"Starting Forecasting Cycle on {len(stock_histories)} stocks...")
        
        # Phase 1: TimesFM inference
        timesfm_results = self._run_timesfm_inference(stock_histories)
        
        # Phase 2: Chronos inference
        chronos_results = self._run_chronos_inference(stock_histories)
        
        # Merge results
        combined_results = {}
        all_tickers = set(timesfm_results.keys()) | set(chronos_results.keys())
        
        for ticker in all_tickers:
            combined_results[ticker] = {
                "timesfm": timesfm_results.get(ticker, {}),
                "chronos": chronos_results.get(ticker, {})
            }
        
        logger.info(f"Inference Cycle Complete. Generated results for {len(combined_results)} stocks.")
        return combined_results

# Singleton
engine = ForecastingEngine()
