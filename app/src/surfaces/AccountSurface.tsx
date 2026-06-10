import { EmptyState } from "@contract/components/primitives";
import {
  useAccount,
  useAlertPreferences,
  useComputeBudget,
  useCronletActions,
} from "@contract/data/hooks";
import type { AlertPreference } from "@contract/types/mycron";
import { useAppCopy, useNotice } from "../shell/context";
import { Bell } from "../shell/icons";
import { PageHead, Skeleton } from "../shell/primitives";

export function AccountSurface() {
  const { tc } = useAppCopy();
  const { data: account, loading: aLoading } = useAccount();
  const { data: budget } = useComputeBudget();
  const { data: alerts, reload } = useAlertPreferences();
  const actions = useCronletActions();
  const { showNotice } = useNotice();
  if (aLoading) return <Skeleton title="Loading account" />;
  if (!account)
    return (
      <>
        <PageHead
          eyebrow={tc("account.eyebrow")}
          title={tc("account.title")}
          sub={tc("account.summary")}
        />
        <EmptyState
          title={tc("account.empty")}
          hint={tc("account.emptyHint")}
        />
      </>
    );
  return (
    <>
      <PageHead
        eyebrow={tc("account.eyebrow")}
        title={tc("account.title")}
        sub={tc("account.summary")}
        action={
          <button
            className="ghost-btn"
            onClick={() =>
              showNotice(
                tc("notice.notificationsTitle"),
                tc("notice.notificationsDetail"),
              )
            }
          >
            <Bell size={16} />
          </button>
        }
      />
      <div className="list" style={{ maxWidth: 720 }}>
        <div className="card account-card">
          <div
            className="avatar"
            style={{ width: 60, height: 60, borderRadius: 14 }}
          >
            {account.avatarInitials ?? account.name.slice(0, 1)}
          </div>
          <div>
            <h2 style={{ margin: 0 }}>{account.name}</h2>
            <div className="muted">{account.email}</div>
          </div>
          <span className="status verified">{account.plan}</span>
          <button
            className="ghost-btn"
            onClick={() =>
              showNotice(tc("notice.profileTitle"), tc("notice.profileDetail"))
            }
          >
            {tc("action.editProfile")}
          </button>
        </div>
        {budget && (
          <div className="card card-pad">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3>{tc("account.computeBudget")}</h3>
              <span className="mono">
                {tc("account.renews", { date: budget.renewsLabel })}
              </span>
            </div>
            <div className="budget-line">
              <strong>{budget.usedLabel}</strong>
              <span className="muted">
                {tc("account.budgetOf", { limit: budget.limitLabel })}
              </span>
            </div>
            <div className="progress">
              <span style={{ width: `${budget.usedFraction * 100}%` }} />
            </div>
            <p className="mono">
              {budget.cronlets} Cronlets · {budget.runsPerWeek} runs / wk{" "}
              <span style={{ float: "right", color: "var(--green)" }}>
                {Math.round(budget.usedFraction * 100)}% used
              </span>
            </p>
            <button
              className="ghost-btn"
              onClick={() =>
                showNotice(
                  tc("notice.billingTitle"),
                  tc("notice.billingDetail"),
                )
              }
            >
              {tc("action.manageBilling")}
            </button>
          </div>
        )}
        <div className="card">
          <div className="card-pad">
            <h3>{tc("account.alerts")}</h3>
          </div>
          {alerts?.map((alert) => (
            <AlertRow
              key={alert.key}
              alert={alert}
              toggle={async () => {
                await actions.setAlertPreference(alert.key, !alert.enabled);
                reload();
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
function AlertRow({
  alert,
  toggle,
}: {
  alert: AlertPreference;
  toggle: () => void;
}) {
  return (
    <div className="alert-row">
      <span className="iconbox" style={{ width: 34, height: 34 }}>
        <Bell size={16} />
      </span>
      <div className="grow">
        <b>{alert.label}</b>
        <br />
        <span className="muted">{alert.detail}</span>
      </div>
      <button
        className={`switch ${alert.enabled ? "on" : ""}`}
        type="button"
        role="switch"
        aria-checked={alert.enabled}
        onClick={toggle}
        aria-label={`${alert.label}: ${alert.enabled ? "on" : "off"}`}
      >
        <span />
      </button>
    </div>
  );
}
