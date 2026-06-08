// ============================================================
// MyCron — CronletCard (reference container + presentational)
// ------------------------------------------------------------
// Demonstrates the full data flow:
//   list view → useCronlets() → map → <CronletCard cronlet={c} />
// The card is PURE: it only reads its `cronlet` prop. No fetching,
// no fixtures. The list container owns loading/empty/error.
// ============================================================

import React from "react";
import { color, radius, shadow, font } from "../styles/tokens";
import { StatusBadge, HealthStrip, Mono } from "./primitives";
import { EmptyState } from "./primitives";
import { useCronlets, byTriagePriority } from "../data/hooks";
import type { Cronlet } from "../types/mycron";

// ---- presentational ----
export function CronletCard(
  { cronlet, onOpen }: { cronlet: Cronlet; onOpen?: (c: Cronlet) => void }
) {
  const c = cronlet;
  const nextTone =
    c.state === "failed" ? color.sub : c.state === "stale" ? color.sub : color.sub;
  return (
    <button
      onClick={() => onOpen?.(c)}
      style={{
        width: "100%", textAlign: "left", cursor: "pointer", padding: 0,
        background: color.surface, border: `1px solid ${color.border}`,
        borderRadius: radius.cardLg, overflow: "hidden", boxShadow: shadow.card,
      }}
    >
      <div style={{ display: "flex", gap: 12, padding: "14px 15px 12px" }}>
        {/* icon slot — resolve c.icon against your icon set */}
        <div style={{
          width: 40, height: 40, borderRadius: 11, flex: "none",
          background: color.surface2, border: `1px solid ${color.hair}`,
          display: "grid", placeItems: "center", color: color.green,
        }}>
          <IconSlot name={c.icon} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 600, color: color.ink, letterSpacing: "-0.01em",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{c.name}</div>
          <div style={{
            fontSize: 12.5, color: color.faint, marginTop: 2, lineHeight: 1.4,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>{c.intent}</div>
        </div>
        <StatusBadge state={c.state} />
      </div>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 15px", borderTop: `1px solid ${color.hair}`, background: color.panel,
      }}>
        <Mono c={nextTone}>{c.nextRunLabel}</Mono>
        <HealthStrip days={c.health} />
      </div>
    </button>
  );
}

// ---- container (owns loading / empty / error) ----
export function CronletList({ onOpen }: { onOpen?: (c: Cronlet) => void }) {
  const { data, loading, error } = useCronlets();

  if (loading) return <ListSkeleton />;
  if (error)   return <EmptyState title="Couldn’t load routines" hint={error.message} />;
  if (!data || data.length === 0)
    return <EmptyState title="No cronlets yet" hint="Create one from the Routine Inbox or the builder." />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {[...data].sort(byTriagePriority).map((c) => (
        <CronletCard key={c.id} cronlet={c} onOpen={onOpen} />
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          height: 96, borderRadius: radius.cardLg, background: color.surface2,
          border: `1px solid ${color.hair}`, opacity: 1 - i * 0.2,
        }} />
      ))}
    </div>
  );
}

// Placeholder — wire to your icon library (Lucide ≈ the prototype set).
function IconSlot({ name }: { name: string }) {
  return <span aria-hidden style={{ fontFamily: font.mono, fontSize: 10 }}>{name.slice(0, 2)}</span>;
}
