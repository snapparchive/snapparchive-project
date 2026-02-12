import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/emailService';

const EMAIL_ROUTING = {
    sales: 'sales@snapparchive.eu',
    support: 'support@snapparchive.eu',
    billing: 'billing@snapparchive.eu',
    partnership: 'partners@snapparchive.eu',
    Enterprise: 'support@snapparchive.eu',
    Security: 'security@snapparchive.eu',
    Privacy: 'privacy@snapparchive.eu',
    Legal: 'legal@snapparchive.eu',
    other: 'admin@snapparchive.eu',
};

export async function POST(request: NextRequest) {
    try {
        const { name, email, subject, inquiryType, message } = await request.json();

        // Validation
        if (!name || !email || !subject || !inquiryType || !message) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        const departmentEmail = EMAIL_ROUTING[inquiryType as keyof typeof EMAIL_ROUTING] || EMAIL_ROUTING.other;

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Submission</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #04a3c3 0%, #0891b2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">New Contact Form Submission</h1>
          </div>
          <div style="padding: 40px 30px;">
            <div style="background-color: #f8f9fa; border-left: 4px solid #04a3c3; border-radius: 4px; padding: 20px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 10px; font-size: 18px; color: #04a3c3;">Inquiry Details</h3>
              <p style="margin: 5px 0; font-size: 14px; color: #666666;">
                <strong>Type:</strong> ${inquiryType}
              </p>
              <p style="margin: 5px 0; font-size: 14px; color: #666666;">
                <strong>Subject:</strong> ${subject}
              </p>
            </div>
            
            <div style="margin-bottom: 25px;">
              <h3 style="margin: 0 0 10px; font-size: 16px; color: #333333;">Contact Information</h3>
              <p style="margin: 5px 0; font-size: 14px; color: #666666;">
                <strong>Name:</strong> ${name}
              </p>
              <p style="margin: 5px 0; font-size: 14px; color: #666666;">
                <strong>Email:</strong> <a href="mailto:${email}" style="color: #04a3c3; text-decoration: none;">${email}</a>
              </p>
            </div>
            
            <div style="margin-bottom: 25px;">
              <h3 style="margin: 0 0 10px; font-size: 16px; color: #333333;">Message</h3>
              <div style="background-color: #f8f9fa; border-radius: 4px; padding: 20px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #333333; white-space: pre-wrap;">${message}</p>
              </div>
            </div>
            
            <div style="background-color: #e7f7f9; border-radius: 4px; padding: 15px; margin-top: 25px;">
              <p style="margin: 0; font-size: 12px; color: #666666;">
                <strong>Note:</strong> This email was sent via the SnappArchive contact form. Please respond directly to ${email}.
              </p>
            </div>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
              © 2024 SnappArchive. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

        const text = `
New Contact Form Submission

Inquiry Type: ${inquiryType}
Subject: ${subject}

Contact Information:
Name: ${name}
Email: ${email}

Message:
${message}

---
This email was sent via the SnappArchive contact form.
Please respond directly to ${email}.

© 2024 SnappArchive. All rights reserved.
    `;

        const emailResult = await sendEmail({
            to: departmentEmail,
            subject: `[${inquiryType}] ${subject}`,
            html,
            text,
            replyTo: email,
        } as any);

        if (!emailResult.success) {
            console.error('Failed to send contact form email:', emailResult.error);
            return NextResponse.json(
                { error: 'Failed to send message. Please try again later.' },
                { status: 500 }
            );
        }

        const confirmationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Message Received</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #04a3c3 0%, #0891b2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Message Received</h1>
          </div>
          <div style="padding: 40px 30px;">
            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
              Hi ${name},
            </p>
            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
              Thank you for contacting SnappArchive. We've received your message and our ${inquiryType} team will get back to you within 24 hours during business days.
            </p>
            <div style="background-color: #f8f9fa; border-left: 4px solid #04a3c3; border-radius: 4px; padding: 20px; margin: 25px 0;">
              <h3 style="margin: 0 0 10px; font-size: 16px; color: #04a3c3;">Your Message Summary</h3>
              <p style="margin: 5px 0; font-size: 14px; color: #666666;">
                <strong>Subject:</strong> ${subject}
              </p>
              <p style="margin: 5px 0; font-size: 14px; color: #666666;">
                <strong>Inquiry Type:</strong> ${inquiryType}
              </p>
            </div>
            <p style="margin: 0 0 15px; font-size: 14px; line-height: 1.6; color: #666666;">
              If you have any urgent concerns, please don't hesitate to contact us directly at ${departmentEmail}.
            </p>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
              © 2024 SnappArchive. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

        const confirmationText = `
Hi ${name},

Thank you for contacting SnappArchive. We've received your message and our ${inquiryType} team will get back to you within 24 hours during business days.

Your Message Summary:
Subject: ${subject}
Inquiry Type: ${inquiryType}

If you have any urgent concerns, please don't hesitate to contact us directly at ${departmentEmail}.

© 2024 SnappArchive. All rights reserved.
    `;

        sendEmail({
            to: email,
            subject: 'We received your message - SnappArchive',
            html: confirmationHtml,
            text: confirmationText,
        }).catch(err => console.error('Failed to send confirmation email:', err));

        return NextResponse.json({
            success: true,
            message: 'Message sent successfully. We\'ll get back to you soon!',
        });
    } catch (error: any) {
        console.error('Error in contact form submission:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}