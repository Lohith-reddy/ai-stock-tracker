import torch
import numpy as np
import logging
import os
import sys

# 1. FIXED: Set local TMPDIR to avoid MPS Cache Permission Errors
# Must be set BEFORE importing torch/libraries that use it
local_tmp = os.path.join(os.getcwd(), 'tmp_cache')
os.makedirs(local_tmp, exist_ok=True)
os.environ['TMPDIR'] = local_tmp
os.environ['HF_HOME'] = os.path.join(os.getcwd(), 'hf_cache')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("evaluate_accuracy")

def generate_synthetic_data(length=1500):
    """Generates a predictable pattern: Linear Trend + Seasonality + Noise"""
    t = np.arange(length)
    # y = Start + Trend*t + Seasonality + Noise
    y = 100 + 0.05 * t + 10 * np.sin(t / 20.0) + np.random.normal(0, 0.5, length)
    return y

def evaluate():
    logger.info("Starting Multi-Horizon Foundation Model Evaluation...")
    logger.info(f"Temporary Directory set to: {os.environ['TMPDIR']}")
    
    # 2. Multi-Horizon Setup
    horizons = {
        "1d": 1,
        "1w": 5,
        "3m": 63,
        "6m": 126,
        "1y": 252
    }
    max_h = 252
    
    # Generate Data (Context + Future)
    full_data = generate_synthetic_data(1500)
    train_len = 1000
    
    context = full_data[:train_len]
    ground_truth = full_data[train_len : train_len + max_h] # Full 1y future
    
    logger.info(f"Data Generated. Context Length: {len(context)}, Evaluation Horizon: {max_h} days")
    
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    logger.info(f"Using device: {device}")

    metrics = {"chronos": {}, "timesfm": {}}

    # --- EVALUATE CHRONOS ---
    try:
        logger.info("Evaluating Amazon Chronos (Parallelized Horizon Evaluation)...")
        from chronos import ChronosPipeline
        
        chronos = ChronosPipeline.from_pretrained(
            "amazon/chronos-t5-large",
            device_map=device,
            dtype=torch.bfloat16
        )
        
        ctx_tensor = torch.tensor(context[-512:], dtype=torch.float32)
        
        # Optimize: Predict ONCE for the max horizon (252 days)
        # We can then slice this single long prediction to evaluate shorter horizons
        forecast = chronos.predict(
            ctx_tensor.unsqueeze(0),
            prediction_length=max_h,
            num_samples=20
        )
        
        # Median forecast [252]
        chronos_full_pred = torch.median(forecast[0], dim=0).values.float().cpu().numpy()
        
        # Slice and Dice
        for h_name, h_days in horizons.items():
            pred_slice = chronos_full_pred[:h_days]
            truth_slice = ground_truth[:h_days]
            
            abs_err = np.abs(pred_slice - truth_slice)
            mape = np.mean(abs_err / truth_slice) * 100
            mae = np.mean(abs_err)
            
            metrics["chronos"][h_name] = {"MAPE": mape, "MAE": mae}
        
    except Exception as e:
        logger.error(f"Chronos Evaluation Failed: {e}", exc_info=True)


    # --- EVALUATE TIMESFM ---
    try:
        logger.info("Evaluating Google TimesFM (Parallelized Horizon Evaluation)...")
        import timesfm
        
        tfm = timesfm.TimesFM_2p5_200M_torch.from_pretrained(
            "google/timesfm-2.5-200m-pytorch",
            device=device
        )
        tfm.compile(
            timesfm.ForecastConfig(
                max_context=1024,
                max_horizon=max_h + 10, # Buffer
                normalize_inputs=True,
                use_continuous_quantile_head=True,
                force_flip_invariance=True,
                infer_is_positive=True,
                fix_quantile_crossing=True,
            )
        )
        
        output = tfm.forecast(
             inputs=[context],
             horizon=max_h 
        )
        
        if isinstance(output, tuple): 
            tfm_full_pred = output[0][0]
        else:
            tfm_full_pred = output[0]
            
        # Slice and Dice
        for h_name, h_days in horizons.items():
            pred_slice = tfm_full_pred[:h_days]
            truth_slice = ground_truth[:h_days]
            
            abs_err = np.abs(pred_slice - truth_slice)
            mape = np.mean(abs_err / truth_slice) * 100
            mae = np.mean(abs_err)
            
            metrics["timesfm"][h_name] = {"MAPE": mape, "MAE": mae}

    except Exception as e:
        logger.error(f"TimesFM Evaluation Failed: {e}", exc_info=True)

    # --- REPORT ---
    logger.info("\n" + "="*60)
    logger.info(f"{'MULTI-HORIZON ACCURACY REPORT':^60}")
    logger.info("="*60)
    
    # Header
    logger.info(f"{'Model':<10} | {'Horizon':<8} | {'MAPE (%)':<10} | {'MAE':<10}")
    logger.info("-" * 46)
    
    for model in ["timesfm", "chronos"]:
        scores = metrics.get(model, {})
        if not scores:
            logger.info(f"{model.upper():<10} | FAILED")
            continue
            
        # Sort by horizon length logic
        sorted_h = sorted(scores.keys(), key=lambda k: horizons[k])
        
        for h in sorted_h:
            s = scores[h]
            logger.info(f"{model.upper():<10} | {h:<8} | {s['MAPE']:<10.2f} | {s['MAE']:<10.2f}")
        logger.info("-" * 46)

if __name__ == "__main__":
    evaluate()
