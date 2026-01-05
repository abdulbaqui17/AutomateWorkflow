#!/bin/bash

# EC2 Production Deployment Script
# This script automates the deployment of the application on EC2

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    echo -e "${GREEN}[DEPLOY]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if .env.production exists
if [ ! -f .env.production ]; then
    print_error ".env.production file not found!"
    print_message "Please create .env.production with your production environment variables"
    exit 1
fi

print_message "Starting deployment..."

# Pull latest code (if using git)
if [ -d .git ]; then
    print_message "Pulling latest code from git..."
    git pull origin main || git pull origin master || print_warning "Could not pull from git"
fi

# Load environment variables
print_message "Loading environment variables..."
export $(cat .env.production | grep -v '^#' | xargs)

# Stop existing containers
print_message "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Remove old images (optional, uncomment if you want to rebuild everything)
# print_message "Removing old images..."
# docker-compose -f docker-compose.prod.yml down --rmi all

# Build images
print_message "Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Run database migrations
print_message "Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm apis npx prisma migrate deploy || {
    print_error "Database migration failed!"
    print_message "Attempting to generate Prisma client and retry..."
    docker-compose -f docker-compose.prod.yml run --rm apis npx prisma generate
    docker-compose -f docker-compose.prod.yml run --rm apis npx prisma migrate deploy
}

# Start all services
print_message "Starting all services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
print_message "Waiting for services to be healthy..."
sleep 10

# Check service status
print_message "Checking service status..."
docker-compose -f docker-compose.prod.yml ps

# Show logs
print_message "Recent logs:"
docker-compose -f docker-compose.prod.yml logs --tail=50

print_message "${GREEN}✓${NC} Deployment completed successfully!"
print_message "Access your application at:"
print_message "  - Web: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
print_message "  - API: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3001"
print_message ""
print_message "To view logs: docker-compose -f docker-compose.prod.yml logs -f [service-name]"
print_message "To restart: docker-compose -f docker-compose.prod.yml restart"
print_message "To stop: docker-compose -f docker-compose.prod.yml down"
