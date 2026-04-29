"use client";
import { useState, useTransition } from "react";
import type { Activity } from "@/lib/activities";
import { ActivityIcon } from "./ActivityIcon";

interface SaveEntry {
  happenedAt?: string;
  note?: string;
  data?: Record<string, unknown>;
  photos?: string[];
  files?: { url: string; name: string }[];
}

interface Props {
  act: Activity;
  cat: { id: string; name: string };
  onClose: () => void;
  onSave: (entry: SaveEntry) => Promise<void> | void;
}

export function LogSheet({ act, cat, onClose, onSave }: Props) {
  const [data, setData] = useState<Record<string, string | number>>({});
  const [time, setTime] = useState<"now" | "5m" | "1h" | "custom">("now");
  const [customTime, setCustomTime] = useState("");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [files, setFiles] = useState<{ url: string; name: string }[]>([]);
  const [uploading, setUploading] = useState<null | "photo" | "file">(null);
  const [pending, start] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fields = act.fields ?? ["note"];
  // Always allow attachments — every activity can have photos/files.
  const showAttach = true;

  function set(k: string, v: string | number) {
    setData((d) => ({ ...d, [k]: v }));
  }

  async function uploadFiles(input: HTMLInputElement, kind: "photo" | "file") {
    const fileList = input.files;
    if (!fileList || fileList.length === 0) return;
    setUploading(kind);
    setUploadError(null);
    const newPhotos: string[] = [];
    const newFiles: { url: string; name: string }[] = [];
    try {
      for (const file of Array.from(fileList)) {
        const fd = new FormData();
        fd.set("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? `Upload failed (${res.status})`);
        }
        const j = (await res.json()) as { url: string; name: string };
        if (kind === "photo") newPhotos.push(j.url);
        else newFiles.push({ url: j.url, name: j.name });
      }
      if (newPhotos.length) setPhotos((p) => [...p, ...newPhotos]);
      if (newFiles.length) setFiles((f) => [...f, ...newFiles]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
      input.value = "";
    }
  }

  function removePhoto(i: number) {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
  }
  function removeFile(i: number) {
    setFiles((f) => f.filter((_, idx) => idx !== i));
  }

  function happenedAtIso(): string {
    if (time === "now") return new Date().toISOString();
    if (time === "5m") return new Date(Date.now() - 5 * 60 * 1000).toISOString();
    if (time === "1h") return new Date(Date.now() - 60 * 60 * 1000).toISOString();
    if (customTime) {
      const d = new Date(customTime);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    return new Date().toISOString();
  }

  function submit() {
    start(async () => {
      await onSave({
        happenedAt: happenedAtIso(),
        note: note || undefined,
        data,
        photos,
        files,
      });
    });
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 540,
          background: "var(--paper)",
          color: "var(--ink)",
          borderRadius: "20px 20px 0 0",
          padding: "14px 18px 24px",
          maxHeight: "92dvh",
          overflow: "auto",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--rule)", margin: "0 auto 12px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "var(--accent-soft)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIcon act={act} style="mono" size={32} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: 22, fontWeight: 500, lineHeight: 1.1 }}>{act.label}</div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>for {cat.name}</div>
          </div>
        </div>

        <Row label="When">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(["now", "5m", "1h", "custom"] as const).map((opt) => (
              <Chip key={opt} active={time === opt} onClick={() => setTime(opt)}>
                {opt === "now" ? "now" : opt === "5m" ? "5m ago" : opt === "1h" ? "1h ago" : "Custom"}
              </Chip>
            ))}
          </div>
          {time === "custom" && (
            <input
              type="datetime-local"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              style={{ ...inputStyle, marginTop: 8 }}
            />
          )}
        </Row>

        {fields.includes("amount") && (
          <Row label="Amount">
            <div style={{ display: "flex", gap: 6 }}>
              {["small", "medium", "large"].map((v) => (
                <Chip key={v} active={data.amount === v} onClick={() => set("amount", v)}>
                  {v}
                </Chip>
              ))}
            </div>
          </Row>
        )}

        {fields.includes("consistency") && (
          <Row label="Consistency" hint="1 = liquid · 7 = hard">
            <div style={{ display: "flex", gap: 4 }}>
              {[1, 2, 3, 4, 5, 6, 7].map((v) => (
                <button
                  key={v}
                  onClick={() => set("consistency", v)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    cursor: "pointer",
                    border: `1px solid ${data.consistency === v ? "var(--accent)" : "var(--rule)"}`,
                    background: data.consistency === v ? "var(--accent-soft)" : "transparent",
                    color: "var(--ink)",
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 12,
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </Row>
        )}

        {fields.includes("grams") && (
          <Row label="Grams">
            <input
              inputMode="numeric"
              value={String(data.grams ?? "")}
              onChange={(e) => set("grams", e.target.value)}
              placeholder="60"
              style={inputStyle}
            />
          </Row>
        )}

        {fields.includes("kg") && (
          <Row label="Weight (kg)">
            <input
              inputMode="decimal"
              value={String(data.kg ?? "")}
              onChange={(e) => set("kg", e.target.value)}
              placeholder="4.6"
              style={inputStyle}
            />
          </Row>
        )}

        {fields.includes("minutes") && (
          <Row label="Minutes">
            <input
              inputMode="numeric"
              value={String(data.minutes ?? "")}
              onChange={(e) => set("minutes", e.target.value)}
              placeholder="10"
              style={inputStyle}
            />
          </Row>
        )}

        {fields.includes("count") && (
          <Row label="Count">
            <input
              inputMode="numeric"
              value={String(data.count ?? "")}
              onChange={(e) => set("count", e.target.value)}
              placeholder="3"
              style={inputStyle}
            />
          </Row>
        )}

        {fields.includes("brand") && (
          <Row label="Brand">
            <input
              value={String(data.brand ?? "")}
              onChange={(e) => set("brand", e.target.value)}
              placeholder="Smalls"
              style={inputStyle}
            />
          </Row>
        )}

        {fields.includes("name") && (
          <Row label="Name">
            <input
              value={String(data.name ?? "")}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Cerenia"
              style={inputStyle}
            />
          </Row>
        )}

        {fields.includes("dose") && (
          <Row label="Dose">
            <input
              value={String(data.dose ?? "")}
              onChange={(e) => set("dose", e.target.value)}
              placeholder="4mg"
              style={inputStyle}
            />
          </Row>
        )}

        {fields.includes("toy") && (
          <Row label="Toy">
            <input
              value={String(data.toy ?? "")}
              onChange={(e) => set("toy", e.target.value)}
              placeholder="wand"
              style={inputStyle}
            />
          </Row>
        )}

        {fields.includes("location") && (
          <Row label="Location">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["Box A", "Box B", "Kitchen", "Bedroom", "Other"].map((v) => (
                <Chip key={v} active={data.location === v} onClick={() => set("location", v)}>
                  {v}
                </Chip>
              ))}
            </div>
          </Row>
        )}

        {fields.includes("certainty") && (
          <Row label="Certainty">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["Saw it", "Pretty sure", "Found later"].map((v) => (
                <Chip key={v} active={data.certainty === v} onClick={() => set("certainty", v)}>
                  {v}
                </Chip>
              ))}
            </div>
          </Row>
        )}

        <Row label="Note">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional…"
            style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
          />
        </Row>

        {showAttach && (
          <Row label="Attach" hint={photos.length + files.length > 0 ? `${photos.length + files.length} attached` : undefined}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <label style={attachBtn}>
                {uploading === "photo" ? "Uploading…" : `📷 ${photos.length ? "Add photo" : "Photo"}`}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => uploadFiles(e.target, "photo")}
                />
              </label>
              <label style={attachBtn}>
                {uploading === "file" ? "Uploading…" : `📎 ${files.length ? "Add file" : "File"}`}
                <input
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => uploadFiles(e.target, "file")}
                />
              </label>
            </div>
            {photos.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: 6, marginTop: 8 }}>
                {photos.map((p, i) => (
                  <div key={i} style={{ position: "relative", paddingBottom: "100%", borderRadius: 8, overflow: "hidden", background: `center/cover no-repeat url(${p})` }}>
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      aria-label="Remove"
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        border: "none",
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: 12,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {files.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: "1px solid var(--rule)", borderRadius: 8, fontSize: 13 }}>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📎 {f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      aria-label="Remove"
                      style={{ appearance: "none", border: "none", background: "transparent", color: "var(--ink-soft)", cursor: "pointer", fontSize: 16 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {uploadError && <div style={{ color: "var(--bad)", fontSize: 12, marginTop: 6 }}>{uploadError}</div>}
          </Row>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 12,
              border: "1px solid var(--rule)",
              background: "transparent",
              color: "var(--ink)",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={pending}
            style={{
              flex: 2,
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
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-soft)" }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: "var(--ink-soft)", fontStyle: "italic" }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Chip({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        appearance: "none",
        cursor: "pointer",
        padding: "8px 12px",
        borderRadius: 999,
        border: `1px solid ${active ? "var(--accent)" : "var(--rule)"}`,
        background: active ? "var(--accent-soft)" : "transparent",
        color: active ? "var(--accent)" : "var(--ink)",
        fontSize: 13,
        textTransform: "capitalize",
      }}
    >
      {children}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid var(--rule)",
  background: "var(--bg)",
  color: "var(--ink)",
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
};

const attachBtn: React.CSSProperties = {
  flex: 1,
  padding: 12,
  borderRadius: 10,
  border: "1px dashed var(--rule)",
  background: "transparent",
  color: "var(--ink)",
  cursor: "pointer",
  fontSize: 13,
  textAlign: "center",
  minWidth: 120,
};
