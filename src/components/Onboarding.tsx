"use client";
import { useState, useTransition } from "react";
import { createHouseholdAction } from "@/app/actions";
import { PawMark } from "./PawMark";

interface Props {
  userEmail: string;
  householdName?: string;
  hasHousehold?: boolean;
}

export function Onboarding({ userEmail, householdName, hasHousehold }: Props) {
  const [step, setStep] = useState(hasHousehold ? 2 : 0);
  const [hh, setHh] = useState(householdName ?? `${userEmail.split("@")[0]}'s household`);
  const [catName, setCatName] = useState("");
  const [breed, setBreed] = useState("");
  const [weight, setWeight] = useState("");
  const [pending, start] = useTransition();

  const steps = [
    { kicker: "welcome", title: "A diary for your cat." },
    { kicker: "household", title: "Name your household." },
    { kicker: "add cat", title: "Who are we tracking?" },
    { kicker: "ready", title: "Tap to log. Hold to customize." },
  ];

  const last = step === steps.length - 1;
  const s = steps[step];

  function next() {
    if (step === 2) {
      start(async () => {
        await createHouseholdAction(hh, catName, weight ? parseFloat(weight) : undefined, breed);
        setStep(3);
      });
      return;
    }
    if (last) {
      window.location.reload();
      return;
    }
    setStep(step + 1);
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        padding: "40px 22px 22px",
        background: "var(--bg)",
        color: "var(--ink)",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <div style={{ display: "flex", gap: 4, marginBottom: 36 }}>
        {steps.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i <= step ? "var(--accent)" : "var(--rule)",
            }}
          />
        ))}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--ink-soft)",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <PawMark size={12} color="var(--accent)" />
          {s.kicker}
        </div>
        <div
          style={{
            fontFamily: '"Crimson Pro", Georgia, serif',
            fontSize: 36,
            lineHeight: 1.05,
            fontWeight: 500,
            marginBottom: 14,
          }}
        >
          {s.title}
        </div>
        {step === 0 && (
          <p style={{ color: "var(--ink-dim)", fontSize: 15, lineHeight: 1.5 }}>
            Tap a tile, log a moment. We&apos;ll learn what you track most and put it on top.
          </p>
        )}
        {step === 1 && (
          <input
            value={hh}
            onChange={(e) => setHh(e.target.value)}
            placeholder="De Jong household"
            style={inputStyle}
          />
        )}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Cat name"
              autoFocus
              style={inputStyle}
            />
            <input
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="Breed (optional)"
              style={inputStyle}
            />
            <input
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Weight (kg, optional)"
              inputMode="decimal"
              style={inputStyle}
            />
          </div>
        )}
        {step === 3 && (
          <p style={{ color: "var(--ink-dim)", fontSize: 15, lineHeight: 1.5 }}>
            You can reorder, hide, or add new activities any time from Settings → Activities.
          </p>
        )}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        {step > 0 && step !== 3 && (
          <button
            onClick={() => setStep(step - 1)}
            style={{
              padding: "14px 18px",
              borderRadius: 12,
              border: "1px solid var(--rule)",
              background: "transparent",
              color: "var(--ink)",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Back
          </button>
        )}
        <button
          onClick={next}
          disabled={pending || (step === 2 && !catName.trim())}
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 12,
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? "Saving…" : last ? "Start logging" : "Continue"}
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 10,
  border: "1px solid var(--rule)",
  background: "var(--bg)",
  color: "var(--ink)",
  fontSize: 16,
  outline: "none",
};
