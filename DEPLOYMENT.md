# EC2 Deployment Guide

Complete guide to deploying the Week2 application on AWS EC2.

## Table of Contents
- [Prerequisites](#prerequisites)
- [EC2 Instance Setup](#ec2-instance-setup)
- [Initial Configuration](#initial-configuration)
- [Application Deployment](#application-deployment)
- [Domain & SSL Setup](#domain--ssl-setup)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### AWS Account Requirements
- Active AWS account
- EC2 instance access
- Security group with appropriate ports open

### Recommended EC2 Instance
- **Instance Type**: t3.medium or larger (minimum t2.medium)
  - t2.micro is NOT recommended for production
- **OS**: Ubuntu 22.04 LTS
- **Storage**: At least 30GB EBS volume
- **Memory**: Minimum 4GB RAM

### Required Ports
Configure your EC2 Security Group to allow:
- Port 22 (SSH)
- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 3000 (Next.js - optional, if not using Nginx)
- Port 3001 (API - optional, if not using Nginx)

## EC2 Instance Setup

### 1. Launch EC2 Instance

```bash
# From AWS Console:
1. Go to EC2 Dashboard
2. Click "Launch Instance"
3. Choose Ubuntu Server 22.04 LTS (HVM)
4. Select t3.medium or t2.medium instance type
5. Configure storage: 30GB minimum
6. Configure Security Group with required ports
7. Create or select an existing key pair
8. Launch instance
```

### 2. Connect to EC2 Instance

```bash
# From your local machine
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### 3. Run Initial Setup Script

```bash
# Clone your repository (or upload files)
cd ~
git clone https://github.com/your-username/your-repo.git app
cd app

# Make setup script executable
chmod +x setup-ec2.sh

# Run setup script
./setup-ec2.sh

# IMPORTANT: Log out and log back in
exit
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

The setup script will install:
- Docker & Docker Compose
- Node.js (v20)
- Nginx
- AWS CLI
- Other essential tools

## Initial Configuration

### 1. Create Production Environment File

Create `.env.production` in your project root:

```bash
cd ~/app
nano .env.production
```

Add the following (replace with your actual values):

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password-here
POSTGRES_DB=week2
DATABASE_URL="postgresql://postgres:your-secure-password-here@postgres:5432/week2"

# Kafka
KAFKA_BROKERS="kafka:9092"

# Security
JWT_SECRET="generate-a-secure-random-string-here"
ENCRYPTION_KEY="generate-a-secure-encryption-key-here"
SECRET_KEY="generate-a-secure-secret-key-here"

# Email Configuration (Resend)
RESEND_EMAIL_KEY="your-resend-api-key"
RESEND_FROM="your-email@yourdomain.com"

# Email Configuration (Gmail - if using Nodemailer)
GMAIL_USER="your-gmail@gmail.com"
GMAIL_APP_PASSWORD="your-gmail-app-password"

# Application URLs (replace with your domain or EC2 IP)
APP_BASE_URL="http://your-domain.com"
FRONTEND_URL="http://your-domain.com"
NEXT_PUBLIC_API_URL="http://your-domain.com/api"
PUBLIC_WEBHOOK_URL="http://your-domain.com"

# Node Environment
NODE_ENV="production"
```

**Important Notes:**
- Generate secure random strings for JWT_SECRET and ENCRYPTION_KEY
- Never commit `.env.production` to version control
- Use strong passwords for PostgreSQL

### 2. Generate Secure Keys

```bash
# Generate JWT_SECRET (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate ENCRYPTION_KEY (base64, 32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Configure Nginx

```bash
# Copy Nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/week2

# Update the configuration with your domain/IP
sudo nano /etc/nginx/sites-available/week2
# Replace 'your-domain.com' with your actual domain or EC2 public IP

# Enable the site
sudo ln -sf /etc/nginx/sites-available/week2 /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Application Deployment

### 1. Make Deploy Script Executable

```bash
chmod +x deploy.sh
```

### 2. Run Initial Deployment

```bash
./deploy.sh
```

The deployment script will:
1. Pull latest code (if using git)
2. Load environment variables
3. Stop existing containers
4. Build Docker images
5. Run database migrations
6. Start all services
7. Display service status

### 3. Verify Deployment

```bash
# Check running containers
docker ps

# Check service logs
docker-compose -f docker-compose.prod.yml logs -f

# Check specific service
docker-compose -f docker-compose.prod.yml logs -f web
docker-compose -f docker-compose.prod.yml logs -f apis

# Test endpoints
curl http://localhost:3001/health
curl http://localhost:3000
```

### 4. Access Your Application

```bash
# Get your EC2 public IP
curl http://169.254.169.254/latest/meta-data/public-ipv4

# Access in browser:
# http://YOUR-EC2-IP (Web interface)
# http://YOUR-EC2-IP/api (API)
```

## Domain & SSL Setup

### 1. Point Domain to EC2

In your domain registrar (GoDaddy, Namecheap, etc.):
1. Create an A record pointing to your EC2 public IP
2. Wait for DNS propagation (5-30 minutes)

### 2. Install SSL Certificate with Let's Encrypt

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: yes)

# Test automatic renewal
sudo certbot renew --dry-run
```

### 3. Update Environment Variables for HTTPS

```bash
nano .env.production
```

Update URLs to use HTTPS:
```env
APP_BASE_URL="https://your-domain.com"
FRONTEND_URL="https://your-domain.com"
NEXT_PUBLIC_API_URL="https://your-domain.com/api"
PUBLIC_WEBHOOK_URL="https://your-domain.com"
```

### 4. Redeploy with HTTPS

```bash
./deploy.sh
```

## Monitoring & Maintenance

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f web
docker-compose -f docker-compose.prod.yml logs -f apis
docker-compose -f docker-compose.prod.yml logs -f processor
docker-compose -f docker-compose.prod.yml logs -f workers

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100

# Nginx logs
sudo tail -f /var/log/nginx/week2_access.log
sudo tail -f /var/log/nginx/week2_error.log
```

### Container Management

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Restart a service
docker-compose -f docker-compose.prod.yml restart web

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Rebuild and restart a service
docker-compose -f docker-compose.prod.yml up -d --build web
```

### Database Management

```bash
# Access PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d week2

# Backup database
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres week2 > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
cat backup.sql | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres week2

# Run migrations
docker-compose -f docker-compose.prod.yml exec apis npx prisma migrate deploy

# Generate Prisma client
docker-compose -f docker-compose.prod.yml exec apis npx prisma generate
```

### System Monitoring

```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check Docker disk usage
docker system df

# Clean up Docker
docker system prune -a --volumes  # Be careful! This removes all unused images and volumes
```

### Automated Backups

Create a backup script:

```bash
nano ~/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker-compose -f ~/app/docker-compose.prod.yml exec -T postgres pg_dump -U postgres week2 > $BACKUP_DIR/db_$DATE.sql

# Backup environment file
cp ~/app/.env.production $BACKUP_DIR/env_$DATE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "env_*" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make it executable and add to crontab:

```bash
chmod +x ~/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add this line:
0 2 * * * /home/ubuntu/backup.sh >> /home/ubuntu/backup.log 2>&1
```

## Troubleshooting

### Services Not Starting

```bash
# Check logs for errors
docker-compose -f docker-compose.prod.yml logs

# Check if ports are already in use
sudo netstat -tulpn | grep -E ':(3000|3001|5432|9092)'

# Restart Docker
sudo systemctl restart docker

# Remove all containers and start fresh
docker-compose -f docker-compose.prod.yml down -v
./deploy.sh
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose -f docker-compose.prod.yml ps postgres

# Check DATABASE_URL in .env.production
cat .env.production | grep DATABASE_URL

# Test connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d week2 -c "SELECT 1;"
```

### Kafka Issues

```bash
# Check Kafka and Zookeeper are running
docker-compose -f docker-compose.prod.yml ps kafka zookeeper

# Check Kafka logs
docker-compose -f docker-compose.prod.yml logs kafka

# Restart Kafka services
docker-compose -f docker-compose.prod.yml restart zookeeper kafka
```

### Out of Memory

```bash
# Check memory usage
free -h

# Increase swap space
sudo fallocate -l 4G /swapfile2
sudo chmod 600 /swapfile2
sudo mkswap /swapfile2
sudo swapon /swapfile2

# Or upgrade to larger instance type
```

### SSL Certificate Issues

```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Application Not Accessible

```bash
# Check EC2 Security Group
# Ensure ports 80 and 443 are open to 0.0.0.0/0

# Check Nginx status
sudo systemctl status nginx

# Check if services are listening
sudo netstat -tulpn | grep -E ':(80|443|3000|3001)'

# Test locally
curl http://localhost:3000
curl http://localhost:3001/health
```

## Updates and Redeployment

### Update Application Code

```bash
cd ~/app

# Pull latest changes
git pull origin main

# Redeploy
./deploy.sh
```

### Update Environment Variables

```bash
# Edit .env.production
nano .env.production

# Redeploy
./deploy.sh
```

### Update Dependencies

```bash
# Stop containers
docker-compose -f docker-compose.prod.yml down

# Rebuild with no cache
docker-compose -f docker-compose.prod.yml build --no-cache

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

## Security Best Practices

1. **Keep system updated:**
   ```bash
   sudo apt-get update && sudo apt-get upgrade -y
   ```

2. **Use strong passwords** for all services

3. **Never commit sensitive data** to git

4. **Regularly backup** your database

5. **Monitor logs** for suspicious activity

6. **Use SSL/HTTPS** in production

7. **Restrict SSH access** to specific IPs if possible

8. **Keep Docker images updated:**
   ```bash
   docker-compose -f docker-compose.prod.yml pull
   ./deploy.sh
   ```

## Useful Commands Reference

```bash
# View all running containers
docker ps

# Access container shell
docker-compose -f docker-compose.prod.yml exec [service-name] sh

# View container resource usage
docker stats

# Follow logs in real-time
docker-compose -f docker-compose.prod.yml logs -f [service-name]

# Restart specific service
docker-compose -f docker-compose.prod.yml restart [service-name]

# Scale a service (if needed)
docker-compose -f docker-compose.prod.yml up -d --scale workers=3

# Check Docker network
docker network ls
docker network inspect week2_default
```

## Support

For issues:
1. Check logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify environment variables in `.env.production`
3. Check EC2 Security Group settings
4. Ensure sufficient disk space and memory

## Quick Commands Summary

```bash
# Initial setup
./setup-ec2.sh

# Deploy/Update
./deploy.sh

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart all
docker-compose -f docker-compose.prod.yml restart

# Stop all
docker-compose -f docker-compose.prod.yml down

# Backup database
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres week2 > backup.sql
```
