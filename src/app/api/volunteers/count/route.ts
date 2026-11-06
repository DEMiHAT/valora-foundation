import { NextResponse } from "next/server";
import { getVolunteerProgram } from "@/data/volunteer-programs";
import { repository } from "@/lib/repository";
import { errorResponse, rate } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await rate(request, "volunteer-count", 120, 60_000);
    const programKey = new URL(request.url).searchParams.get("program");
    const program = programKey ? getVolunteerProgram(programKey) : undefined;
    if (programKey && !program)
      return NextResponse.json({ count: 0 }, { status: 404 });
    const count = await repository().countVolunteers(program?.id);
    return NextResponse.json(
      { count, updatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20" } }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
