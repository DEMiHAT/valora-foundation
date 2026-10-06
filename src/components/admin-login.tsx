"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Button } from "./ui/button";
export function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fields = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: fields.get("username"),
          password: fields.get("password"),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError((err as Error).message || "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="login-form" onSubmit={submit}>
      <span className="login-icon">
        <LockKeyhole size={22} />
      </span>
      <span className="micro-label">VALORA ORGANISER ACCESS</span>
      <h1>
        A space to
        <br />
        make it happen.
      </h1>
      <p>
        Sign in to manage registrations, payments, allocations and digital IDs.
      </p>
      <label>
        Username
        <input
          name="username"
          autoComplete="username"
          required
          maxLength={100}
        />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={256}
        />
      </label>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <Button type="submit" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
        <ArrowRight size={17} />
      </Button>
      <small>Access is restricted to authorised Valora organisers.</small>
    </form>
  );
}
