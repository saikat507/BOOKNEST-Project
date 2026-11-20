const nodemailer = require('nodemailer');
require('dotenv').config();

// Create Nodemailer transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Send OTP email for verification
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} otp - One-time password
 * @returns {Promise<object>} Email send result
 */
const sendOTPEmail = async (email, name, otp) => {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: white; padding: 30px; }
          .otp-box { background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; text-align: center; }
          .otp-code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px; }
          .warning { color: #dc2626; font-size: 14px; margin-top: 10px; }
          .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📚 BookNest</div>
            <p>Password reset</p>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Use this one-time token to reset your BookNest password:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="warning">⏱️ This code expires in 10 minutes</div>
            </div>
            <p>If you didn't request this verification, please ignore this email.</p>
            <p>Happy reading and sharing!<br>The BookNest Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 BookNest. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'BookNest password reset token',
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent');
    return result;
  } catch (error) {
    console.error('Failed to send password reset email');
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

/**
 * Send welcome email to new user
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {number} initialCoins - Initial coins given
 * @returns {Promise<object>} Email send result
 */
const sendWelcomeEmail = async (email, name, initialCoins) => {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: white; padding: 30px; }
          .coins-box { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center; }
          .coins-amount { font-size: 36px; font-weight: bold; }
          .coins-label { font-size: 14px; margin-top: 5px; }
          .features { list-style: none; padding: 0; }
          .features li { padding: 10px 0; padding-left: 30px; position: relative; }
          .features li:before { content: "✓"; position: absolute; left: 0; color: #2563eb; font-weight: bold; }
          .cta-button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
          .logo { font-size: 24px; font-weight: bold; color: white; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📚 BookNest</div>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Welcome aboard!</p>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Welcome to BookNest – your community for sharing, exchanging, and discovering books! We're thrilled to have you join our growing community of book lovers.</p>
            
            <div class="coins-box">
              <div class="coins-amount">🎉 ${initialCoins} Free Coins!</div>
              <div class="coins-label">Start exploring and trading books today</div>
            </div>

            <p><strong>What you can do on BookNest:</strong></p>
            <ul class="features">
              <li>Donate books to help others discover great reads</li>
              <li>Exchange books with other members</li>
              <li>Adopt books for temporary borrowing</li>
              <li>Sell your books to earn coins</li>
              <li>Earn coins through community interactions</li>
              <li>Leave reviews and connect with fellow readers</li>
            </ul>

            <p>Your ${initialCoins} free coins are already in your account. Use them to explore books, make requests, or save them for special deals!</p>

            <a href="#" class="cta-button">Explore Books Now</a>

            <p style="margin-top: 30px;">Happy reading!<br>The BookNest Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 BookNest. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to BookNest!',
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
    return result;
  } catch (error) {
    console.error(`Failed to send welcome email to ${email}:`, error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

/**
 * Send notification email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @returns {Promise<object>} Email send result
 */
const sendNotificationEmail = async (email, name, title, message) => {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: white; padding: 30px; }
          .notification-box { background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; }
          .notification-title { font-size: 18px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
          .notification-message { color: #555; line-height: 1.8; }
          .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📚 BookNest</div>
            <p>Notification</p>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <div class="notification-box">
              <div class="notification-title">${title}</div>
              <div class="notification-message">${message}</div>
            </div>
            <p>Best regards,<br>The BookNest Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 BookNest. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `BookNest — ${title}`,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Notification email sent to ${email}`);
    return result;
  } catch (error) {
    console.error(`Failed to send notification email to ${email}:`, error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
  sendNotificationEmail
};
