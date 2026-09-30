import { z } from "zod";
import { api, body } from "@/lib/api";
import { checkOtp, createSession } from "@/lib/auth";
import { mergeGuestCart } from "@/lib/cart";

const Input = z.object({ email: z.string().trim().toLowerCase().email("Invalid email address"), code: z.string().regex(/^\d{6}$/, "Please enter the 6 digit OTP") });

export const POST = api(async (req) => {
  const { email, code } = Input.parse(await body(req));
  const user = await checkOtp(email, code);
  await mergeGuestCart(user.id);
  await createSession(user.id);
  return { user: { id: user.id, email: user.email, name: user.name } };
});
