#!/bin/bash
set -e
PROJECT_ID="your-gcp-project-id"
REGION="us-central1"

echo "Deploying GeoSentinel 4D to Google Cloud..."

# Backend API
gcloud builds submit backend/ \
  --tag gcr.io/$PROJECT_ID/geosentinel-api
gcloud run deploy geosentinel-api \
  --image gcr.io/$PROJECT_ID/geosentinel-api \
  --platform managed --region $REGION \
  --allow-unauthenticated --memory 2Gi \
  --set-secrets GEMINI_API_KEY=gemini-key:latest,\
AISSTREAM_KEY=aisstream-key:latest,\
VERTEX_PROJECT=$PROJECT_ID

# Data Recorder
gcloud builds submit recorder/ \
  --tag gcr.io/$PROJECT_ID/geosentinel-recorder
gcloud run jobs deploy geosentinel-recorder \
  --image gcr.io/$PROJECT_ID/geosentinel-recorder \
  --region $REGION \
  --set-secrets GEMINI_API_KEY=gemini-key:latest

# Cloud Scheduler (triggers recorder every 60s)
gcloud scheduler jobs create http osint-recorder \
  --schedule "* * * * *" --region $REGION \
  --uri $(gcloud run jobs describe geosentinel-recorder \
    --region $REGION --format 'value(status.url)')

# Frontend
cd frontend && npm run build
firebase deploy --only hosting

echo "✓ GeoSentinel 4D is live."
