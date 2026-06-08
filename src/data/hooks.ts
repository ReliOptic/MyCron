// ============================================================
// MyCron — Data-access hooks
// ------------------------------------------------------------
// Components consume ONLY these hooks. They return a uniform
// async envelope { data, loading, error } plus actions.
// Swap the injected api (see src/data/provider.tsx) for a real
// MyCronApi at app bootstrap. Until then every read resolves to
// EMPTY data (no fixtures) and every write throws, so the UI
// renders its loading + empty + error states honestly.
// ============================================================

import { useEffect, useState, useCallback } from "react";
import type {
  Cronlet,
  Run,
  InboxRequest,
  WeeklyReview,
  CronletDraft,
  DonePolicyDraft,
  EvidenceType,
} from "../types/mycron";
import { useApi } from "./provider";

export interface Async<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): Async<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fn()
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e) => {
        if (alive) setError(e as Error);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(run, [run]);
  return { data, loading, error, reload: run };
}

// ---- queries ----
// Each query depends on `api` so swapping the provider (or a test
// double) re-fetches instead of holding a stale reference.
export function useCronlets(): Async<Cronlet[]> {
  const api = useApi();
  return useAsync(() => api.listCronlets(), [api]);
}

export function useCronlet(id: string | null): Async<Cronlet> {
  const api = useApi();
  return useAsync(
    () => (id ? api.getCronlet(id) : Promise.resolve(null as unknown as Cronlet)),
    [api, id]
  );
}

export function useRunHistory(cronletId: string | null): Async<Run[]> {
  const api = useApi();
  return useAsync(
    async () => (cronletId ? (await api.listRuns(cronletId)).runs : []),
    [api, cronletId]
  );
}

export function useInbox(): Async<InboxRequest[]> {
  const api = useApi();
  return useAsync(() => api.listInbox(), [api]);
}

export function useWeeklyReview(rangeStart?: string): Async<WeeklyReview> {
  const api = useApi();
  return useAsync(() => api.getWeeklyReview(rangeStart), [api, rangeStart]);
}

// ---- actions (imperative) ----
export function useCronletActions() {
  const api = useApi();
  return {
    runNow: (id: string) => api.runNow(id),
    pause: (id: string) => api.pause(id),
    resume: (id: string) => api.resume(id),
    retryRun: (runId: string) => api.retryRun(runId),
    rearm: (id: string) => api.rearmSchedule(id),
    escalate: (runId: string, note?: string) => api.escalate(runId, note),
    confirm: (runId: string) => api.confirmRun(runId),
    create: (draft: CronletDraft) => api.createCronlet(draft),
    update: (id: string, draft: Partial<CronletDraft>) => api.updateCronlet(id, draft),
    previewSchedule: (cron: string, tz: string, count = 4) =>
      api.previewSchedule(cron, tz, count),
    promoteInbox: (id: string) => api.promoteInbox(id),
    dismissInbox: (id: string) => api.dismissInbox(id),
    applySuggestion: (id: string) => api.applySuggestion(id),
  };
}

// ------------------------------------------------------------
// Helpers the UI uses to derive view-state from data.
// ------------------------------------------------------------

/** Count cronlets by state for the triage tiles/chips. */
export function countByState(cronlets: Cronlet[]): Record<string, number> {
  return cronlets.reduce(
    (acc, c) => ((acc[c.state] = (acc[c.state] ?? 0) + 1), acc),
    { verified: 0, failed: 0, stale: 0, unverified: 0 } as Record<string, number>
  );
}

/** Sort so problems surface first: failed → stale → unverified → verified. */
export const STATE_ORDER = ["failed", "stale", "unverified", "verified"] as const;
export function byTriagePriority(a: Cronlet, b: Cronlet): number {
  return STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state);
}

/** Derive required evidence artifacts from a Done Policy draft. */
export function deriveRequiredEvidence(p: DonePolicyDraft): EvidenceType[] {
  const out: EvidenceType[] = [];
  if (p.output) out.push("file");
  if (p.sources) out.push("links");
  if (p.evidence) out.push("deliver");
  if (p.ran) out.push("log");
  return out;
}
