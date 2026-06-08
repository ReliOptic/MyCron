/* ============================================================
   MyCron — dashboard.jsx : Run Console (operating ledger)
   ============================================================ */

function StateTile({ status, count, label, sub, active, onClick }) {
  const s = STATUS[status];
  const [hover, setHover] = React.useState(false);
  const borderCol = active ? s.line : hover ? T.borderStrong : T.border;
  return (
    <button onClick={onClick}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
      flex:1, textAlign:"left", cursor:"pointer", background: active? s.bg : T.surface,
      border:`1px solid ${borderCol}`, borderRadius:13, padding:"15px 16px 14px",
      transition:"all .14s", boxShadow: active?"none":"0 1px 2px rgba(20,32,26,.035)",
    }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <StatusDot status={status} size={8} ring />
          <span style={{ fontSize:12.5, fontWeight:600, color:T.sub }}>{label}</span>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"baseline", gap:8, marginTop:11 }}>
        <span style={{ fontSize:30, fontWeight:700, letterSpacing:"-0.03em", color: count? s.text : T.mute,
          fontFamily:"'JetBrains Mono',monospace" }}>{String(count).padStart(2,"0")}</span>
        <span style={{ fontSize:11.5, color:T.faint }}>{sub}</span>
      </div>
    </button>
  );
}

function LedgerRow({ c, onOpen }) {
  const s = STATUS[c.state];
  return (
    <div onClick={()=>onOpen(c)} style={{
      display:"grid", gridTemplateColumns:"minmax(280px,1.7fr) 130px 150px 130px 132px 40px",
      alignItems:"center", gap:14, padding:"15px 18px", cursor:"pointer",
      borderTop:`1px solid ${T.hair}`, transition:"background .12s",
    }}
      onMouseEnter={e=>e.currentTarget.style.background=T.panel}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      {/* name + intent */}
      <div style={{ display:"flex", alignItems:"center", gap:12, minWidth:0 }}>
        <div style={{ width:38, height:38, borderRadius:10, flex:"none", background:T.surface2,
          border:`1px solid ${T.hair}`, display:"grid", placeItems:"center" }}>
          <Icon name={c.icon} size={18} sw={1.7} color={T.green} />
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:14, fontWeight:700, color:T.ink, letterSpacing:"-0.01em",
              whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{c.name}</span>
          </div>
          <div style={{ fontSize:12, color:T.faint, marginTop:2, overflow:"hidden", textOverflow:"ellipsis",
            whiteSpace:"nowrap", maxWidth:340 }}>{c.intent}</div>
        </div>
      </div>
      {/* state */}
      <div><StatusBadge status={c.state} /></div>
      {/* last run */}
      <div>
        <Mono c={T.sub} style={{ fontSize:11.5 }}>{c.lastRun}</Mono>
        <div style={{ marginTop:3 }}><Mono dim style={{ fontSize:10.5 }}>{c.runId}</Mono></div>
      </div>
      {/* next run */}
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <Icon name="clock" size={13} sw={1.7} color={c.state==="failed"?T.badDot:c.state==="stale"?T.staleDot:T.mute} />
        <Mono c={c.state==="failed"?T.badText:c.state==="stale"?T.staleText:T.sub} style={{ fontSize:11 }}>{c.nextRun}</Mono>
      </div>
      {/* health */}
      <div><HealthStrip days={c.health} size={12} gap={3.5} /></div>
      {/* chevron */}
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <Icon name="chevR" size={17} color={T.mute} />
      </div>
    </div>
  );
}

function RunConsole({ onOpen, go }) {
  const [filter, setFilter] = React.useState(null);
  const counts = countByState();
  const rate = Math.round((WEEK.verifiedRuns/WEEK.totalRuns)*100);
  const ordered = [...CRONLETS].sort((a,b)=> STATE_ORDER.indexOf(a.state)-STATE_ORDER.indexOf(b.state));
  const rows = filter ? ordered.filter(c=>c.state===filter) : ordered;
  const attention = CRONLETS.filter(c=>["failed","stale"].includes(c.state)).length;

  return (
    <div>
      {/* page header */}
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:22 }}>
        <div>
          <Eyebrow style={{ marginBottom:10 }}>Run Console · {WEEK.range.split("–")[1].trim()}</Eyebrow>
          <h1 style={{ fontSize:27, fontWeight:700, letterSpacing:"-0.032em", color:T.ink, margin:0 }}>
            Today's delegated work
          </h1>
          <p style={{ fontSize:14, color:T.sub, margin:"8px 0 0", maxWidth:560, lineHeight:1.5 }}>
            Every scheduled agent routine, resolved to a state you can trust.
            {attention>0 && <span style={{ color:T.staleText, fontWeight:500 }}> {attention} routines need a look.</span>}
          </p>
        </div>
        <Btn kind="primary" icon="plus" onClick={()=>go("builder")}>New Cronlet</Btn>
      </div>

      {/* state triage strip */}
      <div style={{ display:"flex", gap:12, marginBottom:14 }}>
        <StateTile status="failed"     count={counts.failed}     label="Failed"     sub="need a fix"      active={filter==="failed"}     onClick={()=>setFilter(filter==="failed"?null:"failed")} />
        <StateTile status="stale"      count={counts.stale}      label="Stale"      sub="schedule drift"  active={filter==="stale"}      onClick={()=>setFilter(filter==="stale"?null:"stale")} />
        <StateTile status="unverified" count={counts.unverified} label="Unverified" sub="ran, not proven" active={filter==="unverified"} onClick={()=>setFilter(filter==="unverified"?null:"unverified")} />
        <StateTile status="verified"   count={counts.verified}   label="Verified"   sub="evidence on file" active={filter==="verified"}  onClick={()=>setFilter(filter==="verified"?null:"verified")} />
        {/* verified rate */}
        <div style={{ flex:1, background:T.deep, borderRadius:13, padding:"15px 17px 14px", color:"#EAF3ED",
          display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:12.5, fontWeight:600, color:"#BFD9C9" }}>Verified this week</span>
            <Icon name="shieldChk" size={15} color="#7FC79E" />
          </div>
          <div style={{ display:"flex", alignItems:"baseline", gap:8, marginTop:11 }}>
            <span style={{ fontSize:30, fontWeight:700, letterSpacing:"-0.03em", fontFamily:"'JetBrains Mono',monospace" }}>{rate}%</span>
            <span style={{ fontSize:11.5, color:"#9CCBB1" }}>{WEEK.verifiedRuns}/{WEEK.totalRuns} runs · +{WEEK.verifiedRuns-WEEK.prevVerified} vs last</span>
          </div>
        </div>
      </div>

      {/* ledger */}
      <Card pad={0}>
        <div style={{ display:"grid",
          gridTemplateColumns:"minmax(280px,1.7fr) 130px 150px 130px 132px 40px",
          gap:14, padding:"11px 18px", alignItems:"center" }}>
          {["Cronlet","Run state","Last run","Next run","7-day health",""].map((h,i)=>(
            <Eyebrow key={i} style={{ fontSize:9.5, letterSpacing:"0.1em",
              textAlign: i===5?"right":"left" }}>{h}</Eyebrow>
          ))}
        </div>
        {rows.map(c => <LedgerRow key={c.id} c={c} onOpen={onOpen} />)}
        {rows.length===0 && (
          <div style={{ padding:"40px", textAlign:"center", borderTop:`1px solid ${T.hair}` }}>
            <Mono dim>No cronlets in this state.</Mono>
          </div>
        )}
        {/* footer */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"12px 18px", borderTop:`1px solid ${T.hair}`, background:T.panel, borderRadius:"0 0 13px 13px" }}>
          <Mono dim style={{ fontSize:11 }}>{rows.length} of {CRONLETS.length} cronlets {filter?`· filtered: ${STATUS[filter].label}`:""}</Mono>
          <div style={{ display:"flex", gap:8 }}>
            {filter && <Btn kind="ghost" size="sm" onClick={()=>setFilter(null)}>Clear filter</Btn>}
            <Btn kind="ghost" size="sm" icon="filter" onClick={()=>go("review")}>Weekly review</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { RunConsole });
