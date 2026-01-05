import { PrismaClient } from '../generated/prisma/index.js';

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

  // removed http_request from seeds - 30 September 2025
  // removed send_email from seeds - 5 January 2026

  console.log('Created trigger:', webhookTrigger);
  console.log('Created trigger:', formTrigger);
  console.log('Created trigger:', telegramTrigger);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });