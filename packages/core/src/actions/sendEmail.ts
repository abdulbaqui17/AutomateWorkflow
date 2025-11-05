import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_EMAIL_KEY);

export async function sendEmail(config: any, input: any) {
  const { to, subject, body } = config;
  
  // Validate required fields
  if (!to) {
    console.error('Email validation failed: Missing "to" field');
    return { ok: false, error: 'Missing required field: to' };
  }
  if (!subject) {
    console.error('Email validation failed: Missing "subject" field');
    return { ok: false, error: 'Missing required field: subject' };
  }
  if (!body) {
    console.error('Email validation failed: Missing "body" field');
    return { ok: false, error: 'Missing required field: body' };
  }
  
  try {
    // Use Resend's verified domain for testing
    const fromAddress = 'onboarding@resend.dev'; // Resend's default verified sender
    
    console.log('Sending email to:', to);
    console.log('From:', fromAddress);
    console.log('Subject:', subject);
    
    const result = await resend.emails.send({
      from: fromAddress,
      to: to,
      subject: subject,
      html: body, // Supports HTML content
    });
    
    console.log('Resend API full response:', JSON.stringify(result, null, 2));
    console.log('Email sent successfully:', result.data?.id);
    
    return { 
      ok: true, 
      emailId: result.data?.id,
      to, 
      subject,
      message: 'Email sent successfully'
    };
  } catch (error: any) {
    console.error('Failed to send email - Full error:', JSON.stringify(error, null, 2));
    console.error('Error message:', error.message);
    console.error('Error details:', error);
    return { 
      ok: false, 
      error: error.message || 'Failed to send email'
    };
  }
}
