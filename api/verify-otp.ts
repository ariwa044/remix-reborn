import { VercelRequest, VercelResponse } from "@vercel/node";

interface VerifyRequest {
  email: string;
  otp: string;
  token: string;
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

    const { email, otp, token }: VerifyRequest = req.body;

    console.log(`Verifying OTP for: ${email}`);

    if (!token || !otp || !email) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing email, otp, or token" 
      });
    }

    // Decode token
    const decodedData = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    const { otp: storedOtp, email: tokenEmail, timestamp } = decodedData;

    // Check if token is within 10 minutes
    const now = Date.now();
    const tokenAge = now - timestamp;
    const TEN_MINUTES = 10 * 60 * 1000;

    if (tokenAge > TEN_MINUTES) {
      return res.status(400).json({ 
        success: false, 
        error: "Code has expired" 
      });
    }

    // Verify email matches
    if (tokenEmail !== email) {
      return res.status(400).json({ 
        success: false, 
        error: "Email mismatch" 
      });
    }

    // Verify OTP matches
    if (storedOtp !== otp) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid verification code" 
      });
    }

    console.log("OTP verified successfully for:", email);

    return res.status(200).json({ 
      success: true, 
      message: "Email verified successfully" 
    });
  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
    return res.status(500).json({ error: error.message });
  }
};
