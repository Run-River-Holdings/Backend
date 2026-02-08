import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../infastructure/schemas/user.js";
import { generateOTP } from "../api/utils/generateOTP.js";
import { sendOTPEmail } from "../api/utils/emailService.js";

const OTP_EXPIRE_MINUTES = 10;

const signToken = (userId) => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is missing in env");
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ✅ SIGNUP
export const signUp = async ({ name, email, password, confirmPassword }) => {
  if (!name || !email || !password || !confirmPassword) {
    return { ok: false, status: 400, message: "All fields are required" };
  }
  if (password !== confirmPassword) {
    return { ok: false, status: 400, message: "Passwords do not match" };
  }

  const emailLower = String(email).toLowerCase().trim();

  const exist = await User.findOne({ email: emailLower });
  if (exist) {
    return { ok: false, status: 409, message: "Email already exists" };
  }

  const hashed = await bcrypt.hash(password, 10);

  const otp = generateOTP();
  const otpExpiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);

  const user = await User.create({
    name,
    email: emailLower,
    password: hashed,
    isEmailVerified: false,
    otp,
    otpExpiresAt,
  });

  // ✅ Most 500 errors come from SMTP here
  const emailRes = await sendOTPEmail(user.email, otp);
  if (!emailRes.ok) {
    return {
      ok: false,
      status: 500,
      message: "User created but OTP email sending failed",
      error: emailRes.error,
    };
  }

  return {
    ok: true,
    status: 201,
    message: "Signup success. OTP sent to email.",
    data: { userId: user._id, email: user.email },
  };
};

// ✅ SIGNIN
export const signIn = async ({ email, password }) => {
  if (!email || !password) {
    return { ok: false, status: 400, message: "Email and password are required" };
  }

  const emailLower = String(email).toLowerCase().trim();

  const user = await User.findOne({ email: emailLower }).select("+password");
  if (!user) return { ok: false, status: 401, message: "Invalid credentials" };

  const match = await bcrypt.compare(password, user.password);
  if (!match) return { ok: false, status: 401, message: "Invalid credentials" };

  if (!user.isEmailVerified) {
    return {
      ok: false,
      status: 403,
      message: "Email not verified. Please verify with OTP.",
      data: { email: user.email },
    };
  }

  const token = signToken(user._id);

  return {
    ok: true,
    status: 200,
    message: "Signin success",
    data: {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    },
  };
};

// ✅ VERIFY EMAIL
export const verifyEmail = async ({ email, otp }) => {
  if (!email || !otp) {
    return { ok: false, status: 400, message: "Email and OTP are required" };
  }

  const emailLower = String(email).toLowerCase().trim();

  const user = await User.findOne({ email: emailLower });
  if (!user) return { ok: false, status: 404, message: "User not found" };

  if (user.isEmailVerified) {
    return { ok: true, status: 200, message: "Email already verified" };
  }

  if (!user.otp || !user.otpExpiresAt) {
    return { ok: false, status: 400, message: "No OTP found. Please resend OTP." };
  }

  if (new Date() > new Date(user.otpExpiresAt)) {
    return { ok: false, status: 400, message: "OTP expired. Please resend OTP." };
  }

  if (String(user.otp) !== String(otp)) {
    return { ok: false, status: 400, message: "Invalid OTP" };
  }

  user.isEmailVerified = true;
  user.otp = null;
  user.otpExpiresAt = null;
  await user.save();

  return { ok: true, status: 200, message: "Email verified successfully" };
};

// ✅ RESEND OTP
export const resendOTP = async ({ email }) => {
  if (!email) return { ok: false, status: 400, message: "Email is required" };

  const emailLower = String(email).toLowerCase().trim();

  const user = await User.findOne({ email: emailLower });
  if (!user) return { ok: false, status: 404, message: "User not found" };

  if (user.isEmailVerified) {
    return { ok: true, status: 200, message: "Email already verified" };
  }

  const otp = generateOTP();
  user.otp = otp;
  user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000);
  await user.save();

  const emailRes = await sendOTPEmail(user.email, otp);
  if (!emailRes.ok) {
    return { ok: false, status: 500, message: "OTP sending failed", error: emailRes.error };
  }

  return { ok: true, status: 200, message: "OTP resent successfully" };
};
