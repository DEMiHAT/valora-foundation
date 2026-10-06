import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  validPassword,
  sessionToken,
  cookieName,
  cookieOptions,
} from "@/lib/auth";
import { sameOrigin, rate, jsonBody, errorResponse } from "@/lib/http";
import { DomainError } from "@/lib/domain";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await rate(request, "login", 5, 15 * 60 * 1000);
    const input = z
      .object({ username: z.string().max(100), password: z.string().max(256) })
      .parse(await jsonBody(request));
    if (!process.env.ADMIN_PASSWORD_HASH || !process.env.SESSION_SECRET)
      throw new DomainError(
        "CONFIG",
        "Organiser access needs to be configured. See the setup guide.",
        503
      );
    const valid = validPassword(input.password);
    if (
      input.username !== (process.env.ADMIN_USERNAME ?? "organiser") ||
      !valid
    )
      throw new DomainError(
        "INVALID_LOGIN",
        "The username or password is incorrect.",
        401
      );
    (await cookies()).set(
      cookieName,
      sessionToken(input.username),
      cookieOptions
    );
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return errorResponse(e);
  }
}
