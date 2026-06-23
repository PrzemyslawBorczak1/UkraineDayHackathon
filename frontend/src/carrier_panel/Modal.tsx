import type { ReactNode } from "react";

export function Modal({ title, onClose, children }: {
  title: string; onClose: () => void; children: ReactNode;
}) {
  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="cp-dialog-head">
          <h3>{title}</h3>
          <button className="cp-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="cp-dialog-body">{children}</div>
      </div>
    </div>
  );
}
