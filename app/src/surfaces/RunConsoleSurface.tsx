import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState } from "@contract/components/primitives";
import {
  byTriagePriority,
  countByState,
  STATE_ORDER,
  useCronlets,
  useWeeklyReview,
} from "@contract/data/hooks";
import type { Cronlet, RunState } from "@contract/types/mycron";
import { useAppCopy, useNotice } from "../shell/context";
import { AlertTriangle, ChevronRight, Icon } from "../shell/icons";
import {
  demoSearch,
  Health,
  PageHead,
  Skeleton,
  Status,
  statusCopyKey,
} from "../shell/primitives";

export function RunConsoleSurface() {
  const { tc } = useAppCopy();
  const { showNotice } = useNotice();
  const { data: cronlets, loading, error } = useCronlets();
  const { data: review } = useWeeklyReview();
  const [filter, setFilter] = useState<RunState | null>(null);
  const navigate = useNavigate();
  const list = useMemo(
    () =>
      (cronlets ?? [])
        .filter((c) => !filter || c.state === filter)
        .sort(byTriagePriority),
    [cronlets, filter],
  );
  if (loading) return <Skeleton title="Loading" />;
  if (error)
    return <EmptyState title="Couldn’t load Cronlets" hint={error.message} />;
  if (!cronlets?.length)
    return (
      <>
        <PageHead
          eyebrow={tc("run.eyebrow")}
          title={tc("run.title")}
          sub={tc("run.summary")}
          action={
            <Link to={`/builder${demoSearch()}`}>
              <button className="primary-btn">
                + {tc("action.createCronlet")}
              </button>
            </Link>
          }
        />
        <div className="not-found">
          <EmptyState
            title={tc("run.noCronlets")}
            hint={`${tc("run.valueProp")} ${tc("run.emptyHint")}`}
          />
          <div className="empty-actions">
            <Link to="/?demo=1" className="primary-btn">
              {tc("action.openDemoControlPlane")}
            </Link>
            <button
              type="button"
              className="ghost-btn"
              onClick={() =>
                showNotice(
                  tc("notice.connectTitle"),
                  tc("notice.connectDetail"),
                )
              }
            >
              {tc("action.connectProvider")}
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() =>
                showNotice(tc("notice.importTitle"), tc("notice.importDetail"))
              }
            >
              {tc("action.importCronlet")}
            </button>
          </div>
        </div>
      </>
    );
  const counts = countByState(cronlets);
  return (
    <>
      <PageHead
        eyebrow={tc("run.eyebrow")}
        title={tc("run.title")}
        sub={tc("run.summary")}
        action={
          <Link to={`/builder${demoSearch()}`}>
            <button className="primary-btn">
              <span className="desktop-label">
                + {tc("action.createCronlet")}
              </span>
              <span className="mobile-label">+ {tc("action.new")}</span>
            </button>
          </Link>
        }
      />
      <div className="grid stats" style={{ marginBottom: 18 }}>
        {STATE_ORDER.map((s) => (
          <button
            key={s}
            className="card stat"
            onClick={() => setFilter(filter === s ? null : s)}
            style={{
              textAlign: "left",
              cursor: "pointer",
              borderColor:
                filter === s
                  ? `var(--${s === "failed" ? "bad" : s === "stale" ? "stale" : s === "unverified" ? "unv" : "ok"}-line)`
                  : undefined,
            }}
          >
            <div>
              <Status state={s} />
            </div>
            <div
              className="stat-value"
              style={{
                color: `var(--${s === "failed" ? "bad" : s === "stale" ? "stale" : s === "unverified" ? "unv" : "ok"})`,
              }}
            >
              {String(counts[s]).padStart(2, "0")}
            </div>
            <div className="stat-sub">
              {s === "failed"
                ? tc("status.operatorAction")
                : s === "stale"
                  ? tc("status.scheduleDrift")
                  : s === "unverified"
                    ? tc("status.completedNoProof")
                    : tc("status.proofAttached")}
            </div>
          </button>
        ))}
        <div className="card stat hero-rate">
          <div className="eyebrow">{tc("run.verifiedThisWeek")}</div>
          <div className="stat-value">
            {review?.totalRuns
              ? Math.round((review.verifiedRuns / review.totalRuns) * 100)
              : 0}
            %
          </div>
          <div className="stat-sub">
            {review?.verifiedRuns}/{review?.totalRuns} runs · +3 vs last
          </div>
          <div className="progress">
            <span
              style={{
                width: `${review?.totalRuns ? (review.verifiedRuns / review.totalRuns) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>
      {filter && (
        <button
          className="ghost-btn"
          onClick={() => setFilter(null)}
          style={{ marginBottom: 12 }}
        >
          {tc("run.clearFilter", { status: tc(statusCopyKey(filter)) })}
        </button>
      )}
      <div className="mobile-section-label">
        <AlertTriangle size={14} /> {tc("run.needsReview")}
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>{tc("table.cronlet")}</th>
              <th>{tc("table.actorRuntime")}</th>
              <th>{tc("table.state")}</th>
              <th>{tc("table.evidenceStatus")}</th>
              <th>{tc("table.lastEvidence")}</th>
              <th>{tc("table.nextRun")}</th>
              <th>{tc("table.health")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr
                key={c.id}
                onClick={() => navigate(`/cronlets/${c.id}${demoSearch()}`)}
                style={{ cursor: "pointer" }}
              >
                <td>
                  <CronletIdentity c={c} />
                </td>
                <td>
                  <span className="mono">{c.latestRun.actor.kind}</span>
                  <br />
                  <span className="muted" style={{ fontSize: 12 }}>
                    {c.binding.agent} · {c.binding.runtime}
                  </span>
                </td>
                <td>
                  <Status state={c.state} />
                </td>
                <td>
                  <span className="mono">
                    {c.latestRun.evidence[0]?.provenance ?? "self_reported"}
                  </span>
                </td>
                <td>
                  <span className="mono">
                    {c.latestRun.evidence[0]?.capturedAt ??
                      "evidence unavailable"}
                  </span>
                </td>
                <td>
                  <span className="mono">{c.nextRunLabel}</span>
                </td>
                <td>
                  <Health days={c.health} />
                </td>
                <td>
                  <ChevronRight size={16} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function CronletIdentity({ c }: { c: Cronlet }) {
  return (
    <div className="cronlet-name">
      <span className="iconbox">
        <Icon name={c.icon} />
      </span>
      <span>
        <span>{c.name}</span>
        <br />
        <span className="muted" style={{ fontWeight: 400, fontSize: 12.5 }}>
          {c.intent}
        </span>
      </span>
    </div>
  );
}
