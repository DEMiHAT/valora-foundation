import { PageHero } from "@/components/public";
export const metadata = { title: "Event information & terms" };
export default function Terms() {
  return (
    <>
      <PageHero
        eyebrow="BEFORE YOU REGISTER"
        title="Event information & terms."
        description="Review these terms and the refund policy shown at registration before payment."
      />
      <section className="section">
        <div className="container legal-copy">
          <h2>Confirmation</h2>
          <p>
            Registration is followed by secure Razorpay checkout and server-confirmed payment.
            Committee and portfolio allocations are issued only after payment is
            verified. Preferences are considered in order and remain subject to
            availability.
          </p>
          <h2>Fees and payment</h2>
          <p>
            The event page lists the delegate fee and inclusions. Complete payment only through the Razorpay checkout on our registration page. Keep your payment receipt and registration reference.
          </p>
          <h2>Cancellations and refunds</h2>
          <p>
            The applicable cancellation and refund policy is displayed on the registration page before checkout. Review it before paying and contact the organising team with your registration reference for refund requests.
          </p>
          <h2>Event details</h2>
          <p>
            Venue and training schedules will be confirmed by the organising
            team. Updated information will be published on the event page and
            sent to registered participants.
          </p>
          <h2>Participation</h2>
          <p>
            Participants are expected to respect fellow delegates and
            organisers. Any age eligibility, guardian consent or conduct
            requirements will be communicated by the organising team.
          </p>
        </div>
      </section>
    </>
  );
}
