/** LYNK logo mark (dot · line · pill) on ink, for ImageResponse icons. */
export function LogoMark({ size, padding = 0.18 }: { size: number; padding?: number }) {
  const w = size * (1 - padding * 2);
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0E0E0F",
      }}
    >
      <svg width={w} height={w / 2} viewBox="0 0 40 20">
        <circle cx="4.5" cy="10" r="3.5" fill="#FAF7F2" />
        <path d="M10 10h12" stroke="#FAF7F2" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="25" y="4" width="13.5" height="12" rx="6" fill="#FFCF20" />
      </svg>
    </div>
  );
}
