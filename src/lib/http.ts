import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DomainError } from "./domain";
import { repository, appUrl } from "./repository";
export function errorResponse(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      {
        error: "Please check the submitted fields.",
        fields: error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  if (error instanceof DomainError)
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status }
    );
  console.error(
    "Valora operation failed:",
    error instanceof Error ? error.name : "Unknown error"
  );
  return NextResponse.json(
    { error: "The operation could not be completed. Please try again." },
    { status: 503 }
  );
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin !== appUrl())
    throw new DomainError("ORIGIN", "Invalid request origin.", 403);
}
export async function rate(
  request: Request,
  scope: string,
  limit = 10,
  windowMs = 60000
) {
  // Vercel overwrites x-vercel-forwarded-for. On local preview, group requests together.
  const ip = process.env.VERCEL
    ? request.headers.get("x-vercel-forwarded-for") ?? "unknown"
    : "local";
  const key = createHash("sha256")
    .update(scope + ":" + ip)
    .digest("hex");
  if (!(await repository().rateLimit(key, limit, windowMs)))
    throw new DomainError(
      "RATE_LIMIT",
      "Too many attempts. Please try again shortly.",
      429
    );
}
export async function jsonBody(request: Request) {
  const text = await request.text();
  if (text.length > 32000)
    throw new DomainError("TOO_LARGE", "Request too large.", 413);
  try {
    return JSON.parse(text);
  } catch {
    throw new DomainError("INVALID_JSON", "Invalid request.", 400);
  }
}
