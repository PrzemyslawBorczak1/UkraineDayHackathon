import type { ReactNode } from "react";

function Mark() {
  return (
    <span className="cp-mark" aria-hidden>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" />
        <circle cx="7" cy="17.5" r="1.6" />
        <circle cx="17.5" cy="17.5" r="1.6" />
      </svg>
    </span>
  );
}

export function TopBar({ right }: { right?: ReactNode }) {
  return (
    <header className="cp-bar">
      <div className="cp-brand">
        <Mark />
        <div>
          <div className="cp-brand-name">Carrier Portal</div>
          <div className="cp-brand-sub">Crisis Logistics Grid</div>
        </div>
      </div>
      {right}
    </header>
  );
}
