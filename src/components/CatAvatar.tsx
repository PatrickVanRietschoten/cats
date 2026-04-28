interface CatAvatarProps {
  cat: { id: string; color: string };
  size?: number;
  ring?: boolean;
}

export function CatAvatar({ cat, size = 36, ring = false }: CatAvatarProps) {
  const s = size;
  const fg = cat.color;
  const clipId = `clip-${cat.id}`;
  return (
    <div
      style={{
        width: s,
        height: s,
        position: "relative",
        flexShrink: 0,
        borderRadius: "50%",
        boxShadow: ring ? `0 0 0 2px ${fg}, 0 0 0 4px var(--bg)` : "none",
      }}
    >
      <svg width={s} height={s} viewBox="0 0 40 40" style={{ display: "block" }}>
        <defs>
          <clipPath id={clipId}>
            <circle cx="20" cy="20" r="20" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <rect width="40" height="40" fill={fg} opacity="0.25" />
          <polygon points="8,2 16,12 4,12" fill={fg} />
          <polygon points="32,2 36,12 24,12" fill={fg} />
          <circle cx="20" cy="24" r="14" fill={fg} />
          <circle cx="15" cy="22" r="1.6" fill="#fff" />
          <circle cx="25" cy="22" r="1.6" fill="#fff" />
          <path d="M 17 28 Q 20 30 23 28" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
