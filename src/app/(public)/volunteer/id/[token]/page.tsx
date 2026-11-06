import { VolunteerCredentialCard, VolunteerVerification } from "@/components/volunteer-credential";
import { lookupVolunteer } from "@/lib/volunteer-lookup";

export const dynamic = "force-dynamic";
export const metadata = { title: "Digital volunteer card", robots: { index: false, follow: false } };

export default async function VolunteerIdPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const credential = await lookupVolunteer(token);
  return <section className="section"><div className="container">{credential ? <VolunteerCredentialCard credential={credential} token={token}/> : <VolunteerVerification credential={null}/>}</div></section>;
}
