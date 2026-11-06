import { after, NextResponse } from "next/server";
import { z } from "zod";
import { repository } from "@/lib/repository";
import { errorResponse, jsonBody, rate, sameOrigin } from "@/lib/http";
import { safelyDrainEmail } from "@/lib/email";
import { volunteerContributionOptions } from "@/data/volunteer-programs";

const schema = z.object({
  program_id: z.string().min(1).max(80),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(8).max(25),
  city: z.string().trim().min(2).max(100),
  contributions: z.array(z.enum(volunteerContributionOptions)).min(1).max(5),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await rate(request, "volunteer-register", 5, 10 * 60_000);
    const input = schema.parse(await jsonBody(request));
    const volunteer = await repository().registerVolunteer(input);
    after(safelyDrainEmail);
    return NextResponse.json(
      {
        volunteer_id: volunteer.volunteer_id,
        name: volunteer.name,
        email: volunteer.email,
        message: "Your volunteer card has been queued for email delivery.",
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
