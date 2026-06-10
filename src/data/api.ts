// ============================================================
// MyCron — API contract
// ------------------------------------------------------------
// The endpoints the UI expects. Implement against your backend.
// Components NEVER call these directly — they go through the
// hooks in src/data/hooks.ts, which return {data, loading, error}.
// No mock fixtures live in the component tree.
// ============================================================

import type {
  Cronlet,
  Run,
  InboxRequest,
  WeeklyReview,
  CronletStagedInput,
  AccountProfile,
  ComputeBudget,
  AlertPreference,
} from "../types/mycron";

export interface MyCronApi {
  // ---- Run Console ----
  /** List all cronlets with rolled-up health + latest run. */
  listCronlets(): Promise<Cronlet[]>;
  /** Full detail for one cronlet (includes latestRun proof). */
  getCronlet(id: string): Promise<Cronlet>;
  /** Paginated run history for a cronlet. */
  listRuns(
    cronletId: string,
    opts?: { limit?: number; cursor?: string },
  ): Promise<{ runs: Run[]; nextCursor?: string }>;

  // ---- domain transitions ----
  runNow(cronletId: string): Promise<{ runId: string }>;
  pause(cronletId: string): Promise<void>;
  resume(cronletId: string): Promise<void>;
  retryRun(runId: string): Promise<{ runId: string }>;
  rearmSchedule(cronletId: string): Promise<void>;
  notify(runId: string, note?: string): Promise<void>;
  /** Recompute Run verification/read-back state; not manual approval. */
  verifyRun(runId: string): Promise<void>;

  // ---- builder ----
  createCronlet(input: CronletStagedInput): Promise<Cronlet>;
  updateCronlet(id: string, input: Partial<CronletStagedInput>): Promise<Cronlet>;
  /** Server-side cron preview: next N fire times for a cron+tz. */
  previewSchedule(
    cron: string,
    timezone: string,
    count: number,
  ): Promise<string[]>;

  // ---- inbox ----
  listInbox(): Promise<InboxRequest[]>;
  dismissInbox(id: string): Promise<void>;
  /** Promote a raw request into a pre-filled staged input (server may use an LLM). */
  promoteInbox(id: string): Promise<CronletStagedInput>;

  // ---- weekly review ----
  getWeeklyReview(rangeStart?: string): Promise<WeeklyReview>;
  applySuggestion(suggestionId: string): Promise<void>;

  // ---- Account scope ----
  getAccount(): Promise<AccountProfile | null>;
  getComputeBudget(): Promise<ComputeBudget | null>;
  getAlertPreferences(): Promise<AlertPreference[]>;
  setAlertPreference(key: string, enabled: boolean): Promise<void>;
}

// ------------------------------------------------------------
// Suggested REST mapping (adjust to your conventions)
// ------------------------------------------------------------
//  GET    /cronlets
//  GET    /cronlets/:id
//  GET    /cronlets/:id/runs?limit&cursor
//  POST   /cronlets/:id/run
//  POST   /cronlets/:id/pause | /resume | /rearm
//  POST   /runs/:runId/retry | /notify | /verify
//  POST   /cronlets                      (create)
//  PATCH  /cronlets/:id                  (update)
//  POST   /schedule/preview              { cron, timezone, count }
//  GET    /inbox
//  DELETE /inbox/:id
//  POST   /inbox/:id/promote
//  GET    /review?start=YYYY-MM-DD
//  POST   /suggestions/:id/apply
