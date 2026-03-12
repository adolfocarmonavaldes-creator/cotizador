#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# QuoteFlow — Cloud Run Deployment Script
# Usage: ./deploy.sh [PROJECT_ID] [REGION]
#   PROJECT_ID  your GCP project ID  (default: cotizador-app)
#   REGION      Cloud Run region     (default: us-central1)
# ─────────────────────────────────────────────────────────
set -euo pipefail

PROJECT_ID="${1:-cotizador-app}"
REGION="${2:-us-central1}"
SERVICE_NAME="cotizador"
REPO="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
IMAGE="${REPO}:$(git rev-parse --short HEAD 2>/dev/null || echo latest)"

GCLOUD="${GCLOUD:-gcloud}"

echo "╔══════════════════════════════════════════════╗"
echo "║  QuoteFlow → Cloud Run Deploy                ║"
echo "╠══════════════════════════════════════════════╣"
echo "  Project  : $PROJECT_ID"
echo "  Region   : $REGION"
echo "  Image    : $IMAGE"
echo ""

# 1. Set project
$GCLOUD config set project "$PROJECT_ID"

# 2. Enable required APIs
echo "→ Enabling APIs..."
$GCLOUD services enable \
  run.googleapis.com \
  containerregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  --project "$PROJECT_ID"

# 3. Configure docker auth
$GCLOUD auth configure-docker --quiet

# 4. Build & push image using Cloud Build (no local Docker needed)
echo "→ Building image with Cloud Build..."
$GCLOUD builds submit \
  --tag "$IMAGE" \
  --project "$PROJECT_ID" \
  .

# 5. Store secrets in Secret Manager (first deploy only — skip if they exist)
echo "→ Setting up secrets..."
for SECRET in supabase-url supabase-anon-key app-url; do
  if ! $GCLOUD secrets describe "$SECRET" --project "$PROJECT_ID" &>/dev/null; then
    echo "  Creating secret: $SECRET"
    echo -n "PLACEHOLDER" | $GCLOUD secrets create "$SECRET" --data-file=- --project "$PROJECT_ID"
    echo "  ⚠️  Update the secret '$SECRET' in Cloud Console → Secret Manager"
  fi
done

# 6. Deploy to Cloud Run
echo "→ Deploying to Cloud Run..."
$GCLOUD run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets "NEXT_PUBLIC_SUPABASE_URL=supabase-url:latest,NEXT_PUBLIC_SUPABASE_ANON_KEY=supabase-anon-key:latest,NEXT_PUBLIC_APP_URL=app-url:latest" \
  --project "$PROJECT_ID"

# 7. Print URL
SERVICE_URL=$($GCLOUD run services describe "$SERVICE_NAME" \
  --region "$REGION" \
  --format "value(status.url)" \
  --project "$PROJECT_ID")

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  ✅ Deployment complete!                     ║"
echo "╠══════════════════════════════════════════════╣"
echo "  URL: $SERVICE_URL"
echo ""
echo "  ⚠️  Next steps:"
echo "  1. Update Secret Manager secrets:"
echo "     https://console.cloud.google.com/security/secret-manager?project=$PROJECT_ID"
echo "  2. Run Supabase migrations on your production DB"
echo "  3. Set NEXT_PUBLIC_APP_URL = $SERVICE_URL"
echo "╚══════════════════════════════════════════════╝"
