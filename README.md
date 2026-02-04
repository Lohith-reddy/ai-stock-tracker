# AI Stock Tracker 📈

Real-time AI stock portfolio tracker with foundation model forecasting. Uses Google TimesFM and Amazon Chronos for multi-horizon price predictions.

![Dashboard Preview](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js) ![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?logo=fastapi)

## Features

- 📊 **Real-time Stock Data** - Live prices from Yahoo Finance
- 🤖 **AI Forecasting** - Google TimesFM & Amazon Chronos models
- 📈 **Multi-Horizon Predictions** - 1D, 1W, 1M, 6M, 1Y forecasts
- 🎯 **AI Tech Stack Focus** - Tracks companies across Hardware, Cloud, Data, Models, Applications
- ⚡ **Optimized Performance** - Sequential model loading, GPU acceleration (CUDA/MPS)

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- [uv](https://docs.astral.sh/uv/) (recommended) or pip

### Option 1: Local Development

**1. Frontend Setup**
```bash
npm install
npm run dev
```

**2. Backend Setup** (new terminal)
```bash
cd backend

# Using uv (recommended)
uv sync
uv run python main.py

# Or using pip
pip install -r requirements.txt
python main.py
```

**3. Open** http://localhost:3000

### Option 2: Docker

```bash
# Development (hot-reload)
docker-compose up

# Production build
docker build -t ai-stock-tracker .
docker run -p 3000:3000 -p 8000:8000 ai-stock-tracker
```

## Project Structure

```
ai-stock-tracker/
├── src/                    # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   └── store/             # Zustand state management
├── backend/               # Python FastAPI backend
│   ├── main.py           # API endpoints
│   ├── forecasting.py    # ML inference engine
│   ├── service.py        # Stock data service
│   └── models.py         # SQLAlchemy models
├── docker-compose.yml     # Docker development setup
└── Dockerfile            # Production container
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stocks` | GET | Get all tracked stocks |
| `/api/stocks` | POST | Add new stock to watchlist |
| `/api/refresh` | POST | Refresh stock data (add `?run_inference=true` for ML) |
| `/api/needs-refresh` | GET | Check if data is stale (>24h) |
| `/api/forecasts/{ticker}` | GET | Get forecast data for specific stock |

## GPU Acceleration

The backend auto-detects the best available device:

1. **CUDA** - NVIDIA GPUs (Linux/Windows)
2. **MPS** - Apple Silicon (macOS)
3. **CPU** - Fallback for all systems

To force a specific device, set `TORCH_DEVICE` environment variable:
```bash
TORCH_DEVICE=cpu python main.py
```

## Memory Optimization

Models load sequentially to minimize RAM usage:
- Peak usage: ~5-6GB (vs ~11GB if loaded simultaneously)
- Each model is unloaded after inference with explicit garbage collection

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8000 | Backend API port |
| `TORCH_DEVICE` | auto | Force device: `cuda`, `mps`, or `cpu` |
| `HF_HOME` | `./hf_cache` | Hugging Face cache directory |

## Tech Stack

**Frontend:**
- Next.js 16.1 (App Router)
- React 19
- Tailwind CSS 4
- Recharts, Framer Motion
- Zustand

**Backend:**
- FastAPI
- SQLAlchemy (SQLite)
- PyTorch
- Google TimesFM 2.5
- Amazon Chronos T5

## License

MIT
