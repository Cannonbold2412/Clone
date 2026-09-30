import { z } from "zod";
import { api, body } from "@/lib/api";
import { HttpError, isAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NEXT_STATUS } from "@/lib/orders";


export const PATCH = api<{ params: Promise<{ id: string }> }>(async (req, ctx) => {
  const u = await requireUser();
  if (!u.email || !isAdmin(u.email)) throw new HttpError(403, "Forbidden");
  const { status, note } = z.object({ status: z.string(), note: z.string().max(200).optional() }).parse(await body(req));
  const order = await db.order.findUnique({ where: { id: (await ctx.params).id }, include: { items: true } });
  if (!order) throw new HttpError(404, "Order not found");
  if (!NEXT_STATUS[order.status]?.includes(status)) throw new HttpError(400, `Cannot move ${order.status} to ${status}`);
  await db.$transaction(async (tx) => {
    // Cancelling a confirmed order returns its units to stock.
    if (status === "CANCELLED" && order.status === "CONFIRMED")
      for (const it of order.items) await tx.variant.update({ where: { id: it.variantId }, data: { stock: { increment: it.qty } } });
    await tx.order.update({ where: { id: order.id }, data: { status, events: { create: { status, note } } } });
  });
});
