import type { Cronlet, DomainEvent, Run, RunState } from "@contract/types/mycron";

export type CronletRow = {
  id: string;
  account_id: string;
  client_ref: string;
  name: string | null;
  state: string | null;
  action_type: string | null;
  schedule: string | null;
  timezone: string | null;
  requires_approval: boolean | null;
  external_execution_approved: boolean | null;
  next_run: string | null;
  spec: unknown;
  created_at: string | null;
};

export function mapCronletRow(row: CronletRow): Cronlet {
  const spec = record(row.spec);
  const intent = stringMeta(spec, "intent") || row.name || row.client_ref;
  const cron = row.schedule ?? "";
  const timezone = row.timezone ?? "UTC";
  const external = row.requires_approval === true || row.action_type === "external";
  const baseEvent = event(`aud_${row.id}_loaded`, row.created_at, row.id);
  return {
    id: row.id,
    name: row.name ?? row.client_ref,
    action_type: external ? "external" : "internal",
    icon: external ? "send" : "clock",
    intent,
    binding: {
      agent: row.client_ref.split(":")[0] ?? "host_agent",
      runtime: "Host Agent",
    },
    scheduleLabel: cron ? `${cron} · ${timezone}` : "No schedule",
    cron,
    timezone,
    nextRunLabel: row.next_run ? new Date(row.next_run).toLocaleString() : "Not scheduled",
    lastRunLabel: "No runs yet",
    state: runState(row.state),
    health: [null, null, null, null, null, null, null],
    verifiedRate: 0,
    latestRun: emptyRun(row.id, intent, baseEvent),
    createdEvent: baseEvent,
    lastEditedEvent: baseEvent,
    approvalEvent: external && !row.external_execution_approved
      ? {
          ...baseEvent,
          id: `aud_${row.id}_approval_pending`,
          resource: "approval",
          action: "queue",
          outcome: "pending",
        }
      : undefined,
  };
}

function emptyRun(cronletId: string, summary: string, provenanceEvent: DomainEvent): Run {
  return {
    id: `${cronletId}:no-run`,
    state: "unverified",
    startedAt: provenanceEvent.ts,
    durationLabel: "—",
    summary,
    donePolicy: [],
    evidence: [],
    actor: { kind: "system", id: null },
    provenanceEvent,
    readbackCommand: `mycron run list --cronlet ${cronletId} --json`,
  };
}

function event(id: string, ts: string | null, targetId: string): DomainEvent {
  return {
    id,
    ts: ts ?? new Date(0).toISOString(),
    actor: { kind: "system", id: null },
    resource: "cronlet",
    action: "load",
    target_id: targetId,
    outcome: "matched",
  };
}

function runState(value: string | null): RunState {
  return value === "verified" || value === "failed" || value === "stale"
    ? value
    : "unverified";
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringMeta(value: Record<string, unknown> | undefined, key: string): string {
  const found = value?.[key];
  return typeof found === "string" ? found : "";
}
