// Hand-drawn 24×24 SVG glyphs, one per activity slug. Line-only (currentColor),
// 1.6 stroke, round caps/joins. Designed to read at 16–44px.
// Sourced from the Cat Tracker design bundle (Icon Validation.html).

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const ACTIVITY_SVGS: Record<string, React.ReactNode> = {
  // ── Litter box ─────────────────────────────────────────────
  poop: (
    <g {...STROKE}>
      <path d="M7 19 H17 A2 2 0 0 0 17 15 H15.5 A2 2 0 0 0 15.5 11 H14 A2 2 0 0 0 14 7.5" />
      <path d="M7 19 A2 2 0 0 1 7 15 H8.5" />
      <path d="M8.5 15 A2 2 0 0 1 8.5 11 H10" />
      <path d="M10 11 A2 2 0 0 1 10 7.5" />
    </g>
  ),
  pee: (
    <g {...STROKE}>
      <path d="M12 4 C 9 9 6.5 12.5 6.5 15.5 A5.5 5.5 0 0 0 17.5 15.5 C 17.5 12.5 15 9 12 4 Z" />
    </g>
  ),
  diarrhea: (
    <g {...STROKE}>
      <path d="M12 4 C 9.5 8 7.5 11 7.5 13.5 A4.5 4.5 0 0 0 16.5 13.5 C 16.5 11 14.5 8 12 4 Z" />
      <path d="M5 19 Q 7 17.6 9 19 T 13 19 T 17 19 T 19 19" />
    </g>
  ),
  constip: (
    <g {...STROKE}>
      <circle cx="12" cy="12" r="6.5" />
      <path d="M9 9 L15 15 M15 9 L9 15" />
    </g>
  ),
  "box-clean": (
    <g {...STROKE}>
      <rect x="3" y="13" width="11" height="7" rx="1" />
      <path d="M14 13 L19 6" />
      <path d="M19 6 L21 8 L17.5 11.5 Z" />
      <path d="M5.5 16 V19 M8 16 V19 M10.5 16 V19" />
    </g>
  ),

  // ── Vomit ──────────────────────────────────────────────────
  "hb-vomit": (
    <g {...STROKE}>
      <path d="M16.5 11 a4.5 4.5 0 1 1 -2.6 -4 a3 3 0 1 1 -1.7 2.5 a1.6 1.6 0 1 0 1 1.5" />
      <path d="M6.5 17 Q 8.5 15.5 10.5 17 T 14.5 17 T 18 17" />
    </g>
  ),
  "hb-dry": (
    <g {...STROKE}>
      <ellipse cx="12" cy="13" rx="5" ry="3.2" />
      <path d="M7.5 11 L6 9.5 M9 9.7 L8.4 7.8 M12 9 V7 M15 9.7 L15.6 7.8 M16.5 11 L18 9.5" />
    </g>
  ),
  "vomit-food": (
    <g {...STROKE}>
      <path d="M5 9 Q 12 4 19 9" />
      <path d="M5 9 Q 5 13 8 13 L16 13 Q 19 13 19 9" />
      <path d="M9 16 v2 M12 16.5 v2.5 M15 16 v2" />
    </g>
  ),
  "vomit-other": (
    <g {...STROKE}>
      <path d="M5 14 C 5 10 9 9 12 10 C 14 8.5 18 9.5 19 13 C 20 16 17.5 18 14.5 17.5 C 11.5 19 6 18 5 14 Z" />
    </g>
  ),

  // ── Food ───────────────────────────────────────────────────
  "eat-wet": (
    <g {...STROKE}>
      <rect x="6" y="7" width="12" height="11" rx="1" />
      <path d="M6 11 H18" />
      <circle cx="9.5" cy="9" r="0.6" />
      <path d="M9.5 9 H13" />
    </g>
  ),
  "eat-dry": (
    <g {...STROKE}>
      <path d="M4 12 H20 A8 8 0 0 1 4 12 Z" />
      <circle cx="9" cy="8" r="1" />
      <circle cx="12" cy="6.6" r="1" />
      <circle cx="15" cy="8" r="1" />
    </g>
  ),
  water: (
    <g {...STROKE}>
      <path d="M7 5 H17 L16 19 A2 2 0 0 1 14 21 H10 A2 2 0 0 1 8 19 Z" />
      <path d="M7.5 10 Q 9.5 8.5 12 10 T 16.5 10" />
    </g>
  ),
  treats: (
    <g {...STROKE}>
      <path d="M12 4 A8 8 0 1 0 20 12 A3 3 0 0 1 17 9 A3 3 0 0 1 14 6 A2 2 0 0 1 12 4 Z" />
      <circle cx="9" cy="10" r="0.6" />
      <circle cx="13" cy="14" r="0.6" />
      <circle cx="9.5" cy="15" r="0.6" />
    </g>
  ),

  // ── Health ─────────────────────────────────────────────────
  meds: (
    <g {...STROKE}>
      <rect x="3.5" y="9" width="17" height="6" rx="3" transform="rotate(-25 12 12)" />
      <path d="M9 7.5 L13.5 16" transform="rotate(-25 12 12)" />
    </g>
  ),
  vet: (
    <g {...STROKE}>
      <path d="M7 4 V10 A4 4 0 0 0 15 10 V4" />
      <path d="M11 13 V16 A3 3 0 0 0 17 16 V14" />
      <circle cx="17" cy="13" r="1.4" />
    </g>
  ),
  weight: (
    <g {...STROKE}>
      <rect x="3.5" y="6" width="17" height="13" rx="2" />
      <path d="M8 11 A4 4 0 0 1 16 11" />
      <path d="M12 8.5 V11" />
    </g>
  ),

  // ── Grooming ───────────────────────────────────────────────
  comb: (
    <g {...STROKE}>
      <rect x="4" y="6" width="16" height="4" rx="0.6" />
      <path d="M6 10 V14 M9 10 V15 M12 10 V15 M15 10 V15 M18 10 V14" />
    </g>
  ),
  nails: (
    <g {...STROKE}>
      <circle cx="7" cy="8" r="2.2" />
      <circle cx="7" cy="16" r="2.2" />
      <path d="M9 9.5 L20 17" />
      <path d="M9 14.5 L20 7" />
    </g>
  ),
  bath: (
    <g {...STROKE}>
      <path d="M3 12 H21 V14 A4 4 0 0 1 17 18 H7 A4 4 0 0 1 3 14 Z" />
      <path d="M5 18 V20 M19 18 V20" />
      <circle cx="10" cy="7" r="1.4" />
      <circle cx="13" cy="5" r="0.8" />
      <circle cx="15" cy="8" r="1" />
    </g>
  ),

  // ── Play & activity ────────────────────────────────────────
  play: (
    <g {...STROKE}>
      <path d="M5 19 L11 13" />
      <path d="M11 13 C 14 10 16 8 18 5 C 17 8 15 11 12.5 13.5 Z" />
      <path d="M14 11 L11.5 11 M15.5 9 L13 9 M17 7 L14.5 7" />
    </g>
  ),
  scratch: (
    <g {...STROKE}>
      <rect x="9" y="3" width="6" height="16" rx="1" />
      <path d="M5 8 L8.5 8.7 M5 12 L8.5 12 M5 16 L8.5 15.3" />
      <rect x="6.5" y="19" width="11" height="2" rx="0.4" />
    </g>
  ),
  zoomies: (
    <g {...STROKE}>
      <path d="M13 3 L6 13 H11 L9 21 L18 9 H13 Z" />
    </g>
  ),
  outdoor: (
    <g {...STROKE}>
      <path d="M12 3 C 7 7 5 11 7 14 C 8.5 16.5 11 16 12 14 C 13 16 15.5 16.5 17 14 C 19 11 17 7 12 3 Z" />
      <path d="M12 14 V21" />
    </g>
  ),
  prey: (
    <g {...STROKE}>
      <path d="M3 17 C 4 13 8 11.5 11.5 12.5 C 13 11 16 11 17.5 13 C 19 14.8 18.3 17 16 17.2 Z" />
      <path d="M11.5 12.5 L9.5 9 L12 9.5 Z" />
      <path d="M14 11.5 L12.5 8 L15 9 Z" />
      <circle cx="14.5" cy="14.5" r="0.5" />
      <path d="M3 17 C 1.5 17.5 1 18.5 1.5 19.5" />
    </g>
  ),

  // ── Mood & behavior ────────────────────────────────────────
  sleep: (
    <g {...STROKE}>
      <path d="M16 4 A8 8 0 1 0 20 16 A6 6 0 0 1 16 4 Z" />
      <path d="M5 6 H8 L5 10 H8" />
    </g>
  ),
  vocal: (
    <g {...STROKE}>
      <path d="M5 5 H19 A2 2 0 0 1 21 7 V14 A2 2 0 0 1 19 16 H11 L7 20 V16 H5 A2 2 0 0 1 3 14 V7 A2 2 0 0 1 5 5 Z" />
      <circle cx="9" cy="10.5" r="0.6" />
      <circle cx="12" cy="10.5" r="0.6" />
      <circle cx="15" cy="10.5" r="0.6" />
    </g>
  ),
  hide: (
    <g {...STROKE}>
      <path d="M3 14 H13 V21 H3 Z" />
      <circle cx="17" cy="10" r="4" />
      <circle cx="15.5" cy="10" r="0.6" />
      <circle cx="18.5" cy="10" r="0.6" />
    </g>
  ),
  aggression: (
    <g {...STROKE}>
      <path d="M12 4 L21 19 H3 Z" />
      <path d="M12 10 V14" />
      <circle cx="12" cy="16.5" r="0.5" />
    </g>
  ),
  affection: (
    <g {...STROKE}>
      <path d="M12 20 C 5 15 3 11 5 8 A4 4 0 0 1 12 8 A4 4 0 0 1 19 8 C 21 11 19 15 12 20 Z" />
    </g>
  ),
  "mood-note": (
    <g {...STROKE}>
      <path d="M5 5 H14 L17 8 V19 H5 Z" />
      <path d="M14 5 V8 H17" />
      <path d="M8 12 H13 M8 15 H12" />
    </g>
  ),
};

export function ActivityGlyph({ slug, size = 28, color = "currentColor" }: { slug: string; size?: number; color?: string }) {
  const svg = ACTIVITY_SVGS[slug];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ color, display: "block", flexShrink: 0 }}
      aria-hidden="true"
    >
      {svg ?? <circle cx="12" cy="12" r="6" {...STROKE} />}
    </svg>
  );
}
