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

type ScheduleMode = "weekday" | "daily" | "weekly" | "interval" | "custom";
type IntervalUnit = "minutes" | "hours";

interface ScheduleConfig {
  mode: ScheduleMode;
  time: string;
  weekday: string;
  intervalEvery: string;
  intervalUnit: IntervalUnit;
  customCron: string;
}

const weekdayOptions = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "0", label: "Sunday" },
];

export function BuilderSurface() {
  const { tc } = useAppCopy();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const actions = useCronletActions();
  const { data: existingCronlets } = useCronlets();
  const { showNotice } = useNotice();
  const [input, setInput] = useState<CronletStagedInput>(() => blankInput());
  const [schedule, setSchedule] = useState<ScheduleConfig>(() => blankSchedule());
  const [preview, setPreview] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
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
  const artifact = useMemo(
    () => makeArtifact(input, evidence),
    [input, evidence],
  );
  const scheduleContext = useMemo(
    () => findScheduleContext(input.cron, existingCronlets ?? []),
    [input.cron, existingCronlets],
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
      <div className="grid two-col">
        <section className="list">
          <div className="card card-pad">
            <h3>{tc("builder.intentSchedule")}</h3>
            <div className="field">
              <label>{tc("builder.name")}</label>
              <input
                className="input"
                value={input.name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tc("builder.namePlaceholder")}
              />
              {validation.name && <span className="field-error">{validation.name}</span>}
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
            <div className="form-grid" style={{ marginTop: 12 }}>
              <div className="field">
                <label>{tc("builder.repeat")}</label>
                <select
                  className="select"
                  aria-label={tc("builder.repeat")}
                  value={schedule.mode}
                  onChange={(e) =>
                    applySchedule({
                      ...schedule,
                      mode: e.target.value as ScheduleMode,
                    })
                  }
                >
                  <option value="weekday">{tc("builder.repeatWeekday")}</option>
                  <option value="daily">{tc("builder.repeatDaily")}</option>
                  <option value="weekly">{tc("builder.repeatWeekly")}</option>
                  <option value="interval">{tc("builder.repeatInterval")}</option>
                  <option value="custom">{tc("builder.repeatCustom")}</option>
                </select>
              </div>
              {schedule.mode !== "interval" && schedule.mode !== "custom" && (
                <div className="field">
                  <label>{tc("builder.time")}</label>
                  <input
                    className="input"
                    aria-label={tc("builder.time")}
                    type="time"
                    value={schedule.time}
                    onChange={(e) =>
                      applySchedule({ ...schedule, time: e.target.value })
                    }
                  />
                </div>
              )}
              {schedule.mode === "weekly" && (
                <div className="field">
                  <label>{tc("builder.weekday")}</label>
                  <select
                    className="select"
                    aria-label={tc("builder.weekday")}
                    value={schedule.weekday}
                    onChange={(e) =>
                      applySchedule({ ...schedule, weekday: e.target.value })
                    }
                  >
                    {weekdayOptions.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {schedule.mode === "interval" && (
                <>
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
                        applySchedule({
                          ...schedule,
                          intervalEvery: e.target.value,
                        })
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
                </>
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
              <div className="field schedule-output">
                <label>{tc("builder.when")}</label>
                <span className="mono">{input.scheduleLabel || tc("builder.chooseSchedule")}</span>
                <span className="mono">{input.cron || "cron preview"}</span>
                {validation.schedule && (
                  <span className="field-error">{validation.schedule}</span>
                )}
              </div>
              <div className="schedule-context">
                <div>
                  <b>{tc("builder.scheduleContext")}</b>
                  <p className="muted" style={{ margin: "4px 0 0" }}>
                    {tc("builder.scheduleContextHint", {
                      count: existingCronlets?.length ?? 0,
                    })}
                  </p>
                </div>
                {scheduleContext.length ? (
                  <div className="schedule-context-list">
                    {scheduleContext.map((item) => (
                      <span className="chip" key={item.id}>
                        {tc("builder.scheduleConflict")}: {item.name} · {item.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="mono">
                    {input.cron
                      ? tc("builder.scheduleNoConflict")
                      : tc("builder.scheduleNeedsRuntime")}
                  </span>
                )}
              </div>
              <div className="field">
                <label>{tc("builder.timezone")}</label>
                <input
                  className="input"
                  value={input.timezone}
                  onChange={(e) => set("timezone", e.target.value)}
                />
              </div>
              <div className="field">
                <label>{tc("builder.agentRuntime")}</label>
                <select
                  className="select"
                  aria-label={tc("builder.agentRuntime")}
                  value={input.runtimeTarget}
                  onChange={(e) => setRuntime(e.target.value as RuntimeTarget | "")}
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
                  onChange={(e) => set("action_type", e.target.value as ActionType)}
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
              <div className="field">
                <label>{tc("builder.deliverTo")}</label>
                <input
                  className="input"
                  value={input.deliverTo}
                  onChange={(e) => set("deliverTo", e.target.value)}
                  placeholder="MyCron Inbox"
                />
              </div>
            </div>
          </div>
          <div className="card card-pad">
            <h3>{tc("builder.requiredCapabilities")}</h3>
            <p className="muted">{tc("builder.capabilitiesHint")}</p>
            <div className="chips">
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
          </div>
          <div className="card">
            <div className="card-pad">
              <h3>{tc("detail.donePolicy")}</h3>
              <p className="muted">{tc("builder.donePolicyHint")}</p>
            </div>
            {policyRows.map((p) => (
              <div className="policy-row" key={p.key}>
                <button
                  className={`toggle ${input.donePolicy[p.key] ? "on" : ""}`}
                  onClick={() => setPolicy(p.key)}
                  disabled={p.key === "ran"}
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
          </div>
          <div className="card card-pad">
            <h3>{tc("builder.evidenceRequirements")}</h3>
            <p className="muted">{tc("builder.evidenceHint")}</p>
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
        <aside className="list">
          <div className="card card-pad">
            <div className="builder-preview-head">
              <div>
                <b>{tc("builder.mcPreview")}</b>
                <p className="muted" style={{ margin: "6px 0 0" }}>
                  {tc("builder.mcHint")}
                </p>
              </div>
              <button className="ghost-btn" onClick={copyArtifact} type="button">
                {copied ? tc("action.copied") : tc("action.copy")}
              </button>
            </div>
            <div className="terminal">{artifact}</div>
            <p className="mono" style={{ marginBottom: 0 }}>
              mycron cronlet create --file {artifactFileName(input)} --dry-run --json
            </p>
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

function findScheduleContext(cron: string, cronlets: { id: string; name: string; cron: string; scheduleLabel: string }[]) {
  if (!cron.trim()) return [];
  const selected = parseCron(cron);
  return cronlets
    .map((cronlet) => ({ cronlet, parsed: parseCron(cronlet.cron) }))
    .filter(({ parsed }) => isScheduleOverlap(selected, parsed))
    .slice(0, 4)
    .map(({ cronlet }) => ({
      id: cronlet.id,
      name: cronlet.name,
      label: cronlet.scheduleLabel,
    }));
}

function parseCron(cron: string) {
  const [minute, hour, dayOfMonth, month, dayOfWeek] = cron.trim().split(/\s+/);
  if (!minute || !hour || !dayOfMonth || !month || !dayOfWeek) return null;
  return { minute, hour, dayOfMonth, month, dayOfWeek };
}

function isScheduleOverlap(
  selected: ReturnType<typeof parseCron>,
  existing: ReturnType<typeof parseCron>,
) {
  if (!selected || !existing) return false;
  if (selected.minute === existing.minute && selected.hour === existing.hour) {
    return dayOfWeekOverlap(selected.dayOfWeek, existing.dayOfWeek);
  }
  if (selected.minute.startsWith("*/") || existing.minute.startsWith("*/")) {
    return hourOverlap(selected.hour, existing.hour);
  }
  if (selected.hour.startsWith("*/") || existing.hour.startsWith("*/")) {
    return minuteOverlap(selected.minute, existing.minute);
  }
  return false;
}

function minuteOverlap(a: string, b: string) {
  if (a === "*" || b === "*") return true;
  if (a.startsWith("*/") || b.startsWith("*/")) return true;
  return a === b;
}

function hourOverlap(a: string, b: string) {
  if (a === "*" || b === "*") return true;
  if (a.startsWith("*/") || b.startsWith("*/")) return true;
  return a === b;
}

function dayOfWeekOverlap(a: string, b: string) {
  const left = expandDayOfWeek(a);
  const right = expandDayOfWeek(b);
  return left.some((day) => right.includes(day));
}

function expandDayOfWeek(value: string) {
  if (value === "*" || value === "?") return ["0", "1", "2", "3", "4", "5", "6"];
  if (value.includes("-")) {
    const [start, end] = value.split("-").map(Number);
    if (Number.isInteger(start) && Number.isInteger(end)) {
      return Array.from({ length: end - start + 1 }, (_, index) => String(start + index));
    }
  }
  return value.split(",");
}

function blankSchedule(): ScheduleConfig {
  return {
    mode: "weekday",
    time: "",
    weekday: "1",
    intervalEvery: "1",
    intervalUnit: "hours",
    customCron: "",
  };
}

function scheduleFromInput(input: CronletStagedInput): ScheduleConfig {
  if (input.cron === "0 8 * * 1-5") {
    return { ...blankSchedule(), mode: "weekday", time: "08:00" };
  }
  if (input.cron === "0 9 * * 1") {
    return { ...blankSchedule(), mode: "weekly", time: "09:00", weekday: "1" };
  }
  return { ...blankSchedule(), mode: "custom", customCron: input.cron };
}

function deriveSchedule(config: ScheduleConfig) {
  if (config.mode === "custom") {
    return {
      label: config.customCron.trim() ? `Custom cron · ${config.customCron.trim()}` : "",
      cron: config.customCron.trim(),
    };
  }

  if (config.mode === "interval") {
    const every = Number(config.intervalEvery);
    if (!Number.isInteger(every) || every < 1) return { label: "", cron: "" };
    if (config.intervalUnit === "minutes") {
      if (every > 59) return { label: "", cron: "" };
      return { label: `Every ${every} minute${every === 1 ? "" : "s"}`, cron: `*/${every} * * * *` };
    }
    if (every > 23) return { label: "", cron: "" };
    return { label: `Every ${every} hour${every === 1 ? "" : "s"}`, cron: `0 */${every} * * *` };
  }

  const parsed = parseTime(config.time);
  if (!parsed) return { label: "", cron: "" };
  const { hour, minute } = parsed;
  if (config.mode === "daily") {
    return { label: `Daily · ${config.time}`, cron: `${minute} ${hour} * * *` };
  }
  if (config.mode === "weekly") {
    const day = weekdayOptions.find((option) => option.value === config.weekday) ?? weekdayOptions[0];
    return { label: `${day.label}s · ${config.time}`, cron: `${minute} ${hour} * * ${day.value}` };
  }
  return { label: `Every weekday · ${config.time}`, cron: `${minute} ${hour} * * 1-5` };
}

function parseTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
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
