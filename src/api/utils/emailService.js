import axios from "axios";

export const sendOTPEmail = async (toEmail, otp) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME || "RunRiver";

    if (!apiKey) {
      return { ok: false, error: "BREVO_API_KEY missing in env" };
    }
    if (!senderEmail) {
      return { ok: false, error: "BREVO_SENDER_EMAIL missing in env" };
    }
    if (!toEmail) {
      return { ok: false, error: "Recipient email missing" };
    }

    const payload = {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: toEmail }],
      subject: "RunRiver - Email Verification OTP",
      textContent: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
      htmlContent: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2 style="color:#1D4ED8;margin:0 0 12px">RunRiver Email Verification</h2>
          <p style="margin:0 0 10px">Use this OTP to verify your email:</p>
          <div style="font-size:28px;font-weight:800;letter-spacing:6px;color:#111;margin:10px 0 16px">
            ${otp}
          </div>
          <p style="margin:0;color:#444">This OTP expires in <b>10 minutes</b>.</p>
        </div>
      `,
    };

    // Brevo Transactional Email endpoint
    const res = await axios.post("https://api.brevo.com/v3/smtp/email", payload, {
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 15000,
    });

    // Brevo returns { messageId: "..."} usually
    return { ok: true, messageId: res?.data?.messageId || null };
  } catch (err) {
    // Best error extraction for Brevo responses
    const apiMsg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Brevo email sending failed";

    console.error("sendOTPEmail (Brevo) error:", err?.response?.data || err);
    return { ok: false, error: apiMsg };
  }
};
