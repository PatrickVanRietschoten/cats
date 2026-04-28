"use client";
import { useState } from "react";
import { PawMark } from "@/components/PawMark";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `Failed (${res.status})`);
      }
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--bg)",
        color: "var(--ink)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "var(--paper)",
          borderRadius: 18,
          padding: "32px 28px",
          boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 18px 40px rgba(0,0,0,.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, color: "var(--ink-soft)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>
          <PawMark size={14} color="var(--accent)" />
          <span>cat tracker</span>
        </div>
        <h1 style={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: 32, fontWeight: 500, margin: "0 0 8px", lineHeight: 1.05 }}>
          A diary for your cat.
        </h1>
        <p style={{ color: "var(--ink-dim)", margin: "0 0 22px", fontSize: 14, lineHeight: 1.5 }}>
          Sign in with your email — we&apos;ll send you a one-tap link.
        </p>
        {status === "sent" ? (
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "var(--accent-soft)",
              color: "var(--accent)",
              fontSize: 14,
            }}
          >
            ✓ Check your inbox at <b>{email}</b>. The link expires in 30 minutes.
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              type="email"
              autoFocus
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 14px",
                borderRadius: 10,
                border: "1px solid var(--rule)",
                background: "var(--bg)",
                color: "var(--ink)",
                fontSize: 16,
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={status === "sending"}
              style={{
                padding: 14,
                borderRadius: 12,
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                cursor: status === "sending" ? "wait" : "pointer",
                opacity: status === "sending" ? 0.7 : 1,
              }}
            >
              {status === "sending" ? "Sending…" : "Email me a sign-in link"}
            </button>
            {error && (
              <div style={{ color: "var(--bad)", fontSize: 13 }}>{error}</div>
            )}
          </form>
        )}
        <div style={{ marginTop: 20, fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5 }}>
          One household, many humans. Everyone sees the same cats and logs.
        </div>
      </div>
    </main>
  );
}
