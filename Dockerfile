# Stage 1: Frontend Build
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Backend
FROM python:3.11-slim AS backend
WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast Python package management
RUN pip install uv

# Copy backend files
COPY backend/pyproject.toml backend/requirements.txt ./
RUN uv pip install --system -r requirements.txt

COPY backend/ ./

# Expose port
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Stage 3: Production (Frontend + Backend)
FROM node:20-alpine AS production
WORKDIR /app

# Install Python for backend
RUN apk add --no-cache python3 py3-pip git

# Copy frontend build
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/node_modules ./node_modules
COPY --from=frontend-builder /app/package.json ./
COPY --from=frontend-builder /app/public ./public

# Copy backend
COPY backend/ ./backend/
WORKDIR /app/backend
RUN pip3 install --break-system-packages -r requirements.txt
WORKDIR /app

# Expose ports
EXPOSE 3000 8000

# Start script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
CMD ["/docker-entrypoint.sh"]
