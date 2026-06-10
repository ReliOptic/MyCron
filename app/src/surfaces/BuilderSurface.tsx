import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  deriveRequiredEvidence,
  useCronletActions,
  useCronlets,
} from "@contract/data/hooks";
import { runtimeOptionFor, runtimeOptions } from "@contract/data/runtimeOptions";
import type {
  ActionType,
  CronletStagedInput,
  DonePolicyStagedInput,
  EvidenceType,
  RuntimeTarget,
} from "@contract/types/mycron";
import type { CopyKey } from "../i18n/copy";
import { useAppCopy, useNotice } from "../shell/context";
import { Inbox } from "../shell/icons";
import { demoSearch, PageHead } from "../shell/primitives";
import {
  blankSchedule,
  deriveSchedule,
  findScheduleContext,
  getTimelineModel,
  scheduleFromInput,
  weekdayOptions,
  type IntervalUnit,
  type ScheduleConfig,
  type ScheduleMode,
} from "./scheduleTimeline";

const policyRows: {
  key: keyof DonePolicyStagedInput;
  labelKey: CopyKey;
  detailKey: CopyKey;
  evidence?: boolean;
}[] = [
  {
    key: "ran",
    labelKey: "policy.ran",
    detailKey: "policy.ranDetail",
    evidence: true,
  },
  {
    key: "sources",
    labelKey: "policy.sources",
    detailKey: "policy.sourcesDetail",
    evidence: true,
  },
  {
    key: "output",
    labelKey: "policy.output",
    detailKey: "policy.outputDetail",
    evidence: true,
  },
  {
    key: "evidence",
    labelKey: "policy.evidence",
    detailKey: "policy.evidenceDetail",
    evidence: true,
  },
  { key: "goal", labelKey: "policy.goal", detailKey: "policy.goalDetail" },
  {
    key: "noDrift",
    labelKey: "policy.noDrift",
    detailKey: "policy.noDriftDetail",
  },
];

const repeatModes: { mode: ScheduleMode; key: CopyKey }[] = [
  { mode: "weekday", key: "builder.repeatWeekday" },
  { mode: "daily", key: "builder.repeatDaily" },
  { mode: "weekly", key: "builder.repeatWeekly" },
  { mode: "interval", key: "builder.repeatInterval" },
  { mode: "custom", key: "builder.repeatCustom" },
];

const quickTimes = ["06:00", "08:00", "09:00", "12:00", "14:00", "18:00"];
const timelineReference = new Date("2026-06-08T00:00:00+09:00");

export function BuilderSurface() {
  const { tc } = useAppCopy();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const actions = useCronletActions();
  const { data: existingCronlets } = useCronlets();
  const { showNotice } = useNotice();
  const [input, setInput] = useState<CronletStagedInput>(() => blankInput());
  const [schedule, setSchedule] = useState<ScheduleConfig>(() =>
    blankSchedule(),
  );
  const [preview, setPreview] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const seed = params.get("seed");

  useEffect(() => {
    if (seed)
      actions
        .promoteInbox(seed)
        .then((staged) => {
          setInput(staged);
          setSchedule(scheduleFromInput(staged));
        })
        .catch((e) => setError((e as Error).message));
  }, [seed]);

  useEffect(() => {
    actions
      .previewSchedule(input.cron, input.timezone, 4)
      .then(setPreview)
      .catch(() => setPreview([]));
  }, [input.cron, input.timezone]);

  const evidence = deriveRequiredEvidence(input.donePolicy);
  const validation = validateInput(input);
  const canCreate = Object.keys(validation).length === 0 && !saving;
  const cronlets = existingCronlets ?? [];
  const scheduleContext = useMemo(
    () => findScheduleContext(input.cron, cronlets),
    [input.cron, cronlets],
  );
  const timeline = useMemo(
    () => getTimelineModel(cronlets, input.cron, timelineReference),
    [cronlets, input.cron],
  );
  const artifact = useMemo(
    () => makeArtifact(input, evidence),
    [input, evidence],
  );

  const set = <K extends keyof CronletStagedInput>(
    key: K,
    value: CronletStagedInput[K],
  ) => setInput((current) => ({ ...current, [key]: value }));

  const setName = (name: string) =>
    setInput((current) => ({
      ...current,
      name,
      client_ref: clientRef(current.originAgent, name),
    }));

  const setRuntime = (target: RuntimeTarget | "") => {
    const option = runtimeOptionFor(target);
    setInput((current) => ({
      ...current,
      runtimeTarget: target,
      actor: option?.actor ?? "",
      runtimeLabel: option?.runtime ?? "",
      originAgent: option?.originAgent ?? "",
      requiredCapabilities: option?.requiredCapabilities ?? [],
      client_ref: clientRef(option?.originAgent ?? "", current.name),
    }));
  };

  const applySchedule = (next: ScheduleConfig) => {
    const derived = deriveSchedule(next);
    setSchedule(next);
    setInput((current) => ({
      ...current,
      scheduleLabel: derived.label,
      cron: derived.cron,
    }));
  };

  const setPolicy = (key: keyof DonePolicyStagedInput) =>
    setInput((current) => {
      const nextPolicy = {
        ...current.donePolicy,
        [key]: key === "ran" ? true : !current.donePolicy[key],
      };
      return {
        ...current,
        donePolicy: nextPolicy,
        requiredEvidence: deriveRequiredEvidence(nextPolicy),
      };
    });

  async function copyArtifact() {
    await navigator.clipboard?.writeText(artifact).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  async function submit() {
    const problems = validateInput(input);
    if (Object.keys(problems).length > 0) {
      setError(tc("builder.validationSummary"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const c = await actions.create({ ...input, requiredEvidence: evidence });
      showNotice(tc("notice.createdTitle"), tc("notice.createdDetail"));
      navigate(`/cronlets/${c.id}${demoSearch()}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHead
        eyebrow={tc("builder.eyebrow")}
        title={tc("builder.title")}
        sub={tc("builder.summary")}
      />
      {input.seededFromInboxId && (
        <div
          className="card card-pad"
          style={{
            background: "var(--mint)",
            borderColor: "var(--mint-line)",
            marginBottom: 16,
          }}
        >
          <Inbox size={16} /> {tc("builder.fromInbox")}
        </div>
      )}
      {error && (
        <div
          className="card card-pad"
          style={{
            background: "var(--bad-bg)",
            borderColor: "var(--bad-line)",
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <HumanSummary
        schedule={input.scheduleLabel}
        timezone={input.timezone}
        runtime={input.runtimeLabel}
        actor={input.actor}
        evidence={evidence}
        overlaps={scheduleContext}
      />

      <div className="grid two-col">
        <section className="list">
          <section className="card card-pad builder-section">
            <div className="section-kicker">1 · {tc("builder.sectionWhen")}</div>
            <RepeatPills
              mode={schedule.mode}
              onChange={(mode) => applySchedule({ ...schedule, mode })}
            />
            <ScheduleControls schedule={schedule} applySchedule={applySchedule} />
            <div className="schedule-output">
              <b>{tc("builder.when")}</b>
              <span className="mono">
                {input.scheduleLabel || tc("builder.chooseSchedule")}
              </span>
              <span className="mono">{input.cron || "cron preview"}</span>
              {validation.schedule && (
                <span className="field-error">{validation.schedule}</span>
              )}
            </div>
            <div className="field" style={{ marginTop: 12 }}>
              <label>{tc("builder.timezone")}</label>
              <input
                className="input"
                value={input.timezone}
                onChange={(e) => set("timezone", e.target.value)}
              />
            </div>
            <ScheduleTimeline timeline={timeline} />
            <ScheduleContext
              items={scheduleContext}
              totalCount={cronlets.length}
              hasCron={Boolean(input.cron)}
            />
          </section>

          <section className="card card-pad builder-section">
            <div className="section-kicker">2 · {tc("builder.sectionWho")}</div>
            <div className="form-grid">
              <div className="field">
                <label>{tc("builder.agentRuntime")}</label>
                <select
                  className="select"
                  aria-label={tc("builder.agentRuntime")}
                  value={input.runtimeTarget}
                  onChange={(e) =>
                    setRuntime(e.target.value as RuntimeTarget | "")
                  }
                >
                  <option value="">{tc("builder.chooseRuntime")}</option>
                  {runtimeOptions.map((option) => (
                    <option value={option.target} key={option.target}>
                      {option.label} · {option.runtime}
                    </option>
                  ))}
                </select>
                {input.actor && <span className="mono">{input.actor}</span>}
                {validation.actor && (
                  <span className="field-error">{validation.actor}</span>
                )}
              </div>
              <div className="field">
                <label>{tc("builder.actionType")}</label>
                <select
                  className="select"
                  value={input.action_type}
                  onChange={(e) =>
                    set("action_type", e.target.value as ActionType)
                  }
                >
                  <option value="internal">internal</option>
                  <option value="external">external</option>
                </select>
                <span className="mono">
                  {input.action_type === "external"
                    ? tc("builder.externalApproval")
                    : tc("builder.internalAction")}
                </span>
              </div>
            </div>
            <div className="chips" style={{ marginTop: 14 }}>
              {input.requiredCapabilities.length ? (
                input.requiredCapabilities.map((capability) => (
                  <span key={capability} className="chip">
                    {capability}
                  </span>
                ))
              ) : (
                <span className="muted">{tc("builder.noCapabilities")}</span>
              )}
            </div>
            <p className="muted">{tc("builder.capabilitiesHint")}</p>
          </section>

          <section className="card card-pad builder-section">
            <div className="section-kicker">3 · {tc("builder.sectionWhat")}</div>
            <div className="field">
              <label>{tc("builder.name")}</label>
              <input
                className="input"
                value={input.name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tc("builder.namePlaceholder")}
              />
              {validation.name && (
                <span className="field-error">{validation.name}</span>
              )}
            </div>
            <div className="field" style={{ marginTop: 12 }}>
              <label>{tc("builder.intent")}</label>
              <textarea
                className="textarea"
                value={input.intent}
                onChange={(e) => set("intent", e.target.value)}
                placeholder={tc("builder.intentPlaceholder")}
              />
              {validation.intent && (
                <span className="field-error">{validation.intent}</span>
              )}
            </div>
            <div className="field" style={{ marginTop: 12 }}>
              <label>{tc("builder.deliverTo")}</label>
              <input
                className="input"
                value={input.deliverTo}
                onChange={(e) => set("deliverTo", e.target.value)}
                placeholder="MyCron Inbox"
              />
            </div>
          </section>

          <section className="card builder-section">
            <div className="card-pad">
              <div className="section-kicker">4 · {tc("builder.sectionEvidence")}</div>
              <p className="muted">{tc("builder.donePolicyHint")}</p>
            </div>
            {policyRows.map((p) => (
              <div className="policy-row" key={p.key}>
                <button
                  className={`toggle ${input.donePolicy[p.key] ? "on" : ""}`}
                  onClick={() => setPolicy(p.key)}
                  disabled={p.key === "ran"}
                  type="button"
                >
                  <span />
                </button>
                <div>
                  <b>{tc(p.labelKey)}</b>{" "}
                  {p.key === "ran" && (
                    <span className="mono"> {tc("meta.required")}</span>
                  )}{" "}
                  {p.evidence && (
                    <span className="mono" style={{ color: "var(--green)" }}>
                      {" "}
                      {tc("meta.evidence")}
                    </span>
                  )}
                  <br />
                  <span className="muted">{tc(p.detailKey)}</span>
                </div>
              </div>
            ))}
            <div className="card-pad">
              <h3>{tc("builder.evidenceRequirements")}</h3>
              <div className="chips">
                {evidence.length ? (
                  evidence.map((item) => (
                    <span key={item} className="chip">
                      {evidenceLabel(item)}
                    </span>
                  ))
                ) : (
                  <span className="muted">{tc("builder.noEvidence")}</span>
                )}
              </div>
            </div>
          </section>
        </section>

        <aside className="list">
          <div className="card card-pad">
            <button
              className="ghost-btn"
              onClick={() => setContractOpen((open) => !open)}
              type="button"
              aria-expanded={contractOpen}
            >
              {contractOpen ? tc("builder.hideContract") : tc("builder.viewContract")}
            </button>
            <p className="muted">{tc("builder.mcHint")}</p>
            {contractOpen && (
              <>
                <div className="builder-preview-head">
                  <b>{tc("builder.mcPreview")}</b>
                  <button
                    className="ghost-btn"
                    onClick={copyArtifact}
                    type="button"
                  >
                    {copied ? tc("action.copied") : tc("action.copy")}
                  </button>
                </div>
                <div className="terminal">{artifact}</div>
                <p className="mono" style={{ marginBottom: 0 }}>
                  mycron cronlet create --file {artifactFileName(input)} --dry-run --json
                </p>
              </>
            )}
          </div>
          <div className="card">
            <div className="card-pad">
              <b>
                {tc("builder.nextRuns")} · {input.timezone || "timezone"}
              </b>
            </div>
            {preview.length ? (
              preview.map((p, i) => (
                <div className="policy-row" key={p}>
                  <span className="mono">{i + 1}</span>
                  <span>{p}</span>
                </div>
              ))
            ) : (
              <div className="card-pad muted">
                {tc("builder.schedulePreview")}
              </div>
            )}
            <div className="card-pad">
              <button
                className="primary-btn"
                onClick={submit}
                disabled={!canCreate}
              >
                {saving ? tc("builder.creating") : tc("action.createCronlet")}
              </button>
              <p className="muted" style={{ textAlign: "center" }}>
                {tc("builder.storageHint")}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function HumanSummary({
  schedule,
  timezone,
  runtime,
  actor,
  evidence,
  overlaps,
}: {
  schedule: string;
  timezone: string;
  runtime: string;
  actor: string;
  evidence: EvidenceType[];
  overlaps: { name: string }[];
}) {
  const { tc } = useAppCopy();
  return (
    <div className="card card-pad human-summary">
      <div className="eyebrow">{tc("builder.humanSummary")}</div>
      <div className="summary-grid">
        <SummaryLine
          label={tc("builder.summarySchedule")}
          value={schedule ? `${schedule} · ${timezone}` : tc("builder.chooseSchedule")}
        />
        <SummaryLine
          label={tc("builder.summaryRuntime")}
          value={runtime || tc("builder.chooseRuntime")}
        />
        <SummaryLine
          label={tc("builder.summaryActor")}
          value={actor || "host_agent:—"}
        />
        <SummaryLine
          label={tc("builder.summaryEvidence")}
          value={evidence.length ? evidence.map(evidenceLabel).join(", ") : "—"}
        />
        <SummaryLine
          label={tc("builder.summaryOverlap")}
          value={overlaps.length ? overlaps.map((item) => item.name).join(", ") : tc("builder.scheduleNoConflict")}
        />
      </div>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="mono">{label}</span>
      <b>{value}</b>
    </div>
  );
}

function RepeatPills({
  mode,
  onChange,
}: {
  mode: ScheduleMode;
  onChange: (mode: ScheduleMode) => void;
}) {
  const { tc } = useAppCopy();
  return (
    <div className="repeat-pills" role="group" aria-label={tc("builder.repeat")}>
      {repeatModes.map((item) => (
        <button
          key={item.mode}
          className={`repeat-pill ${mode === item.mode ? "active" : ""}`}
          onClick={() => onChange(item.mode)}
          aria-pressed={mode === item.mode}
          type="button"
        >
          {tc(item.key)}
        </button>
      ))}
    </div>
  );
}

function ScheduleControls({
  schedule,
  applySchedule,
}: {
  schedule: ScheduleConfig;
  applySchedule: (next: ScheduleConfig) => void;
}) {
  const { tc } = useAppCopy();
  return (
    <div className="schedule-controls">
      {schedule.mode !== "interval" && schedule.mode !== "custom" && (
        <div className="field">
          <label>{tc("builder.time")}</label>
          <div className="time-picker" role="group" aria-label={tc("builder.timePicker")}>
            {quickTimes.map((time) => (
              <button
                className={`time-chip ${schedule.time === time ? "active" : ""}`}
                key={time}
                onClick={() => applySchedule({ ...schedule, time })}
                type="button"
              >
                {time}
              </button>
            ))}
            <input
              className="input custom-time"
              aria-label={tc("builder.time")}
              type="time"
              value={schedule.time}
              onChange={(e) => applySchedule({ ...schedule, time: e.target.value })}
            />
          </div>
        </div>
      )}
      {schedule.mode === "weekly" && (
        <div className="field">
          <label>{tc("builder.weekday")}</label>
          <div className="weekday-picker" role="group" aria-label={tc("builder.weekday")}>
            {weekdayOptions.map((day) => (
              <button
                key={day.value}
                className={`time-chip ${schedule.weekday === day.value ? "active" : ""}`}
                onClick={() => applySchedule({ ...schedule, weekday: day.value })}
                type="button"
              >
                {day.short}
              </button>
            ))}
          </div>
        </div>
      )}
      {schedule.mode === "interval" && (
        <div className="form-grid">
          <div className="field">
            <label>{tc("builder.intervalEvery")}</label>
            <input
              className="input"
              aria-label={tc("builder.intervalEvery")}
              type="number"
              min="1"
              max={schedule.intervalUnit === "minutes" ? "59" : "23"}
              value={schedule.intervalEvery}
              onChange={(e) =>
                applySchedule({ ...schedule, intervalEvery: e.target.value })
              }
            />
          </div>
          <div className="field">
            <label>{tc("builder.intervalUnit")}</label>
            <select
              className="select"
              aria-label={tc("builder.intervalUnit")}
              value={schedule.intervalUnit}
              onChange={(e) =>
                applySchedule({
                  ...schedule,
                  intervalUnit: e.target.value as IntervalUnit,
                })
              }
            >
              <option value="minutes">{tc("builder.minutes")}</option>
              <option value="hours">{tc("builder.hours")}</option>
            </select>
          </div>
        </div>
      )}
      {schedule.mode === "custom" && (
        <div className="field">
          <label>{tc("builder.customCron")}</label>
          <input
            className="input"
            aria-label={tc("builder.customCron")}
            value={schedule.customCron}
            onChange={(e) =>
              applySchedule({ ...schedule, customCron: e.target.value })
            }
            placeholder="*/15 * * * *"
          />
        </div>
      )}
    </div>
  );
}

function ScheduleTimeline({
  timeline,
}: {
  timeline: ReturnType<typeof getTimelineModel>;
}) {
  const { tc } = useAppCopy();
  return (
    <div className="timeline-card">
      <div className="timeline-head">
        <b>{tc("builder.timelineTitle")}</b>
        <span className="mono">{tc("builder.timelineHint")}</span>
      </div>
      {timeline.bands.length > 0 && (
        <div className="timeline-bands">
          {timeline.bands.map((band) => (
            <span
              key={band.id}
              className={`timeline-band ${band.source} ${band.overlap ? "overlap" : ""}`}
            >
              {tc("builder.patternBand")}: {band.label}
            </span>
          ))}
        </div>
      )}
      <div className="week-timeline">
        {timeline.days.map((day, dayIndex) => (
          <div className="timeline-day" key={day}>
            <b>{day}</b>
            <div className="timeline-lane">
              {timeline.markers
                .filter((marker) => marker.dayIndex === dayIndex)
                .map((marker) => (
                  <span
                    key={marker.id}
                    className={`timeline-marker ${marker.source} ${marker.overlap ? "overlap" : ""}`}
                    style={{ top: `${marker.topPct}%` }}
                    title={`${marker.label} · ${formatMinute(marker.minuteOfDay)}`}
                    aria-label={`${marker.label} ${formatMinute(marker.minuteOfDay)}`}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
      <div className="timeline-legend mono">
        <span>{tc("builder.existingFire")}</span>
        <span>{tc("builder.selectedFire")}</span>
      </div>
    </div>
  );
}

function ScheduleContext({
  items,
  totalCount,
  hasCron,
}: {
  items: { id: string; name: string; label: string }[];
  totalCount: number;
  hasCron: boolean;
}) {
  const { tc } = useAppCopy();
  return (
    <div className="schedule-context">
      <div>
        <b>{tc("builder.scheduleContext")}</b>
        <p className="muted" style={{ margin: "4px 0 0" }}>
          {tc("builder.scheduleContextHint", { count: totalCount })}
        </p>
      </div>
      {items.length ? (
        <div className="schedule-context-list">
          {items.map((item) => (
            <span className="chip" key={item.id}>
              {tc("builder.scheduleConflict")}: {item.name} · {item.label}
            </span>
          ))}
        </div>
      ) : (
        <span className="mono">
          {hasCron ? tc("builder.scheduleNoConflict") : tc("builder.scheduleNeedsRuntime")}
        </span>
      )}
    </div>
  );
}

function blankInput(): CronletStagedInput {
  const donePolicy = {
    ran: true,
    sources: true,
    output: true,
    evidence: true,
    goal: false,
    noDrift: false,
  };
  return {
    name: "",
    intent: "",
    scheduleLabel: "",
    cron: "",
    timezone: "Asia/Seoul",
    actor: "",
    runtimeTarget: "",
    runtimeLabel: "",
    originAgent: "",
    action_type: "internal",
    client_ref: "",
    requiredCapabilities: [],
    deliverTo: "",
    donePolicy,
    requiredEvidence: deriveRequiredEvidence(donePolicy),
  };
}

function validateInput(input: CronletStagedInput): Partial<Record<"name" | "intent" | "schedule" | "actor", string>> {
  const errors: Partial<Record<"name" | "intent" | "schedule" | "actor", string>> = {};
  if (!input.name.trim()) errors.name = "Cronlet name is required.";
  if (!input.intent.trim()) errors.intent = "Intent is required.";
  if (!input.cron.trim()) errors.schedule = "Schedule is required.";
  if (!input.actor.trim()) errors.actor = "Actor/runtime is required.";
  return errors;
}

function evidenceLabel(e: EvidenceType) {
  return (
    {
      file: "Output file",
      links: "Source manifest",
      deliver: "Delivery receipt",
      log: "Run log",
      note: "Note",
    } as Record<EvidenceType, string>
  )[e];
}

function clientRef(originAgent: string, name: string) {
  const prefix = slug(originAgent) || "staged";
  const nameSlug = slug(name) || "new-cronlet";
  return `${prefix}:${nameSlug}`;
}

function artifactFileName(input: CronletStagedInput) {
  return `${input.client_ref ? input.client_ref.replace(":", "-") : "cronlet"}.mc`;
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function formatMinute(minuteOfDay: number) {
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function makeArtifact(input: CronletStagedInput, evidence: EvidenceType[]) {
  return JSON.stringify(
    {
      schema: "mycron/v0",
      kind: "Cronlet",
      client_ref: input.client_ref || clientRef(input.originAgent, input.name),
      name: input.name,
      schedule: input.cron,
      timezone: input.timezone,
      action_type: input.action_type,
      args: {
        intent: input.intent,
        runtime_binding: {
          target: input.runtimeTarget || null,
          actor: input.actor || null,
          runtime: input.runtimeLabel || null,
        },
        deliver_to: input.deliverTo,
        done_policy: {
          ran: input.donePolicy.ran,
          sources: input.donePolicy.sources,
          output: input.donePolicy.output,
          evidence: input.donePolicy.evidence,
          goal: input.donePolicy.goal,
          no_drift: input.donePolicy.noDrift,
        },
        required_capabilities: input.requiredCapabilities,
        evidence,
      },
    },
    null,
    2,
  );
}
