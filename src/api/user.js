import express from "express";
import { signIn, signUp, verifyEmail, resendOTP } from "../application/user.js";

const router = express.Router();

// ✅ SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const result = await signUp(req.body);
    return res.status(result.status).json(result);
  } catch (err) {
    console.error("signup error:", err); // ✅ full error
    return res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// ✅ SIGNIN
router.post("/signin", async (req, res) => {
  try {
    const result = await signIn(req.body);
    return res.status(result.status).json(result);
  } catch (err) {
    console.error("signin error:", err);
    return res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// ✅ VERIFY EMAIL
router.post("/verify-email", async (req, res) => {
  try {
    const result = await verifyEmail(req.body);
    return res.status(result.status).json(result);
  } catch (err) {
    console.error("verify-email error:", err);
    return res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

// ✅ RESEND OTP
router.post("/resend-otp", async (req, res) => {
  try {
    const result = await resendOTP(req.body);
    return res.status(result.status).json(result);
  } catch (err) {
    console.error("resend-otp error:", err);
    return res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

export default router;
