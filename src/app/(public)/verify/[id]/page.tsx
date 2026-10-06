import { VerificationResult } from "@/components/credential";
import { lookupCredential } from "@/lib/credential-lookup";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Verify a Valora E-ID",
  robots: { index: false, follow: false },
};
export default async function VerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;
  const credential = await lookupCredential(token ?? "", id);
  return (
    <section className="section">
      <div className="container">
        <VerificationResult credential={credential} />
      </div>
    </section>
  );
}
