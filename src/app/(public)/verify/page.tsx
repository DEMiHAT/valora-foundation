import { PageHero } from "@/components/public";
import { VerifyScanner } from "@/components/verify-scanner";
export const metadata = {
  title: "E-ID verification",
  robots: { index: false, follow: false },
};
export default function Verify() {
  return (
    <>
      <PageHero
        eyebrow="SECURE VALORA E-ID VERIFICATION"
        title={
          <>
            A credential
            <br />
            you can <em>verify.</em>
          </>
        }
        description="Scan a delegate’s current QR or paste the secure verification link to check their event credential."
      />
      <section className="section">
        <div className="container">
          <VerifyScanner />
        </div>
      </section>
    </>
  );
}
