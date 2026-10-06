import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminLogin } from "@/components/admin-login";
export const metadata = {
  title: "Organiser sign in",
  robots: { index: false, follow: false },
};
export default async function Login() {
  if (await getSession()) redirect("/admin");
  return (
    <main id="main" className="login-page">
      <div className="login-visual">
        <Link href="/" className="brand">
          <Image
            src="/brand/crest.png"
            alt="Valora crest"
            width={52}
            height={49}
          />
          <span>
            VALORA<small>FOUNDATION</small>
          </span>
        </Link>
        <div>
          <Image src="/brand/crest.png" alt="" width={290} height={271} />
          <h2>
            Knowledge.
            <br />
            Growth.
            <br />
            <em>Empathy.</em>
          </h2>
        </div>
        <Link href="/">← Back to the foundation</Link>
      </div>
      <div className="login-panel">
        <AdminLogin />
      </div>
    </main>
  );
}
