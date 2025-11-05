# 🚀 Workflow Automation Platform

Full-stack microservices platform for creating automated workflows with triggers and actions. Built with TypeScript, Next.js, Kafka, and Docker.

## 🛠️ Tech Stack

**Frontend:** Next.js 15 • React 19 • TypeScript 5 • CSS Modules  
**Backend:** Node.js 20 • Express.js • TypeScript • Prisma 6 ORM  
**Database:** PostgreSQL 16  
**Message Queue:** Apache Kafka 7.6 • KafkaJS 2.2 • Zookeeper  
**DevOps:** Docker • Docker Compose • npm Workspaces  
**Email:** Resend API • Nodemailer (Gmail SMTP)  
**Integrations:** Telegram Bot API

---

## ✨ Features

**Workflow Automation**
- Visual workflow builder with drag-and-drop
- Form triggers, Telegram bot triggers, webhook triggers
- Email actions with HTML templates
- Template variables: `{{submission.email}}`, `{{trigger.name}}`
- Multi-step execution with data passing

**Dynamic Form Builder**
- Custom forms with various field types
- Public form URLs for submissions
- Auto-trigger workflows on submission
- Form data mapping to workflow variables

**Email System**
- Resend API integration
- Nodemailer with Gmail SMTP (send to any email)
- HTML email support
- Dynamic variable replacement

**Telegram Integration**
- Create and manage bots
- Message triggers for workflows
- User email mapping
- Automated responses

**Event-Driven Architecture**
- Apache Kafka for reliable message processing
- Async workflow execution
- Scalable worker pool
- Fault-tolerant design

---

## 🏗️ Architecture

```
Next.js Frontend (3000)
         ↓
   APIs Service (3001) ← REST API
         ↓
    Apache Kafka ← Event Bus
    ↓         ↓
Processor   Workers ← Consumers
    ↓         ↓
PostgreSQL (5432) ← Prisma ORM
```

**Microservices:**
- **web**: Next.js frontend
- **apis**: REST API endpoints
- **processor**: Creates workflow runs
- **workers**: Executes actions (scalable)
- **postgres**: Database
- **kafka + zookeeper**: Message queue

**Message Flow:**
```
Form Submit → APIs → Kafka (zap.trigger) → Processor → 
Kafka (zap.run.requested) → Workers → Execute Actions → Complete
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/abdulbaqui17/week2.git
cd week2

# Install dependencies
npm install

# Start all services with Docker
docker compose up -d

# Run database migrations
cd packages/db
npx prisma migrate dev
```

### Access

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **Database**: localhost:5432

---

## 📦 Project Structure

```
week2/
├── apps/
│   ├── apis/          # REST API service (Express)
│   ├── processor/     # Kafka consumer (creates workflow runs)
│   ├── workers/       # Action executor (scalable)
│   └── web/           # Next.js frontend
├── packages/
│   ├── core/          # Business logic (executor, actions)
│   ├── db/            # Prisma schema & migrations
│   ├── kafka/         # Kafka client & topics
│   └── ui/            # Shared React components
├── docker-compose.yml
└── package.json
```

---

## 🔑 Environment Variables

Create `.env` file (or use docker-compose.yml defaults):

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/week2"

# Email (Resend)
RESEND_EMAIL_KEY="your_resend_api_key"
RESEND_FROM="onboarding@resend.dev"

# Email (Gmail SMTP via Nodemailer)
GMAIL_USER="your_email@gmail.com"
GMAIL_APP_PASSWORD="your_app_password"

# Kafka
KAFKA_BROKERS="kafka:9092"

# JWT
JWT_SECRET="your_secret_key"
```

---

## 💡 Key Concepts

### Template Variables
Dynamic data injection using `{{variable}}` syntax:

```typescript
// Config
{
  to: "{{submission.email}}",
  subject: "Welcome {{submission.name}}!",
  body: "<h1>Hi {{submission.name}}!</h1>"
}

// Runtime data
{ submission: { email: "user@example.com", name: "John" } }

// Result
{
  to: "user@example.com",
  subject: "Welcome John!",
  body: "<h1>Hi John!</h1>"
}
```

### Workflow Execution
1. User creates workflow (trigger + actions)
2. Trigger event occurs (form submit, telegram message)
3. APIs service publishes to Kafka
4. Processor creates ZapRun record
5. Workers consume and execute actions
6. Results logged to database

---

## 📊 Database Schema

**Core Tables:**
- `User` - User accounts
- `Zap` - Workflow definitions
- `Trigger` - Workflow triggers (form, telegram, webhook)
- `Action` - Workflow actions (email, http)
- `ZapRun` - Execution records
- `Form` - Custom forms
- `FormSubmission` - Form data
- `TelegramBot` - Bot configurations
- `AvailableTrigger` - Trigger types
- `AvailableAction` - Action types

---

## 🧪 Usage Example

### Create Email Workflow

1. **Create Form** at `/workflows/new`
2. **Add Form Trigger**
3. **Add Email Action** with config:
   ```json
   {
     "to": "{{submission.email}}",
     "subject": "Thanks for submitting!",
     "body": "<h1>Hello {{submission.name}}!</h1>"
   }
   ```
4. **Save Workflow**
5. **Submit Form** - email sent automatically!

### Check Logs
```bash
docker compose logs -f workers
```

---

## 👨‍💻 Skills Demonstrated

✅ **Full-Stack Development** - Next.js, React, Node.js, TypeScript  
✅ **Microservices Architecture** - Event-driven, loosely coupled services  
✅ **Message Queues** - Apache Kafka for async processing  
✅ **Database Design** - PostgreSQL with Prisma ORM  
✅ **Docker** - Multi-container orchestration  
✅ **API Development** - RESTful endpoints, auth, validation  
✅ **Real-Time Processing** - Event streaming, workers  
✅ **Third-Party Integration** - Email APIs, Telegram bots  
✅ **Monorepo** - npm workspaces, shared packages  
✅ **Production Patterns** - Error handling, logging, scalability

---

## 📈 Complexity Metrics

- **7 Services** (web, apis, processor, workers, postgres, kafka, zookeeper)
- **15+ Technologies** integrated
- **Microservices + Event-Driven** architecture
- **10+ Database Tables** with relations
- **3 Kafka Topics** for async communication
- **Multiple Triggers & Actions** supported
- **Template Engine** for dynamic variables
- **Scalable Worker Pool** for parallel execution

---

## 🎯 Suitable For

**Senior Full-Stack Developer** • **Backend Engineer** • **Solutions Architect**  
**Microservices Developer** • **Integration Engineer** • **DevOps Engineer**

**Estimated Level:** Senior Developer ($100k-$150k+)

---

## 📞 Contact

**GitHub**: [@abdulbaqui17](https://github.com/abdulbaqui17)  
**Repository**: [github.com/abdulbaqui17/week2](https://github.com/abdulbaqui17/week2)

---

## 📄 License

MIT License - Open source and free to use.

---

<div align="center">

**⭐ Star this repository if you find it impressive!**

Made with ❤️ by Abdul Baqui

</div>
