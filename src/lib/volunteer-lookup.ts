import "server-only";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { repository } from "./repository";
import { DomainError } from "./domain";

export async function lookupVolunteer(token: string, id?: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const requestHeaders = await headers();
  const ip = process.env.VERCEL
    ? requestHeaders.get("x-vercel-forwarded-for") ?? "unknown"
    : "local";
  const key = createHash("sha256").update(`volunteer-card:${ip}`).digest("hex");
  const repo = repository();
  if (!(await repo.rateLimit(key, 120, 60_000)))
    throw new DomainError("RATE_LIMIT", "Too many verification attempts. Please try again shortly.", 429);
  return repo.verifyVolunteer(token, id);
}
