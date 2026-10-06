import "server-only";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { repository } from "./repository";
import { DomainError } from "./domain";
export async function lookupCredential(token: string, id?: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const h = await headers();
  const ip = process.env.VERCEL
    ? h.get("x-vercel-forwarded-for") ?? "unknown"
    : "local";
  const key = createHash("sha256")
    .update("credential-page:" + ip)
    .digest("hex");
  const repo = repository();
  if (!(await repo.rateLimit(key, 120, 60000)))
    throw new DomainError(
      "RATE_LIMIT",
      "Too many verification attempts. Please try again shortly.",
      429
    );
  return repo.verify(token, id);
}
