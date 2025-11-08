import nodemailer from "nodemailer";

// Create transporter for Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD, // Use App Password, not regular password
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter verification failed:", error);
  } else {
    console.log("✅ Email server is ready to send messages");
  }
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const emailService = {
  // Send generic email
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const senderName = process.env.SENDER_NAME || "NutriChef";
      const senderEmail = process.env.SENDER_EMAIL || process.env.SMTP_EMAIL;

      const mailOptions = {
        from: `"${senderName}" <${senderEmail}>`,
        replyTo: `"${senderName} Support" <${senderEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${options.to} from ${senderEmail}`);
    } catch (error) {
      console.error("Failed to send email:", error);
      throw new Error("Failed to send email");
    }
  },

  // Send welcome email after registration
  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #4CAF50 0%, #29B6F6 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .features {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .feature-item {
              padding: 10px 0;
              border-bottom: 1px solid #eee;
            }
            .feature-item:last-child {
              border-bottom: none;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Welcome to NutriChef!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Thank you for joining NutriChef! We're excited to have you on board.</p>
            
            <div class="features">
              <h3>Here's what you can do with NutriChef:</h3>
              <div class="feature-item">
                <strong>📦 Smart Inventory Management</strong><br>
                Track your pantry items and get expiration alerts
              </div>
              <div class="feature-item">
                <strong>🍳 AI Recipe Recommendations</strong><br>
                Get personalized recipes based on your available ingredients
              </div>
              <div class="feature-item">
                <strong>📅 Meal Planning</strong><br>
                Plan your entire week and generate smart shopping lists
              </div>
              <div class="feature-item">
                <strong>📊 Nutrition Tracking</strong><br>
                Monitor your daily calories and macros
              </div>
              <div class="feature-item">
                <strong>💡 Health Insights</strong><br>
                Get AI-powered health recommendations
              </div>
            </div>

            <center>
              <a href="${
                process.env.FRONTEND_URL || "http://localhost:5173"
              }/dashboard" class="button">
                Get Started Now →
              </a>
            </center>

            <p style="margin-top: 30px;">
              If you have any questions or need help getting started, feel free to reach out to our support team.
            </p>

            <p>
              Happy cooking!<br>
              <strong>The NutriChef Team</strong>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} NutriChef. All rights reserved.</p>
            <p>This email was sent to ${to} because you registered for a NutriChef account.</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to,
      subject: "Welcome to NutriChef! 🎉",
      html,
    });
  },

  // Send password reset email
  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetToken: string
  ): Promise<void> {
    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #FF7043 0%, #29B6F6 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #FF7043;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .alert {
              background: #fff3cd;
              border: 1px solid #ffc107;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .token-box {
              background: white;
              padding: 15px;
              border-radius: 8px;
              font-family: monospace;
              word-break: break-all;
              margin: 10px 0;
              border: 2px dashed #ddd;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>We received a request to reset your password for your NutriChef account.</p>

            <div class="alert">
              ⚠️ If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
            </div>

            <p>Click the button below to reset your password:</p>

            <center>
              <a href="${resetUrl}" class="button">
                Reset Password →
              </a>
            </center>

            <p style="margin-top: 30px;">
              Or copy and paste this link into your browser:
            </p>
            <div class="token-box">
              ${resetUrl}
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              <strong>Important:</strong> This password reset link will expire in <strong>1 hour</strong> for security reasons.
            </p>

            <p>
              Best regards,<br>
              <strong>The NutriChef Team</strong>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} NutriChef. All rights reserved.</p>
            <p>This email was sent to ${to} because a password reset was requested.</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to,
      subject: "Reset Your NutriChef Password 🔐",
      html,
    });
  },

  // Send password reset confirmation
  async sendPasswordResetConfirmation(to: string, name: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #4CAF50 0%, #29B6F6 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .success {
              background: #d4edda;
              border: 1px solid #28a745;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              color: #155724;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✅ Password Changed Successfully</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            
            <div class="success">
              ✅ Your password has been changed successfully!
            </div>

            <p>
              Your NutriChef account password was recently changed. You can now log in with your new password.
            </p>

            <center>
              <a href="${
                process.env.FRONTEND_URL || "http://localhost:5173"
              }/login" class="button">
                Log In Now →
              </a>
            </center>

            <p style="margin-top: 30px; color: #666;">
              If you did not make this change, please contact our support team immediately to secure your account.
            </p>

            <p>
              Best regards,<br>
              <strong>The NutriChef Team</strong>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} NutriChef. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to,
      subject: "Your NutriChef Password Has Been Changed ✅",
      html,
    });
  },

  // Send account deletion notification
  async sendAccountDeletionEmail(to: string, name: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .warning {
              background: #fee2e2;
              border: 1px solid #dc2626;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              color: #991b1b;
            }
            .info-box {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🗑️ Account Deleted</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            
            <div class="warning">
              ⚠️ Your NutriChef account has been permanently deleted.
            </div>

            <p>
              This email confirms that your NutriChef account and all associated data have been permanently removed from our systems.
            </p>

            <div class="info-box">
              <h3>What has been deleted:</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Your profile and account information</li>
                <li>All inventory items</li>
                <li>All saved recipes</li>
                <li>All meal plans</li>
                <li>All uploaded images</li>
                <li>All session data and login history</li>
              </ul>
            </div>

            <p>
              We're sorry to see you go. If this deletion was a mistake or done without your authorization, please contact our support team immediately.
            </p>

            <p style="margin-top: 30px; color: #666;">
              If you would like to use NutriChef again in the future, you're welcome to create a new account at any time.
            </p>

            <p>
              Thank you for using NutriChef.<br>
              <strong>The NutriChef Team</strong>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} NutriChef. All rights reserved.</p>
            <p>This email was sent to ${to} to confirm account deletion.</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to,
      subject: "Your NutriChef Account Has Been Deleted",
      html,
    });
  },

  // Send account suspension notification
  async sendAccountSuspensionEmail(
    to: string,
    name: string,
    reason?: string
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #F59E0B 0%, #EAB308 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .warning {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              color: #92400e;
            }
            .info-box {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>⚠️ Account Suspended</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            
            <div class="warning">
              ⚠️ Your NutriChef account has been temporarily suspended.
            </div>

            <p>
              This email confirms that your NutriChef account has been suspended by an administrator.
            </p>

            ${
              reason
                ? `
            <div class="info-box">
              <h3>Reason for suspension:</h3>
              <p style="margin: 10px 0;">${reason}</p>
            </div>
            `
                : ""
            }

            <div class="info-box">
              <h3>What this means:</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>You cannot log in to your account</li>
                <li>Your data is preserved but inaccessible</li>
                <li>All active sessions have been terminated</li>
                <li>Your account can be reactivated by an administrator</li>
              </ul>
            </div>

            <p>
              If you believe this suspension was made in error or would like to appeal, please contact our support team.
            </p>

            <p style="margin-top: 30px; color: #666;">
              <strong>Support Contact:</strong><br>
              Email: ${process.env.SMTP_EMAIL || "support@nutrichef.com"}<br>
              Please include your account email in any correspondence.
            </p>

            <p>
              Best regards,<br>
              <strong>The NutriChef Team</strong>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} NutriChef. All rights reserved.</p>
            <p>This email was sent to ${to} to notify you of account suspension.</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to,
      subject: "Your NutriChef Account Has Been Suspended ⚠️",
      html,
    });
  },

  // Send account reactivation notification
  async sendAccountReactivationEmail(to: string, name: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #4CAF50 0%, #29B6F6 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .success {
              background: #d4edda;
              border: 1px solid #28a745;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              color: #155724;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✅ Account Reactivated</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            
            <div class="success">
              ✅ Your NutriChef account has been reactivated!
            </div>

            <p>
              Good news! Your NutriChef account has been reactivated by an administrator and you can now log in again.
            </p>

            <p>
              All your data, including inventory items, recipes, and meal plans, has been preserved and is ready for you to access.
            </p>

            <center>
              <a href="${
                process.env.FRONTEND_URL || "http://localhost:5173"
              }/login" class="button">
                Log In Now →
              </a>
            </center>

            <p style="margin-top: 30px;">
              If you have any questions or concerns, please don't hesitate to contact our support team.
            </p>

            <p>
              Welcome back!<br>
              <strong>The NutriChef Team</strong>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} NutriChef. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to,
      subject: "Your NutriChef Account Has Been Reactivated ✅",
      html,
    });
  },
};

// Export individual functions for easier importing
export const sendWelcomeEmail =
  emailService.sendWelcomeEmail.bind(emailService);
export const sendPasswordResetEmail =
  emailService.sendPasswordResetEmail.bind(emailService);
export const sendPasswordResetConfirmation =
  emailService.sendPasswordResetConfirmation.bind(emailService);
export const sendAccountDeletionEmail =
  emailService.sendAccountDeletionEmail.bind(emailService);
export const sendAccountSuspensionEmail =
  emailService.sendAccountSuspensionEmail.bind(emailService);
export const sendAccountReactivationEmail =
  emailService.sendAccountReactivationEmail.bind(emailService);
