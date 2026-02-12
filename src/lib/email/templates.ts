export function getOTPEmailTemplate(otp: string): { html: string; text: string } {
  // Primary Brand Color Configuration
  // To change: Update these hex values to match your primary color in globals.css
  const primaryColor = '#04a3c3';  // Main primary color (--primary in globals.css)
  const primaryHover = '#0891b2';  // Hover state color (--primary-hover in globals.css)
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset OTP</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryHover} 100%); padding: 40px 20px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Password Reset Request</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #333333;">
            You have requested to reset your password. Please use the following One-Time Password (OTP) to verify your identity:
          </p>
          <div style="background-color: #f8f9fa; border: 2px dashed ${primaryColor}; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
            <div style="font-size: 42px; font-weight: 700; color: ${primaryColor}; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${otp}
            </div>
          </div>
          <p style="margin: 0 0 15px; font-size: 14px; line-height: 1.5; color: #666666;">
            This OTP will expire in <strong>10 minutes</strong>.
          </p>
          <p style="margin: 0 0 15px; font-size: 14px; line-height: 1.5; color: #666666;">
            If you did not request a password reset, please ignore this email or contact support if you have concerns.
          </p>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
            This is an automated email. Please do not reply.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Password Reset Request

You have requested to reset your password. Please use the following One-Time Password (OTP) to verify your identity:

${otp}

This OTP will expire in 10 minutes.

If you did not request a password reset, please ignore this email or contact support if you have concerns.

This is an automated email. Please do not reply.
  `;

  return { html, text };
}

export function getWelcomeEmailTemplate(email: string): { html: string; text: string } {
  // Primary Brand Color Configuration
  // To change: Update these hex values to match your primary color in globals.css
  const primaryColor = '#04a3c3';  // Main primary color (--primary in globals.css)
  const primaryHover = '#0891b2';  // Hover state color (--primary-hover in globals.css)
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to SnappArchive</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryHover} 100%); padding: 50px 20px; text-align: center;">
          <h1 style="margin: 0 0 10px; color: #ffffff; font-size: 32px; font-weight: 700;">Welcome to SnappArchive!</h1>
          <p style="margin: 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Your account has been created successfully</p>
        </div>
        <div style="padding: 40px 30px;">
          <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
            Hello and welcome!
          </p>
          <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
            Thank you for creating an account with SnappArchive. We're excited to have you on board!
          </p>
          <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
            Your account has been set up with the email: <strong>${email}</strong>
          </p>
          <div style="background-color: #f8f9fa; border-left: 4px solid ${primaryColor}; border-radius: 4px; padding: 20px; margin: 30px 0;">
            <h3 style="margin: 0 0 10px; font-size: 18px; color: ${primaryColor};">Getting Started</h3>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #666666;">
              You can now log in to your account and start managing your documents with ease. Upload, organize, and access your files from anywhere.
            </p>
          </div>
          <p style="margin: 0 0 15px; font-size: 14px; line-height: 1.6; color: #666666;">
            If you have any questions or need assistance, feel free to reach out to our support team.
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

  const text = `
Welcome to SnappArchive!

Your account has been created successfully

Hello and welcome!

Thank you for creating an account with SnappArchive. We're excited to have you on board!

Your account has been set up with the email: ${email}

Getting Started:
You can now log in to your account and start managing your documents with ease. Upload, organize, and access your files from anywhere.

If you have any questions or need assistance, feel free to reach out to our support team.

© 2024 SnappArchive. All rights reserved.
  `;

  return { html, text };
}

export function getPasswordResetSuccessTemplate(): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Successful</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 20px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Password Reset Successful</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
            Your password has been successfully reset.
          </p>
          <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
            You can now log in to your account using your new password.
          </p>
          <p style="margin: 0 0 15px; font-size: 14px; line-height: 1.6; color: #666666;">
            If you did not make this change, please contact our support team immediately.
          </p>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; font-size: 12px; color: #999999; text-align: center;">
            This is an automated email. Please do not reply.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Password Reset Successful

Your password has been successfully reset.

You can now log in to your account using your new password.

If you did not make this change, please contact our support team immediately.

This is an automated email. Please do not reply.
  `;

  return { html, text };
}
