import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertTriangle, Bell, Box, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight,
  CircleGauge, Clock3, Copy, FileText, GitBranch, Inbox, Layers, Mail, Pause, Play,
  RefreshCw, Search, Send, Settings2, Shield, Sparkles, Terminal, TrendingUp, User,
  Wand2, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { EmptyState, Mono } from "@contract/components/primitives";
import {
  byTriagePriority, countByState, deriveRequiredEvidence, STATE_ORDER,
  useAccount, useAlertPreferences, useComputeBudget, useCronlet, useCronletActions,
  useCronlets, useInbox, useWeeklyReview,
} from "@contract/data/hooks";
import type {
  AlertPreference, Cronlet, CronletDraft, DonePolicyDraft, EvidenceType, InboxRequest,
  RunState, WeeklyReview,
} from "@contract/types/mycron";
import { STATUS_LABEL } from "@contract/styles/tokens";

type IconKey = string;
type AppProps = { demoMode: boolean };

type Notice = { title: string; detail?: string } | null;
type NoticeContextValue = { notice: Notice; showNotice: (title: string, detail?: string) => void; clearNotice: () => void };
const NoticeContext = createContext<NoticeContextValue | null>(null);
function useNotice() {
  const ctx = useContext(NoticeContext);
  if (!ctx) throw new Error("useNotice must be used inside Shell");
  return ctx;
}

const iconMap: Record<string, LucideIcon> = {
  pulse: Zap, calendar: CalendarDays, clock: Clock3, check: Check, checkCircle: CheckCircle2,
  alert: AlertTriangle, shield: Shield, shieldChk: Shield, link: GitBranch, file: FileText,
  fileText: FileText, play: Play, pause: Pause, bolt: Zap, refresh: RefreshCw, inbox: Inbox,
  gauge: CircleGauge, history: Clock3, terminal: Terminal, sparkle: Sparkles, wand: Wand2,
  lock: Shield, hash: Settings2, trend: TrendingUp, git: GitBranch, robot: Sparkles, send: Send,
  cube: Box, layers: Layers, user: User, flag: AlertTriangle, mail: Mail,
};

function Icon({ name, size = 18 }: { name: IconKey; size?: number }) {
  const Cmp = iconMap[name] ?? Sparkles;
  return <Cmp size={size} strokeWidth={1.8} />;
}

export function App({ demoMode }: AppProps) {
  return (
    <BrowserRouter>
      <Shell demoMode={demoMode} />
    </BrowserRouter>
  );
}

function Shell({ demoMode }: AppProps) {
  const demoSearch = demoMode ? "?demo=1" : "";
  const [notice, setNotice] = useState<Notice>(null);
  function showNotice(title: string, detail?: string) {
    setNotice({ title, detail });
    window.setTimeout(() => setNotice((current) => current?.title === title ? null : current), 3200);
  }
  function clearNotice() { setNotice(null); }
  const { data: inbox } = useInbox();
  const { data: account } = useAccount();
  const { data: cronlets } = useCronlets();
  const inboxBadge = inbox?.length ? String(inbox.length) : undefined;
  const footerInitial = account?.avatarInitials?.slice(0, 1) ?? account?.name.slice(0, 1) ?? "A";
  const footerName = account?.name ?? "Account";
  const footerMeta = account ? `${account.plan} · ${cronlets?.length ?? 0} cronlets` : "Provider not connected";
  return (
    <NoticeContext.Provider value={{ notice, showNotice, clearNotice }}>
    <div className="app">
      <aside className="sidebar">
        <Link to={`/${demoSearch}`} className="brand"><span className="brand-mark"><Check size={15}/></span><span>My<span className="brand-cron">Cron</span></span></Link>
        <Link to={`/builder${demoSearch}`}><button className="new-btn">+&nbsp; New Cronlet</button></Link>
        <div className="nav-section">Operate</div>
        <SideNav to={`/${demoSearch}`} end icon="pulse" label="Run Console" />
        <SideNav to={`/inbox${demoSearch}`} icon="inbox" label="Routine Inbox" badge={inboxBadge} />
        <SideNav to={`/review${demoSearch}`} icon="gauge" label="Weekly Review" />
        <div className="nav-section" style={{ marginTop: 24 }}>Library</div>
        <div className="nav-link"><Icon name="cube" /> Agents</div>
        <div className="nav-link"><Icon name="layers" /> Runtimes</div>
        <Link to={`/account${demoSearch}`} className="sidebar-user">
          <div className="avatar">{footerInitial}</div><div><b style={{ color: "var(--ink)" }}>{footerName}</b><br/><span className="mono">{footerMeta}</span></div>
        </Link>
      </aside>
      <main className="main">
        <div className="topbar">
          <button className="search" type="button" onClick={() => showNotice("Search coming soon", "Command palette search is visible in the preview shell but not wired to a provider yet.")} aria-label="Search cronlets, runs, evidence — coming soon"><Search size={16}/> Search cronlets, runs, evidence... <span style={{ marginLeft: "auto" }} className="mono">⌘K</span></button>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {demoMode && <span className="status verified">Demo mode</span>}
            <div className="live-pill"><span className="dot"/> {demoMode ? "2 running now" : "EmptyApi"}</div>
            <button className="ghost-btn" aria-label="Notifications" onClick={() => showNotice("Notifications preview", "Alert delivery is not wired until the backend/auth follow-up.")}><Bell size={16}/></button>
          </div>
        </div>
        <div className="content">
          <Routes>
            <Route path="/" element={<RunConsoleSurface />} />
            <Route path="/cronlets/:id" element={<CronletDetail />} />
            <Route path="/builder" element={<BuilderSurface />} />
            <Route path="/inbox" element={<RoutineInbox />} />
            <Route path="/review" element={<WeeklyReviewSurface />} />
            <Route path="/account" element={<AccountSurface />} />
            <Route path="*" element={<RouteNotFound demoMode={demoMode} />} />
          </Routes>
        </div>
      </main>
      <NoticeBanner />
      <nav className="phone-nav">
        <MobileNav to={`/${demoSearch}`} end icon="pulse" label="Console" />
        <MobileNav to={`/inbox${demoSearch}`} icon="inbox" label={inboxBadge ? `Inbox · ${inboxBadge}` : "Inbox"} />
        <MobileNav to={`/review${demoSearch}`} icon="gauge" label="Review" />
        <MobileNav to={`/account${demoSearch}`} icon="user" label="Account" />
      </nav>
    </div>
    </NoticeContext.Provider>
  );
}

function SideNav({ to, icon, label, badge, end }: { to: string; icon: string; label: string; badge?: string; end?: boolean }) {
  return <NavLink to={to} end={end} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}><Icon name={icon}/><span>{label}</span>{badge && <span className="badge">{badge}</span>}</NavLink>;
}
function MobileNav({ to, icon, label, end }: { to: string; icon: string; label: string; end?: boolean }) {
  return <NavLink to={to} end={end}><Icon name={icon} size={20}/><span>{label}</span></NavLink>;
}

function NoticeBanner() {
  const { notice, clearNotice } = useNotice();
  if (!notice) return null;
  return <div className="notice" role="status" aria-live="polite"><div><b>{notice.title}</b>{notice.detail && <span>{notice.detail}</span>}</div><button type="button" onClick={clearNotice} aria-label="Dismiss notice">×</button></div>;
}

function RouteNotFound({ demoMode }: { demoMode: boolean }) {
  const demo = demoMode ? "?demo=1" : "";
  return <div className="not-found"><EmptyState title="Page not found" hint="This preview route does not exist. Return to the Run Console or open the seeded demo." /><div className="empty-actions"><Link to={`/${demo}`} className="primary-btn">Back to Run Console</Link>{!demoMode && <Link to="/?demo=1" className="ghost-btn">View seeded demo</Link>}</div></div>;
}

function PageHead({ eyebrow, title, sub, action }: { eyebrow: string; title: React.ReactNode; sub: string; action?: React.ReactNode }) {
  return <header className="page-head"><div><div className="eyebrow">{eyebrow}</div><h1 className="page-title">{title}</h1><p className="page-sub">{sub}</p></div>{action}</header>;
}

function Status({ state }: { state: RunState }) { return <span className={`status ${state}`}>{STATUS_LABEL[state]}</span>; }
function Health({ days }: { days: (RunState | null)[] }) { return <div className="health">{days.map((d, i) => <span key={i} className={d ?? ""} title={d ?? "No run"}/>)}</div>; }
function StateDot({ state }: { state: RunState }) { return <span className={`status ${state}`} style={{ width: 23, padding: 0, justifyContent: "center" }} aria-label={state}/>; }
function pct(n: number) { return `${Math.round(n * 100)}%`; }
function demoSearch() { return window.location.search.includes("demo=1") ? "?demo=1" : ""; }

function RunConsoleSurface() {
  const { data: cronlets, loading, error } = useCronlets();
  const { data: review } = useWeeklyReview();
  const [filter, setFilter] = useState<RunState | null>(null);
  const navigate = useNavigate();
  const list = useMemo(() => (cronlets ?? []).filter((c) => !filter || c.state === filter).sort(byTriagePriority), [cronlets, filter]);
  if (loading) return <Skeleton title="Loading delegated work" />;
  if (error) return <EmptyState title="Couldn’t load routines" hint={error.message} />;
  if (!cronlets?.length) return <><PageHead eyebrow="Run Console · Jun 8" title="Today's delegated work" sub="Every scheduled agent routine, resolved to a state you can trust." action={<Link to={`/builder${demoSearch()}`}><button className="primary-btn">+ New Cronlet</button></Link>} /><div className="not-found"><EmptyState title="No cronlets yet" hint="EmptyApi is active. Connect a provider later, or open the seeded preview now." /><div className="empty-actions"><Link to="/?demo=1" className="primary-btn">View seeded demo</Link></div></div></>;
  const counts = countByState(cronlets);
  return <>
    <PageHead eyebrow="Run Console · Jun 8" title={<><span className="desktop-title">Today's delegated work</span><span className="mobile-title">Today's work</span></>} sub="Every scheduled agent routine, resolved to a state you can trust. 2 routines need a look." action={<Link to={`/builder${demoSearch()}`}><button className="primary-btn"><span className="desktop-label">+ New Cronlet</span><span className="mobile-label">+ New</span></button></Link>} />
    <div className="grid stats" style={{ marginBottom: 18 }}>
      {STATE_ORDER.map((s) => <button key={s} className="card stat" onClick={() => setFilter(filter === s ? null : s)} style={{ textAlign: "left", cursor: "pointer", borderColor: filter === s ? `var(--${s === "failed" ? "bad" : s === "stale" ? "stale" : s === "unverified" ? "unv" : "ok"}-line)` : undefined }}><div><Status state={s}/></div><div className="stat-value" style={{ color: `var(--${s === "failed" ? "bad" : s === "stale" ? "stale" : s === "unverified" ? "unv" : "ok"})` }}>{String(counts[s]).padStart(2, "0")}</div><div className="stat-sub">{s === "failed" ? "need a fix" : s === "stale" ? "schedule drift" : s === "unverified" ? "ran, not proven" : "evidence on file"}</div></button>)}
      <div className="card stat hero-rate"><div className="eyebrow">Verified this week</div><div className="stat-value">{review?.totalRuns ? Math.round((review.verifiedRuns / review.totalRuns) * 100) : 0}%</div><div className="stat-sub">{review?.verifiedRuns}/{review?.totalRuns} runs · +3 vs last</div><div className="progress"><span style={{ width: `${review?.totalRuns ? (review.verifiedRuns / review.totalRuns) * 100 : 0}%` }}/></div></div>
    </div>
    {filter && <button className="ghost-btn" onClick={() => setFilter(null)} style={{ marginBottom: 12 }}>Clear {STATUS_LABEL[filter]} filter</button>}
    <div className="mobile-section-label"><AlertTriangle size={14}/> Needs attention · 2</div>
    <div className="card">
      <table className="table"><thead><tr><th>Cronlet</th><th>Run state</th><th>Last run</th><th>Next run</th><th>7-day health</th><th></th></tr></thead><tbody>{list.map((c) => <tr key={c.id} onClick={() => navigate(`/cronlets/${c.id}${demoSearch()}`)} style={{ cursor: "pointer" }}><td><CronletIdentity c={c}/></td><td><Status state={c.state}/></td><td><span className="mono">{c.lastRunLabel}</span></td><td><span className="mono">{c.nextRunLabel}</span></td><td><Health days={c.health}/></td><td><ChevronRight size={16}/></td></tr>)}</tbody></table>
    </div>
  </>;
}

function CronletIdentity({ c }: { c: Cronlet }) {
  return <div className="cronlet-name"><span className="iconbox"><Icon name={c.icon}/></span><span><span>{c.name}</span><br/><span className="muted" style={{ fontWeight: 400, fontSize: 12.5 }}>{c.intent}</span></span></div>;
}

function CronletDetail() {
  const { id } = useParams();
  const { data: c, loading, error } = useCronlet(id ?? null);
  const actions = useCronletActions();
  const { showNotice } = useNotice();
  const [copied, setCopied] = useState(false);
  if (loading) return <Skeleton title="Loading proof panel" />;
  if (error || !c) return <EmptyState title="Cronlet not found" hint={error?.message ?? "No selected cronlet."} />;
  const run = c.latestRun;
  const met = run.donePolicy.filter((d) => d.state === "verified").length;
  const total = run.donePolicy.length;
  async function copyReadback() {
    await navigator.clipboard?.writeText(run.readbackCommand).catch(() => undefined);
    setCopied(true); window.setTimeout(() => setCopied(false), 1200);
  }
  return <>
    <Link to={`/${demoSearch()}`} className="ghost-btn" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 18 }}><ChevronLeft size={16}/> Run Console</Link>
    <PageHead eyebrow="Cronlet" title={c.name} sub={c.intent} action={<Status state={c.state}/>} />
    <div className="grid" style={{ gridTemplateColumns: "repeat(4,minmax(0,1fr))", marginBottom: 18 }}>
      <Fact label="Agent" value={`${c.binding.agent} · ${c.binding.runtime}`} />
      <Fact label="Schedule" value={`${c.scheduleLabel} · ${c.timezone}`} />
      <Fact label="Next run" value={c.nextRunLabel} />
      <Fact label="Verified rate" value={`${pct(c.verifiedRate)} · ${c.costLabel ?? "—"}`} />
    </div>
    {(c.state === "failed" || c.state === "stale") && <div className="card card-pad" style={{ background: c.state === "failed" ? "var(--bad-bg)" : "var(--stale-bg)", borderColor: c.state === "failed" ? "var(--bad-line)" : "var(--stale-line)", marginBottom: 18 }}><div style={{ display: "flex", gap: 14, alignItems: "center", justifyContent: "space-between" }}><div><b>{c.state === "failed" ? "This run failed verification" : "This routine is stale"}</b><p className="page-sub" style={{ margin: "6px 0 0" }}>{run.summary} {run.errorType ? `Error: ${run.errorType}.` : ""}</p><span className="mono">Last verified: {c.lastSuccessLabel ?? "—"}</span></div><div style={{ display: "flex", gap: 8 }}><button className="primary-btn" onClick={() => actions.retryRun(run.id).then(() => showNotice("Retry queued", "Demo mode records the click without starting a real backend run."))}>Retry</button><button className="ghost-btn" onClick={() => c.state === "stale" ? actions.rearm(c.id).then(() => showNotice("Schedule re-armed", "Demo mode records the action without changing a backend schedule.")) : actions.escalate(run.id).then(() => showNotice("Escalation noted", "Demo mode does not send external notifications."))}> {c.state === "stale" ? "Re-arm" : "Escalate"}</button></div></div></div>}
    <div className="grid two-col">
      <section className="card"><div className="card-pad" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><b>Done Policy</b><span className="mono">{met} / {total} conditions met</span></div><div className="progress" style={{ margin: "0 16px 10px" }}><span style={{ width: `${(met/total)*100}%`, background: c.state === "verified" ? "var(--ok-dot)" : "var(--bad-dot)" }}/></div>{run.donePolicy.map((d) => <div className="policy-row" key={d.id}><StateDot state={d.state}/><div className="grow"><b>{d.label}</b> {d.required && <span className="mono"> REQUIRED</span>} {d.producesEvidence && <span className="mono" style={{ color: "var(--green)" }}> EVIDENCE</span>}<br/><span className="muted">{d.detail}</span></div><Status state={d.state}/></div>)}</section>
      <section className="card"><div className="card-pad" style={{ textAlign: "center" }}><div className={`seal ${run.state}`}><Icon name={run.state === "verified" ? "shieldChk" : run.state === "failed" ? "alert" : "shield"} size={34}/></div><div className="eyebrow" style={{ marginTop: 8 }}>{STATUS_LABEL[run.state]}</div><p className="page-sub" style={{ margin: "8px auto 0" }}>{run.summary}</p></div>{run.evidence.map((e) => <div className="evidence-row" key={`${e.type}-${e.label}`}><span className="iconbox" style={{ width: 34, height: 34 }}><Icon name={e.type === "file" ? "fileText" : e.type === "links" ? "link" : e.type === "deliver" ? "send" : "terminal"}/></span><div className="grow"><b>{e.label}</b><br/><span className="muted">{e.meta}</span></div><span className="mono" style={{ color: e.warn ? "var(--bad)" : "var(--green)" }}>{e.ref}</span></div>)}<div className="card-pad"><button className="ghost-btn" onClick={copyReadback} style={{ float: "right", marginBottom: 8 }}><Copy size={14}/> {copied ? "Copied" : "Copy"}</button><div className="terminal">{run.readbackCommand}</div></div></section>
    </div>
  </>;
}

function BuilderSurface() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const actions = useCronletActions();
  const { showNotice } = useNotice();
  const [draft, setDraft] = useState<CronletDraft>(() => blankDraft());
  const [preview, setPreview] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const seed = params.get("seed");
  useEffect(() => { if (seed) actions.promoteInbox(seed).then(setDraft).catch((e) => setError((e as Error).message)); }, [seed]);
  useEffect(() => { actions.previewSchedule(draft.cron, draft.timezone, 4).then(setPreview).catch(() => setPreview([])); }, [draft.cron, draft.timezone]);
  const evidence = deriveRequiredEvidence(draft.donePolicy);
  const set = <K extends keyof CronletDraft>(key: K, value: CronletDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setPolicy = (key: keyof DonePolicyDraft) => setDraft((d) => ({ ...d, donePolicy: { ...d.donePolicy, [key]: key === "ran" ? true : !d.donePolicy[key] }, requiredEvidence: deriveRequiredEvidence({ ...d.donePolicy, [key]: key === "ran" ? true : !d.donePolicy[key] }) }));
  async function submit() { setSaving(true); setError(null); try { const c = await actions.create({ ...draft, requiredEvidence: evidence }); showNotice("Cronlet created", "Preview demo created a seeded Cronlet without backend persistence."); navigate(`/cronlets/${c.id}${demoSearch()}`); } catch (e) { setError((e as Error).message); } finally { setSaving(false); } }
  return <>
    <PageHead eyebrow="New Cronlet" title="Define the routine — and what counts as done" sub="A Cronlet is not finished when it runs. It is finished when its Done Policy is satisfied and evidence is captured." />
    {draft.seededFromInboxId && <div className="card card-pad" style={{ background: "var(--mint)", borderColor: "var(--mint-line)", marginBottom: 16 }}><Inbox size={16}/> Promoted from Inbox request.</div>}
    {error && <div className="card card-pad" style={{ background: "var(--bad-bg)", borderColor: "var(--bad-line)", marginBottom: 16 }}>{error}</div>}
    <div className="grid two-col"><section className="list"><div className="card card-pad"><h3>Intent & schedule</h3><div className="field"><label>Routine name</label><input className="input" value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="Name the delegated routine"/></div><div className="field" style={{ marginTop: 12 }}><label>What should the agent do?</label><textarea className="textarea" value={draft.intent} onChange={(e) => set("intent", e.target.value)} placeholder="Describe the outcome and source boundaries"/></div><div className="form-grid" style={{ marginTop: 12 }}><div className="field"><label>When</label><select className="select" value={draft.scheduleLabel} onChange={(e) => { const v = e.target.value; setDraft((d) => ({ ...d, scheduleLabel: v, cron: v.startsWith("Mondays") ? "0 9 * * 1" : v.startsWith("Daily") ? "0 9 * * *" : "0 8 * * 1-5" })); }}><option value="">Choose schedule</option><option>Every weekday · 08:00</option><option>Daily · 09:00</option><option>Mondays · 09:00</option></select><span className="mono">{draft.cron || "cron preview"}</span></div><div className="field"><label>Timezone</label><input className="input" value={draft.timezone} onChange={(e) => set("timezone", e.target.value)} /></div><div className="field"><label>Agent / runtime</label><input className="input" value={draft.agent} onChange={(e) => set("agent", e.target.value)} placeholder="OpsAgent" /></div><div className="field"><label>Deliver results to</label><input className="input" value={draft.deliverTo} onChange={(e) => set("deliverTo", e.target.value)} placeholder="MyCron Inbox" /></div></div></div><div className="card"><div className="card-pad"><h3>Done Policy</h3><p className="muted">The run is only marked Verified when every enabled condition passes.</p></div>{policyRows.map((p) => <div className="policy-row" key={p.key}><button className={`toggle ${draft.donePolicy[p.key] ? "on" : ""}`} onClick={() => setPolicy(p.key)} disabled={p.key === "ran"}><span/></button><div><b>{p.label}</b> {p.key === "ran" && <span className="mono"> REQUIRED</span>} {p.evidence && <span className="mono" style={{ color: "var(--green)" }}> EVIDENCE</span>}<br/><span className="muted">{p.detail}</span></div></div>)}</div><div className="card card-pad"><h3>Evidence requirements</h3><p className="muted">Derived from the Done Policy. These artifacts must exist for a run to be provable.</p><div className="chips">{evidence.length ? evidence.map((e) => <span key={e} className="chip">{evidenceLabel(e)}</span>) : <span className="muted">No evidence required yet.</span>}</div></div></section><aside className="list"><div className="terminal">{manifest(draft, evidence)}</div><div className="card"><div className="card-pad"><b>Next 4 runs · {draft.timezone || "timezone"}</b></div>{preview.length ? preview.map((p, i) => <div className="policy-row" key={p}><span className="mono">{i + 1}</span><span>{p}</span></div>) : <div className="card-pad muted">Choose a schedule to preview next runs.</div>}<div className="card-pad"><button className="primary-btn" onClick={submit} disabled={saving}>{saving ? "Creating..." : "Approve & create Cronlet"}</button><p className="muted" style={{ textAlign: "center" }}>Human-readable and machine-replayable. Stored to your account only.</p></div></div></aside></div>
  </>;
}

function RoutineInbox() {
  const { data, loading, error, reload } = useInbox();
  const actions = useCronletActions();
  const navigate = useNavigate();
  if (loading) return <Skeleton title="Loading Routine Inbox" />;
  if (error) return <EmptyState title="Couldn’t load inbox" hint={error.message} />;
  return <><PageHead eyebrow="Routine Inbox" title="Turn loose requests into Cronlets" sub={'Vague "do this every..." asks captured from your agents and tools, waiting to become verifiable routines.'} />{!data?.length ? <EmptyState title="No captured requests" hint="EmptyApi is active. Demo requests appear only with ?demo=1." /> : <div className="card"><div className="card-pad mono">{data.length} captured requests</div>{data.map((r) => <InboxRow key={r.id} req={r} onDismiss={async () => { await actions.dismissInbox(r.id); reload(); }} onMake={() => navigate(`/builder?seed=${r.id}${demoSearch().replace("?", "&")}`)} />)}</div>}</>;
}
function InboxRow({ req, onDismiss, onMake }: { req: InboxRequest; onDismiss: () => void; onMake: () => void }) { return <div className="inbox-row"><div className="cronlet-name"><span className="iconbox"><Inbox size={18}/></span><span><b>"{req.text}"</b><br/><span className="muted">via {req.source} · {req.capturedLabel}</span></span></div><div style={{ display: "flex", gap: 10 }}><button className="ghost-btn" onClick={onDismiss}>Dismiss</button><button className="primary-btn" onClick={onMake}><Wand2 size={14}/> Make Cronlet</button></div></div>; }

function WeeklyReviewSurface() {
  const { data: review, loading, error } = useWeeklyReview();
  const { data: cronlets } = useCronlets();
  const actions = useCronletActions();
  const { showNotice } = useNotice();
  if (loading) return <Skeleton title="Loading weekly review" />;
  if (error) return <EmptyState title="Couldn’t load weekly review" hint={error.message} />;
  if (!review?.totalRuns) return <><PageHead eyebrow="Weekly Review" title="How your routines actually performed" sub="One honest read on delegated work — what held, what drifted, and what to tighten next week."/><EmptyState title="No weekly signal yet" hint="EmptyApi has no runs. Use ?demo=1 for the populated preview." /></>;
  return <><PageHead eyebrow={`Weekly Review · ${review.rangeLabel}`} title="How your routines actually performed" sub="One honest read on delegated work — what held, what drifted, and what to tighten next week." action={<button className="ghost-btn" onClick={() => showNotice("Export preview", "Report export is not wired in the static preview.")}>Export report</button>} /><ReviewStats review={review}/><SignalMatrix cronlets={cronlets ?? []}/><div className="grid two-col" style={{ marginTop: 18 }}><section className="card"><div className="card-pad"><h3>Improvement loop</h3><p className="muted">Concrete changes drawn from this week's runs — not generic tips.</p></div>{review.suggestions.map((s) => <div className="suggestion" key={s.id}><StateDot state={s.state}/><div><b>{s.title}</b><br/><span className="muted">{s.body}</span></div><button className="ghost-btn" onClick={() => actions.applySuggestion(s.id).then(() => showNotice(`${s.actionLabel} noted`, "Demo mode records review actions without changing backend policy."))}>{s.actionLabel} <ChevronRight size={14}/></button></div>)}</section><section className="card"><div className="card-pad"><h3>Your corrections</h3><p className="muted">Feedback you gave this week, folded back into routines.</p></div>{review.corrections.map((c) => <div className="policy-row" key={c.id}><StateDot state={c.state}/><div><b>{c.title}</b><br/><span className="muted">{c.detail}</span></div></div>)}<div className="card-pad" style={{ background: "var(--mint)", color: "var(--green)" }}>Applying all 3 fixes would have lifted this week's verified rate to an estimated <b>92%</b>.</div></section></div></>;
}
function ReviewStats({ review }: { review: WeeklyReview }) { const rate = review.totalRuns ? Math.round((review.verifiedRuns / review.totalRuns) * 100) : 0; return <div className="grid stats" style={{ marginBottom: 18 }}><div className="card stat"><div className="eyebrow">Verified rate</div><div className="stat-value" style={{ color: "var(--ok)" }}>{rate}% ↑3</div><div className="stat-sub">{review.verifiedRuns}/{review.totalRuns} runs this week</div></div><div className="card stat"><div className="eyebrow">Failed runs</div><div className="stat-value" style={{ color: "var(--bad)" }}>{review.failed}</div><div className="stat-sub">across 1 cronlet</div></div><div className="card stat"><div className="eyebrow">Stale routines</div><div className="stat-value" style={{ color: "var(--stale)" }}>{review.stale}</div><div className="stat-sub">schedule drift</div></div><div className="card stat"><div className="eyebrow">Unverified</div><div className="stat-value" style={{ color: "var(--unv)" }}>{review.unverified}</div><div className="stat-sub">ran, not proven</div></div><div className="card stat"><div className="eyebrow">Compute cost</div><div className="stat-value">{review.costLabel}</div><div className="stat-sub">all routines · 7d</div></div></div>; }
function SignalMatrix({ cronlets }: { cronlets: Cronlet[] }) { const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]; return <div className="card"><div className="card-pad"><h3>Weekly routine signal</h3></div><div className="matrix"><div className="matrix-head">Cronlet</div>{days.map((d) => <div key={d} className="matrix-head">{d}</div>)}{cronlets.map((c) => <React.Fragment key={c.id}><div>{c.name}</div>{c.health.map((h, i) => <div key={i}><Health days={[h]}/></div>)}</React.Fragment>)}</div></div>; }

function AccountSurface() {
  const { data: account, loading: aLoading } = useAccount();
  const { data: budget } = useComputeBudget();
  const { data: alerts, reload } = useAlertPreferences();
  const actions = useCronletActions();
  const { showNotice } = useNotice();
  if (aLoading) return <Skeleton title="Loading account" />;
  if (!account) return <><PageHead eyebrow="Workspace" title="Account" sub="Account identity, compute budget, and alert preferences live here once a provider is connected." /><EmptyState title="No account provider" hint="EmptyApi has no account profile. Use ?demo=1 for the preview account surface." /></>;
  return <><PageHead eyebrow="Workspace" title="Account" sub="Manage the workspace boundary for scheduled agent work." action={<button className="ghost-btn" onClick={() => showNotice("Notifications preview", "Alert delivery is not wired until backend/auth exists.")}><Bell size={16}/></button>} /><div className="list" style={{ maxWidth: 720 }}><div className="card account-card"><div className="avatar" style={{ width: 60, height: 60, borderRadius: 14 }}>{account.avatarInitials ?? account.name.slice(0,1)}</div><div><h2 style={{ margin: 0 }}>{account.name}</h2><div className="muted">{account.email}</div></div><span className="status verified">{account.plan}</span><button className="ghost-btn" onClick={() => showNotice("Profile editing unavailable", "Identity settings require the backend/auth follow-up.")}>Profile & identity → Edit</button></div>{budget && <div className="card card-pad"><div style={{ display: "flex", justifyContent: "space-between" }}><h3>Compute budget</h3><span className="mono">renews {budget.renewsLabel}</span></div><div className="budget-line"><strong>{budget.usedLabel}</strong><span className="muted">of {budget.limitLabel} this cycle</span></div><div className="progress"><span style={{ width: `${budget.usedFraction*100}%` }}/></div><p className="mono">{budget.routines} routines · {budget.runsPerWeek} runs / wk <span style={{ float: "right", color: "var(--green)" }}>{Math.round(budget.usedFraction*100)}% used</span></p><button className="ghost-btn" onClick={() => showNotice("Billing unavailable", "Subscription and invoice management are outside the static preview.")}>Manage subscription & invoices →</button></div>}<div className="card"><div className="card-pad"><h3>Alerts</h3></div>{alerts?.map((alert) => <AlertRow key={alert.key} alert={alert} toggle={async () => { await actions.setAlertPreference(alert.key, !alert.enabled); reload(); }} />)}</div></div></>;
}
function AlertRow({ alert, toggle }: { alert: AlertPreference; toggle: () => void }) { return <div className="alert-row"><span className="iconbox" style={{ width: 34, height: 34 }}><Bell size={16}/></span><div className="grow"><b>{alert.label}</b><br/><span className="muted">{alert.detail}</span></div><button className={`switch ${alert.enabled ? "on" : ""}`} type="button" role="switch" aria-checked={alert.enabled} onClick={toggle} aria-label={`${alert.label}: ${alert.enabled ? "on" : "off"}`}><span/></button></div>; }

function Fact({ label, value }: { label: string; value: string }) { return <div className="card stat"><div className="eyebrow">{label}</div><div className="mono" style={{ marginTop: 10 }}>{value}</div></div>; }
function Skeleton({ title }: { title: string }) { return <><PageHead eyebrow="Loading" title={title} sub="Fetching the current MyCron provider state."/><div className="grid"><div className="card" style={{ height: 92, opacity: .7 }}/><div className="card" style={{ height: 260, opacity: .45 }}/></div></>; }

const policyRows: { key: keyof DonePolicyDraft; label: string; detail: string; evidence?: boolean }[] = [
  { key: "ran", label: "Process completes cleanly", detail: "Agent exits 0 within the timeout window.", evidence: true },
  { key: "sources", label: "All required sources reached", detail: "Every declared input returns valid data — partials fail.", evidence: true },
  { key: "output", label: "Output artifact generated", detail: "A non-empty file or message is produced and stored.", evidence: true },
  { key: "evidence", label: "Evidence captured & linked", detail: "Delivery receipts and artifact refs are recorded to the manifest.", evidence: true },
  { key: "goal", label: "User goal confirmed", detail: "Wait for explicit read-back or approval before counting as done." },
  { key: "noDrift", label: "No silent schedule drift", detail: "Flag as Stale if a scheduled run is missed by more than one interval." },
];
function blankDraft(): CronletDraft { const donePolicy = { ran: true, sources: true, output: true, evidence: true, goal: false, noDrift: false }; return { name: "", intent: "", scheduleLabel: "", cron: "", timezone: "Asia/Seoul", agent: "", deliverTo: "", donePolicy, requiredEvidence: deriveRequiredEvidence(donePolicy) }; }
function evidenceLabel(e: EvidenceType) { return ({ file: "Output file", links: "Source manifest", deliver: "Delivery receipt", log: "Run log", note: "Note" } as Record<EvidenceType, string>)[e]; }
function manifest(d: CronletDraft, evidence: EvidenceType[]) { return `name: ${JSON.stringify(d.name || "")}
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
evidence: [${evidence.map((x) => JSON.stringify(x)).join(", ")}]`; }
