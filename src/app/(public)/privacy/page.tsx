import { PageHero } from "@/components/public";
export const metadata = { title: "Privacy" };
export default function Privacy() {
  return (
    <>
      <PageHero
        eyebrow="YOUR INFORMATION"
        title="Privacy at Valora."
        description="How the event platform uses participant information."
      />
      <section className="section">
        <div className="container legal-copy">
          <h2>Event registration</h2>
          <p>
            Our registration form collects participant information,
            committee preferences and payment references for registration,
            payment verification, allocation, event communication and delegate
            ID issuance. The school delegation portal also collects the school name and teacher contact details, and saves a roster and checkout reference in the current browser tab so payment can be resumed. Do not submit unnecessary sensitive information.
          </p>
          <h2>Access and storage</h2>
          <p>
            Event operations use a restricted Google Sheet. Organiser access to
            this platform is protected. Digital ID verification shows only the
            participant’s name, event, committee, portfolio, validity and
            credential status. Email addresses, phone numbers, schools and
            payment references are not shown on public verification pages.
          </p>
          <h2>External services</h2>
          <p>
            Registration takes place on our website, linked from the event
            page. Payments are processed by Razorpay under its privacy terms; card and banking credentials are entered in Razorpay checkout and are not stored by Valora. A checkout reference is saved in this browser tab so you can resume payment. Google’s own privacy terms apply when using Google Forms,
            Sheets and email. Private E-ID links should be kept safe; anyone
            with the secure QR link can view the limited verification details.
          </p>
          <h2>Requests about your data</h2>
          <p>
            Contact Valora through the official channels on our contact page to
            request a correction or discuss removal of your registration
            information. Organisers will review requests against event and
            payment record requirements.
          </p>
          <h2>Retention</h2>
          <p>
            Participant and payment records are retained for event
            administration and follow-up. The organising team will communicate
            any additional retention or consent terms during registration before accepting payments.
          </p>
        </div>
      </section>
    </>
  );
}
