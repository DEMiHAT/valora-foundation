import { HeartHandshake, Mail, QrCode, Users } from "lucide-react";
import { PageHero, Eyebrow } from "@/components/public";
import { VolunteerRegistration } from "@/components/volunteer-registration";
import { VolunteerCount } from "@/components/volunteer-count";
import { volunteerPrograms } from "@/data/volunteer-programs";

export const metadata = {
  title: "Volunteer with Valora",
  description: "Join the Valora Foundation volunteer community and receive your digital volunteer card.",
};

export default function VolunteerPage() {
  const programs = volunteerPrograms.filter((program) => program.active);
  return <><PageHero eyebrow="VOLUNTEER WITH VALORA" title={<>Learn. Lead.<br/><em>Make an impact.</em></>} description="Join our volunteer community, choose how you’d like to contribute and receive your secure digital volunteer card by email."/><section className="section volunteer-overview"><div className="container volunteer-overview-grid"><div className="volunteer-community-stat"><Eyebrow>OUR COMMUNITY</Eyebrow><div className="volunteer-community-count"><VolunteerCount/><span>Volunteers</span></div><p>Growing together through service.</p></div><div className="volunteer-benefits"><div><HeartHandshake/><h3>Contribute your way</h3><p>Choose outreach, events, education, community work or partnerships.</p></div><div><Mail/><h3>Card by email</h3><p>Your personalised volunteer card is generated and queued automatically.</p></div><div><QrCode/><h3>Secure verification</h3><p>Every card has a private QR that verifies its current status.</p></div><div><Users/><h3>One growing community</h3><p>Your unique VF number stays tied to your volunteer registration.</p></div></div></div></section><section className="section initiatives-section"><div className="container volunteer-registration-grid"><VolunteerRegistration programs={programs}/><aside className="volunteer-program-card"><span className="micro-label">CURRENT PROGRAMME</span><h2>{programs[0]?.title ?? "Volunteer registration"}</h2><p>{programs[0]?.description ?? "Volunteer applications are currently closed."}</p><ul><li>Unique volunteer ID</li><li>Digital PNG card by email</li><li>Secure QR verification</li><li>Event-ready volunteer records</li></ul></aside></div></section></>;
}
