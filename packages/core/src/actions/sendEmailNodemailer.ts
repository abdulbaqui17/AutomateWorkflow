import nodemailer from "nodemailer";

export async function sendEmailNodemailer({ 
  to, 
  subject, 
  body 
}: { 
  to: string; 
  subject: string; 
  body: string; 
}) {
  console.log("🔧 Nodemailer Email Action Config:", { to, subject, body });

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    console.error("❌ Gmail credentials not configured in .env");
    throw new Error("Gmail SMTP credentials are missing. Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env file");
  }

  // Create transporter using Gmail SMTP
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  console.log("📧 Sending email via Gmail SMTP...");
  console.log(`From: ${gmailUser}`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);

  try {
    const info = await transporter.sendMail({
      from: `"Workflow Automation" <${gmailUser}>`,
      to: to,
      subject: subject,
      text: body,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #333;">Workflow Automation Platform</h2>
        <p style="color: #555; line-height: 1.6;">${body}</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">Sent via Nodemailer from your workflow automation system</p>
      </div>`,
    });

    console.log("✅ Email sent successfully via Nodemailer!");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);

    return {
      ok: true,
      messageId: info.messageId,
      to: to,
      subject: subject,
      message: "Email sent successfully via Gmail SMTP",
    };
  } catch (error: any) {
    console.error("❌ Failed to send email via Nodemailer:", error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
}
