# 🚀 Quick Start: EC2 Deployment

## Ultra-Simple 3-Step Process

After initial setup, deploying is just:
1. **SSH into EC2**
2. **Edit `.env.production`** with your settings
3. **Run `./deploy.sh`** - That's it! It handles build + deployment automatically

---

## First Time Setup (One-Time Only)

### 1️⃣ Launch EC2 Instance (AWS Console)
- **AMI**: Ubuntu 22.04 LTS
- **Instance Type**: t3.medium (or t2.medium minimum)
- **Storage**: 30GB
- **Security Group**: Allow ports 22, 80, 443

### 2️⃣ Connect to EC2
```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### 3️⃣ Clone Repository
```bash
cd ~
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git app
cd app
```

### 4️⃣ Run Setup Script (ONE TIME ONLY)
```bash
chmod +x setup-ec2.sh
./setup-ec2.sh

# ⚠️ IMPORTANT: Log out and log back in for Docker permissions
exit
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
cd ~/app
```

### 5️⃣ Configure Environment
```bash
# Copy template
cp .env.production.template .env.production

# Edit with your values
nano .env.production
```

**Required Changes in .env.production:**
```bash
# Generate secrets:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # For JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"  # For ENCRYPTION_KEY

# Update these in .env.production:
- POSTGRES_PASSWORD
- JWT_SECRET
- ENCRYPTION_KEY
- RESEND_EMAIL_KEY (get from resend.com)
- APP_BASE_URL (your EC2 IP or domain)
- FRONTEND_URL (your EC2 IP or domain)
- NEXT_PUBLIC_API_URL (your EC2 IP/domain + /api)
- PUBLIC_WEBHOOK_URL (your EC2 IP or domain)
```

### 6️⃣ Configure Nginx
```bash
# Edit nginx config with your domain/IP
sudo nano nginx.conf
# Change 'your-domain.com' to your actual domain or EC2 public IP

# Copy to nginx
sudo cp nginx.conf /etc/nginx/sites-available/week2
sudo ln -sf /etc/nginx/sites-available/week2 /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
```

### 7️⃣ Deploy Application (Builds & Deploys Everything!)
```bash
chmod +x deploy.sh
./deploy.sh
```

**That's it!** The script automatically:
- ✅ Builds all Docker images
- ✅ Runs database migrations
- ✅ Starts all services (web, api, postgres, kafka, workers, processor)
- ✅ Shows status and logs

### 8️⃣ Access Your Application
```bash
# Get your public IP
curl http://169.254.169.254/latest/meta-data/public-ipv4

# Open in browser:
# http://YOUR_EC2_IP
```

---

## 🔄 Future Deployments (After Initial Setup)

Whenever you need to update or redeploy:

```bash
# 1. SSH into EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
cd ~/app

# 2. Pull latest code (if using git)
git pull origin main

# 3. Update .env.production if needed
nano .env.production

# 4. Deploy! (handles everything)
./deploy.sh
```

**That's literally it!** The deploy script handles all the building and deployment automatically.

---

## 🔒 Optional: Setup SSL (Recommended for Production)

### Prerequisites
- Domain name pointing to your EC2 IP
- Wait 10-30 minutes for DNS propagation

### Install SSL Certificate
```bash
# Install certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts and choose to redirect HTTP to HTTPS
```

### Update Environment for HTTPS
```bash
nano .env.production

# Change all URLs from http:// to https://
APP_BASE_URL="https://yourdomain.com"
FRONTEND_URL="https://yourdomain.com"
NEXT_PUBLIC_API_URL="https://yourdomain.com/api"
PUBLIC_WEBHOOK_URL="https://yourdomain.com"

# Redeploy
./deploy.sh
```

---

## 🛠️ Common Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Backup database
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres week2 > backup.sql

# Update and redeploy
git pull origin main
./deploy.sh
```

---

## ⚠️ Troubleshooting

### Services won't start?
```bash
docker-compose -f docker-compose.prod.yml logs
```

### Can't access application?
1. Check Security Group (ports 80, 443 open)
2. Check Nginx: `sudo systemctl status nginx`
3. Check containers: `docker ps`

### Out of memory?
```bash
# Check memory
free -h

# Increase swap
sudo fallocate -l 4G /swapfile2
sudo chmod 600 /swapfile2
sudo mkswap /swapfile2
sudo swapon /swapfile2
```

---

## 📚 Full Documentation

For detailed information, see [DEPLOYMENT.md](DEPLOYMENT.md)

## 🎉 That's It!

Your application should now be running at:
- **Frontend**: http://YOUR_IP
- **API**: http://YOUR_IP/api

---

**Need Help?** Check the logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```
