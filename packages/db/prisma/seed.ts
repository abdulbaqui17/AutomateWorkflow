import { PrismaClient } from '../generated/prisma/index.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables from root .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create AvailableTrigger
  const webhookTrigger = await prisma.availableTrigger.upsert({
    where: { name: 'Webhook Trigger' },
    update: {},
    create: {
      name: 'Webhook Trigger',
    },
  });

  // New AvailableTriggers for Form and Telegram Bot
  const formTrigger = await prisma.availableTrigger.upsert({
    where: { name: 'Form Trigger' },
    update: {},
    create: { name: 'Form Trigger' },
  });

  const telegramTrigger = await prisma.availableTrigger.upsert({
    where: { name: 'Telegram Bot Trigger' },
    update: {},
    create: { name: 'Telegram Bot Trigger' },
  });

  // Seed AvailableActions
  console.log('Seeding available actions...');
  
  const sendEmailNodemailerAction = await prisma.availableAction.upsert({
    where: { name: 'send_email_nodemailer' },
    update: {},
    create: {
      name: 'send_email_nodemailer',
      description: 'Send email using Gmail SMTP via Nodemailer',
    },
  });

  console.log('Created trigger:', webhookTrigger);
  console.log('Created trigger:', formTrigger);
  console.log('Created trigger:', telegramTrigger);
  console.log('Created action:', sendEmailNodemailerAction);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });