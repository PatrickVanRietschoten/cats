import type { Activity } from "@/lib/activities";

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
  const s = size;
  const stroke = color;
  const filled = style === "filled";
  let mark: React.ReactNode;
  switch (act.category) {
    case "litter":
      mark = <circle cx={s / 2} cy={s / 2} r={s * 0.32} fill={filled ? color : "none"} stroke={stroke} strokeWidth={1.6} />;
      break;
    case "vomit":
      mark = (
        <path
          d={`M ${s * 0.2} ${s * 0.65} Q ${s / 2} ${s * 0.25} ${s * 0.8} ${s * 0.65}`}
          fill="none"
          stroke={stroke}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      );
      break;
    case "food":
      mark = (
        <rect
          x={s * 0.22}
          y={s * 0.3}
          width={s * 0.56}
          height={s * 0.4}
          rx={s * 0.05}
          fill={filled ? color : "none"}
          stroke={stroke}
          strokeWidth={1.6}
        />
      );
      break;
    case "health":
      mark = (
        <g>
          <line x1={s / 2} y1={s * 0.22} x2={s / 2} y2={s * 0.78} stroke={stroke} strokeWidth={1.6} />
          <line x1={s * 0.22} y1={s / 2} x2={s * 0.78} y2={s / 2} stroke={stroke} strokeWidth={1.6} />
        </g>
      );
      break;
    case "groom":
      mark = (
        <g>
          {[0.28, 0.44, 0.6, 0.76].map((x) => (
            <line key={x} x1={s * x} y1={s * 0.3} x2={s * x} y2={s * 0.7} stroke={stroke} strokeWidth={1.4} />
          ))}
        </g>
      );
      break;
    case "play":
      mark = (
        <polygon
          points={`${s / 2},${s * 0.22} ${s * 0.78},${s * 0.78} ${s * 0.22},${s * 0.78}`}
          fill={filled ? color : "none"}
          stroke={stroke}
          strokeWidth={1.6}
        />
      );
      break;
    case "mood":
      mark = (
        <path
          d={`M ${s / 2} ${s * 0.78} L ${s * 0.25} ${s * 0.45} A ${s * 0.18} ${s * 0.18} 0 1 1 ${s / 2} ${s * 0.32} A ${s * 0.18} ${s * 0.18} 0 1 1 ${s * 0.75} ${s * 0.45} Z`}
          fill={filled ? color : "none"}
          stroke={stroke}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      );
      break;
    default:
      mark = <circle cx={s / 2} cy={s / 2} r={s * 0.3} fill={filled ? color : "none"} stroke={stroke} strokeWidth={1.6} />;
  }
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} aria-hidden="true">
      {mark}
    </svg>
  );
}
