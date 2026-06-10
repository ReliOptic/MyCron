import React from "react";
import { EmptyState } from "@contract/components/primitives";
import type { RunState } from "@contract/types/mycron";
import type { CopyKey } from "../i18n/copy";
import { useAppCopy } from "./context";

export function statusCopyKey(state: RunState): CopyKey {
  return `status.${state}` as CopyKey;
}

export function PageHead({ eyebrow, title, sub, action }: { eyebrow: string; title: React.ReactNode; sub: string; action?: React.ReactNode }) {
  return <header className="page-head"><div><div className="eyebrow">{eyebrow}</div><h1 className="page-title">{title}</h1><p className="page-sub">{sub}</p></div>{action}</header>;
}

export function Status({ state }: { state: RunState }) {
  const { tc } = useAppCopy();
  return <span className={`status ${state}`}>{tc(statusCopyKey(state))}</span>;
}

export function Health({ days }: { days: (RunState | null)[] }) {
  return <div className="health">{days.map((d, i) => <span key={i} className={d ?? ""} title={d ?? "No run"}/>)}</div>;
}

export function StateDot({ state }: { state: RunState }) {
  const { tc } = useAppCopy();
  return <span className={`status ${state}`} style={{ width: 23, padding: 0, justifyContent: "center" }} aria-label={tc(statusCopyKey(state))}/>;
}

export function Fact({ label, value }: { label: string; value: string }) {
  return <div className="card stat"><div className="eyebrow">{label}</div><div className="mono" style={{ marginTop: 10 }}>{value}</div></div>;
}

export function Skeleton({ title }: { title: string }) {
  return <><PageHead eyebrow="Loading" title={title} sub="Fetching the current MyCron provider state."/><div className="grid"><div className="card" style={{ height: 92, opacity: .7 }}/><div className="card" style={{ height: 260, opacity: .45 }}/></div></>;
}

export function NotFoundBlock({ title, hint }: { title: string; hint: string }) {
  return <div className="not-found"><EmptyState title={title} hint={hint} /></div>;
}

export function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export function demoSearch() {
  return window.location.search.includes("demo=1") ? "?demo=1" : "";
}
