import { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import crypto from "crypto";

interface OTPRequest {
  email: string;
  fullName?: string;
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(otp: string, email: string): string {
  const data = JSON.stringify({ otp, email, timestamp: Date.now() });
  return Buffer.from(data).toString("base64");
}

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    res.setHeader("Access-Control-Allow-Origin", "*");

    const { email, fullName }: OTPRequest = req.body;

    console.log(`Generating OTP for: ${email}`);

    const otp = generateOTP();
    const token = generateToken(otp, email);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .logo { text-align: center; margin-bottom: 30px; }
          .otp-code { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; border-radius: 10px; margin: 20px 0; }
          .message { color: #333; line-height: 1.6; }
          .footer { text-align: center; color: #888; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1 style="color: #1a1a2e;">BITPAY</h1>
          </div>
          <div class="message">
            <p>Hello${fullName ? ` ${fullName}` : ''},</p>
            <p>Your verification code for BitPay account registration is:</p>
          </div>
          <div class="otp-code">${otp}</div>
          <div class="message">
            <p>This code will expire in <strong>10 minutes</strong>.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 BITPAY INC. All rights reserved.</p>
            <p>Contact: no-reply@money-pay.online</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log("Sending OTP email via Hostinger SMTP...");

    const smtpHost = process.env.SMTP_HOST || "smtp.hostinger.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "465");
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const fromEmail = process.env.SMTP_FROM_EMAIL || "no-reply@money-pay.online";

    if (!smtpUser || !smtpPassword) {
      throw new Error("SMTP credentials not configured");
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    await transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: "Your BitPay Verification Code",
      html: htmlContent,
    });

    console.log("OTP sent successfully to:", email);

    return res.status(200).json({ 
      success: true, 
      message: "OTP sent successfully",
      token: token 
    });
  } catch (error: any) {
    console.error("Error in send-otp function:", error);
    return res.status(500).json({ error: error.message });
  }
};
