import torch
import numpy as np
import logging
import sys
import os

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("debug_models")

def test_models():
    logger.info("Starting Foundation Model Debug Sequence...")
    
    # Mock Data: 500 days of random walk
    logger.info("Generating mock data...")
    history = [100.0]
    for _ in range(500):
        history.append(history[-1] * (1 + np.random.normal(0, 0.01)))
    
    context_tensor = torch.tensor(history[-512:], dtype=torch.float32)
    context_list = history[-512:]
    
    horizons = [1, 5, 21, 126, 252]
    max_horizon = 252

    # Set HF Cache to local dir to avoid permission errors
    os.environ['HF_HOME'] = os.path.join(os.getcwd(), 'hf_cache')
    logger.info(f"Set HF_HOME to {os.environ['HF_HOME']}")
    
    # --- TEST 1: CHRONOS ---
    logger.info("\n--- TESTING AMAZON CHRONOS ---")
    try:
        from chronos import ChronosPipeline
        logger.info("Import successful.")
        
        device = "cpu" # Force CPU for debug safety
        pipeline = ChronosPipeline.from_pretrained(
            "amazon/chronos-t5-large",
            device_map=device,
            torch_dtype=torch.float32 # Use float32 for CPU
        )
        logger.info("Model loaded.")
        
        forecast = pipeline.predict(
            context_tensor.unsqueeze(0),
            prediction_length=max_horizon,
            num_samples=5
        )
        logger.info(f"Prediction shape: {forecast.shape}")
        
        median = torch.median(forecast[0], dim=0).values.numpy()
        logger.info(f"Median shape: {median.shape}")
        logger.info(f"1D Forecast: {median[0]}")
        logger.info(f"1Y Forecast: {median[-1]}")
        
    except Exception as e:
        logger.error(f"Chronos Failed: {e}", exc_info=True)

    # --- TEST 2: TIMESFM ---
    logger.info("\n--- TESTING GOOGLE TIMESFM ---")
    try:
        # Try new import style found in logs
        from timesfm import TimesFM_2p5_200M_torch
        logger.info("Import successful.")
        
        tfm = TimesFM_2p5_200M_torch(repo_id="google/timesfm-2.5-200m-pytorch")
        logger.info("Model loaded.")
        
        inputs = [history] # Full history
        freq = [0] # Daily/Unknown - Leaving this prepared but checking if needed
        
        # Inspection
        import inspect
        sig = inspect.signature(tfm.forecast)
        logger.info(f"Forecast signature: {sig}")
        
        # Try without freq first as per error
        output = tfm.forecast(
             inputs,
             # freq=freq, # Removed
             window_size=max_horizon
        )
        
        # Inspect output structure
        logger.info(f"Output type: {type(output)}")
        if isinstance(output, tuple):
             logger.info(f"Tuple len: {len(output)}")
             logger.info(f"Item 0 shape: {output[0].shape}")
             preds = output[0]
        else:
             logger.info(f"Output shape: {output.shape}")
             preds = output
             
        logger.info(f"1Y Forecast value: {preds[0, -1]}")

    except Exception as e:
        logger.error(f"TimesFM Failed: {e}", exc_info=True)

if __name__ == "__main__":
    test_models()
