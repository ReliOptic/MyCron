import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  deriveRequiredEvidence,
  useCronletActions,
} from "@contract/data/hooks";
import type {
  CronletDraft,
  DonePolicyDraft,
  EvidenceType,
} from "@contract/types/mycron";
import type { CopyKey } from "../i18n/copy";
import { useAppCopy, useNotice } from "../shell/context";
import { Inbox } from "../shell/icons";
import { demoSearch, PageHead } from "../shell/primitives";

const policyRows: {
  key: keyof DonePolicyDraft;
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

export function BuilderSurface() {
  const { tc } = useAppCopy();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const actions = useCronletActions();
  const { showNotice } = useNotice();
  const [draft, setDraft] = useState<CronletDraft>(() => blankDraft());
  const [preview, setPreview] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const seed = params.get("seed");
  useEffect(() => {
    if (seed)
      actions
        .promoteInbox(seed)
        .then(setDraft)
        .catch((e) => setError((e as Error).message));
  }, [seed]);
  useEffect(() => {
    actions
      .previewSchedule(draft.cron, draft.timezone, 4)
      .then(setPreview)
      .catch(() => setPreview([]));
  }, [draft.cron, draft.timezone]);
  const evidence = deriveRequiredEvidence(draft.donePolicy);
  const set = <K extends keyof CronletDraft>(key: K, value: CronletDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const setPolicy = (key: keyof DonePolicyDraft) =>
    setDraft((d) => ({
      ...d,
      donePolicy: {
        ...d.donePolicy,
        [key]: key === "ran" ? true : !d.donePolicy[key],
      },
      requiredEvidence: deriveRequiredEvidence({
        ...d.donePolicy,
        [key]: key === "ran" ? true : !d.donePolicy[key],
      }),
    }));
  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const c = await actions.create({ ...draft, requiredEvidence: evidence });
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
      {draft.seededFromInboxId && (
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
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder={tc("builder.namePlaceholder")}
              />
            </div>
            <div className="field" style={{ marginTop: 12 }}>
              <label>{tc("builder.intent")}</label>
              <textarea
                className="textarea"
                value={draft.intent}
                onChange={(e) => set("intent", e.target.value)}
                placeholder={tc("builder.intentPlaceholder")}
              />
            </div>
            <div className="form-grid" style={{ marginTop: 12 }}>
              <div className="field">
                <label>{tc("builder.when")}</label>
                <select
                  className="select"
                  value={draft.scheduleLabel}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraft((d) => ({
                      ...d,
                      scheduleLabel: v,
                      cron: v.startsWith("Mondays")
                        ? "0 9 * * 1"
                        : v.startsWith("Daily")
                          ? "0 9 * * *"
                          : "0 8 * * 1-5",
                    }));
                  }}
                >
                  <option value="">{tc("builder.chooseSchedule")}</option>
                  <option>Every weekday · 08:00</option>
                  <option>Daily · 09:00</option>
                  <option>Mondays · 09:00</option>
                </select>
                <span className="mono">{draft.cron || "cron preview"}</span>
              </div>
              <div className="field">
                <label>{tc("builder.timezone")}</label>
                <input
                  className="input"
                  value={draft.timezone}
                  onChange={(e) => set("timezone", e.target.value)}
                />
              </div>
              <div className="field">
                <label>{tc("builder.agentRuntime")}</label>
                <input
                  className="input"
                  value={draft.agent}
                  onChange={(e) => set("agent", e.target.value)}
                  placeholder="OpsAgent"
                />
              </div>
              <div className="field">
                <label>{tc("builder.deliverTo")}</label>
                <input
                  className="input"
                  value={draft.deliverTo}
                  onChange={(e) => set("deliverTo", e.target.value)}
                  placeholder="MyCron Inbox"
                />
              </div>
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
                  className={`toggle ${draft.donePolicy[p.key] ? "on" : ""}`}
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
                evidence.map((e) => (
                  <span key={e} className="chip">
                    {evidenceLabel(e)}
                  </span>
                ))
              ) : (
                <span className="muted">{tc("builder.noEvidence")}</span>
              )}
            </div>
          </div>
        </section>
        <aside className="list">
          <div className="terminal">{manifest(draft, evidence)}</div>
          <div className="card">
            <div className="card-pad">
              <b>
                {tc("builder.nextRuns")} · {draft.timezone || "timezone"}
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
                disabled={saving}
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

function blankDraft(): CronletDraft {
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
    agent: "",
    deliverTo: "",
    donePolicy,
    requiredEvidence: deriveRequiredEvidence(donePolicy),
  };
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
function manifest(d: CronletDraft, evidence: EvidenceType[]) {
  return `name: ${JSON.stringify(d.name || "")}
intent: ${JSON.stringify(d.intent || "")}
schedule:
  cron: ${JSON.stringify(d.cron || "")}
  tz: ${JSON.stringify(d.timezone || "")}
agent: ${JSON.stringify(d.agent || "")}
deliver: ${JSON.stringify(d.deliverTo || "")}
done_policy:
  ran: ${d.donePolicy.ran}
  sources: ${d.donePolicy.sources}
  output: ${d.donePolicy.output}
  evidence: ${d.donePolicy.evidence}
  goal: ${d.donePolicy.goal}
  no_drift: ${d.donePolicy.noDrift}
evidence: [${evidence.map((x) => JSON.stringify(x)).join(", ")}]`;
}
