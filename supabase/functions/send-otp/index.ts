import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OTPRequest {
  email: string;
  fullName?: string;
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName }: OTPRequest = await req.json();

    console.log(`Generating OTP for: ${email}`);

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Store OTP in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete any existing OTP for this email
    await supabase.from("otp_verifications").delete().eq("email", email);

    // Insert new OTP
    const { error: insertError } = await supabase.from("otp_verifications").insert({
      email,
      otp_code: otp,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      throw new Error("Failed to store OTP");
    }

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

    console.log("Sending OTP email via Resend...");

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const { error: emailError } = await resend.emails.send({
      from: "BitPay <no-reply@money-pay.online>",
      to: [email],
      subject: "Your BitPay Verification Code",
      html: htmlContent,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw new Error(emailError.message || "Failed to send email");
    }

    console.log("OTP sent successfully to:", email);

    return new Response(JSON.stringify({ success: true, message: "OTP sent successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-otp function:", error);
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
