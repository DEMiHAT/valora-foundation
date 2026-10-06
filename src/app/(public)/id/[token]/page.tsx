import { CredentialCard, VerificationResult } from "@/components/credential";
import { lookupCredential } from "@/lib/credential-lookup";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Digital Valora E-ID",
  robots: { index: false, follow: false },
};
export default async function IdPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const credential = await lookupCredential(token);
  return (
    <section className="section">
      <div className="container">
        {credential ? (
          <CredentialCard credential={credential} token={token} />
        ) : (
          <VerificationResult credential={null} />
        )}
      </div>
    </section>
  );
}
