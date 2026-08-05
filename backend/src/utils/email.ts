import nodemailer from 'nodemailer';

// Configure Email Transporter
// Supports Gmail SMTP, Ethereal test account, or custom SMTP from environment variables
const createTransporter = async () => {
  // If SMTP environment variables exist, use them (e.g. Gmail App Password or SendGrid)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback to Gmail SMTP service if GMAIL_USER and GMAIL_APP_PASS exist
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS,
      },
    });
  }

  // Default Ethereal Test Account (Zero setup needed — automatically delivers test email preview link!)
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

export const sendOtpEmail = async (toEmail: string, otp: string, userName?: string): Promise<boolean> => {
  try {
    const transporter = await createTransporter();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2563eb; margin: 0;">Maryland Vending</h2>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Field Operations & Route Platform</p>
        </div>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 15px 0;" />
        <p style="color: #1e293b; font-size: 14px;">Hello <strong>${userName || 'User'}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">
          You requested a password reset for your VendRoute account. Use the 6-digit OTP code below to verify your identity and set a new password:
        </p>
        <div style="text-align: center; margin: 25px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb; background-color: #eff6ff; padding: 12px 24px; border-radius: 8px; border: 1px solid #bfdbfe; display: inline-block;">
            ${otp}
          </span>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center;">
          ⏱️ This OTP code is valid for <strong>15 minutes</strong>. If you did not request this, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
          &copy; ${new Date().getFullYear()} Maryland Vending Services. All rights reserved.
        </p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Maryland Vending Security" <no-reply@vendroute.in>`,
      to: toEmail,
      subject: `🔑 ${otp} is your VendRoute Password Reset OTP`,
      html: htmlContent,
    });

    console.log(`\n======================================================`);
    console.log(`✉️ REAL EMAIL SENT TO: ${toEmail}`);
    console.log(`🔑 OTP CODE: [ ${otp} ]`);
    const testUrl = nodemailer.getTestMessageUrl(info);
    if (testUrl) {
      console.log(`🌐 TEST EMAIL LIVE INBOX PREVIEW LINK: ${testUrl}`);
    }
    console.log(`======================================================\n`);

    return true;
  } catch (error) {
    console.error('❌ Failed to send OTP email via Nodemailer:', error);
    return false;
  }
};
