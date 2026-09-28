import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "./auth";

type Handler<C> = (req: Request, ctx: C) => Promise<unknown>;

/** Wraps a route handler: returns JSON, maps HttpError/ZodError to 4xx, hides internals on 500. */
export function api<C = unknown>(fn: Handler<C>) {
  return async (req: Request, ctx: C) => {
    try {
      const data = await fn(req, ctx);
      return data instanceof Response ? data : NextResponse.json(data ?? { ok: true });
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e instanceof ZodError) return NextResponse.json({ error: e.issues[0]?.message ?? "Invalid input" }, { status: 400 });
      console.error(e);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  };
}

export async function body(req: Request) {
  try { return await req.json(); } catch { throw new HttpError(400, "Invalid JSON body"); }
}
