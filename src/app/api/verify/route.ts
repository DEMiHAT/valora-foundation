import { NextResponse } from "next/server";
import { repository } from "@/lib/repository";
import { rate, errorResponse } from "@/lib/http";
export async function GET(request: Request) {
  try {
    await rate(request, "verification", 40);
    const url = new URL(request.url),
      token = url.searchParams.get("token") ?? "",
      id = url.searchParams.get("id") ?? undefined;
    if (!/^[a-f0-9]{64}$/.test(token))
      return NextResponse.json(
        { valid: false, error: "A secure QR identifier is required." },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    const credential = await repository().verify(token, id);
    return NextResponse.json(
      { valid: credential?.status === "ACTIVE", credential },
      {
        status: credential ? 200 : 404,
        headers: {
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
          "X-Robots-Tag": "noindex",
        },
      }
    );
  } catch (e) {
    return errorResponse(e);
  }
}
