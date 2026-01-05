# 📦 EC2 Deployment Files Overview

## Files Created for Deployment

### 🚀 Core Deployment Files

#### 1. `docker-compose.prod.yml`
Production Docker Compose configuration with:
- Optimized for production use
- Health checks for all services
- Persistent volumes for data
- Restart policies
- Environment variable support
- No development mounts

#### 2. `deploy.sh` ⭐️
Main deployment script that:
- Pulls latest code
- Builds Docker images
- Runs database migrations
- Starts all services
- Shows deployment status

**Usage:**
```bash
./deploy.sh
```

#### 3. `setup-ec2.sh` ⭐️
Initial EC2 setup script that installs:
- Docker & Docker Compose
- Node.js
- Nginx
- AWS CLI
- Configures firewall
- Sets up swap space

**Usage (run once):**
```bash
./setup-ec2.sh
```

#### 4. `.env.production.template`
Template for production environment variables. Copy to `.env.production` and fill in your values.

**Setup:**
```bash
cp .env.production.template .env.production
nano .env.production  # Fill in your values
```

---

### 🌐 Web Server Configuration

#### 5. `nginx.conf`
Nginx reverse proxy configuration:
- Routes web traffic to Next.js (port 3000)
- Routes API traffic to backend (port 3001)
- SSL/HTTPS support (commented, uncomment after SSL setup)
- Security headers
- Static file caching

**Setup:**
```bash
sudo cp nginx.conf /etc/nginx/sites-available/week2
sudo ln -sf /etc/nginx/sites-available/week2 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### 📚 Documentation

#### 6. `DEPLOYMENT.md` 📖
Comprehensive deployment guide with:
- Prerequisites
- Step-by-step instructions
- SSL setup with Let's Encrypt
- Monitoring and maintenance
- Troubleshooting
- Security best practices

#### 7. `QUICKSTART.md` ⚡
Quick 5-minute deployment guide:
- Condensed step-by-step process
- Essential commands only
- Common troubleshooting

---

### 🔧 Utility Scripts

#### 8. `health-check.sh`
System health monitoring script that checks:
- Docker status
- Container health
- Resource usage (CPU, memory, disk)
- Endpoint availability
- Recent errors

**Usage:**
```bash
./health-check.sh
```

---

### 🤖 CI/CD (Optional)

#### 9. `.github/workflows/deploy.yml`
GitHub Actions workflow for automated deployment:
- Triggers on push to main branch
- SSH into EC2
- Pulls latest code
- Runs deployment script

**Setup:**
Add these GitHub Secrets:
- `EC2_SSH_PRIVATE_KEY`
- `EC2_HOST`
- `EC2_USER`

---

## 📋 Deployment Checklist

### Before Deployment
- [ ] Launch EC2 instance (t3.medium or larger)
- [ ] Configure Security Group (ports 22, 80, 443)
- [ ] Have domain name ready (optional)

### Initial Setup
- [ ] Run `setup-ec2.sh`
- [ ] Log out and log back in
- [ ] Create `.env.production` from template
- [ ] Configure Nginx with your domain/IP
- [ ] Run `deploy.sh`

### After Deployment
- [ ] Run `health-check.sh` to verify
- [ ] Test application in browser
- [ ] Setup SSL with Let's Encrypt (recommended)
- [ ] Configure automated backups
- [ ] Set up monitoring

---

## 🎯 Quick Commands Reference

```bash
# Initial setup (run once)
./setup-ec2.sh

# Deploy application
./deploy.sh

# Check system health
./health-check.sh

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f web
docker-compose -f docker-compose.prod.yml logs -f apis

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Backup database
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres week2 > backup_$(date +%Y%m%d).sql

# Access PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d week2

# Run migrations
docker-compose -f docker-compose.prod.yml exec apis npx prisma migrate deploy

# Check container status
docker ps

# Check resource usage
docker stats
```

---

## 🔐 Security Files (Protected)

These files contain sensitive data and are in `.gitignore`:

- `.env.production` - Production environment variables
- `backup*.sql` - Database backups
- `*.log` - Log files

**NEVER commit these to git!**

---

## 🌟 Architecture Overview

```
Internet
    ↓
  [Nginx] :80, :443
    ├─→ Frontend (Next.js) :3000
    └─→ Backend API :3001
         ├─→ PostgreSQL :5432
         ├─→ Kafka :9092
         │    └─→ Zookeeper :2181
         ├─→ Processor (Kafka Consumer)
         └─→ Workers (Email, Tasks)
```

---

## 📊 Monitoring & Maintenance

### Daily
- Run `./health-check.sh`
- Check logs for errors

### Weekly
- Review disk usage: `df -h`
- Check Docker disk usage: `docker system df`
- Update system: `sudo apt update && sudo apt upgrade`

### Monthly
- Update Docker images
- Review and clean old backups
- Check SSL certificate expiration

### Backups
Set up automated daily backups:
```bash
# Add to crontab
0 2 * * * cd ~/app && docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres week2 > ~/backups/db_$(date +\%Y\%m\%d).sql
```

---

## 🆘 Getting Help

1. **Check health status**: `./health-check.sh`
2. **View logs**: `docker-compose -f docker-compose.prod.yml logs -f`
3. **Check documentation**: See `DEPLOYMENT.md`
4. **Common issues**: See Troubleshooting section in `DEPLOYMENT.md`

---

## 🎉 Summary

All deployment files are ready! Follow the quick start guide to deploy:

1. **Launch EC2** (t3.medium, Ubuntu 22.04)
2. **Run setup**: `./setup-ec2.sh` (once)
3. **Configure**: Create `.env.production`
4. **Deploy**: `./deploy.sh`
5. **Verify**: `./health-check.sh`

For detailed instructions, see [QUICKSTART.md](QUICKSTART.md) or [DEPLOYMENT.md](DEPLOYMENT.md).

Good luck with your deployment! 🚀
