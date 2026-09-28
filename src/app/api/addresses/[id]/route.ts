import { api, body } from "@/lib/api";
import { HttpError, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AddressInput } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

async function own(ctx: Ctx) {
  const u = await requireUser();
  const a = await db.address.findFirst({ where: { id: (await ctx.params).id, userId: u.id } });
  if (!a) throw new HttpError(404, "Address not found");
  return a;
}

export const PATCH = api<Ctx>(async (req, ctx) => {
  const a = await own(ctx);
  const data = AddressInput.parse(await body(req));
  if (data.isDefault) await db.address.updateMany({ where: { userId: a.userId }, data: { isDefault: false } });
  return { address: await db.address.update({ where: { id: a.id }, data: { ...data, email: data.email || null, landmark: data.landmark || null, isDefault: data.isDefault ?? a.isDefault } }) };
});

export const DELETE = api<Ctx>(async (_req, ctx) => {
  const a = await own(ctx);
  await db.address.delete({ where: { id: a.id } });
});
