#!/bin/bash
# EC2 Deployment Cheatsheet - Quick Reference

cat << 'EOF'
╔══════════════════════════════════════════════════════════════════════╗
║                    EC2 DEPLOYMENT CHEATSHEET                         ║
╚══════════════════════════════════════════════════════════════════════╝

📌 FIRST TIME SETUP (ONE TIME ONLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. SSH into EC2:
   $ ssh -i your-key.pem ubuntu@YOUR_EC2_IP

2. Clone & Setup:
   $ git clone YOUR_REPO app && cd app
   $ chmod +x setup-ec2.sh && ./setup-ec2.sh
   $ exit  # Log out and log back in

3. Configure Environment:
   $ cd ~/app
   $ cp .env.production.template .env.production
   $ nano .env.production  # Fill in your values

4. Setup Nginx:
   $ sudo cp nginx.conf /etc/nginx/sites-available/week2
   $ sudo ln -sf /etc/nginx/sites-available/week2 /etc/nginx/sites-enabled/
   $ sudo rm -f /etc/nginx/sites-enabled/default
   $ sudo nginx -t && sudo systemctl restart nginx

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 DEPLOY / UPDATE (EVERY TIME)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   $ ssh -i your-key.pem ubuntu@YOUR_EC2_IP
   $ cd ~/app
   $ git pull origin main          # (if using git)
   $ nano .env.production           # (if changes needed)
   $ ./deploy.sh                    # ✨ Does everything!

   The deploy.sh script automatically:
   ✅ Builds all Docker images
   ✅ Runs database migrations
   ✅ Starts all services

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 MONITORING & MANAGEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Health Check:
   $ ./health-check.sh

View All Logs:
   $ docker-compose -f docker-compose.prod.yml logs -f

View Specific Service:
   $ docker-compose -f docker-compose.prod.yml logs -f [web|apis|workers]

Check Status:
   $ docker-compose -f docker-compose.prod.yml ps

Restart Service:
   $ docker-compose -f docker-compose.prod.yml restart [service-name]

Stop All:
   $ docker-compose -f docker-compose.prod.yml down

Start All:
   $ docker-compose -f docker-compose.prod.yml up -d

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💾 DATABASE OPERATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Backup:
   $ docker-compose -f docker-compose.prod.yml exec postgres \
     pg_dump -U postgres week2 > backup_$(date +%Y%m%d).sql

Restore:
   $ cat backup.sql | docker-compose -f docker-compose.prod.yml exec -T \
     postgres psql -U postgres week2

Access DB:
   $ docker-compose -f docker-compose.prod.yml exec postgres \
     psql -U postgres -d week2

Run Migrations:
   $ docker-compose -f docker-compose.prod.yml exec apis \
     npx prisma migrate deploy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔒 SSL SETUP (OPTIONAL BUT RECOMMENDED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Install Certbot:
   $ sudo apt-get update
   $ sudo apt-get install -y certbot python3-certbot-nginx

2. Get Certificate:
   $ sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

3. Update .env.production URLs to https://

4. Redeploy:
   $ ./deploy.sh

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Service won't start:
   $ docker-compose -f docker-compose.prod.yml logs [service-name]

Can't access application:
   1. Check Security Group (ports 80, 443 open)
   2. $ sudo systemctl status nginx
   3. $ docker ps

Out of memory:
   $ free -h
   $ sudo fallocate -l 4G /swapfile2
   $ sudo chmod 600 /swapfile2
   $ sudo mkswap /swapfile2 && sudo swapon /swapfile2

Clean Docker:
   $ docker system prune -a  # Careful! Removes unused images

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 DOCUMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Quick Start:  QUICKSTART.md
   Full Guide:   DEPLOYMENT.md
   Files Info:   DEPLOYMENT_FILES.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 REMEMBER: After initial setup, deployment is just 3 steps:
   1. SSH into EC2
   2. Edit .env.production (if needed)
   3. Run ./deploy.sh

EOF
