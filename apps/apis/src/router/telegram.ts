import { Router } from "express";
import { prisma } from "../prisma.js";
import { Kafka, Partitioners, Producer } from "kafkajs";
import { z } from "zod";
import crypto from "crypto";
import { authMiddleware } from "../middleware.js";

const router = Router();
const ZAP_TRIGGER_TOPIC = process.env.ZAP_TRIGGER_TOPIC || "zap.trigger";

const ENCRYPTION_KEY_B64 = process.env.ENCRYPTION_KEY || ""; // base64 32 bytes
const ENC_KEY = ENCRYPTION_KEY_B64 ? Buffer.from(ENCRYPTION_KEY_B64, "base64") : Buffer.alloc(32);

function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENC_KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

let producer: Producer | null = null;
async function getProducer(): Promise<Producer> {
  if (producer) return producer;
  const kafka = new Kafka({
    clientId: "apis-telegram",
    brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  });
  producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });
  await producer.connect();
  return producer;
}

const botSchema = z.object({ 
  name: z.string().min(1), 
  token: z.string().min(10),
  webhookUrl: z.string().url().optional() // Optional: allow custom webhook URL
});

router.post("/telegram/register", authMiddleware, async (req, res) => {
  // @ts-ignore - req.user is set by authMiddleware
  const userId = req.user.id;
  if (!ENCRYPTION_KEY_B64) return res.status(500).json({ error: "server_not_configured_for_encryption" });
  
  const parsed = botSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_bot", details: parsed.error.flatten() });
  
  try {
    // Create bot in database first
    // @ts-ignore - generated Prisma types will include TelegramBot after migration
    const bot = await prisma.telegramBot.create({ 
      data: { 
        name: parsed.data.name, 
        tokenEnc: encrypt(parsed.data.token), 
        userId 
      } 
    });

    // Automatically set webhook on Telegram
    // Use provided webhookUrl or construct from bot ID
    const baseUrl = parsed.data.webhookUrl || process.env.PUBLIC_WEBHOOK_URL || req.headers.origin || "";
    const webhookUrl = `${baseUrl}/api/v1/telegram/webhook/${bot.id}`;
    
    const telegramApiUrl = `https://api.telegram.org/bot${parsed.data.token}/setWebhook`;
    const webhookResponse = await fetch(telegramApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl }),
    });

    const webhookResult = await webhookResponse.json();
    
    if (!webhookResult.ok) {
      // If webhook setup fails, still return the bot but include warning
      return res.json({ 
        id: bot.id, 
        name: bot.name, 
        createdAt: bot.createdAt,
        webhookUrl: webhookUrl,
        webhookStatus: "failed",
        webhookError: webhookResult.description || "Unknown error",
        message: "Bot registered but webhook setup failed. You may need to set it manually."
      });
    }

    return res.json({ 
      id: bot.id, 
      name: bot.name, 
      createdAt: bot.createdAt,
      webhookUrl: webhookUrl,
      webhookStatus: "success",
      message: "Bot registered and webhook configured successfully!"
    });
    
  } catch (error: any) {
    console.error("Error registering bot:", error);
    return res.status(500).json({ 
      error: "bot_registration_failed", 
      details: error.message 
    });
  }
});

// Helper function to send message via Telegram API
async function sendTelegramMessage(botToken: string, chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  return response.json();
}

// Helper function to decrypt bot token
function decrypt(encryptedData: string): string {
  const buf = Buffer.from(encryptedData, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", ENC_KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Public webhook invoked by Telegram
router.post("/telegram/webhook/:triggerId", async (req, res) => {
  const { triggerId } = req.params;
  // @ts-ignore - generated Prisma types will include relations after migration
  const trigger = await prisma.trigger.findUnique({ 
    where: { id: triggerId }, 
    include: { zap: true, telegramBot: true } 
  });
  
  // @ts-ignore - relation typing after migration
  if (!trigger || !trigger.telegramBot) {
    return res.status(404).json({ error: "trigger_not_found" });
  }

  const update = req.body;
  const message = update.message;
  
  if (!message || !message.text) {
    return res.json({ ok: true }); // Ignore non-text messages
  }

  const chatId = message.chat.id;
  const text = message.text.trim();
  const userId = message.from.id;
  
  // @ts-ignore - telegramBot relation
  const botToken = decrypt(trigger.telegramBot.tokenEnc);

  try {
    // Handle /start command
    if (text === "/start") {
      await sendTelegramMessage(
        botToken,
        chatId,
        "Welcome! We're glad you're here. To get started, please provide your email address and we will contact you shortly."
      );
      return res.json({ ok: true });
    }

    // Check if message looks like an email
    if (isValidEmail(text)) {
      // Store email in database (create or update TelegramUserEmail table)
      // @ts-ignore - TelegramUserEmail table will be created
      const existingRecord = await prisma.telegramUserEmail.findUnique({
        where: { telegramUserId: userId }
      });

      if (existingRecord) {
        // @ts-ignore
        await prisma.telegramUserEmail.update({
          where: { telegramUserId: userId },
          data: { email: text, updatedAt: new Date() }
        });
        await sendTelegramMessage(
          botToken,
          chatId,
          `Thank you! Your email (${text}) has been updated successfully. We will contact you soon! 📧`
        );
      } else {
        // @ts-ignore
        await prisma.telegramUserEmail.create({
          data: {
            telegramUserId: userId,
            telegramUsername: message.from.username || null,
            firstName: message.from.first_name || null,
            lastName: message.from.last_name || null,
            email: text,
            // @ts-ignore
            telegramBotId: trigger.telegramBot.id
          }
        });
        await sendTelegramMessage(
          botToken,
          chatId,
          `Thank you! Your email (${text}) has been saved successfully. We will contact you soon! 📧`
        );
      }
      
      // Still trigger the workflow for any custom actions
      if (trigger.zap) {
        const p = await getProducer();
        await p.send({
          topic: ZAP_TRIGGER_TOPIC,
          messages: [{ 
            key: trigger.zapId, 
            value: JSON.stringify({ 
              trigger: "telegram", 
              zapId: trigger.zapId, 
              payload: { ...update, collectedEmail: text } 
            }) 
          }],
        });
      }
      
      return res.json({ ok: true });
    }

    // If not /start and not an email, send a helpful message
    await sendTelegramMessage(
      botToken,
      chatId,
      "Please provide a valid email address so we can contact you. 📧"
    );
    
    return res.json({ ok: true });
    
  } catch (error) {
    console.error("Error handling Telegram webhook:", error);
    return res.status(500).json({ error: "internal_error" });
  }
});

export default router;
