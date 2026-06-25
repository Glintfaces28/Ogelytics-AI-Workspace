#!/bin/bash
# Run on EC2 to deploy or update the application.
# Usage:
#   First deploy:  git clone <your-repo-url> ~/enterprise-ai-workspace
#                  cd ~/enterprise-ai-workspace/backend
#                  cp .env.example .env   # then fill in real values
#                  ./aws/deploy.sh
#   Updates:       ./aws/deploy.sh

set -e

cd ~/enterprise-ai-workspace/backend

echo "--- Pulling latest code ---"
git pull

echo "--- Building and starting backend ---"
docker compose -f docker-compose.prod.yml up --build -d

echo ""
echo "Deployment complete."
echo "API is running at http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000"
