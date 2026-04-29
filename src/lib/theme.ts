// Derive a small palette from a single accent hex so the whole app shifts
// (background tint, paper, soft-accent fills) when the user picks a new color.
// Pure function — safe to call from server or client components.

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return [95, 75, 33]; // cocoa fallback
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === R) h = ((G - B) / d) % 6;
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s * 100, l * 100];
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`;
}

export function deriveThemeVars(accentHex: string): React.CSSProperties {
  const [h, s] = rgbToHsl(...hexToRgb(accentHex));
  // Soft accent = same hue, slightly desaturated, very light. Used for tile
  // glyph backgrounds, chip fills, and tab dots.
  const accentSoft = hsl(h, Math.min(s, 55), 92);
  // Background = barely-tinted wash. Keeps cream feel but shifts toward accent
  // hue so cool palettes (Sky, Mint) actually look cool.
  const bg = hsl(h, Math.min(s * 0.25, 14), 96.5);
  const paper = hsl(h, Math.min(s * 0.18, 10), 98.5);
  const rule = hsl(h, Math.min(s * 0.2, 12), 88);
  const ruleSoft = hsl(h, Math.min(s * 0.15, 9), 92);
  return {
    ["--accent" as string]: accentHex,
    ["--accent-soft" as string]: accentSoft,
    ["--bg" as string]: bg,
    ["--paper" as string]: paper,
    ["--rule" as string]: rule,
    ["--rule-soft" as string]: ruleSoft,
  };
}
