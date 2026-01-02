#!/bin/bash
# Deploy script for grants platform

set -e

PROJECT_ID=${1:-grants-platform-dev}
REGION="northamerica-northeast1"

echo "Deploying to project: $PROJECT_ID"

# Deploy Firestore indexes
echo "Deploying Firestore indexes..."
gcloud firestore indexes create \
  --project=$PROJECT_ID \
  --database='(default)' \
  --index-file=firestore/indexes.json

# Deploy Firestore security rules
echo "Deploying Firestore security rules..."
gcloud firestore deploy \
  --project=$PROJECT_ID \
  --rules=firestore/firestore.rules

# Deploy sync function
echo "Deploying sync function..."
gcloud functions deploy sync-to-bigquery \
  --project=$PROJECT_ID \
  --region=$REGION \
  --runtime=python311 \
  --trigger-http \
  --entry-point=sync_to_bigquery \
  --source=functions/sync-to-bigquery \
  --service-account=grants-sync-function@$PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars=GCP_PROJECT=$PROJECT_ID

# Deploy API
echo "Deploying API to Cloud Run..."
gcloud run deploy grants-api \
  --project=$PROJECT_ID \
  --region=$REGION \
  --source=api \
  --service-account=grants-api@$PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars=GCP_PROJECT=$PROJECT_ID \
  --allow-unauthenticated

echo "Deployment complete!"
echo "API URL:"
gcloud run services describe grants-api \
  --project=$PROJECT_ID \
  --region=$REGION \
  --format='value(status.url)'
