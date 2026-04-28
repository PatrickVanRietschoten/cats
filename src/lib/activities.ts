// Built-in activity taxonomy. Custom activities live in DB and are merged at runtime.
export type ActivityCategoryId =
  | "litter"
  | "vomit"
  | "food"
  | "health"
  | "groom"
  | "play"
  | "mood";

export const CATEGORIES: { id: ActivityCategoryId; label: string }[] = [
  { id: "litter", label: "Litter box" },
  { id: "vomit", label: "Vomiting" },
  { id: "food", label: "Eating & drinking" },
  { id: "health", label: "Health" },
  { id: "groom", label: "Grooming" },
  { id: "play", label: "Play & activity" },
  { id: "mood", label: "Mood & behavior" },
];

export type FieldKey =
  | "amount"
  | "consistency"
  | "grams"
  | "kg"
  | "minutes"
  | "location"
  | "certainty"
  | "name"
  | "dose"
  | "brand"
  | "count"
  | "toy"
  | "note"
  | "photo"
  | "file";

export interface Activity {
  slug: string;
  label: string;
  category: ActivityCategoryId;
  glyph: string;
  emoji: string;
  fields: FieldKey[];
  custom?: boolean;
}

export const BUILTIN_ACTIVITIES: Activity[] = [
  // Litter box
  { slug: "poop", label: "Poop", category: "litter", glyph: "PO", emoji: "💩", fields: ["amount", "consistency", "location", "photo", "note"] },
  { slug: "pee", label: "Pee", category: "litter", glyph: "PE", emoji: "💧", fields: ["amount", "location", "note"] },
  { slug: "diarrhea", label: "Diarrhea", category: "litter", glyph: "DI", emoji: "🟫", fields: ["amount", "consistency", "photo", "note"] },
  { slug: "constip", label: "Constipation", category: "litter", glyph: "CN", emoji: "⚠︎", fields: ["note"] },
  { slug: "box-clean", label: "Litter cleaned", category: "litter", glyph: "LC", emoji: "🧹", fields: ["location", "note"] },

  // Vomit
  { slug: "hb-vomit", label: "Hairball (vomit)", category: "vomit", glyph: "HV", emoji: "🌀", fields: ["amount", "photo", "note"] },
  { slug: "hb-dry", label: "Hairball (dry)", category: "vomit", glyph: "HD", emoji: "🪶", fields: ["note"] },
  { slug: "vomit-food", label: "Threw up food", category: "vomit", glyph: "VF", emoji: "🤢", fields: ["amount", "photo", "note"] },
  { slug: "vomit-other", label: "Vomit (other)", category: "vomit", glyph: "VO", emoji: "🟡", fields: ["amount", "photo", "note", "certainty"] },

  // Food
  { slug: "eat-wet", label: "Wet food", category: "food", glyph: "WF", emoji: "🥫", fields: ["grams", "brand", "note"] },
  { slug: "eat-dry", label: "Dry food", category: "food", glyph: "DF", emoji: "🥣", fields: ["grams", "brand", "note"] },
  { slug: "water", label: "Drank water", category: "food", glyph: "WA", emoji: "💧", fields: ["note"] },
  { slug: "treats", label: "Treats", category: "food", glyph: "TR", emoji: "🍪", fields: ["count", "brand", "note"] },

  // Health
  { slug: "meds", label: "Medication", category: "health", glyph: "RX", emoji: "💊", fields: ["name", "dose", "note", "file"] },
  { slug: "vet", label: "Vet visit", category: "health", glyph: "VT", emoji: "🩺", fields: ["note", "file", "photo"] },
  { slug: "weight", label: "Weight", category: "health", glyph: "KG", emoji: "⚖︎", fields: ["kg", "note"] },

  // Grooming
  { slug: "comb", label: "Comb / brush", category: "groom", glyph: "CB", emoji: "🪮", fields: ["note"] },
  { slug: "nails", label: "Nail clipping", category: "groom", glyph: "NL", emoji: "✂︎", fields: ["note"] },
  { slug: "bath", label: "Bath", category: "groom", glyph: "BA", emoji: "🛁", fields: ["note", "photo"] },

  // Play & activity
  { slug: "play", label: "Play session", category: "play", glyph: "PL", emoji: "🪀", fields: ["minutes", "toy", "note"] },
  { slug: "scratch", label: "Scratching post", category: "play", glyph: "SC", emoji: "🪵", fields: ["note"] },
  { slug: "zoomies", label: "Zoomies", category: "play", glyph: "ZM", emoji: "⚡︎", fields: ["note"] },
  { slug: "outdoor", label: "Outdoor time", category: "play", glyph: "OD", emoji: "🌿", fields: ["minutes", "note"] },
  { slug: "prey", label: "Brought prey", category: "play", glyph: "PR", emoji: "🐭", fields: ["photo", "note", "certainty"] },

  // Mood & behavior
  { slug: "sleep", label: "Nap", category: "mood", glyph: "NP", emoji: "🌙", fields: ["location", "minutes", "note"] },
  { slug: "vocal", label: "Vocalization", category: "mood", glyph: "VC", emoji: "🗣", fields: ["note", "photo"] },
  { slug: "hide", label: "Hiding", category: "mood", glyph: "HI", emoji: "🫥", fields: ["location", "minutes", "note"] },
  { slug: "aggression", label: "Aggression", category: "mood", glyph: "AG", emoji: "⚠︎", fields: ["note", "photo"] },
  { slug: "affection", label: "Affection", category: "mood", glyph: "AF", emoji: "♡", fields: ["note", "photo"] },
  { slug: "mood-note", label: "Mood note", category: "mood", glyph: "MN", emoji: "✎", fields: ["note"] },
];

export const BUILTIN_BY_SLUG: Record<string, Activity> = Object.fromEntries(
  BUILTIN_ACTIVITIES.map((a) => [a.slug, a]),
);

export function fmtTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  const isYest = d.toDateString() === yest.toDateString();
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  if (sameDay) return `${hh}:${mm}`;
  if (isYest) return `Yesterday ${hh}:${mm}`;
  const day = d.toLocaleDateString(undefined, { weekday: "short" });
  return `${day} ${hh}:${mm}`;
}

export function fmtDayHeader(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}
