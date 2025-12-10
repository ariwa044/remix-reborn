import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  email: string;
  otp: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp }: VerifyRequest = await req.json();

    console.log(`Verifying OTP for: ${email}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get OTP record
    const { data, error } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("email", email)
      .eq("otp_code", otp)
      .single();

    if (error || !data) {
      console.log("Invalid OTP for:", email);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid verification code" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      // Delete expired OTP
      await supabase.from("otp_verifications").delete().eq("id", data.id);
      
      return new Response(
        JSON.stringify({ success: false, error: "Verification code has expired" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Mark as verified
    await supabase
      .from("otp_verifications")
      .update({ verified: true })
      .eq("id", data.id);

    console.log("OTP verified successfully for:", email);

    return new Response(JSON.stringify({ success: true, message: "Email verified successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
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
