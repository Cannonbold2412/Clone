import { api, body } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AddressInput } from "@/lib/validation";

export const GET = api(async () => {
  const u = await requireUser();
  return { addresses: await db.address.findMany({ where: { userId: u.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }) };
});

export const POST = api(async (req) => {
  const u = await requireUser();
  const data = AddressInput.parse(await body(req));
  const count = await db.address.count({ where: { userId: u.id } });
  if (count >= 20) throw new Error("Address limit reached");
  const isDefault = data.isDefault || count === 0;
  if (isDefault) await db.address.updateMany({ where: { userId: u.id }, data: { isDefault: false } });
  if (!u.name) await db.user.update({ where: { id: u.id }, data: { name: data.name } });
  return { address: await db.address.create({ data: { ...data, email: data.email || null, landmark: data.landmark || null, isDefault, userId: u.id } }) };
});
