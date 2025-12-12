import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      recipientAccount
    }: AlertRequest = await req.json();

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

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const { error } = await resend.emails.send({
      from: "BitPay <no-reply@money-pay.online>",
      to: [email],
      subject: `BitPay ${alertTitle}: ${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      html: htmlContent,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw new Error(error.message || "Failed to send email");
    }

    console.log("Transaction alert sent successfully to:", email);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending transaction alert:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
