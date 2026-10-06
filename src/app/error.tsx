"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="standalone-state">
      <h1>Let’s try that again.</h1>
      <p>We couldn’t load this page. Please try again in a moment.</p>
      <button className="button button-primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
