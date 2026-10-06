import { notFound } from "next/navigation";
import { getEvent, formatFee } from "@/data/events";
import { paymentReady, paymentMode, checkoutPolicyText } from "@/lib/razorpay";
import { DelegationCheckout } from "@/components/delegation-checkout";
import { PageHero, PoweredBy } from "@/components/public";
export const dynamic="force-dynamic";
export const metadata={title:"School delegation registration"};
export default async function Page({params}:{params:Promise<{slug:string}>}) {
  const event=getEvent((await params).slug);if(!event)notFound();
  return <><PageHero eyebrow="VALORA MUN · SCHOOLS" title={<>Bring your<br/><em>delegation.</em></>} description="One teacher. One roster. One payment. Every student gets their own registration and digital E-ID."/><section className="section"><div className="container registration-grid"><DelegationCheckout event={event} ready={paymentReady(event)} refundPolicy={checkoutPolicyText()} testMode={paymentMode() === "test"}/><aside className="registration-summary"><span className="micro-label">SCHOOL DELEGATION</span><h3>Bring your students together.</h3><p>Register 2–30 students with their committee preferences. Pay {formatFee(event)} per student in one secure checkout.</p><ul><li>Individual registration for every student</li><li>One combined payment</li><li>Allocations and E-IDs sent to student emails</li><li>Two training sessions included</li></ul><p className="summary-small">Need help with a larger delegation? <a href="/contact" className="text-link">Contact the Valora team</a></p><PoweredBy compact /></aside></div></section></>;
}
