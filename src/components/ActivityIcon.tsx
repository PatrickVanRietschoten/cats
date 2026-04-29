import type { Activity } from "@/lib/activities";
import { ActivityGlyph, ACTIVITY_SVGS } from "./ActivityGlyphs";

interface Props {
  act: Activity;
  style?: "mono" | "shape" | "filled" | "emoji";
  size?: number;
  color?: string;
}

export function ActivityIcon({ act, style = "shape", size = 28, color = "currentColor" }: Props) {
  if (style === "emoji") {
    return (
      <span style={{ fontSize: size * 0.85, lineHeight: 1, fontFamily: "system-ui" }}>
        {act.emoji}
      </span>
    );
  }
  if (style === "mono") {
    return (
      <span
        style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: size * 0.46,
          fontWeight: 600,
          color,
          letterSpacing: "0.02em",
        }}
      >
        {act.glyph}
      </span>
    );
  }
  // Hand-drawn glyph by slug. "filled" tints the same line art with a softer
  // duplicate path underneath; "shape" is the plain line.
  if (style === "filled") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{ color, display: "block", flexShrink: 0 }}
        aria-hidden="true"
      >
        <g style={{ opacity: 0.18 }}>{ACTIVITY_SVGS[act.slug]}</g>
        {ACTIVITY_SVGS[act.slug]}
      </svg>
    );
  }
  return <ActivityGlyph slug={act.slug} size={size} color={color} />;
}
