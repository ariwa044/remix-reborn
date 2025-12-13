import { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

interface AlertRequest {
  email: string;
  fullName: string;
  type: "credit" | "debit";
  amount: number;
  currency: string;
  description: string;
  balance: number;
  transactionId: string;
  recipientName?: string;
  recipientAccount?: string;
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

    const {
      email,
      fullName,
      type,
      amount,
      currency,
      description,
      balance,
      transactionId,
      recipientName,
      recipientAccount,
    }: AlertRequest = req.body;

    console.log(`Sending ${type} alert to: ${email}`);

    const isCredit = type === "credit";
    const alertColor = isCredit ? "#22c55e" : "#ef4444";
    const alertTitle = isCredit ? "Credit Alert" : "Debit Alert";
    const alertIcon = isCredit ? "+" : "-";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: ${alertColor}; color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .amount-box { background: #f8f9fa; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
          .amount { font-size: 36px; font-weight: bold; color: ${alertColor}; }
          .details { margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
          .detail-label { color: #666; }
          .detail-value { font-weight: 600; color: #333; }
          .balance-box { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; border-radius: 10px; padding: 20px; text-align: center; margin-top: 20px; }
          .balance-label { font-size: 12px; opacity: 0.8; }
          .balance-value { font-size: 28px; font-weight: bold; margin-top: 5px; }
          .footer { text-align: center; color: #888; font-size: 12px; padding: 20px; background: #f8f9fa; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${alertTitle}</h1>
          </div>
          <div class="content">
            <p>Dear ${fullName},</p>
            <p>A ${type} transaction has been processed on your BitPay account.</p>
            
            <div class="amount-box">
              <div class="amount">${alertIcon}${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Transaction ID</span>
                <span class="detail-value">${transactionId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date & Time</span>
                <span class="detail-value">${new Date().toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Description</span>
                <span class="detail-value">${description}</span>
              </div>
              ${recipientName ? `
              <div class="detail-row">
                <span class="detail-label">Recipient</span>
                <span class="detail-value">${recipientName}</span>
              </div>
              ` : ''}
              ${recipientAccount ? `
              <div class="detail-row">
                <span class="detail-label">Account</span>
                <span class="detail-value">${recipientAccount}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="balance-box">
              <div class="balance-label">Available Balance</div>
              <div class="balance-value">${currency} ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>
          <div class="footer">
            <p>If you did not authorize this transaction, please contact us immediately.</p>
            <p>© 2024 BITPAY INC. All rights reserved.</p>
            <p>Contact: no-reply@money-pay.online</p>
          </div>
        </div>
      </body>
      </html>
    `;

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
      subject: `BitPay ${alertTitle}: ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      html: htmlContent,
    });

    console.log("Transaction alert sent successfully to:", email);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Error sending transaction alert:", error);
    return res.status(500).json({ error: error.message });
  }
};
