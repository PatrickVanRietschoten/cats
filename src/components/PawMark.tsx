interface PawMarkProps {
  size?: number;
  color?: string;
  opacity?: number;
  style?: React.CSSProperties;
}

export function PawMark({ size = 24, color = "currentColor", opacity = 1, style }: PawMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} aria-hidden="true">
      <g fill={color} opacity={opacity}>
        <path d="M 16 28 C 11 28 7 24 7 20 C 7 17 9 15 12 15 L 20 15 C 23 15 25 17 25 20 C 25 24 21 28 16 28 Z" />
        <ellipse cx="9" cy="11" rx="2.6" ry="3.4" transform="rotate(-15 9 11)" />
        <ellipse cx="14" cy="7" rx="2.4" ry="3.2" />
        <ellipse cx="20" cy="7" rx="2.4" ry="3.2" />
        <ellipse cx="25" cy="11" rx="2.6" ry="3.4" transform="rotate(15 25 11)" />
      </g>
    </svg>
  );
}
