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
import { t, type CopyKey, type Language } from "./i18n/copy";

type IconKey = string;
type AppProps = { demoMode: boolean };

type Notice = { title: string; detail?: string } | null;
type NoticeContextValue = { notice: Notice; showNotice: (title: string, detail?: string) => void; clearNotice: () => void };
type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; tc: (key: CopyKey, values?: Record<string, string | number>) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);
function useAppCopy() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useAppCopy must be used inside Shell");
  return ctx;
}
function statusCopyKey(state: RunState): CopyKey { return `status.${state}` as CopyKey; }
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
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = window.localStorage.getItem("mycron:language");
    return saved === "ko" ? "ko" : "en";
  });
  const tc = (key: CopyKey, values?: Record<string, string | number>) => t(language, key, values);
  function setLanguage(next: Language) {
    setLanguageState(next);
    window.localStorage.setItem("mycron:language", next);
  }
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
  const footerMeta = account ? `${account.plan} · ${cronlets?.length ?? 0} cronlets` : tc("shell.providerMissing");
  return (
    <NoticeContext.Provider value={{ notice, showNotice, clearNotice }}>
    <LanguageContext.Provider value={{ language, setLanguage, tc }}>
    <div className="app">
      <aside className="sidebar">
        <Link to={`/${demoSearch}`} className="brand"><span className="brand-mark"><Check size={15}/></span><span>My<span className="brand-cron">Cron</span></span></Link>
        <Link to={`/builder${demoSearch}`}><button className="new-btn">+&nbsp; {tc("action.createRoutine")}</button></Link>
        <div className="nav-section">{tc("nav.operate")}</div>
        <SideNav to={`/${demoSearch}`} end icon="pulse" label={tc("nav.today")} />
        <SideNav to={`/inbox${demoSearch}`} icon="inbox" label={tc("nav.inbox")} badge={inboxBadge} />
        <SideNav to={`/review${demoSearch}`} icon="gauge" label={tc("nav.review")} />
        <div className="nav-section" style={{ marginTop: 24 }}>{tc("nav.library")}</div>
        <div className="nav-link"><Icon name="cube" /> {tc("nav.agents")}</div>
        <div className="nav-link"><Icon name="layers" /> {tc("nav.runtimes")}</div>
        <Link to={`/account${demoSearch}`} className="sidebar-user">
          <div className="avatar">{footerInitial}</div><div><b style={{ color: "var(--ink)" }}>{footerName}</b><br/><span className="mono">{footerMeta}</span></div>
        </Link>
      </aside>
      <main className="main">
        <div className="topbar">
          <button className="search" type="button" onClick={() => showNotice(tc("notice.searchTitle"), tc("notice.searchDetail"))} aria-label={tc("shell.search")}><Search size={16}/> {tc("shell.search")} <span style={{ marginLeft: "auto" }} className="mono">⌘K</span></button>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {demoMode && <span className="status verified">{tc("shell.demoMode")}</span>}
            <div className="live-pill"><span className="dot"/> {demoMode ? tc("shell.runningNow") : tc("shell.emptyApi")}</div>
            <button className="ghost-btn" aria-label="Notifications" onClick={() => showNotice(tc("notice.notificationsTitle"), tc("notice.notificationsDetail"))}><Bell size={16}/></button>
          </div>
        </div>
        <div className="content">
          <div className="mobile-language-row"><LanguageToggle /></div>
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
        <MobileNav to={`/${demoSearch}`} end icon="pulse" label={tc("nav.today")} />
        <MobileNav to={`/inbox${demoSearch}`} icon="inbox" label={inboxBadge ? `${tc("nav.inbox")} · ${inboxBadge}` : tc("nav.inbox")} />
        <MobileNav to={`/review${demoSearch}`} icon="gauge" label={tc("nav.review")} />
        <MobileNav to={`/account${demoSearch}`} icon="user" label={tc("nav.account")} />
      </nav>
    </div>
    </LanguageContext.Provider>
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

function LanguageToggle() {
  const { language, setLanguage, tc } = useAppCopy();
  const next = language === "en" ? "ko" : "en";
  const label = language === "en" ? tc("lang.switchToKorean") : tc("lang.switchToEnglish");
  return <button className="language-toggle" type="button" onClick={() => setLanguage(next)} aria-label={label}><span>{tc("lang.current")}</span><span aria-hidden="true">/</span><span>{tc("lang.next")}</span></button>;
}

function RouteNotFound({ demoMode }: { demoMode: boolean }) {
  const demo = demoMode ? "?demo=1" : "";
  const { tc } = useAppCopy();
  return <div className="not-found"><EmptyState title={tc("notFound.title")} hint={tc("notFound.hint")} /><div className="empty-actions"><Link to={`/${demo}`} className="primary-btn">{tc("action.backToToday")}</Link>{!demoMode && <Link to="/?demo=1" className="ghost-btn">{tc("action.viewDemo")}</Link>}</div></div>;
}

function PageHead({ eyebrow, title, sub, action }: { eyebrow: string; title: React.ReactNode; sub: string; action?: React.ReactNode }) {
  return <header className="page-head"><div><div className="eyebrow">{eyebrow}</div><h1 className="page-title">{title}</h1><p className="page-sub">{sub}</p></div>{action}</header>;
}

function Status({ state }: { state: RunState }) { const { tc } = useAppCopy(); return <span className={`status ${state}`}>{tc(statusCopyKey(state))}</span>; }
function Health({ days }: { days: (RunState | null)[] }) { return <div className="health">{days.map((d, i) => <span key={i} className={d ?? ""} title={d ?? "No run"}/>)}</div>; }
function StateDot({ state }: { state: RunState }) { const { tc } = useAppCopy(); return <span className={`status ${state}`} style={{ width: 23, padding: 0, justifyContent: "center" }} aria-label={tc(statusCopyKey(state))}/>; }
function pct(n: number) { return `${Math.round(n * 100)}%`; }
function demoSearch() { return window.location.search.includes("demo=1") ? "?demo=1" : ""; }

function RunConsoleSurface() {
  const { tc } = useAppCopy();
  const { data: cronlets, loading, error } = useCronlets();
  const { data: review } = useWeeklyReview();
  const [filter, setFilter] = useState<RunState | null>(null);
  const navigate = useNavigate();
  const list = useMemo(() => (cronlets ?? []).filter((c) => !filter || c.state === filter).sort(byTriagePriority), [cronlets, filter]);
  if (loading) return <Skeleton title="Loading" />;
  if (error) return <EmptyState title="Couldn’t load routines" hint={error.message} />;
  if (!cronlets?.length) return <><PageHead eyebrow={tc("run.eyebrow")} title={tc("run.title")} sub={tc("run.summary")} action={<Link to={`/builder${demoSearch()}`}><button className="primary-btn">+ {tc("action.createRoutine")}</button></Link>} /><div className="not-found"><EmptyState title={tc("run.noRoutines")} hint={tc("run.emptyHint")} /><div className="empty-actions"><Link to="/?demo=1" className="primary-btn">{tc("action.viewDemo")}</Link></div></div></>;
  const counts = countByState(cronlets);
  return <>
    <PageHead eyebrow={tc("run.eyebrow")} title={tc("run.title")} sub={tc("run.summary")} action={<Link to={`/builder${demoSearch()}`}><button className="primary-btn"><span className="desktop-label">+ {tc("action.createRoutine")}</span><span className="mobile-label">+ {tc("action.new")}</span></button></Link>} />
    <div className="grid stats" style={{ marginBottom: 18 }}>
      {STATE_ORDER.map((s) => <button key={s} className="card stat" onClick={() => setFilter(filter === s ? null : s)} style={{ textAlign: "left", cursor: "pointer", borderColor: filter === s ? `var(--${s === "failed" ? "bad" : s === "stale" ? "stale" : s === "unverified" ? "unv" : "ok"}-line)` : undefined }}><div><Status state={s}/></div><div className="stat-value" style={{ color: `var(--${s === "failed" ? "bad" : s === "stale" ? "stale" : s === "unverified" ? "unv" : "ok"})` }}>{String(counts[s]).padStart(2, "0")}</div><div className="stat-sub">{s === "failed" ? tc("status.needFix") : s === "stale" ? tc("status.scheduleDrift") : s === "unverified" ? tc("status.needsProof") : tc("status.evidenceSaved")}</div></button>)}
      <div className="card stat hero-rate"><div className="eyebrow">{tc("run.verifiedThisWeek")}</div><div className="stat-value">{review?.totalRuns ? Math.round((review.verifiedRuns / review.totalRuns) * 100) : 0}%</div><div className="stat-sub">{review?.verifiedRuns}/{review?.totalRuns} runs · +3 vs last</div><div className="progress"><span style={{ width: `${review?.totalRuns ? (review.verifiedRuns / review.totalRuns) * 100 : 0}%` }}/></div></div>
    </div>
    {filter && <button className="ghost-btn" onClick={() => setFilter(null)} style={{ marginBottom: 12 }}>{tc("run.clearFilter", { status: tc(statusCopyKey(filter)) })}</button>}
    <div className="mobile-section-label"><AlertTriangle size={14}/> {tc("run.needsReview")}</div>
    <div className="card">
      <table className="table"><thead><tr><th>{tc("table.routine")}</th><th>{tc("table.state")}</th><th>{tc("table.lastRun")}</th><th>{tc("table.nextRun")}</th><th>{tc("table.health")}</th><th></th></tr></thead><tbody>{list.map((c) => <tr key={c.id} onClick={() => navigate(`/cronlets/${c.id}${demoSearch()}`)} style={{ cursor: "pointer" }}><td><CronletIdentity c={c}/></td><td><Status state={c.state}/></td><td><span className="mono">{c.lastRunLabel}</span></td><td><span className="mono">{c.nextRunLabel}</span></td><td><Health days={c.health}/></td><td><ChevronRight size={16}/></td></tr>)}</tbody></table>
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
  const { tc } = useAppCopy();
  const [copied, setCopied] = useState(false);
  if (loading) return <Skeleton title="Loading" />;
  if (error || !c) return <EmptyState title={tc("detail.notFound")} hint={error?.message ?? tc("detail.notFoundHint")} />;
  const run = c.latestRun;
  const met = run.donePolicy.filter((d) => d.state === "verified").length;
  const total = run.donePolicy.length;
  async function copyReadback() {
    await navigator.clipboard?.writeText(run.readbackCommand).catch(() => undefined);
    setCopied(true); window.setTimeout(() => setCopied(false), 1200);
  }
  return <>
    <Link to={`/${demoSearch()}`} className="ghost-btn" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 18 }}><ChevronLeft size={16}/> {tc("detail.back")}</Link>
    <PageHead eyebrow={tc("detail.eyebrow")} title={c.name} sub={c.intent} action={<Status state={c.state}/>} />
    <div className="grid" style={{ gridTemplateColumns: "repeat(4,minmax(0,1fr))", marginBottom: 18 }}>
      <Fact label={tc("detail.agent")} value={`${c.binding.agent} · ${c.binding.runtime}`} />
      <Fact label={tc("detail.schedule")} value={`${c.scheduleLabel} · ${c.timezone}`} />
      <Fact label={tc("detail.nextRun")} value={c.nextRunLabel} />
      <Fact label={tc("detail.verifiedRate")} value={`${pct(c.verifiedRate)} · ${c.costLabel ?? "—"}`} />
    </div>
    {(c.state === "failed" || c.state === "stale") && <div className="card card-pad" style={{ background: c.state === "failed" ? "var(--bad-bg)" : "var(--stale-bg)", borderColor: c.state === "failed" ? "var(--bad-line)" : "var(--stale-line)", marginBottom: 18 }}><div style={{ display: "flex", gap: 14, alignItems: "center", justifyContent: "space-between" }}><div><b>{c.state === "failed" ? tc("detail.failedTitle") : tc("detail.staleTitle")}</b><p className="page-sub" style={{ margin: "6px 0 0" }}>{run.summary} {run.errorType ? `Error: ${run.errorType}.` : ""}</p><span className="mono">{tc("detail.lastVerified")}: {c.lastSuccessLabel ?? "—"}</span></div><div style={{ display: "flex", gap: 8 }}><button className="primary-btn" onClick={() => actions.retryRun(run.id).then(() => showNotice(tc("notice.retryTitle"), tc("notice.retryDetail")))}>{tc("action.retry")}</button><button className="ghost-btn" onClick={() => c.state === "stale" ? actions.rearm(c.id).then(() => showNotice(tc("notice.rearmTitle"), tc("notice.rearmDetail"))) : actions.escalate(run.id).then(() => showNotice(tc("notice.escalateTitle"), tc("notice.escalateDetail")))}> {c.state === "stale" ? tc("action.rearm") : tc("action.escalate")}</button></div></div></div>}
    <div className="grid two-col">
      <section className="card"><div className="card-pad" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><b>{tc("detail.donePolicy")}</b><span className="mono">{tc("detail.conditionsMet", { met, total })}</span></div><div className="progress" style={{ margin: "0 16px 10px" }}><span style={{ width: `${(met/total)*100}%`, background: c.state === "verified" ? "var(--ok-dot)" : "var(--bad-dot)" }}/></div>{run.donePolicy.map((d) => <div className="policy-row" key={d.id}><StateDot state={d.state}/><div className="grow"><b>{d.label}</b> {d.required && <span className="mono"> REQUIRED</span>} {d.producesEvidence && <span className="mono" style={{ color: "var(--green)" }}> EVIDENCE</span>}<br/><span className="muted">{d.detail}</span></div><Status state={d.state}/></div>)}</section>
      <section className="card"><div className="card-pad" style={{ textAlign: "center" }}><div className={`seal ${run.state}`}><Icon name={run.state === "verified" ? "shieldChk" : run.state === "failed" ? "alert" : "shield"} size={34}/></div><div className="eyebrow" style={{ marginTop: 8 }}>{tc(statusCopyKey(run.state))}</div><p className="page-sub" style={{ margin: "8px auto 0" }}>{run.summary}</p></div>{run.evidence.map((e) => <div className="evidence-row" key={`${e.type}-${e.label}`}><span className="iconbox" style={{ width: 34, height: 34 }}><Icon name={e.type === "file" ? "fileText" : e.type === "links" ? "link" : e.type === "deliver" ? "send" : "terminal"}/></span><div className="grow"><b>{e.label}</b><br/><span className="muted">{e.meta}</span></div><span className="mono" style={{ color: e.warn ? "var(--bad)" : "var(--green)" }}>{e.ref}</span></div>)}<div className="card-pad"><button className="ghost-btn" onClick={copyReadback} style={{ float: "right", marginBottom: 8 }}><Copy size={14}/> {copied ? tc("action.copied") : tc("action.copy")}</button><div className="terminal">{run.readbackCommand}</div></div></section>
    </div>
  </>;
}

function BuilderSurface() {
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
  useEffect(() => { if (seed) actions.promoteInbox(seed).then(setDraft).catch((e) => setError((e as Error).message)); }, [seed]);
  useEffect(() => { actions.previewSchedule(draft.cron, draft.timezone, 4).then(setPreview).catch(() => setPreview([])); }, [draft.cron, draft.timezone]);
  const evidence = deriveRequiredEvidence(draft.donePolicy);
  const set = <K extends keyof CronletDraft>(key: K, value: CronletDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setPolicy = (key: keyof DonePolicyDraft) => setDraft((d) => ({ ...d, donePolicy: { ...d.donePolicy, [key]: key === "ran" ? true : !d.donePolicy[key] }, requiredEvidence: deriveRequiredEvidence({ ...d.donePolicy, [key]: key === "ran" ? true : !d.donePolicy[key] }) }));
  async function submit() { setSaving(true); setError(null); try { const c = await actions.create({ ...draft, requiredEvidence: evidence }); showNotice(tc("notice.createdTitle"), tc("notice.createdDetail")); navigate(`/cronlets/${c.id}${demoSearch()}`); } catch (e) { setError((e as Error).message); } finally { setSaving(false); } }
  return <>
    <PageHead eyebrow={tc("builder.eyebrow")} title={tc("builder.title")} sub={tc("builder.summary")} />
    {draft.seededFromInboxId && <div className="card card-pad" style={{ background: "var(--mint)", borderColor: "var(--mint-line)", marginBottom: 16 }}><Inbox size={16}/> Promoted from Inbox request.</div>}
    {error && <div className="card card-pad" style={{ background: "var(--bad-bg)", borderColor: "var(--bad-line)", marginBottom: 16 }}>{error}</div>}
    <div className="grid two-col"><section className="list"><div className="card card-pad"><h3>{tc("builder.intentSchedule")}</h3><div className="field"><label>{tc("builder.name")}</label><input className="input" value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder={tc("builder.namePlaceholder")}/></div><div className="field" style={{ marginTop: 12 }}><label>{tc("builder.intent")}</label><textarea className="textarea" value={draft.intent} onChange={(e) => set("intent", e.target.value)} placeholder={tc("builder.intentPlaceholder")}/></div><div className="form-grid" style={{ marginTop: 12 }}><div className="field"><label>{tc("builder.when")}</label><select className="select" value={draft.scheduleLabel} onChange={(e) => { const v = e.target.value; setDraft((d) => ({ ...d, scheduleLabel: v, cron: v.startsWith("Mondays") ? "0 9 * * 1" : v.startsWith("Daily") ? "0 9 * * *" : "0 8 * * 1-5" })); }}><option value="">{tc("builder.chooseSchedule")}</option><option>Every weekday · 08:00</option><option>Daily · 09:00</option><option>Mondays · 09:00</option></select><span className="mono">{draft.cron || "cron preview"}</span></div><div className="field"><label>{tc("builder.timezone")}</label><input className="input" value={draft.timezone} onChange={(e) => set("timezone", e.target.value)} /></div><div className="field"><label>{tc("builder.agentRuntime")}</label><input className="input" value={draft.agent} onChange={(e) => set("agent", e.target.value)} placeholder="OpsAgent" /></div><div className="field"><label>{tc("builder.deliverTo")}</label><input className="input" value={draft.deliverTo} onChange={(e) => set("deliverTo", e.target.value)} placeholder="MyCron Inbox" /></div></div></div><div className="card"><div className="card-pad"><h3>{tc("detail.donePolicy")}</h3><p className="muted">{tc("builder.donePolicyHint")}</p></div>{policyRows.map((p) => <div className="policy-row" key={p.key}><button className={`toggle ${draft.donePolicy[p.key] ? "on" : ""}`} onClick={() => setPolicy(p.key)} disabled={p.key === "ran"}><span/></button><div><b>{tc(p.labelKey)}</b> {p.key === "ran" && <span className="mono"> {tc("meta.required")}</span>} {p.evidence && <span className="mono" style={{ color: "var(--green)" }}> {tc("meta.evidence")}</span>}<br/><span className="muted">{tc(p.detailKey)}</span></div></div>)}</div><div className="card card-pad"><h3>{tc("builder.evidenceRequirements")}</h3><p className="muted">{tc("builder.evidenceHint")}</p><div className="chips">{evidence.length ? evidence.map((e) => <span key={e} className="chip">{evidenceLabel(e)}</span>) : <span className="muted">{tc("builder.noEvidence")}</span>}</div></div></section><aside className="list"><div className="terminal">{manifest(draft, evidence)}</div><div className="card"><div className="card-pad"><b>{tc("builder.nextRuns")} · {draft.timezone || "timezone"}</b></div>{preview.length ? preview.map((p, i) => <div className="policy-row" key={p}><span className="mono">{i + 1}</span><span>{p}</span></div>) : <div className="card-pad muted">{tc("builder.schedulePreview")}</div>}<div className="card-pad"><button className="primary-btn" onClick={submit} disabled={saving}>{saving ? tc("builder.creating") : tc("action.createRoutine")}</button><p className="muted" style={{ textAlign: "center" }}>{tc("builder.storageHint")}</p></div></div></aside></div>
  </>;
}

function RoutineInbox() {
  const { tc } = useAppCopy();
  const { data, loading, error, reload } = useInbox();
  const actions = useCronletActions();
  const navigate = useNavigate();
  if (loading) return <Skeleton title="Loading Routine Inbox" />;
  if (error) return <EmptyState title="Couldn’t load inbox" hint={error.message} />;
  return <><PageHead eyebrow={tc("inbox.eyebrow")} title={tc("inbox.title")} sub={tc("inbox.summary")} />{!data?.length ? <EmptyState title={tc("inbox.empty")} hint={tc("inbox.emptyHint")} /> : <div className="card"><div className="card-pad mono">{tc("inbox.captured", { count: data.length })}</div>{data.map((r) => <InboxRow key={r.id} req={r} onDismiss={async () => { await actions.dismissInbox(r.id); reload(); }} onMake={() => navigate(`/builder?seed=${r.id}${demoSearch().replace("?", "&")}`)} />)}</div>}</>;
}
function InboxRow({ req, onDismiss, onMake }: { req: InboxRequest; onDismiss: () => void; onMake: () => void }) { const { tc } = useAppCopy(); return <div className="inbox-row"><div className="cronlet-name"><span className="iconbox"><Inbox size={18}/></span><span><b>"{req.text}"</b><br/><span className="muted">via {req.source} · {req.capturedLabel}</span></span></div><div style={{ display: "flex", gap: 10 }}><button className="ghost-btn" onClick={onDismiss}>{tc("action.dismiss")}</button><button className="primary-btn" onClick={onMake}><Wand2 size={14}/> {tc("action.makeRoutine")}</button></div></div>; }

function WeeklyReviewSurface() {
  const { tc } = useAppCopy();
  const { data: review, loading, error } = useWeeklyReview();
  const { data: cronlets } = useCronlets();
  const actions = useCronletActions();
  const { showNotice } = useNotice();
  if (loading) return <Skeleton title="Loading weekly review" />;
  if (error) return <EmptyState title="Couldn’t load weekly review" hint={error.message} />;
  if (!review?.totalRuns) return <><PageHead eyebrow={tc("review.eyebrow")} title={tc("review.title")} sub={tc("review.summary")}/><EmptyState title={tc("review.empty")} hint={tc("review.emptyHint")} /></>;
  return <><PageHead eyebrow={`${tc("review.eyebrow")} · ${review.rangeLabel}`} title={tc("review.title")} sub={tc("review.summary")} action={<button className="ghost-btn" onClick={() => showNotice(tc("notice.exportTitle"), tc("notice.exportDetail"))}>{tc("action.export")}</button>} /><ReviewStats review={review}/><SignalMatrix cronlets={cronlets ?? []}/><div className="grid two-col" style={{ marginTop: 18 }}><section className="card"><div className="card-pad"><h3>{tc("review.improvements")}</h3><p className="muted">{tc("review.improvementsHint")}</p></div>{review.suggestions.map((s) => <div className="suggestion" key={s.id}><StateDot state={s.state}/><div><b>{s.title}</b><br/><span className="muted">{s.body}</span></div><button className="ghost-btn" onClick={() => actions.applySuggestion(s.id).then(() => showNotice(tc("notice.reviewActionTitle", { action: s.actionLabel }), tc("notice.reviewActionDetail")))}>{s.actionLabel} <ChevronRight size={14}/></button></div>)}</section><section className="card"><div className="card-pad"><h3>{tc("review.corrections")}</h3><p className="muted">{tc("review.correctionsHint")}</p></div>{review.corrections.map((c) => <div className="policy-row" key={c.id}><StateDot state={c.state}/><div><b>{c.title}</b><br/><span className="muted">{c.detail}</span></div></div>)}<div className="card-pad" style={{ background: "var(--mint)", color: "var(--green)" }}>{tc("review.estimate", { rate: 92 })}</div></section></div></>;
}
function ReviewStats({ review }: { review: WeeklyReview }) { const { tc } = useAppCopy(); const rate = review.totalRuns ? Math.round((review.verifiedRuns / review.totalRuns) * 100) : 0; return <div className="grid stats" style={{ marginBottom: 18 }}><div className="card stat"><div className="eyebrow">{tc("review.verifiedRate")}</div><div className="stat-value" style={{ color: "var(--ok)" }}>{rate}% ↑3</div><div className="stat-sub">{review.verifiedRuns}/{review.totalRuns} runs this week</div></div><div className="card stat"><div className="eyebrow">{tc("review.failedRuns")}</div><div className="stat-value" style={{ color: "var(--bad)" }}>{review.failed}</div><div className="stat-sub">across 1 cronlet</div></div><div className="card stat"><div className="eyebrow">{tc("review.staleRoutines")}</div><div className="stat-value" style={{ color: "var(--stale)" }}>{review.stale}</div><div className="stat-sub">schedule drift</div></div><div className="card stat"><div className="eyebrow">{tc("status.unverified")}</div><div className="stat-value" style={{ color: "var(--unv)" }}>{review.unverified}</div><div className="stat-sub">ran, not proven</div></div><div className="card stat"><div className="eyebrow">{tc("review.computeCost")}</div><div className="stat-value">{review.costLabel}</div><div className="stat-sub">all routines · 7d</div></div></div>; }
function SignalMatrix({ cronlets }: { cronlets: Cronlet[] }) { const { tc } = useAppCopy(); const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]; return <div className="card"><div className="card-pad"><h3>{tc("review.weeklyStatus")}</h3></div><div className="matrix"><div className="matrix-head">{tc("table.routine")}</div>{days.map((d) => <div key={d} className="matrix-head">{d}</div>)}{cronlets.map((c) => <React.Fragment key={c.id}><div>{c.name}</div>{c.health.map((h, i) => <div key={i}><Health days={[h]}/></div>)}</React.Fragment>)}</div></div>; }

function AccountSurface() {
  const { tc } = useAppCopy();
  const { data: account, loading: aLoading } = useAccount();
  const { data: budget } = useComputeBudget();
  const { data: alerts, reload } = useAlertPreferences();
  const actions = useCronletActions();
  const { showNotice } = useNotice();
  if (aLoading) return <Skeleton title="Loading account" />;
  if (!account) return <><PageHead eyebrow={tc("account.eyebrow")} title={tc("account.title")} sub={tc("account.summary")} /><EmptyState title={tc("account.empty")} hint={tc("account.emptyHint")} /></>;
  return <><PageHead eyebrow={tc("account.eyebrow")} title={tc("account.title")} sub={tc("account.summary")} action={<button className="ghost-btn" onClick={() => showNotice(tc("notice.notificationsTitle"), tc("notice.notificationsDetail"))}><Bell size={16}/></button>} /><div className="list" style={{ maxWidth: 720 }}><div className="card account-card"><div className="avatar" style={{ width: 60, height: 60, borderRadius: 14 }}>{account.avatarInitials ?? account.name.slice(0,1)}</div><div><h2 style={{ margin: 0 }}>{account.name}</h2><div className="muted">{account.email}</div></div><span className="status verified">{account.plan}</span><button className="ghost-btn" onClick={() => showNotice(tc("notice.profileTitle"), tc("notice.profileDetail"))}>{tc("action.editProfile")}</button></div>{budget && <div className="card card-pad"><div style={{ display: "flex", justifyContent: "space-between" }}><h3>{tc("account.computeBudget")}</h3><span className="mono">{tc("account.renews", { date: budget.renewsLabel })}</span></div><div className="budget-line"><strong>{budget.usedLabel}</strong><span className="muted">{tc("account.budgetOf", { limit: budget.limitLabel })}</span></div><div className="progress"><span style={{ width: `${budget.usedFraction*100}%` }}/></div><p className="mono">{budget.routines} routines · {budget.runsPerWeek} runs / wk <span style={{ float: "right", color: "var(--green)" }}>{Math.round(budget.usedFraction*100)}% used</span></p><button className="ghost-btn" onClick={() => showNotice(tc("notice.billingTitle"), tc("notice.billingDetail"))}>{tc("action.manageBilling")}</button></div>}<div className="card"><div className="card-pad"><h3>{tc("account.alerts")}</h3></div>{alerts?.map((alert) => <AlertRow key={alert.key} alert={alert} toggle={async () => { await actions.setAlertPreference(alert.key, !alert.enabled); reload(); }} />)}</div></div></>;
}
function AlertRow({ alert, toggle }: { alert: AlertPreference; toggle: () => void }) { return <div className="alert-row"><span className="iconbox" style={{ width: 34, height: 34 }}><Bell size={16}/></span><div className="grow"><b>{alert.label}</b><br/><span className="muted">{alert.detail}</span></div><button className={`switch ${alert.enabled ? "on" : ""}`} type="button" role="switch" aria-checked={alert.enabled} onClick={toggle} aria-label={`${alert.label}: ${alert.enabled ? "on" : "off"}`}><span/></button></div>; }

function Fact({ label, value }: { label: string; value: string }) { return <div className="card stat"><div className="eyebrow">{label}</div><div className="mono" style={{ marginTop: 10 }}>{value}</div></div>; }
function Skeleton({ title }: { title: string }) { return <><PageHead eyebrow="Loading" title={title} sub="Fetching the current MyCron provider state."/><div className="grid"><div className="card" style={{ height: 92, opacity: .7 }}/><div className="card" style={{ height: 260, opacity: .45 }}/></div></>; }

const policyRows: { key: keyof DonePolicyDraft; labelKey: CopyKey; detailKey: CopyKey; evidence?: boolean }[] = [
  { key: "ran", labelKey: "policy.ran", detailKey: "policy.ranDetail", evidence: true },
  { key: "sources", labelKey: "policy.sources", detailKey: "policy.sourcesDetail", evidence: true },
  { key: "output", labelKey: "policy.output", detailKey: "policy.outputDetail", evidence: true },
  { key: "evidence", labelKey: "policy.evidence", detailKey: "policy.evidenceDetail", evidence: true },
  { key: "goal", labelKey: "policy.goal", detailKey: "policy.goalDetail" },
  { key: "noDrift", labelKey: "policy.noDrift", detailKey: "policy.noDriftDetail" },
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
