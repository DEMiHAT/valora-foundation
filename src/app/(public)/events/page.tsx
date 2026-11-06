import { PageHero, CTA } from "@/components/public";
export const metadata = { title: "Events" };
export default function Events() {
  return (
    <>
      <PageHero
        eyebrow="VALORA FOUNDATION"
        title={
          <>
            Events.
          </>
        }
        description="Our inaugural Model United Nations conference takes place on 14 November 2026."
      />
      <CTA />
    </>
  );
}
