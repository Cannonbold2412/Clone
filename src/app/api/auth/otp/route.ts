import { z } from "zod";
import { api, body } from "@/lib/api";
import { issueOtp } from "@/lib/auth";

const Phone = z.object({ phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10 digit mobile number") });

export const POST = api(async (req) => {
  const { phone } = Phone.parse(await body(req));
  const code = await issueOtp(phone);
  // Dev convenience: surface the OTP so the flow is testable without an SMS provider.
  return { ok: true, devOtp: process.env.NODE_ENV === "production" ? undefined : code };
});
