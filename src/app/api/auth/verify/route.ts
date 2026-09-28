import { z } from "zod";
import { api, body } from "@/lib/api";
import { checkOtp, createSession } from "@/lib/auth";
import { mergeGuestCart } from "@/lib/cart";

const Input = z.object({ phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number"), code: z.string().regex(/^\d{6}$/, "Please enter the 6 digit OTP") });

export const POST = api(async (req) => {
  const { phone, code } = Input.parse(await body(req));
  const user = await checkOtp(phone, code);
  await mergeGuestCart(user.id);
  await createSession(user.id);
  return { user: { id: user.id, phone: user.phone, name: user.name } };
});
