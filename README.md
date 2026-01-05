# 🚀 AutomateWorkflow

Microservices workflow automation platform with Next.js, Kafka, and Docker. Create workflows with form/Telegram triggers and email actions.

## 🛠️ Stack

Next.js 15 • React 19 • Node.js 20 • TypeScript • Express • Prisma 6 • PostgreSQL 16 • Kafka 7.6 • Docker • Resend • Nodemailer • Telegram API

## ✨ Features

- Visual workflow builder with form/Telegram/webhook triggers
- Email automation (Resend + Gmail SMTP) with HTML templates
- Template variables: `{{submission.email}}`, `{{trigger.name}}`
- Event-driven architecture with Kafka message queue
- Scalable worker pool for async execution

## 🏗️ Architecture

```
Next.js (3000) → APIs (3001) → Kafka → Processor → Workers → PostgreSQL (5432)
```

**7 Services:** web • apis • processor • workers • postgres • kafka • zookeeper

## 🌐 Deploy to EC2

**Simple 3-step deployment:**

```bash
# 1. SSH into EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
cd ~/app

# 2. Configure environment
nano .env.production

# 3. Deploy (builds & deploys automatically!)
./deploy.sh
```

📚 **First time?** See [QUICKSTART.md](QUICKSTART.md) for initial setup  
📖 **Full guide:** [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 🚀 Local Development Quick Start

```bash
git clone https://github.com/abdulbaqui17/week2.git
cd week2
npm install
docker compose up -d
cd packages/db && npx prisma migrate dev
```

**Access:** http://localhost:3000

## 📦 Structure

```
apps/
  apis/       # REST API
  processor/  # Kafka consumer
  workers/    # Action executor
  web/        # Next.js frontend
packages/
  core/       # Business logic
  db/         # Prisma schema
  kafka/      # Message queue
```

## 💡 Template Variables

```typescript
// Config
{ to: "{{submission.email}}", subject: "Welcome {{submission.name}}!" }

// Runtime → Result
{ submission: { email: "user@example.com", name: "John" } }
→ { to: "user@example.com", subject: "Welcome John!" }
```

## 👨‍💻 Skills

✅ Full-Stack (Next.js, React, Node.js, TypeScript)  
✅ Microservices + Event-Driven Architecture  
✅ Kafka Message Queue  
✅ PostgreSQL + Prisma ORM  
✅ Docker Multi-Container  
✅ REST APIs + Third-Party Integration

**Level:** Senior Developer

---

**GitHub:** [@abdulbaqui17](https://github.com/abdulbaqui17) | **License:** MIT

⭐ Star if impressive!
