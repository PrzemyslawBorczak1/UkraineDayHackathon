import * as React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

/** Shared defaults so every icon inherits stroke color and sizing uniformly. */
function Icon({ size = 16, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon size={14} {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </Icon>
  );
}

export function TruckGlyph(props: IconProps) {
  return (
    <Icon size={18} {...props}>
      <path d="M1 3h13v10H1zM14 7h4l3 3v3h-7z" />
      <circle cx="6" cy="17" r="2" />
      <circle cx="18" cy="17" r="2" />
    </Icon>
  );
}
