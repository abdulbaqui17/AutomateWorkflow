import { PrismaClient } from '../../db/generated/prisma/index.js';
const prisma = new PrismaClient();
import { sendEmail } from './actions/sendEmail.js';

// Inline Nodemailer implementation to avoid module issues
async function sendEmailNodemailer({ to, subject, body }: { to: string; subject: string; body: string; }) {
  const nodemailer = await import('nodemailer').catch(() => null);
  if (!nodemailer) {
    console.error("❌ Nodemailer not available");
    return { ok: false, error: "Nodemailer not installed" };
  }
  
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  
  if (!gmailUser || !gmailAppPassword) {
    console.error("❌ Gmail credentials not configured");
    return { ok: false, error: "Gmail credentials missing" };
  }
  
  const transporter = nodemailer.default.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailAppPassword },
  });
  
  console.log(`📧 Sending email to: ${to} via Gmail SMTP`);
  
  try {
    const info = await transporter.sendMail({
      from: `"Workflow Automation" <${gmailUser}>`,
      to, subject, text: body,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #333;">Workflow Automation Platform</h2>
        <p style="color: #555; line-height: 1.6;">${body}</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">Sent via Nodemailer</p>
      </div>`,
    });
    console.log("✅ Email sent! Message ID:", info.messageId);
    return { ok: true, messageId: info.messageId, to, subject, message: "Email sent via Gmail SMTP" };
  } catch (error: any) {
    console.error("❌ Email failed:", error);
    return { ok: false, error: error.message };
  }
}

// removed http_request mapping - 30 September 2025
// Map AvailableAction.name -> implementation
const actionImpl: Record<string, (cfg: any, input: any) => Promise<any>> = {
  send_email: sendEmail,
  send_email_nodemailer: sendEmailNodemailer,
};

/**
 * Replace placeholders like {{submission.email}} or {{trigger.firstName}} 
 * with actual values from the payload
 */
function replacePlaceholders(text: string, payload: any): string {
  if (!text || typeof text !== 'string') return text;
  
  // Match {{anything.anything}} or {{anything}}
  return text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const keys = path.trim().split('.');
    let value: any = payload;
    
    // Navigate through nested object
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        // If path not found, return original placeholder
        return match;
      }
    }
    
    // Return the resolved value or original placeholder
    return value !== undefined && value !== null ? String(value) : match;
  });
}

/**
 * Recursively replace placeholders in a configuration object
 */
function replaceConfigPlaceholders(config: any, payload: any): any {
  if (typeof config === 'string') {
    return replacePlaceholders(config, payload);
  }
  
  if (Array.isArray(config)) {
    return config.map(item => replaceConfigPlaceholders(item, payload));
  }
  
  if (config && typeof config === 'object') {
    const result: any = {};
    for (const key in config) {
      result[key] = replaceConfigPlaceholders(config[key], payload);
    }
    return result;
  }
  
  return config;
}

export async function executeZapRun(zapRunId: string) {
  const run = await prisma.zapRun.findUnique({
    where: { id: zapRunId },
    include: {
      zap: {
        include: {
          trigger: { include: { type: true } },
          action: { include: { type: true } },
        },
      },
    },
  });
  if (!run) throw new Error("zapRun not found");
  if (!run.zap) throw new Error("zap missing");

  let payload: any = run.metaData ?? {};
  
  console.log('🔥 Executing ZapRun:', zapRunId);
  console.log('📦 Initial payload:', JSON.stringify(payload, null, 2));
  
  for (const a of run.zap.action) {
    const name = a.type.name;
    const impl = actionImpl[name];
    if (!impl) {
      console.error("executeZapRun: missing implementation for action", name);
      return { error: "action_not_found", name };
    }
    
    // Get config and replace placeholders with actual data from payload
    // @ts-ignore: you'll add Action.config later if desired
    const rawConfig = (a as any).config ?? {};
    const cfg = replaceConfigPlaceholders(rawConfig, payload);
    
    console.log(`🎬 Action: ${name}`);
    console.log(`📝 Raw config:`, JSON.stringify(rawConfig, null, 2));
    console.log(`✨ Resolved config:`, JSON.stringify(cfg, null, 2));
    
    const result = await impl(cfg, payload);
    payload = { prev: payload, action: result };
  }
  
  console.log('✅ ZapRun complete:', zapRunId);
  return payload;
}
