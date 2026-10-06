import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { repository } from "@/lib/repository";
import { sameOrigin, jsonBody, errorResponse, rate } from "@/lib/http";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const session = await requireSession();
    await rate(request, "admin-matrix", 15);
    const input = z
      .object({
        event_id: z.string().max(100),
        committee_id: z.string().max(100),
        capacity: z.number().int().min(1).max(1000),
        portfolios: z.array(z.string().trim().min(1).max(120)).min(1).max(1000),
      })
      .parse(await jsonBody(request));
    await repository().matrix(
      input.event_id,
      input.committee_id,
      input.portfolios,
      input.capacity,
      session.username
    );
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return errorResponse(e);
  }
}
