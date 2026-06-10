// ============================================================
// MyCron — Run Console (first surface shell)
// ------------------------------------------------------------
// The main dashboard: resolve every Cronlet to a state you can
// trust, surfacing problems first. This is a CONTAINER — it owns
// loading / empty / error and reads data only through hooks. It
// embeds ZERO fixtures; under the default EmptyApi it renders an
// honest loading → empty path with no preset cronlets.
//
// Styling is inline + tokens.ts per the handoff (framework- and
// CSS-pipeline-neutral). Swap to your styling solution when an
// application stack is chosen.
// ============================================================

import React from "react";
import {
  color,
  status,
  radius,
  shadow,
  font,
  STATUS_LABEL,
} from "../styles/tokens";
import { StatusBadge, HealthStrip, Mono, EmptyState } from "./primitives";
import {
  useCronlets,
  countByState,
  byTriagePriority,
  STATE_ORDER,
} from "../data/hooks";
import type { Cronlet, RunState } from "../types/mycron";

// ---- container: owns loading / empty / error ----
export function RunConsole({ onOpen }: { onOpen?: (c: Cronlet) => void }) {
  const { data, loading, error, reload } = useCronlets();

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <ConsoleHeader />
      {loading ? (
        <ConsoleSkeleton />
      ) : error ? (
        <EmptyState
          title="Couldn’t load Cronlets"
          hint={`${error.message} — check your MyCronApi wiring, then retry.`}
        />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="No Cronlets yet"
          hint="Register a Cronlet from a host agent (MyCron CLI) or promote one from the Inbox."
        />
      ) : (
        <>
          <TriageStrip cronlets={data} />
          <Ledger cronlets={data} onOpen={onOpen} />
        </>
      )}
      {/* reload kept reachable for retry affordances / tests */}
      <button type="button" onClick={reload} hidden aria-hidden>
        reload
      </button>
    </section>
  );
}

// ---- presentational: page header ----
function ConsoleHeader() {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            fontFamily: font.mono,
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: color.faint,
          }}
        >
          Run Console
        </div>
        <h1
          style={{
            fontSize: 27,
            fontWeight: 700,
            letterSpacing: "-0.032em",
            color: color.ink,
          }}
        >
          Operating Ledger
        </h1>
      </div>
    </header>
  );
}

// ---- presentational: triage strip (counts, no fabricated totals) ----
function TriageStrip({ cronlets }: { cronlets: Cronlet[] }) {
  const counts = countByState(cronlets);
  return (
    <div style={{ display: "flex", gap: 11, flexWrap: "wrap" }}>
      {STATE_ORDER.map((s) => (
        <TriageTile key={s} state={s} count={counts[s] ?? 0} />
      ))}
    </div>
  );
}

function TriageTile({ state, count }: { state: RunState; count: number }) {
  const s = status[state];
  return (
    <div
      style={{
        flex: "1 1 140px",
        padding: "12px 14px",
        borderRadius: radius.card,
        background: color.surface,
        border: `1px solid ${color.border}`,
        boxShadow: shadow.card,
      }}
    >
      <div
        style={{
          fontFamily: font.mono,
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: s.text,
        }}
      >
        {count}
      </div>
      <div
        style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}
      >
        <span
          style={{ width: 7, height: 7, borderRadius: 7, background: s.dot }}
        />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: color.sub }}>
          {STATUS_LABEL[state]}
        </span>
      </div>
    </div>
  );
}

// ---- presentational: ledger (rows sorted by triage priority) ----
function Ledger({
  cronlets,
  onOpen,
}: {
  cronlets: Cronlet[];
  onOpen?: (c: Cronlet) => void;
}) {
  return (
    <div
      style={{
        borderRadius: radius.card,
        border: `1px solid ${color.border}`,
        background: color.surface,
        overflow: "hidden",
        boxShadow: shadow.card,
      }}
    >
      <LedgerHeaderRow />
      {[...cronlets].sort(byTriagePriority).map((c) => (
        <LedgerRow key={c.id} cronlet={c} onOpen={onOpen} />
      ))}
    </div>
  );
}

function LedgerHeaderRow() {
  const cell: React.CSSProperties = {
    fontFamily: font.mono,
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: color.faint,
  };
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.6fr 0.9fr 1fr 1fr 0.8fr 24px",
        gap: 12,
        alignItems: "center",
        padding: "10px 15px",
        background: color.panel,
        borderBottom: `1px solid ${color.hair}`,
      }}
    >
      <span style={cell}>Cronlet</span>
      <span style={cell}>Run state</span>
      <span style={cell}>Last run</span>
      <span style={cell}>Next run</span>
      <span style={cell}>7-day</span>
      <span aria-hidden />
    </div>
  );
}

function LedgerRow({
  cronlet,
  onOpen,
}: {
  cronlet: Cronlet;
  onOpen?: (c: Cronlet) => void;
}) {
  const c = cronlet;
  return (
    <button
      type="button"
      onClick={() => onOpen?.(c)}
      style={{
        display: "grid",
        gridTemplateColumns: "1.6fr 0.9fr 1fr 1fr 0.8fr 24px",
        gap: 12,
        alignItems: "center",
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        padding: "13px 15px",
        background: color.surface,
        border: "none",
        borderBottom: `1px solid ${color.hair}`,
      }}
    >
      <span
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: color.ink,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {c.name}
      </span>
      <span>
        <StatusBadge state={c.state} />
      </span>
      <Mono>{c.lastRunLabel}</Mono>
      <Mono>{c.nextRunLabel}</Mono>
      <HealthStrip days={c.health} />
      <span
        aria-hidden
        style={{ color: color.mute, fontSize: 16, textAlign: "center" }}
      >
        ›
      </span>
    </button>
  );
}

// ---- loading skeleton ----
function ConsoleSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: 11 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: "1 1 140px",
              height: 78,
              borderRadius: radius.card,
              background: color.surface2,
              border: `1px solid ${color.hair}`,
            }}
          />
        ))}
      </div>
      <div
        style={{
          height: 220,
          borderRadius: radius.card,
          background: color.surface2,
          border: `1px solid ${color.hair}`,
        }}
      />
    </div>
  );
}
