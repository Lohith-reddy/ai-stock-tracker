#!/bin/sh
set -e

# Start backend in background
cd /app/backend
python main.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
cd /app
npm start &
FRONTEND_PID=$!

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
