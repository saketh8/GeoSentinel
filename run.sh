#!/bin/bash

echo "Starting GeoSentinel 4D..."

# Start backend
echo "Starting Backend API..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Start recorder
echo "Starting OSINT Recorder..."
cd recorder
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 main.py &
RECORDER_PID=$!
cd ..

# Start frontend
echo "Starting Frontend..."
cd frontend
npm install
npm run dev &
FRONTEND_PID=$!
cd ..

echo "GeoSentinel 4D is running."
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:8000"

function cleanup {
  echo "Shutting down GeoSentinel 4D..."
  kill $BACKEND_PID
  kill $RECORDER_PID
  kill $FRONTEND_PID
  exit
}

trap cleanup INT TERM

wait $FRONTEND_PID
