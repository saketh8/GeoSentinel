#!/bin/bash

# Configuration
PROJECT_ID="project-62ee5d68-cd7f-4ec4-a49"
REGION="us-central1"
BACKEND_SERVICE="geosentinel-backend"
FRONTEND_SERVICE="geosentinel-frontend"

echo "========================================="
echo "  Deploying GeoSentinel to Cloud Run  "
echo "========================================="

# 1. Ensure gcloud is authenticated
echo "\n[1/4] Ensuring GCP authentication..."
# gcloud auth login
gcloud config set project $PROJECT_ID

# 2. Deploy Backend
echo "\n[2/4] Deploying Backend (Python/FastAPI) to Cloud Run..."
cd backend
gcloud run deploy $BACKEND_SERVICE \
  --source . \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_API_KEY=AIzaSyBMrq6Vg5N1__Bq3rDHnVoxcAeKAwEZv88" \
  --port 8080
cd ..

# Get the backend URL to inject into frontend
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region $REGION --format 'value(status.url)')
echo "✅ Backend deployed at: $BACKEND_URL"

# 3. Deploy Frontend
echo "\n[3/4] Deploying Frontend (React/Vite) to Cloud Run..."
cd frontend
# Optional: Set VITE_API_BASE_URL to $BACKEND_URL here if using an .env file
gcloud run deploy $FRONTEND_SERVICE \
  --source . \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080
cd ..

FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region $REGION --format 'value(status.url)')

echo "\n========================================="
echo "🎉 DEPLOYMENT COMPLETE 🎉"
echo "Backend: $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo "========================================="
