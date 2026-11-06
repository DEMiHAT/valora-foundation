import { PageHero } from "@/components/public";
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
        description="Updates on upcoming Valora Foundation events will be shared here."
      />
    </>
  );
}
