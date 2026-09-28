import crypto from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";

const SESSION = "zl_session";
const key = () => {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set (32+ chars)");
  return new TextEncoder().encode(s);
};

export async function createSession(userId: string) {
  const token = await new SignJWT({ uid: userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(key());
  (await cookies()).set(SESSION, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION);
}

export async function currentUser() {
  const token = (await cookies()).get(SESSION)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return await db.user.findUnique({ where: { id: String(payload.uid) } });
  } catch {
    return null;
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function requireUser() {
  const u = await currentUser();
  if (!u) throw new HttpError(401, "Please login to continue");
  return u;
}

export const isAdmin = (phone: string) =>
  (process.env.ADMIN_PHONES ?? "").split(",").map((s) => s.trim()).filter(Boolean).includes(phone);

// ---- OTP ----
const hashOtp = (phone: string, code: string) =>
  crypto.createHmac("sha256", key()).update(`${phone}:${code}`).digest("hex");

export async function issueOtp(phone: string) {
  const recent = await db.otpCode.count({ where: { phone, createdAt: { gt: new Date(Date.now() - 15 * 60_000) } } });
  if (recent >= 5) throw new HttpError(429, "Too many OTP requests. Please try again after some time.");
  const code = String(crypto.randomInt(100000, 1000000));
  await db.otpCode.create({ data: { phone, codeHash: hashOtp(phone, code), expiresAt: new Date(Date.now() + 5 * 60_000) } });
  // ponytail: OTP is logged, not sent. Plug an SMS/WhatsApp provider (MSG91, Gupshup, Twilio) here for production.
  console.log(`[otp] ${phone}: ${code}`);
  return code;
}

export async function checkOtp(phone: string, code: string) {
  const otp = await db.otpCode.findFirst({ where: { phone, usedAt: null }, orderBy: { createdAt: "desc" } });
  if (!otp || otp.expiresAt < new Date()) throw new HttpError(400, "OTP expired. Please request a new one.");
  if (otp.attempts >= 5) throw new HttpError(429, "Too many wrong attempts. Please request a new OTP.");
  if (otp.codeHash !== hashOtp(phone, code)) {
    await db.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    throw new HttpError(400, "Incorrect OTP. Please try again.");
  }
  await db.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
  return db.user.upsert({ where: { phone }, update: {}, create: { phone } });
}
