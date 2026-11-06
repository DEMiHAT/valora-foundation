import { NextResponse } from "next/server";
import { repository, appUrl } from "@/lib/repository";
import { renderVolunteerCard } from "@/lib/volunteer-card";
import { rate, errorResponse } from "@/lib/http";
import { DomainError } from "@/lib/domain";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    await rate(request, "volunteer-card-download", 20);
    const { token } = await params;
    if (!/^[a-f0-9]{64}$/.test(token))
      throw new DomainError("NOT_FOUND", "Volunteer card not found.", 404);
    const credential = await repository().verifyVolunteer(token);
    if (!credential || credential.status !== "ACTIVE")
      throw new DomainError("INVALID_CREDENTIAL", "This volunteer card is invalid, revoked or expired.", 404);
    const verifyUrl = `${appUrl()}/volunteer/verify/${credential.volunteer_id}?token=${token}`;
    const card = await renderVolunteerCard(credential, verifyUrl);
    return new NextResponse(new Uint8Array(card), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${credential.volunteer_id}-volunteer-card.png"`,
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
