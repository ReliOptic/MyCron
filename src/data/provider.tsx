// ============================================================
// MyCron — API provider + mock-free default
// ------------------------------------------------------------
// At bootstrap, wrap the app in <ApiProvider api={yourApi}>.
// If you pass nothing, EmptyApi is used:
//   • reads  resolve to EMPTY data (honest loading → empty states,
//     zero fixtures) — see CONTEXT.md / the no-fixtures rule.
//   • writes throw NotImplementedError — a control plane must never
//     report a silent success for an action it did not perform.
// Replace EmptyApi with a real MyCronApi incrementally, endpoint
// by endpoint, as a backend lands.
// ============================================================

import React, { createContext, useContext } from "react";
import type { MyCronApi } from "./api";
import type { WeeklyReview } from "../types/mycron";

/** Thrown by every un-backed mutation in {@link EmptyApi}. Callers should
 *  surface this as an error state, never treat the action as completed. */
export class NotImplementedError extends Error {
  readonly method: string;
  constructor(method: string) {
    super(
      `MyCronApi.${method} is not implemented (no backend wired). ` +
        `Inject a real MyCronApi via <ApiProvider api={...}> before invoking writes.`
    );
    this.name = "NotImplementedError";
    this.method = method;
  }
}

/**
 * The intended handoff default. Renders the UI honestly with no data:
 * reads return empty, writes fail fast. Zero presets, zero fixtures.
 */
export const EmptyApi: MyCronApi = {
  // ---- reads: empty, never fabricated ----
  listCronlets: async () => [],
  getCronlet: async (id) => {
    throw new Error(`No cronlet "${id}" — EmptyApi holds no data`);
  },
  listRuns: async () => ({ runs: [] }),
  listInbox: async () => [],
  getWeeklyReview: async (): Promise<WeeklyReview> => ({
    rangeLabel: "",
    verifiedRuns: 0,
    totalRuns: 0,
    previousVerifiedRuns: 0,
    failed: 0,
    stale: 0,
    unverified: 0,
    costLabel: "",
    corrections: [],
    suggestions: [],
  }),
  /** No schedule engine yet — honest empty preview, not N blank rows. */
  previewSchedule: async () => [],

  // ---- writes: fail fast, never silently succeed ----
  runNow: async () => {
    throw new NotImplementedError("runNow");
  },
  pause: async () => {
    throw new NotImplementedError("pause");
  },
  resume: async () => {
    throw new NotImplementedError("resume");
  },
  retryRun: async () => {
    throw new NotImplementedError("retryRun");
  },
  rearmSchedule: async () => {
    throw new NotImplementedError("rearmSchedule");
  },
  escalate: async () => {
    throw new NotImplementedError("escalate");
  },
  confirmRun: async () => {
    throw new NotImplementedError("confirmRun");
  },
  createCronlet: async () => {
    throw new NotImplementedError("createCronlet");
  },
  updateCronlet: async () => {
    throw new NotImplementedError("updateCronlet");
  },
  promoteInbox: async () => {
    throw new NotImplementedError("promoteInbox");
  },
  dismissInbox: async () => {
    throw new NotImplementedError("dismissInbox");
  },
  applySuggestion: async () => {
    throw new NotImplementedError("applySuggestion");
  },
};

const ApiContext = createContext<MyCronApi>(EmptyApi);

export function ApiProvider({
  api = EmptyApi,
  children,
}: {
  api?: MyCronApi;
  children: React.ReactNode;
}) {
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

export function useApi(): MyCronApi {
  return useContext(ApiContext);
}
