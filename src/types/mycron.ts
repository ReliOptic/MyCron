// ============================================================
// MyCron — Domain Types (single source of truth for data shapes)
// ------------------------------------------------------------
// These interfaces replace ALL hardcoded mock data from the
// design prototype. The UI components are pure: they receive
// data through props (or a data-fetching hook) and render.
// No fixtures, no presets baked into components.
// ============================================================

/** The four operational run states. `unverified` is first-class:
 *  a Cronlet can finish executing yet remain unproven. */
export type RunState = "verified" | "failed" | "stale" | "unverified";

/** Transient lifecycle states used in headers / live indicators. */
export type LiveState = "scheduled" | "running";

/** A single condition in a Cronlet's Done Policy.
 *  The run is only `verified` when every *enabled* condition passes. */
export interface DoneCondition {
  id: string;
  /** Human label, e.g. "All required sources reached" */
  label: string;
  /** One-line evidence/explanation, e.g. "14 of 15 — 1 partial response" */
  detail: string;
  /** Evaluated state of this condition for the latest run. */
  state: RunState;
  /** If true, condition is mandatory and cannot be disabled in the builder. */
  required?: boolean;
  /** If true, satisfying this condition produces a stored evidence artifact. */
  producesEvidence?: boolean;
}

/** Kinds of evidence the manifest can hold. Drives the icon + grouping. */
export type EvidenceType = "file" | "links" | "deliver" | "log" | "note";

export type ActorKind = "user" | "host_agent" | "system";

export interface Actor {
  kind: ActorKind;
  id: string | null;
}

export type EvidenceProvenance =
  | "self_reported"
  | "runtime_attested"
  | "verified"
  | "rejected";

export type ActionType = "internal" | "external";

export type RuntimeTarget =
  | "hermes"
  | "github-actions"
  | "local-runner"
  | "k8s-cronjob";

export interface RuntimeOption {
  target: RuntimeTarget;
  label: string;
  actor: string;
  runtime: string;
  originAgent: string;
  requiredCapabilities: string[];
}

export interface DomainEvent {
  id: string;
  ts: string;
  actor: Actor;
  resource: string;
  action: string;
  target_id: string;
  outcome: string;
  details?: Record<string, unknown>;
}

/** One line item in the Evidence Manifest — a piece of proof that work happened. */
export interface EvidenceItem {
  type: EvidenceType;
  /** Display label, e.g. "summary.pdf" or "3 source links" */
  label: string;
  /** Secondary detail, e.g. "182 KB · generated 09:01:04" */
  meta: string;
  /** Short status/reference token shown at the row end, e.g. "receipt ✓", "1 unverified" */
  ref: string;
  /** When true, render the row in a warning treatment (incomplete/failed proof). */
  warn?: boolean;
  /** Optional resolvable location (URI, deep link, storage path). */
  href?: string;
  /** Stable source reference for ledger display. */
  sourceRef: string;
  /** Short content hash or manifest hash. */
  hash: string;
  /** ISO capture time from the event/evidence source. */
  capturedAt: string;
  /** Trust ladder value from ADR-0005. */
  provenance: EvidenceProvenance;
}

/** Per-run record. The dashboard shows the latest run; history is a list of these. */
export interface Run {
  id: string; // "run_8f2a91c"
  state: RunState;
  startedAt: string; // ISO 8601
  finishedAt?: string; // ISO 8601 (absent if running/failed-timeout)
  durationLabel: string; // "4.2s" | "—"
  exitCode?: number; // 0 | 124 | …
  errorType?: string; // "UpstreamTimeout" (failed runs only)
  summary: string; // one-paragraph plain-language outcome
  donePolicy: DoneCondition[];
  evidence: EvidenceItem[];
  /** Actor that attempted or performed the run. */
  actor: Actor;
  /** ADR-0006-shaped event backing the run state shown in demo UI. */
  provenanceEvent: DomainEvent;
  /** CLI command a user can run to re-verify this run from source. */
  readbackCommand: string; // "mycron verify run_8f2a91c --evidence"
  costLabel?: string; // "$0.04" | "—"
}

/** The agent + runtime a Cronlet delegates to. */
export interface AgentBinding {
  agent: string; // "FinAgent"
  runtime: string; // "Hermes Cloud" | "Local runner" | "K8s CronJob" | …
}

/** A Cronlet: a delegated, verifiable recurring agent operation. */
export interface Cronlet {
  id: string;
  name: string;
  action_type: ActionType;
  /** Icon key resolved by the host's icon set (see ICON_KEYS in design tokens). */
  icon: string;
  /** Plain-language description of what the Cronlet should accomplish. */
  intent: string;
  binding: AgentBinding;

  // ---- schedule ----
  scheduleLabel: string; // "Every weekday · 09:00"
  cron: string; // "0 9 * * 1-5"
  timezone: string; // IANA tz, e.g. "Asia/Seoul"
  nextRunLabel: string; // "Tomorrow · 09:00 KST" | "Overdue · expected 9 days ago"
  lastRunLabel: string; // "Today · 09:01 KST"
  lastSuccessLabel?: string; // shown in triage for failed/stale

  // ---- rolled-up health ----
  /** Current resolved state (mirrors latestRun.state; denormalized for list views). */
  state: RunState;
  /** Last 7 runs, Mon→Sun. `null` = no run that day. Drives the health heatmap. */
  health: (RunState | null)[];
  /** 0..1 — verified runs over the trailing window (30d). */
  verifiedRate: number;
  /** Aggregate cost label for the trailing window. */
  costLabel?: string;

  /** Most recent run with full proof detail. */
  latestRun: Run;
  /** ADR-0006-shaped provenance events for the Control Surface. */
  createdEvent: DomainEvent;
  lastEditedEvent: DomainEvent;
  approvalEvent?: DomainEvent;
}

/** A captured, not-yet-formalized request in the Inbox. */
export interface InboxRequest {
  id: string;
  /** Raw user/agent phrasing, e.g. "every morning check if my staging deploy is healthy". */
  text: string;
  /** Where it was captured, e.g. "Claude Code" | "Telegram" | "Obsidian". */
  source: string;
  /** Relative capture time, e.g. "2h ago". */
  capturedLabel: string;
  parsedContract: {
    scheduleLabel: string;
    actor: string;
    runtime: string;
    action_type: ActionType;
    evidence: EvidenceType[];
    approvalRequired: boolean;
  };
}

/** Weekly Review roll-up. All values are facts, never vanity metrics. */
export interface WeeklyReview {
  rangeLabel: string; // "Jun 2 – Jun 8"
  verifiedRuns: number;
  totalRuns: number;
  previousVerifiedRuns: number;
  failed: number;
  stale: number;
  unverified: number;
  costLabel: string; // "$0.41"
  corrections: UserCorrection[];
  suggestions: ImprovementSuggestion[];
}

export interface UserCorrection {
  id: string;
  title: string; // "Confirmed Portfolio Brief output"
  detail: string; // "Tue · marked goal satisfied"
  state: RunState;
}

/** A concrete, data-derived improvement drawn from the week's runs. */
export interface ImprovementSuggestion {
  id: string;
  /** Which run state this addresses — drives the accent color/icon. */
  state: RunState;
  iconKey: string;
  title: string;
  body: string;
  /** Label for the primary action button, e.g. "Apply fix" | "Re-arm". */
  actionLabel: string;
  /** Optional id of the Cronlet this suggestion targets. */
  cronletId?: string;
}

// ---- Account surface ----
export interface AccountProfile {
  id: string;
  name: string;
  email: string;
  plan: string;
  avatarInitials?: string;
}

export interface ComputeBudget {
  usedLabel: string;
  limitLabel: string;
  usedFraction: number;
  cronlets: number;
  runsPerWeek: number;
  renewsLabel: string;
}

export interface AlertPreference {
  key: string;
  label: string;
  detail?: string;
  enabled: boolean;
}

// ---- Builder staged input (create/edit flow) ----
export interface DonePolicyStagedInput {
  ran: boolean; // required: process completes cleanly
  sources: boolean; // all required sources reached
  output: boolean; // output artifact generated
  evidence: boolean; // evidence captured & linked
  goal: boolean; // user goal confirmed (read-back)
  noDrift: boolean; // no silent schedule drift
}

export interface CronletStagedInput {
  name: string;
  intent: string;
  scheduleLabel: string;
  cron: string;
  timezone: string;
  actor: string;
  runtimeTarget: RuntimeTarget | "";
  runtimeLabel: string;
  originAgent: string;
  action_type: ActionType;
  client_ref: string;
  requiredCapabilities: string[];
  deliverTo: string; // "MyCron Inbox + Telegram"
  donePolicy: DonePolicyStagedInput;
  /** Derived from donePolicy; not user-set directly. */
  requiredEvidence: EvidenceType[];
  /** Set when promoted from an InboxRequest. */
  seededFromInboxId?: string;
}
