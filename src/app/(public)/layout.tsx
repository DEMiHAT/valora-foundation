import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/public";
import { HelpAssistant } from "@/components/help-assistant";
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      <main id="main" className="public-main">{children}</main>
      <Footer />
      <HelpAssistant />
    </>
  );
}
