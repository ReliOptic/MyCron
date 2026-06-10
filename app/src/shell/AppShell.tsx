import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAccount, useCronlets, useInbox } from "@contract/data/hooks";
import { t, type Language } from "../i18n/copy";
import { LanguageContext, NoticeContext, type Notice } from "./context";
import { Bell, Check, Search, Icon } from "./icons";
import { LanguageToggle } from "./LanguageToggle";
import { NoticeBanner } from "./NoticeBanner";

export function AppShell({ demoMode, children }: { demoMode: boolean; children: React.ReactNode }) {
  const demoSearch = demoMode ? "?demo=1" : "";
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = window.localStorage.getItem("mycron:language");
    return saved === "ko" ? "ko" : "en";
  });
  const [notice, setNotice] = useState<Notice>(null);
  const tc = (key: Parameters<typeof t>[1], values?: Record<string, string | number>) => t(language, key, values);
  const { data: inbox } = useInbox();
  const { data: account } = useAccount();
  const { data: cronlets } = useCronlets();
  const inboxBadge = inbox?.length ? String(inbox.length) : undefined;
  const footerInitial = account?.avatarInitials?.slice(0, 1) ?? account?.name.slice(0, 1) ?? "A";
  const footerName = account?.name ?? "Account";
  const footerMeta = account ? `${account.plan} · ${cronlets?.length ?? 0} cronlets` : tc("shell.providerMissing");

  function setLanguage(next: Language) {
    setLanguageState(next);
    window.localStorage.setItem("mycron:language", next);
  }
  function showNotice(title: string, detail?: string) {
    setNotice({ title, detail });
    window.setTimeout(() => setNotice((current) => current?.title === title ? null : current), 3200);
  }
  function clearNotice() { setNotice(null); }

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
        <div className="content"><div className="mobile-language-row"><LanguageToggle /></div>{children}</div>
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
