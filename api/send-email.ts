import { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
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

    const { to, subject, html, text }: EmailRequest = req.body;

    console.log(`Attempting to send email to: ${to}`);

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
      to: to,
      subject: subject,
      html: html,
      text: text,
    });

    console.log("Email sent successfully to:", to);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return res.status(500).json({ error: error.message });
  }
};
