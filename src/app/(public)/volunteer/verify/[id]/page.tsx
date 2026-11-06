import { VolunteerVerification } from "@/components/volunteer-credential";
import { lookupVolunteer } from "@/lib/volunteer-lookup";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verify a volunteer card", robots: { index: false, follow: false } };

export default async function VolunteerVerifyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ token?: string }> }) {
  const { id } = await params;
  const { token } = await searchParams;
  const credential = await lookupVolunteer(token ?? "", id);
  return <section className="section"><div className="container"><VolunteerVerification credential={credential}/></div></section>;
}
