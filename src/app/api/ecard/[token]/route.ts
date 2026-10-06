import { NextResponse } from "next/server";
import { repository, appUrl } from "@/lib/repository";
import { renderEcard } from "@/lib/ecard";
import { rate, errorResponse } from "@/lib/http";
import { DomainError } from "@/lib/domain";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await rate(request, "ecard-download", 20);
    const { token } = await params;
    if (!/^[a-f0-9]{64}$/.test(token))
      throw new DomainError("NOT_FOUND", "E-card not found.", 404);
    const credential = await repository().verify(token);
    if (!credential || credential.status !== "ACTIVE")
      throw new DomainError(
        "INVALID_CREDENTIAL",
        "This E-ID is invalid, revoked or expired.",
        404
      );
    const card = await renderEcard(
      credential,
      `${appUrl()}/verify/${credential.credential_id}?token=${token}`
    );
    return new NextResponse(new Uint8Array(card), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${credential.credential_id}-ecard.png"`,
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
