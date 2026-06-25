#!/bin/bash
# Run once on a fresh Amazon Linux 2023 EC2 instance.
# SSH into the instance first:
#   ssh -i your-key.pem ec2-user@<EC2_PUBLIC_IP>
# Then run:
#   chmod +x ec2-setup.sh && ./ec2-setup.sh

set -e

echo "--- Updating system packages ---"
sudo dnf update -y

echo "--- Installing Docker and Git ---"
sudo dnf install docker git -y

echo "--- Starting and enabling Docker ---"
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

echo "--- Installing Docker Compose plugin ---"
DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p "$DOCKER_CONFIG/cli-plugins"
curl -SL https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64 \
  -o "$DOCKER_CONFIG/cli-plugins/docker-compose"
chmod +x "$DOCKER_CONFIG/cli-plugins/docker-compose"

echo ""
echo "Setup complete."
echo "IMPORTANT: Log out and back in so the docker group takes effect."
echo "Then run: ./aws/deploy.sh"
