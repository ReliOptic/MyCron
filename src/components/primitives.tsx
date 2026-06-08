// ============================================================
// MyCron — Reference primitives (props-driven, zero fixtures)
// ------------------------------------------------------------
// These show the intended pattern: presentational components
// take typed data via props and read from design tokens.
// Recreate the full set in your codebase's component style.
// (Styling shown inline for portability — convert to your
// CSS solution: CSS Modules, Tailwind, vanilla-extract, etc.)
// ============================================================

import React from "react";
import { color, status, radius, font, STATUS_LABEL } from "../styles/tokens";
import type { RunState } from "../types/mycron";

// ---- StatusBadge ----
export function StatusBadge({ state }: { state: RunState | "scheduled" | "running" }) {
  const s = status[state];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, height: 23,
      padding: "0 9px 0 8px", borderRadius: radius.chip, fontSize: 11.5,
      fontWeight: 600, lineHeight: 1, color: s.text, background: s.bg,
      border: `1px solid ${s.line}`, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: 7, background: s.dot }} />
      {STATUS_LABEL[state]}
    </span>
  );
}

// ---- HealthStrip (7-day heatmap) ----
export function HealthStrip(
  { days, size = 12, gap = 3 }: { days: (RunState | null)[]; size?: number; gap?: number }
) {
  return (
    <div style={{ display: "flex", gap }}>
      {days.map((d, i) => (
        <div key={i} title={d ? STATUS_LABEL[d] : "No run"} style={{
          width: size, height: size, borderRadius: 3,
          background: d ? status[d].dot : "transparent",
          border: d ? "none" : `1px solid ${color.border}`,
        }} />
      ))}
    </div>
  );
}

// ---- Mono (machine-verifiable values) ----
export function Mono(
  { children, dim, c }: { children: React.ReactNode; dim?: boolean; c?: string }
) {
  return (
    <span style={{ fontFamily: font.mono, fontSize: 12, letterSpacing: "-0.01em",
      color: c ?? (dim ? color.faint : color.sub) }}>{children}</span>
  );
}

// ---- EmptyState (the honest default when EmptyApi is in use) ----
export function EmptyState(
  { title, hint }: { title: string; hint?: string }
) {
  return (
    <div style={{
      padding: "48px 24px", textAlign: "center", border: `1px dashed ${color.border}`,
      borderRadius: radius.card, color: color.faint, background: color.panel,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: color.sub }}>{title}</div>
      {hint && <div style={{ fontSize: 12.5, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}
