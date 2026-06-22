type TruckIconProps = {
  color?: string;
  size?: number;
};

export function TruckIcon({ color = "#2563eb", size = 32 }: TruckIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* trailer */}
      <rect x="6" y="22" width="34" height="20" rx="2" fill="#e5e7eb" />

      {/* cabin */}
      <path d="M40 26h9l6 7v9H40V26z" fill={color} />

      {/* window */}
      <path d="M44 29h5l3 4h-8v-4z" fill="white" />

      {/* chassis */}
      <rect x="6" y="42" width="50" height="4" rx="1" fill="#374151" />

      {/* wheels */}
      <circle cx="18" cy="49" r="5" fill="#111827" />
      <circle cx="18" cy="49" r="2.5" fill="white" />

      <circle cx="44" cy="49" r="5" fill="#111827" />
      <circle cx="44" cy="49" r="2.5" fill="white" />
    </svg>
  );
}
