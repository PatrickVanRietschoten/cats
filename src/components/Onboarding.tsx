"use client";
import { useRef, useState, useTransition } from "react";
import { addCatToHouseholdAction, createHouseholdAction } from "@/app/actions";
import { PawMark } from "./PawMark";

interface Props {
  userEmail: string;
  householdName?: string;
  hasHousehold?: boolean;
}

type Step = "welcome" | "household" | "cat" | "another" | "ready";

interface CatDraft {
  name: string;
  breed: string;
  weight: string;
  born: string;
  sex: string;
  indoor: boolean;
  photoUrl?: string;
}

const blankDraft: CatDraft = {
  name: "",
  breed: "",
  weight: "",
  born: "",
  sex: "",
  indoor: true,
};

export function Onboarding({ userEmail, householdName, hasHousehold }: Props) {
  const [step, setStep] = useState<Step>(hasHousehold ? "cat" : "welcome");
  const [hh, setHh] = useState(householdName ?? `${userEmail.split("@")[0]}'s household`);
  const [draft, setDraft] = useState<CatDraft>(blankDraft);
  const [savedCats, setSavedCats] = useState<string[]>([]);
  const [householdCreated, setHouseholdCreated] = useState(!!hasHousehold);
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const stepIndex: Record<Step, number> = { welcome: 0, household: 1, cat: 2, another: 3, ready: 4 };
  const stepCount = hasHousehold ? 3 : 5;
  const idx = hasHousehold ? Math.max(0, stepIndex[step] - 2) : stepIndex[step];
  const titles: Record<Step, { kicker: string; title: string }> = {
    welcome: { kicker: "welcome", title: "A diary for your cat." },
    household: { kicker: "household", title: "Name your household." },
    cat: { kicker: savedCats.length === 0 ? "add cat" : "another cat", title: savedCats.length === 0 ? "Who are we tracking?" : "Add another cat?" },
    another: { kicker: "more cats?", title: "Add another cat?" },
    ready: { kicker: "ready", title: "Tap to log. Hold to customize." },
  };
  const s = titles[step];

  async function uploadPhoto(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const j = (await res.json()) as { url: string };
      setDraft((d) => ({ ...d, photoUrl: j.url }));
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  }

  function saveCurrentCat(): Promise<void> {
    return new Promise((resolve) => {
      start(async () => {
        const weight = draft.weight ? parseFloat(draft.weight) : undefined;
        if (!householdCreated) {
          await createHouseholdAction({
            name: hh,
            catName: draft.name,
            catWeight: weight,
            catBreed: draft.breed,
            catBorn: draft.born,
            catSex: draft.sex,
            catIndoor: draft.indoor,
            catPhotoUrl: draft.photoUrl,
          });
          setHouseholdCreated(true);
        } else {
          await addCatToHouseholdAction({
            name: draft.name,
            breed: draft.breed,
            weightKg: weight,
            born: draft.born,
            sex: draft.sex,
            indoor: draft.indoor,
            photoUrl: draft.photoUrl,
          });
        }
        setSavedCats((c) => [...c, draft.name]);
        setDraft(blankDraft);
        resolve();
      });
    });
  }

  async function next() {
    if (step === "welcome") return setStep("household");
    if (step === "household") return setStep("cat");
    if (step === "cat") {
      await saveCurrentCat();
      setStep("another");
      return;
    }
    if (step === "ready") {
      window.location.reload();
    }
  }

  function addAnotherYes() {
    setStep("cat");
  }
  function addAnotherNo() {
    setStep("ready");
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
        {Array.from({ length: stepCount }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i <= idx ? "var(--accent)" : "var(--rule)",
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

        {step === "welcome" && (
          <p style={{ color: "var(--ink-dim)", fontSize: 15, lineHeight: 1.5 }}>
            Tap a tile, log a moment. We&apos;ll learn what you track most and put it on top.
          </p>
        )}

        {step === "household" && (
          <input
            value={hh}
            onChange={(e) => setHh(e.target.value)}
            placeholder="De Jong household"
            style={inputStyle}
          />
        )}

        {step === "cat" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: "50%",
                  border: "1px dashed var(--rule)",
                  background: draft.photoUrl ? `center/cover no-repeat url(${draft.photoUrl})` : "var(--paper)",
                  color: "var(--ink-soft)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  flexShrink: 0,
                  position: "relative",
                  overflow: "hidden",
                }}
                aria-label="Upload cat photo"
              >
                {!draft.photoUrl && (uploading ? "…" : "+ photo")}
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadPhoto(f);
                  e.target.value = "";
                }}
              />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Cat name"
                  autoFocus
                  style={inputStyle}
                />
                <input
                  value={draft.breed}
                  onChange={(e) => setDraft((d) => ({ ...d, breed: e.target.value }))}
                  placeholder="Breed (optional)"
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={draft.weight}
                onChange={(e) => setDraft((d) => ({ ...d, weight: e.target.value }))}
                placeholder="Weight (kg)"
                inputMode="decimal"
                style={inputStyle}
              />
              <input
                type="date"
                value={draft.born}
                onChange={(e) => setDraft((d) => ({ ...d, born: e.target.value }))}
                placeholder="Born"
                style={inputStyle}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <select
                value={draft.sex}
                onChange={(e) => setDraft((d) => ({ ...d, sex: e.target.value }))}
                style={inputStyle}
              >
                <option value="">Sex (optional)</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
              <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: 12, border: "1px solid var(--rule)", borderRadius: 10, fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={draft.indoor}
                  onChange={(e) => setDraft((d) => ({ ...d, indoor: e.target.checked }))}
                />
                Indoor
              </label>
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-soft)", fontStyle: "italic" }}>
              Photo + breed are optional. You can edit any of this later.
            </div>
          </div>
        )}

        {step === "another" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ color: "var(--ink-dim)", fontSize: 15, lineHeight: 1.5 }}>
              {savedCats.length === 1 ? <><b>{savedCats[0]}</b> is added.</> : <>You&apos;ve added <b>{savedCats.length}</b> cats.</>} Want to add another?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {savedCats.map((n, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-dim)" }}>
                  <span>✓</span>
                  <span>{n}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === "ready" && (
          <p style={{ color: "var(--ink-dim)", fontSize: 15, lineHeight: 1.5 }}>
            You can reorder, hide, or add new activities any time from Settings → Activities. Add more cats from the avatar row up top.
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        {step === "another" ? (
          <>
            <button onClick={addAnotherYes} style={btnSecondary}>+ Another cat</button>
            <button onClick={addAnotherNo} style={btnPrimary(false)}>Done — start logging</button>
          </>
        ) : (
          <>
            {(step === "household" || step === "cat") && (
              <button
                onClick={() => setStep(step === "household" ? "welcome" : (savedCats.length > 0 ? "another" : "household"))}
                style={btnSecondary}
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              disabled={pending || (step === "cat" && !draft.name.trim())}
              style={btnPrimary(pending)}
            >
              {pending ? "Saving…" : step === "ready" ? "Start logging" : step === "cat" ? "Save cat" : "Continue"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const btnSecondary: React.CSSProperties = {
  padding: "14px 18px",
  borderRadius: 12,
  border: "1px solid var(--rule)",
  background: "transparent",
  color: "var(--ink)",
  cursor: "pointer",
  fontSize: 14,
};

function btnPrimary(pending: boolean): React.CSSProperties {
  return {
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
  };
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
