import { requireAdminPage } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Organiser workspace",
  robots: { index: false, follow: false },
};
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminPage();
  return <AdminShell username={session.username}>{children}</AdminShell>;
}
