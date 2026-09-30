import { z } from "zod";
import { api, body } from "@/lib/api";
import { issueOtp } from "@/lib/auth";

const Email = z.object({ email: z.string().trim().toLowerCase().email("Please enter a valid email address") });

export const POST = api(async (req) => {
  const { email } = Email.parse(await body(req));
  const code = await issueOtp(email);
  // Dev convenience: without Twilio the code is returned so the flow is testable locally.
  return { ok: true, devOtp: code ?? undefined };
});
