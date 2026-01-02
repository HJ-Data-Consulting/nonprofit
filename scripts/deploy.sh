#!/bin/bash
# Deploy script for grants platform

set -e

PROJECT_ID=${1:-grants-platform-dev}
REGION="northamerica-northeast1"

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the project root directory (parent of scripts/)
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Deploying to project: $PROJECT_ID"
echo "Project root: $ROOT_DIR"

# Deploy Firestore indexes (Commented out - better managed via Terraform)
# echo "Deploying Firestore indexes..."
# gcloud firestore indexes composite create ...

# Deploy Firestore security rules (Commented out - better managed via Terraform)
# echo "Deploying Firestore security rules..."
# gcloud firestore security-rules rules create --source=$ROOT_DIR/firestore/firestore.rules --project=$PROJECT_ID

# Deploy sync function
echo "Deploying sync function..."
gcloud functions deploy sync-to-bigquery \
  --project=$PROJECT_ID \
  --region=$REGION \
  --runtime=python311 \
  --trigger-http \
  --entry-point=sync_to_bigquery \
  --source=$ROOT_DIR/functions/sync-to-bigquery \
  --service-account=grants-sync-function@$PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars=GCP_PROJECT=$PROJECT_ID \
  --no-allow-unauthenticated

# Deploy API
echo "Deploying API to Cloud Run..."
gcloud run deploy grants-api \
  --project=$PROJECT_ID \
  --region=$REGION \
  --source=$ROOT_DIR/api \
  --service-account=grants-api@$PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars=GCP_PROJECT=$PROJECT_ID \
  --allow-unauthenticated

echo "Deployment complete!"
echo "API URL:"
gcloud run services describe grants-api \
  --project=$PROJECT_ID \
  --region=$REGION \
  --format='value(status.url)'
