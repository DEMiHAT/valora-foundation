import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sameOrigin, errorResponse } from "@/lib/http";
import { cookieName, cookieOptions } from "@/lib/auth";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    (await cookies()).set(cookieName, "", { ...cookieOptions, maxAge: 0 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
