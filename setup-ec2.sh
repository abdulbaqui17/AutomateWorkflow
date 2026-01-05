#!/bin/bash

# EC2 Initial Setup Script
# Run this script once on a fresh EC2 instance to install all dependencies

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_message() {
    echo -e "${GREEN}[SETUP]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if running as root or with sudo
if [ "$EUID" -eq 0 ]; then 
    print_warning "Please do not run this script as root. Run as regular user with sudo access."
    exit 1
fi

print_message "Starting EC2 setup for Week2 application..."

# Update system
print_message "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install essential packages
print_message "Installing essential packages..."
sudo apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    build-essential \
    ca-certificates \
    gnupg \
    lsb-release \
    software-properties-common

# Install Docker
print_message "Installing Docker..."
if ! command -v docker &> /dev/null; then
    # Add Docker's official GPG key
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    # Set up Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Add current user to docker group
    sudo usermod -aG docker $USER
    print_message "Docker installed successfully"
else
    print_info "Docker already installed"
fi

# Install Docker Compose (standalone, for compatibility)
print_message "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION="v2.24.5"
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_message "Docker Compose installed successfully"
else
    print_info "Docker Compose already installed"
fi

# Install Node.js (optional, for local builds)
print_message "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_message "Node.js $(node -v) installed successfully"
else
    print_info "Node.js already installed: $(node -v)"
fi

# Install Nginx
print_message "Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt-get install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    print_message "Nginx installed successfully"
else
    print_info "Nginx already installed"
fi

# Configure firewall (UFW)
print_message "Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw --force enable
    sudo ufw allow ssh
    sudo ufw allow 'Nginx Full'
    sudo ufw allow 22
    sudo ufw allow 80
    sudo ufw allow 443
    sudo ufw status
    print_message "Firewall configured"
else
    print_warning "UFW not available, skipping firewall configuration"
fi

# Create application directory
print_message "Creating application directory..."
APP_DIR="/home/$USER/app"
if [ ! -d "$APP_DIR" ]; then
    mkdir -p "$APP_DIR"
    print_message "Application directory created at $APP_DIR"
else
    print_info "Application directory already exists"
fi

# Setup swap (recommended for t2.micro instances)
print_message "Setting up swap space..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    print_message "Swap space configured (2GB)"
else
    print_info "Swap file already exists"
fi

# Configure Docker daemon for better performance
print_message "Configuring Docker daemon..."
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF
sudo systemctl restart docker

# Install AWS CLI (optional)
print_message "Installing AWS CLI..."
if ! command -v aws &> /dev/null; then
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
    print_message "AWS CLI installed successfully"
else
    print_info "AWS CLI already installed"
fi

# Setup log rotation for Docker
print_message "Setting up log rotation..."
sudo tee /etc/logrotate.d/docker-containers > /dev/null <<EOF
/var/lib/docker/containers/*/*.log {
  rotate 7
  daily
  compress
  missingok
  delaycompress
  copytruncate
}
EOF

print_message ""
print_message "═══════════════════════════════════════════════════════"
print_message "${GREEN}✓${NC} EC2 setup completed successfully!"
print_message "═══════════════════════════════════════════════════════"
print_message ""
print_message "Next steps:"
print_message "1. Log out and log back in for Docker group changes to take effect"
print_message "2. Clone your repository to $APP_DIR"
print_message "3. Create .env.production file with your environment variables"
print_message "4. Configure Nginx with your domain"
print_message "5. Run the deployment script: ./deploy.sh"
print_message ""
print_message "Installed versions:"
print_message "  - Docker: $(docker --version)"
print_message "  - Docker Compose: $(docker-compose --version)"
print_message "  - Node.js: $(node --version)"
print_message "  - Nginx: $(nginx -v 2>&1)"
print_message ""
print_warning "Please log out and log back in for all changes to take effect!"
