import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "@contract/components/primitives";
import { useCronlet, useCronletActions } from "@contract/data/hooks";
import type { Actor, Cronlet, DomainEvent } from "@contract/types/mycron";
import { useAppCopy, useNotice } from "../shell/context";
import { ChevronLeft, Copy, Icon } from "../shell/icons";
import {
  demoSearch,
  Fact,
  PageHead,
  pct,
  Skeleton,
  StateDot,
  Status,
  statusCopyKey,
} from "../shell/primitives";

type PendingAction = "retry" | "rearm" | "notify" | null;

export function CronletDetailSurface() {
  const { id } = useParams();
  const { data: c, loading, error } = useCronlet(id ?? null);
  const actions = useCronletActions();
  const { showNotice } = useNotice();
  const { tc } = useAppCopy();
  const [copied, setCopied] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  if (loading) return <Skeleton title="Loading" />;
  if (error || !c)
    return (
      <EmptyState
        title={tc("detail.notFound")}
        hint={error?.message ?? tc("detail.notFoundHint")}
      />
    );
  const cronlet = c;
  const run = cronlet.latestRun;
  const met = run.donePolicy.filter((d) => d.state === "verified").length;
  const total = run.donePolicy.length;
  async function copyReadback() {
    await navigator.clipboard
      ?.writeText(run.readbackCommand)
      .catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }
  async function confirmPending() {
    if (!pendingAction) return;
    if (pendingAction === "retry") {
      await actions.retryRun(run.id);
      showNotice(tc("notice.retryTitle"), tc("notice.retryDetail"));
    }
    if (pendingAction === "rearm") {
      await actions.rearm(cronlet.id);
      showNotice(tc("notice.rearmTitle"), tc("notice.rearmDetail"));
    }
    if (pendingAction === "notify") {
      await actions.notify(run.id);
      showNotice(tc("notice.notifyTitle"), tc("notice.notifyDetail"));
    }
    setPendingAction(null);
  }
  return (
    <>
      <Link
        to={`/${demoSearch()}`}
        className="ghost-btn"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 18,
        }}
      >
        <ChevronLeft size={16} /> {tc("detail.back")}
      </Link>
      <PageHead
        eyebrow={tc("detail.eyebrow")}
        title={c.name}
        sub={c.intent}
        action={<Status state={c.state} />}
      />
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(4,minmax(0,1fr))",
          marginBottom: 18,
        }}
      >
        <Fact
          label={tc("detail.agent")}
          value={`${c.binding.agent} · ${c.binding.runtime}`}
        />
        <Fact
          label={tc("detail.schedule")}
          value={`${c.scheduleLabel} · ${c.timezone}`}
        />
        <Fact label={tc("detail.nextRun")} value={c.nextRunLabel} />
        <Fact
          label={tc("detail.verifiedRate")}
          value={`${pct(c.verifiedRate)}`}
        />
      </div>
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(4,minmax(0,1fr))",
          marginBottom: 18,
        }}
      >
        <Fact
          label={tc("detail.createdBy")}
          value={formatEvent(c.createdEvent)}
        />
        <Fact
          label={tc("detail.lastEditedBy")}
          value={formatEvent(c.lastEditedEvent)}
        />
        <Fact label={tc("detail.runActor")} value={formatActor(run.actor)} />
        <Fact
          label={tc("detail.approvalActor")}
          value={
            c.approvalEvent ? formatEvent(c.approvalEvent) : "requires user"
          }
        />
      </div>
      {(c.state === "failed" || c.state === "stale") && (
        <div
          className="card card-pad"
          style={{
            background:
              c.state === "failed" ? "var(--bad-bg)" : "var(--stale-bg)",
            borderColor:
              c.state === "failed" ? "var(--bad-line)" : "var(--stale-line)",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <b>
                {c.state === "failed"
                  ? tc("detail.failedTitle")
                  : tc("detail.staleTitle")}
              </b>
              <p className="page-sub" style={{ margin: "6px 0 0" }}>
                {run.summary} {run.errorType ? `Error: ${run.errorType}.` : ""}
              </p>
              <span className="mono">
                {tc("detail.lastVerified")}: {c.lastSuccessLabel ?? "—"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="primary-btn"
                onClick={() => setPendingAction("retry")}
              >
                {tc("action.retry")}
              </button>
              <button
                className="ghost-btn"
                onClick={() =>
                  setPendingAction(c.state === "stale" ? "rearm" : "notify")
                }
              >
                {c.state === "stale" ? tc("action.rearm") : tc("action.notify")}
              </button>
            </div>
          </div>
          {pendingAction && (
            <ConfirmationDrawer
              action={pendingAction}
              c={c}
              onCancel={() => setPendingAction(null)}
              onConfirm={confirmPending}
            />
          )}
        </div>
      )}
      <div className="grid two-col">
        <section className="card">
          <div
            className="card-pad"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <b>{tc("detail.donePolicy")}</b>
            <span className="mono">
              {tc("detail.conditionsMet", { met, total })}
            </span>
          </div>
          <div className="progress" style={{ margin: "0 16px 10px" }}>
            <span
              style={{
                width: `${(met / total) * 100}%`,
                background:
                  c.state === "verified" ? "var(--ok-dot)" : "var(--bad-dot)",
              }}
            />
          </div>
          {run.donePolicy.map((d) => (
            <div className="policy-row" key={d.id}>
              <StateDot state={d.state} />
              <div className="grow">
                <b>{d.label}</b>{" "}
                {d.required && <span className="mono"> REQUIRED</span>}{" "}
                {d.producesEvidence && (
                  <span className="mono" style={{ color: "var(--green)" }}>
                    {" "}
                    EVIDENCE
                  </span>
                )}
                <br />
                <span className="muted">{d.detail}</span>
              </div>
              <Status state={d.state} />
            </div>
          ))}
        </section>
        <section className="card">
          <div className="card-pad" style={{ textAlign: "center" }}>
            <div className={`seal ${run.state}`}>
              <Icon
                name={
                  run.state === "verified"
                    ? "shieldChk"
                    : run.state === "failed"
                      ? "alert"
                      : "shield"
                }
                size={34}
              />
            </div>
            <div className="eyebrow" style={{ marginTop: 8 }}>
              {tc(statusCopyKey(run.state))}
            </div>
            <p className="page-sub" style={{ margin: "8px auto 0" }}>
              {run.summary}
            </p>
            <p className="mono" style={{ marginBottom: 0 }}>
              {tc("detail.runCost")}: {run.costLabel ?? "—"}
            </p>
          </div>
          <div className="card-pad" style={{ paddingBottom: 0 }}>
            <b>{tc("detail.evidenceLedger")}</b>
          </div>
          {run.evidence.map((e) => (
            <div className="evidence-row" key={`${e.type}-${e.label}`}>
              <span className="iconbox" style={{ width: 34, height: 34 }}>
                <Icon
                  name={
                    e.type === "file"
                      ? "fileText"
                      : e.type === "links"
                        ? "link"
                        : e.type === "deliver"
                          ? "send"
                          : "terminal"
                  }
                />
              </span>
              <div className="grow">
                <b>{e.label}</b>
                <br />
                <span className="muted">{e.meta}</span>
                <br />
                <span className="mono">
                  {tc("detail.sourceRef")}: {e.sourceRef}
                </span>
                <br className="desktop-ledger-fields" />
                <span className="mono desktop-ledger-fields">
                  {tc("detail.hash")}: {e.hash} · {tc("detail.captured")}:{" "}
                  {e.capturedAt}
                </span>
              </div>
              <span
                className="mono"
                style={{ color: e.warn ? "var(--bad)" : "var(--green)" }}
              >
                {e.provenance}
              </span>
            </div>
          ))}
          <div className="card-pad">
            <button
              className="ghost-btn"
              onClick={copyReadback}
              style={{ float: "right", marginBottom: 8 }}
            >
              <Copy size={14} />{" "}
              {copied ? tc("action.copied") : tc("action.copy")}
            </button>
            <div className="terminal">{run.readbackCommand}</div>
          </div>
        </section>
      </div>
    </>
  );
}

function ConfirmationDrawer({
  action,
  c,
  onCancel,
  onConfirm,
}: {
  action: Exclude<PendingAction, null>;
  c: Cronlet;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { tc } = useAppCopy();
  const title =
    action === "retry"
      ? tc("detail.retryConfirmTitle")
      : action === "rearm"
        ? tc("detail.rearmConfirmTitle")
        : tc("detail.notifyConfirmTitle");
  return (
    <div
      className="card card-pad"
      style={{ marginTop: 14, background: "var(--surface)" }}
    >
      <b>{title}</b>
      <p className="mono">
        {tc("detail.confirmScope", {
          target: action === "rearm" ? c.id : c.latestRun.id,
        })}
      </p>
      <p className="mono">
        {tc("detail.confirmCost", { cost: c.latestRun.costLabel ?? "—" })}
      </p>
      <p className="muted">
        {c.action_type === "external"
          ? tc("detail.confirmApproval")
          : tc("detail.confirmDemo")}
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="primary-btn" onClick={onConfirm} type="button">
          {tc("action.confirmPreview")}
        </button>
        <button className="ghost-btn" onClick={onCancel} type="button">
          {tc("action.cancel")}
        </button>
      </div>
    </div>
  );
}

function formatActor(actor: Actor): string {
  return `${actor.kind}${actor.id ? ` · ${actor.id}` : ""}`;
}

function formatEvent(event: DomainEvent): string {
  return `${formatActor(event.actor)} · ${event.ts} · ${event.outcome}`;
}
