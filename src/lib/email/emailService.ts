import nodemailer from 'nodemailer';
import { Resend } from 'resend';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailResult {
  success: boolean;
  method?: string;
  message?: string;
  error?: string;
}

async function sendViaResend(options: EmailOptions): Promise<EmailResult> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error('Resend API key not configured');
    }

    const resend = new Resend(resendApiKey);
    const fromEmail = process.env.EMAIL_FROM || 'notify@snapparchive.eu';
    const fromName = process.env.EMAIL_FROM_NAME || 'SnappArchive';

    const data = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log('Email sent via Resend:', data);

    return {
      success: true,
      method: 'resend',
      message: 'Email sent successfully via Resend',
    };
  } catch (error: any) {
    console.error('Resend email error:', error);
    return {
      success: false,
      method: 'resend',
      error: error.message || 'Failed to send email via Resend',
    };
  }
}

async function sendViaSMTP(options: EmailOptions): Promise<EmailResult> {
  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpHost || !smtpUser || !smtpPassword) {
      throw new Error('SMTP configuration incomplete');
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    const fromEmail = process.env.EMAIL_FROM || 'notify@snapparchive.eu';
    const fromName = process.env.EMAIL_FROM_NAME || 'SnappArchive';

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log('Email sent via SMTP:', info.messageId);

    return {
      success: true,
      method: 'smtp',
      message: 'Email sent successfully via SMTP',
    };
  } catch (error: any) {
    console.error('SMTP email error:', error);
    return {
      success: false,
      method: 'smtp',
      error: error.message || 'Failed to send email via SMTP',
    };
  }
}

function logEmailForDevelopment(options: EmailOptions): EmailResult {
  console.log('='.repeat(80));
  console.log('EMAIL SENDING DISABLED - LOGGING EMAIL');
  console.log('='.repeat(80));
  console.log('To:', options.to);
  console.log('Subject:', options.subject);
  console.log('Text:', options.text);
  console.log('='.repeat(80));

  return {
    success: true,
    method: 'development',
    message: 'Email logging only (email sending disabled)',
  };
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const smtpEnabled = process.env.SMTP_ENABLED === 'true';
  const resendEnabled = process.env.RESEND_ENABLED === 'true';

  if (smtpEnabled) {
    return await sendViaSMTP(options);
  }

  if (resendEnabled) {
    return await sendViaResend(options);
  }

  return logEmailForDevelopment(options);
}
