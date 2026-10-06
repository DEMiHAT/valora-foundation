import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="standalone-state">
      <span className="micro-label">404 · PAGE NOT FOUND</span>
      <h1>A different direction.</h1>
      <p>This page isn’t available. Let’s take you back to Valora.</p>
      <Link href="/" className="button button-primary">
        Back to the foundation →
      </Link>
    </main>
  );
}
