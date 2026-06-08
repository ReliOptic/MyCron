/* ============================================================
   MyCron — app.jsx : shell, routing, mount
   ============================================================ */

function NavItem({ icon, label, active, onClick, badge }) {
  const [hover, setHover] = React.useState(false);
  const bg = active ? T.surface : hover ? T.surface2 : "transparent";
  return (
    <button onClick={onClick} data-active={active?"1":"0"}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
      display:"flex", alignItems:"center", gap:11, width:"100%", height:38, padding:"0 11px",
      borderRadius:9, border:"none", cursor:"pointer", textAlign:"left",
      background:bg, color: active?T.ink:T.sub,
      fontSize:13.5, fontWeight: active?600:500, transition:"background .12s, color .12s",
      boxShadow: active?"0 1px 2px rgba(20,32,26,.05)":"none",
    }}>
      <Icon name={icon} size={17.5} sw={active?1.9:1.7} color={active?T.deep:T.faint} />
      <span style={{ flex:1 }}>{label}</span>
      {badge!=null && <span style={{ minWidth:18, height:18, padding:"0 5px", borderRadius:9, background: active?T.deep:T.surface3,
        color: active?"#EAF3ED":T.sub, fontSize:10.5, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
        display:"grid", placeItems:"center" }}>{badge}</span>}
    </button>
  );
}

function Sidebar({ route, go }) {
  const r = (x)=> route===x || (x==="dashboard" && route==="detail");
  return (
    <aside style={{ width:236, flex:"none", borderRight:`1px solid ${T.border}`, background:T.panel,
      display:"flex", flexDirection:"column", padding:"18px 14px", height:"100vh", position:"sticky", top:0 }}>
      <div style={{ padding:"4px 6px 20px" }}><Logo size={23} /></div>

      <Btn kind="primary" icon="plus" full style={{ marginBottom:18 }} onClick={()=>go("builder")}>New Cronlet</Btn>

      <Eyebrow style={{ padding:"0 8px 9px", fontSize:9.5 }}>Operate</Eyebrow>
      <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
        <NavItem icon="pulse"  label="Run Console"   active={r("dashboard")} onClick={()=>go("dashboard")} />
        <NavItem icon="inbox"  label="Routine Inbox" active={r("inbox")}     onClick={()=>go("inbox")} badge={INBOX.length} />
        <NavItem icon="gauge"  label="Weekly Review" active={r("review")}    onClick={()=>go("review")} />
      </div>

      <Eyebrow style={{ padding:"22px 8px 9px", fontSize:9.5 }}>Library</Eyebrow>
      <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
        <NavItem icon="cube"   label="Agents"   onClick={()=>go("dashboard")} />
        <NavItem icon="layers" label="Runtimes" onClick={()=>go("dashboard")} />
      </div>

      <div style={{ marginTop:"auto", borderTop:`1px solid ${T.hair}`, paddingTop:12 }}>
        <button style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"7px 6px", borderRadius:9,
          border:"none", background:"transparent", cursor:"pointer" }}
          onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div style={{ width:30, height:30, borderRadius:8, background:T.deep, color:"#EAF3ED", display:"grid",
            placeItems:"center", fontSize:12, fontWeight:700, flex:"none" }}>J</div>
          <div style={{ flex:1, textAlign:"left", minWidth:0 }}>
            <div style={{ fontSize:12.5, fontWeight:600, color:T.ink }}>Junseo Kim</div>
            <Mono dim style={{ fontSize:10 }}>Pro · 6 cronlets</Mono>
          </div>
          <Icon name="chevD" size={14} color={T.mute} />
        </button>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <div style={{ height:58, flex:"none", borderBottom:`1px solid ${T.border}`, background:`${T.bg}E6`,
      backdropFilter:"blur(8px)", position:"sticky", top:0, zIndex:20,
      display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, height:34, padding:"0 12px", borderRadius:9,
        border:`1px solid ${T.border}`, background:T.surface, width:300, color:T.faint }}>
        <Icon name="search" size={15} color={T.mute} />
        <span style={{ fontSize:13 }}>Search cronlets, runs, evidence…</span>
        <span style={{ marginLeft:"auto", fontFamily:"'JetBrains Mono',monospace", fontSize:10.5, color:T.mute,
          border:`1px solid ${T.border}`, borderRadius:5, padding:"1px 5px" }}>⌘K</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, height:30, padding:"0 11px", borderRadius:8,
          background:T.mint, border:`1px solid ${T.mintLine}` }}>
          <StatusDot status="running" size={7} />
          <Mono c={T.deep} style={{ fontSize:11, fontWeight:600 }}>2 running now</Mono>
        </div>
        <button style={{ width:34, height:34, borderRadius:9, border:`1px solid ${T.border}`, background:T.surface,
          display:"grid", placeItems:"center", cursor:"pointer", position:"relative" }}>
          <Icon name="bell" size={16} color={T.sub} />
          <span style={{ position:"absolute", top:8, right:9, width:6, height:6, borderRadius:6, background:T.badDot,
            border:`1.5px solid ${T.surface}` }} />
        </button>
      </div>
    </div>
  );
}

function App() {
  const [route, setRoute] = React.useState("dashboard");
  const [sel, setSel] = React.useState(null);
  const [seed, setSeed] = React.useState(null);

  const go = (r)=>{ setRoute(r); if(r!=="builder") setSeed(null); window.scrollTo(0,0); };
  const openCronlet = (c)=>{ setSel(c); setRoute("detail"); window.scrollTo(0,0); };
  const openBuilder = (item)=>{ setSeed({ name: item.text.split(" ").slice(0,4).map(w=>w[0].toUpperCase()+w.slice(1)).join(" "), text:item.text }); setRoute("builder"); window.scrollTo(0,0); };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:T.bg, color:T.ink }}>
      <Sidebar route={route} go={go} />
      <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column" }}>
        <TopBar />
        <main style={{ flex:1, padding:"28px 36px 60px", maxWidth:1240, width:"100%", margin:"0 auto" }}>
          {route==="dashboard" && <RunConsole onOpen={openCronlet} go={go} />}
          {route==="detail" && sel && <CronletDetail c={sel} onBack={()=>go("dashboard")} go={go} />}
          {route==="builder" && <CronletBuilder go={go} seed={seed} />}
          {route==="review" && <WeeklyReview go={go} />}
          {route==="inbox" && <RoutineInbox go={go} openBuilder={openBuilder} />}
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
