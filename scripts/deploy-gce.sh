#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════
# Deploy ServiceDesk to a GCE VM with Docker Compose
#
# Prerequisites:
#   - gcloud CLI authenticated with project set
#   - Artifact Registry repo already created
#
# Usage:
#   chmod +x scripts/deploy-gce.sh
#   ./scripts/deploy-gce.sh
# ══════════════════════════════════════════════════════════

set -euo pipefail

# ── Configuration ─────────────────────────────────────────
PROJECT_ID="${PROJECT_ID:-servicedesk-494213}"
ZONE="${ZONE:-me-central1-a}"
INSTANCE_NAME="${INSTANCE_NAME:-servicedesk-vm}"
MACHINE_TYPE="${MACHINE_TYPE:-e2-standard-2}"
DISK_SIZE="${DISK_SIZE:-50GB}"
REGION="${REGION:-me-central1}"
REPO="${REPO:-servicedesk}"
TAG="${TAG:-v1.0.0}"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}"

echo "══════════════════════════════════════════════════════"
echo " ServiceDesk — GCE Deployment"
echo "══════════════════════════════════════════════════════"
echo " Project:  ${PROJECT_ID}"
echo " Zone:     ${ZONE}"
echo " Instance: ${INSTANCE_NAME}"
echo " Machine:  ${MACHINE_TYPE}"
echo " Registry: ${REGISTRY}"
echo " Tag:      ${TAG}"
echo "══════════════════════════════════════════════════════"

# ── Step 1: Create VM (if not exists) ─────────────────────
if gcloud compute instances describe "${INSTANCE_NAME}" --zone="${ZONE}" --project="${PROJECT_ID}" &>/dev/null; then
  echo "✓ VM '${INSTANCE_NAME}' already exists"
else
  echo "→ Creating VM '${INSTANCE_NAME}'..."
  gcloud compute instances create "${INSTANCE_NAME}" \
    --project="${PROJECT_ID}" \
    --zone="${ZONE}" \
    --machine-type="${MACHINE_TYPE}" \
    --boot-disk-size="${DISK_SIZE}" \
    --boot-disk-type=pd-balanced \
    --image-family=cos-stable \
    --image-project=cos-cloud \
    --scopes=cloud-platform \
    --tags=http-server,https-server \
    --metadata=google-logging-enabled=true
  echo "✓ VM created"
fi

# ── Step 2: Open firewall (if not exists) ─────────────────
if gcloud compute firewall-rules describe allow-servicedesk --project="${PROJECT_ID}" &>/dev/null; then
  echo "✓ Firewall rule already exists"
else
  echo "→ Creating firewall rule..."
  gcloud compute firewall-rules create allow-servicedesk \
    --project="${PROJECT_ID}" \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:80,tcp:443 \
    --target-tags=http-server
  echo "✓ Firewall rule created"
fi

# ── Step 3: Wait for VM to be ready ──────────────────────
echo "→ Waiting for VM to be ready..."
sleep 30

# ── Step 4: Deploy via SSH ────────────────────────────────
echo "→ Deploying to VM..."
gcloud compute ssh "${INSTANCE_NAME}" \
  --zone="${ZONE}" \
  --project="${PROJECT_ID}" \
  --command="
set -e

# Configure docker to authenticate with Artifact Registry
docker-credential-gcr configure-docker --registries=${REGION}-docker.pkg.dev 2>/dev/null || true

# Pull images
echo '→ Pulling images...'
docker pull ${REGISTRY}/servicedesk-api:${TAG}
docker pull ${REGISTRY}/servicedesk-frontend:${TAG}
docker pull ${REGISTRY}/servicedesk-nginx:${TAG}

# Create app directory (COS root is read-only, /home is writable)
mkdir -p /home/servicedesk
cd /home/servicedesk

# Write docker-compose.yml
tee docker-compose.yml > /dev/null << 'COMPOSE_EOF'
services:
  # ── MongoDB ────────────────────────────────────────────
  mongodb:
    image: mongo:7.0
    container_name: servicedesk-db
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: \${MONGO_ROOT_USERNAME:-admin}
      MONGO_INITDB_ROOT_PASSWORD: \${MONGO_ROOT_PASSWORD:-admin123}
      MONGO_INITDB_DATABASE: servicedesk
    volumes:
      - mongodb_data:/data/db
    networks:
      - servicedesk-network
    healthcheck:
      test: echo 'db.runCommand(\"ping\").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  # ── Redis ──────────────────────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: servicedesk-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --maxmemory 128mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    networks:
      - servicedesk-network
    healthcheck:
      test: [\"CMD\", \"redis-cli\", \"ping\"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ── API ────────────────────────────────────────────────
  api:
    image: REGISTRY_PLACEHOLDER/servicedesk-api:TAG_PLACEHOLDER
    container_name: servicedesk-api
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 5000
      BASE_URL: \${BASE_URL:-http://localhost}
      CORS_ORIGIN: \${CORS_ORIGIN:-http://localhost}
      JWT_SECRET: \${JWT_SECRET:-your_super_secret_jwt_key_change_in_production}
      JWT_EXPIRE: \${JWT_EXPIRE:-7d}
      MONGODB_URI: mongodb://\${MONGO_ROOT_USERNAME:-admin}:\${MONGO_ROOT_PASSWORD:-admin123}@mongodb:27017/servicedesk?authSource=admin
      REDIS_URL: redis://redis:6379
      KAFKA_ENABLED: \"false\"
      DB_STRATEGY_ITSM: mongodb
      DB_STRATEGY_PM: mongodb
      DB_STRATEGY_FORMS: mongodb
      DB_STRATEGY_WORKFLOW: mongodb
      DB_STRATEGY_PLATFORM: mongodb
      DB_STRATEGY_ANALYTICS: mongodb
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - servicedesk-network
    volumes:
      - api_uploads:/app/uploads
    healthcheck:
      test: [\"CMD\", \"node\", \"-e\", \"require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # ── Frontend ───────────────────────────────────────────
  frontend:
    image: REGISTRY_PLACEHOLDER/servicedesk-frontend:TAG_PLACEHOLDER
    container_name: servicedesk-frontend
    restart: unless-stopped
    networks:
      - servicedesk-network
    healthcheck:
      test: [\"CMD\", \"node\", \"-e\", \"require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  # ── Nginx ──────────────────────────────────────────────
  nginx:
    image: REGISTRY_PLACEHOLDER/servicedesk-nginx:TAG_PLACEHOLDER
    container_name: servicedesk-nginx
    restart: unless-stopped
    ports:
      - \"80:80\"
    depends_on:
      api:
        condition: service_healthy
      frontend:
        condition: service_healthy
    networks:
      - servicedesk-network

networks:
  servicedesk-network:
    driver: bridge

volumes:
  mongodb_data:
  redis_data:
  api_uploads:
COMPOSE_EOF

# Replace image placeholders
sed -i 's|REGISTRY_PLACEHOLDER|${REGISTRY}|g' docker-compose.yml
sed -i 's|TAG_PLACEHOLDER|${TAG}|g' docker-compose.yml

# Write .env file (if not exists)
if [ ! -f .env ]; then
  tee .env > /dev/null << 'ENV_EOF'
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=admin123
JWT_SECRET=change-this-to-a-strong-secret-in-production
BASE_URL=http://localhost
CORS_ORIGIN=http://localhost
ENV_EOF
  echo '✓ Created .env file — update secrets for production!'
fi

# Start services
echo '→ Starting services...'
docker compose pull
docker compose up -d

echo '✓ Deployment complete!'
docker compose ps
"

# ── Step 5: Show external IP ─────────────────────────────
EXTERNAL_IP=$(gcloud compute instances describe "${INSTANCE_NAME}" \
  --zone="${ZONE}" \
  --project="${PROJECT_ID}" \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo ""
echo "══════════════════════════════════════════════════════"
echo " ✓ Deployment complete!"
echo ""
echo " External IP: ${EXTERNAL_IP}"
echo " App URL:     http://${EXTERNAL_IP}"
echo " API URL:     http://${EXTERNAL_IP}/api/v2"
echo ""
echo " Update .env on the VM for production secrets:"
echo "   gcloud compute ssh ${INSTANCE_NAME} --zone=${ZONE}"
echo "   vi /home/servicedesk/.env"
echo "   cd /home/servicedesk && docker compose up -d"
echo "══════════════════════════════════════════════════════"
