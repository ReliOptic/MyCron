/* ============================================================
   MyCron — mobile.jsx : shell, bottom nav, Run Console (mobile)
   reuses theme.jsx (T, STATUS, Icon, …) + data.jsx
   ============================================================ */

const SB_TOP = 56;     // status-bar safe area
const TAB_H  = 66;     // bottom tab bar
const HOME_H = 22;     // home indicator safe area

/* ---------- sticky screen header ---------- */
function MHeader({ title, eyebrow, leading, trailing, onBack }) {
  return (
    <div style={{
      flex:"none", paddingTop:SB_TOP, background:`${T.bg}F2`,
      backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
      borderBottom:`1px solid ${T.hair}`, position:"relative", zIndex:5,
    }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"8px 18px 12px", minHeight:46 }}>
        <div style={{ display:"flex", alignItems:"center", gap:11, minWidth:0 }}>
          {onBack && (
            <button onClick={onBack} style={{ width:34, height:34, borderRadius:10, flex:"none",
              border:`1px solid ${T.border}`, background:T.surface, display:"grid", placeItems:"center", cursor:"pointer" }}>
              <Icon name="chevR" size={17} color={T.sub} style={{ transform:"rotate(180deg)" }} />
            </button>
          )}
          <div style={{ minWidth:0 }}>
            {eyebrow && <Eyebrow style={{ fontSize:9.5, marginBottom:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{eyebrow}</Eyebrow>}
            <div style={{ fontSize:23, fontWeight:700, letterSpacing:"-0.03em", color:T.ink,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{title}</div>
          </div>
        </div>
        {trailing}
      </div>
    </div>
  );
}

/* ---------- bottom tab bar ---------- */
function TabBar({ route, go }) {
  const tabs = [
    { id:"console", icon:"pulse",  label:"Console" },
    { id:"inbox",   icon:"inbox",  label:"Inbox", badge:INBOX.length },
    { id:"review",  icon:"gauge",  label:"Review" },
  ];
  const active = route==="detail" ? "console" : route;
  return (
    <div style={{ flex:"none", paddingBottom:HOME_H, background:`${T.panel}F5`,
      backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
      borderTop:`1px solid ${T.border}`, position:"relative", zIndex:10 }}>
      <div style={{ display:"flex", alignItems:"stretch", height:TAB_H-HOME_H, padding:"0 10px" }}>
        {tabs.map(t=>{
          const on = active===t.id;
          return (
            <button key={t.id} onClick={()=>go(t.id)} style={{ flex:1, border:"none", background:"transparent",
              cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4,
              position:"relative", paddingTop:8 }}>
              <div style={{ position:"relative" }}>
                <Icon name={t.icon} size={23} sw={on?2:1.7} color={on?T.deep:T.mute} />
                {t.badge!=null && <span style={{ position:"absolute", top:-4, right:-8, minWidth:15, height:15,
                  padding:"0 4px", borderRadius:8, background:T.badDot, color:"#fff", fontSize:9.5, fontWeight:700,
                  fontFamily:"'JetBrains Mono',monospace", display:"grid", placeItems:"center",
                  border:`1.5px solid ${T.panel}` }}>{t.badge}</span>}
              </div>
              <span style={{ fontSize:10.5, fontWeight:on?700:500, color:on?T.deep:T.mute, letterSpacing:"-0.01em" }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- triage chip ---------- */
function TriageChip({ status, count, label, active, onClick }) {
  const s = STATUS[status];
  return (
    <button onClick={onClick} style={{ flex:"none", cursor:"pointer", textAlign:"left",
      background: active?s.bg:T.surface, border:`1px solid ${active?s.line:T.border}`, borderRadius:13,
      padding:"11px 13px", minWidth:96, transition:"all .14s" }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:9 }}>
        <StatusDot status={status} size={7} ring />
        <span style={{ fontSize:11.5, fontWeight:600, color:T.sub }}>{label}</span>
      </div>
      <div style={{ fontSize:24, fontWeight:700, letterSpacing:"-0.03em", fontFamily:"'JetBrains Mono',monospace",
        color: count? s.text : T.mute }}>{String(count).padStart(2,"0")}</div>
    </button>
  );
}

/* ---------- cronlet card ---------- */
function CronletCard({ c, onOpen }) {
  return (
    <button onClick={()=>onOpen(c)} style={{ width:"100%", textAlign:"left", cursor:"pointer",
      background:T.surface, border:`1px solid ${T.border}`, borderRadius:15, padding:0, overflow:"hidden",
      boxShadow:"0 1px 2px rgba(20,32,26,.04)" }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"14px 15px 12px" }}>
        <div style={{ width:40, height:40, borderRadius:11, flex:"none", background:T.surface2,
          border:`1px solid ${T.hair}`, display:"grid", placeItems:"center" }}>
          <Icon name={c.icon} size={19} sw={1.7} color={T.green} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:600, color:T.ink, letterSpacing:"-0.01em",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.name}</div>
          <div style={{ fontSize:12.5, color:T.faint, marginTop:2, lineHeight:1.4,
            display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{c.intent}</div>
        </div>
        <StatusBadge status={c.state} />
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"10px 15px", borderTop:`1px solid ${T.hair}`, background:T.panel }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <Icon name="clock" size={13} sw={1.7} color={c.state==="failed"?T.badDot:c.state==="stale"?T.staleDot:T.mute} />
          <Mono c={c.state==="failed"?T.badText:c.state==="stale"?T.staleText:T.sub} style={{ fontSize:11 }}>{c.nextRun}</Mono>
        </div>
        <HealthStrip days={c.health} size={11} gap={3} />
      </div>
    </button>
  );
}

/* ---------- Run Console (mobile) ---------- */
function MConsole({ go, onOpen }) {
  const [filter, setFilter] = React.useState(null);
  const counts = countByState();
  const rate = Math.round((WEEK.verifiedRuns/WEEK.totalRuns)*100);
  const ordered = [...CRONLETS].sort((a,b)=> STATE_ORDER.indexOf(a.state)-STATE_ORDER.indexOf(b.state));
  const attention = ordered.filter(c=>["failed","stale"].includes(c.state));
  const rows = filter ? ordered.filter(c=>c.state===filter) : ordered;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <MHeader eyebrow={`Run Console · ${WEEK.range.split("–")[1].trim()}`} title="Today's work"
        trailing={
          <button onClick={()=>go("builder")} style={{ display:"flex", alignItems:"center", gap:6, height:36, padding:"0 13px",
            borderRadius:10, border:"none", background:T.deep, color:"#EAF3ED", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            <Icon name="plus" size={16} sw={2.1} color="#EAF3ED" /> New
          </button>
        } />

      <div style={{ flex:1, overflow:"auto", padding:`16px 0 ${TAB_H+20}px` }}>
        {/* verified hero */}
        <div style={{ margin:"0 16px 16px", background:T.deep, borderRadius:16, padding:"16px 17px",
          color:"#EAF3ED", position:"relative", overflow:"hidden" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:12.5, fontWeight:600, color:"#BFD9C9" }}>Verified this week</span>
            <Icon name="shieldChk" size={17} color="#7FC79E" />
          </div>
          <div style={{ display:"flex", alignItems:"baseline", gap:9, marginTop:10 }}>
            <span style={{ fontSize:38, fontWeight:700, letterSpacing:"-0.04em", fontFamily:"'JetBrains Mono',monospace" }}>{rate}%</span>
            <span style={{ fontSize:12, color:"#9CCBB1" }}>{WEEK.verifiedRuns}/{WEEK.totalRuns} runs · +{WEEK.verifiedRuns-WEEK.prevVerified} vs last</span>
          </div>
          <div style={{ marginTop:13, height:6, borderRadius:4, background:"#0A4A2F", overflow:"hidden" }}>
            <div style={{ width:`${rate}%`, height:"100%", borderRadius:4, background:"#5FC78D" }} />
          </div>
        </div>

        {/* triage chips */}
        <div style={{ display:"flex", gap:9, padding:"0 16px 18px", overflowX:"auto" }}>
          <TriageChip status="failed"     count={counts.failed}     label="Failed"     active={filter==="failed"}     onClick={()=>setFilter(filter==="failed"?null:"failed")} />
          <TriageChip status="stale"      count={counts.stale}      label="Stale"      active={filter==="stale"}      onClick={()=>setFilter(filter==="stale"?null:"stale")} />
          <TriageChip status="unverified" count={counts.unverified} label="Unverified" active={filter==="unverified"} onClick={()=>setFilter(filter==="unverified"?null:"unverified")} />
          <TriageChip status="verified"   count={counts.verified}   label="Verified"   active={filter==="verified"}   onClick={()=>setFilter(filter==="verified"?null:"verified")} />
        </div>

        {/* attention */}
        {!filter && attention.length>0 && (
          <div style={{ marginBottom:18 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"0 18px 10px" }}>
              <Icon name="alert" size={14} color={T.staleText} />
              <Eyebrow style={{ fontSize:10 }}>Needs attention · {attention.length}</Eyebrow>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:11, padding:"0 16px" }}>
              {attention.map(c=><CronletCard key={c.id} c={c} onOpen={onOpen} />)}
            </div>
          </div>
        )}

        {/* all / filtered */}
        <div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 18px 10px" }}>
            <Eyebrow style={{ fontSize:10 }}>{filter?`${STATUS[filter].label} · ${rows.length}`:"All routines"}</Eyebrow>
            {filter && <button onClick={()=>setFilter(null)} style={{ border:"none", background:"transparent",
              color:T.green, fontSize:12, fontWeight:600, cursor:"pointer" }}>Clear</button>}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:11, padding:"0 16px" }}>
            {(filter?rows:ordered).map(c=><CronletCard key={c.id} c={c} onOpen={onOpen} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MHeader, TabBar, CronletCard, MConsole, SB_TOP, TAB_H, HOME_H });
