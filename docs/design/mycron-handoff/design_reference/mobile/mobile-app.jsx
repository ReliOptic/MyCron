/* ============================================================
   MyCron — mobile-app.jsx : mobile Builder + shell/routing + mount
   ============================================================ */

/* ---------- Cronlet Builder (mobile) ---------- */
function MToggle({ on, onToggle, label, detail, required, evidence }) {
  return (
    <div style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"13px 15px", borderTop:`1px solid ${T.hair}` }}>
      <button onClick={required?undefined:onToggle} style={{ width:40, height:24, borderRadius:13, flex:"none", marginTop:1,
        position:"relative", cursor:required?"default":"pointer", border:`1px solid ${on?T.deep:T.borderStrong}`,
        background:on?T.deep:T.surface3, transition:"all .15s", opacity:required?0.85:1 }}>
        <span style={{ position:"absolute", top:2, left:on?18:2, width:18, height:18, borderRadius:"50%",
          background:"#fff", boxShadow:"0 1px 2px rgba(0,0,0,.2)", transition:"left .15s" }} />
      </button>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
          <span style={{ fontSize:13.5, fontWeight:500, color:T.ink }}>{label}</span>
          {required && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:600, color:T.faint,
            letterSpacing:"0.06em", background:T.surface2, border:`1px solid ${T.hair}`, padding:"1px 5px", borderRadius:5 }}>REQUIRED</span>}
          {evidence && <span style={{ display:"inline-flex", alignItems:"center", gap:3, fontFamily:"'JetBrains Mono',monospace",
            fontSize:9, fontWeight:600, color:T.green, letterSpacing:"0.04em" }}><Icon name="lock" size={10} color={T.green} />EVIDENCE</span>}
        </div>
        <div style={{ fontSize:11.5, color:T.faint, marginTop:3, lineHeight:1.45 }}>{detail}</div>
      </div>
    </div>
  );
}

function MBuilder({ go, seed }) {
  const [name, setName] = React.useState(seed?.name || "Staging Deploy Watch");
  const [intent, setIntent] = React.useState(seed?.text || "Check if the staging deploy is healthy and report status each morning.");
  const [when, setWhen] = React.useState("Every weekday · 08:00");
  const [agent, setAgent] = React.useState("OpsAgent");
  const [policy, setPolicy] = React.useState({ ran:true, sources:true, output:true, evidence:true, goal:false, nofail:false });
  const t = (k)=> setPolicy(p=>({ ...p, [k]:!p[k] }));
  const cronMap = { "Every weekday · 08:00":"0 8 * * 1-5", "Daily · 09:00":"0 9 * * *", "Mondays · 07:00":"0 7 * * 1" };
  const cron = cronMap[when]||"0 8 * * 1-5";
  const evid = [policy.output&&"output_file", policy.sources&&"source_manifest", policy.evidence&&"delivery_receipt", policy.ran&&"run_log"].filter(Boolean);
  const fieldStyle = { width:"100%", height:42, padding:"0 13px", borderRadius:10, border:`1px solid ${T.border}`,
    background:T.surface, fontSize:14, color:T.ink, outline:"none", WebkitAppearance:"none", appearance:"none" };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <MHeader eyebrow="New Cronlet" title="New Cronlet" onBack={()=>go("console")} />
      <div style={{ flex:1, overflow:"auto", padding:`16px 16px ${TAB_H+90}px` }}>
        {seed && (
          <div style={{ display:"flex", gap:9, alignItems:"center", padding:"10px 13px", marginBottom:14,
            background:T.mint, border:`1px solid ${T.mintLine}`, borderRadius:11 }}>
            <Icon name="inbox" size={15} color={T.deep} style={{ flex:"none" }} />
            <span style={{ fontSize:12, color:T.deep, lineHeight:1.4 }}>Promoted from Inbox · <i>"{seed.text.slice(0,42)}…"</i></span>
          </div>
        )}

        {/* intent & schedule */}
        <MCard style={{ marginBottom:14 }}>
          <MCardHead icon="calendar" title="Intent & schedule" />
          <div style={{ display:"flex", flexDirection:"column", gap:13, padding:"0 15px 15px" }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:T.ink, display:"block", marginBottom:6 }}>Routine name</label>
              <input value={name} onChange={e=>setName(e.target.value)} style={fieldStyle} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:T.ink, display:"block", marginBottom:6 }}>What should the agent do?</label>
              <textarea value={intent} onChange={e=>setIntent(e.target.value)} rows={3} style={{ ...fieldStyle, height:"auto",
                padding:"10px 13px", lineHeight:1.5, resize:"none", fontFamily:"inherit" }} />
            </div>
            <div style={{ display:"flex", gap:11 }}>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:12, fontWeight:600, color:T.ink, display:"block", marginBottom:6 }}>When</label>
                <div style={{ position:"relative" }}>
                  <select value={when} onChange={e=>setWhen(e.target.value)} style={{ ...fieldStyle, paddingRight:34 }}>
                    {Object.keys(cronMap).map(o=><option key={o}>{o}</option>)}
                  </select>
                  <Icon name="chevD" size={15} color={T.faint} style={{ position:"absolute", right:12, top:14, pointerEvents:"none" }} />
                </div>
                <Mono dim style={{ fontSize:10, display:"block", marginTop:5 }}>{cron}</Mono>
              </div>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:12, fontWeight:600, color:T.ink, display:"block", marginBottom:6 }}>Agent</label>
                <div style={{ position:"relative" }}>
                  <select value={agent} onChange={e=>setAgent(e.target.value)} style={{ ...fieldStyle, paddingRight:34 }}>
                    {["OpsAgent","FinAgent","TrendAgent","PlanAgent","CodeAgent"].map(o=><option key={o}>{o}</option>)}
                  </select>
                  <Icon name="chevD" size={15} color={T.faint} style={{ position:"absolute", right:12, top:14, pointerEvents:"none" }} />
                </div>
              </div>
            </div>
          </div>
        </MCard>

        {/* done policy */}
        <MCard style={{ marginBottom:14 }}>
          <div style={{ padding:"15px 15px 12px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Icon name="checkCircle" size={16} color={T.green} />
              <span style={{ fontSize:14, fontWeight:600, color:T.ink }}>Done Policy</span>
            </div>
            <p style={{ fontSize:12, color:T.sub, margin:"7px 0 0", lineHeight:1.5 }}>
              The run is only marked <b style={{ color:T.okText }}>Verified</b> when every enabled condition passes. Anything short stays <b style={{ color:T.unvText }}>Unverified</b>.
            </p>
          </div>
          <MToggle on={policy.ran} required label="Process completes cleanly" detail="Agent exits 0 within the timeout window." evidence />
          <MToggle on={policy.sources} onToggle={()=>t("sources")} label="All required sources reached" detail="Every declared input returns valid data — partials fail." evidence />
          <MToggle on={policy.output} onToggle={()=>t("output")} label="Output artifact generated" detail="A non-empty file or message is produced and stored." evidence />
          <MToggle on={policy.evidence} onToggle={()=>t("evidence")} label="Evidence captured & linked" detail="Delivery receipts and artifact refs recorded to the manifest." evidence />
          <MToggle on={policy.goal} onToggle={()=>t("goal")} label="User goal confirmed" detail="Wait for an explicit read-back before counting as done." />
          <MToggle on={policy.nofail} onToggle={()=>t("nofail")} label="No silent schedule drift" detail="Flag as Stale if a run is missed by more than one interval." />
        </MCard>

        {/* evidence requirements */}
        <MCard>
          <div style={{ padding:"15px 15px 10px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Icon name="lock" size={16} color={T.green} />
              <span style={{ fontSize:14, fontWeight:600, color:T.ink }}>Evidence requirements</span>
            </div>
            <p style={{ fontSize:12, color:T.sub, margin:"7px 0 0", lineHeight:1.5 }}>Derived from your Done Policy. These must exist for a run to be provable.</p>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, padding:"0 15px 15px" }}>
            {[{k:"output_file",icon:"fileText",label:"Output file"},{k:"source_manifest",icon:"link",label:"Source manifest"},
              {k:"delivery_receipt",icon:"send",label:"Delivery receipt"},{k:"run_log",icon:"terminal",label:"Run log"}].map(e=>{
              const active = evid.includes(e.k);
              return (
                <div key={e.k} style={{ display:"flex", alignItems:"center", gap:7, height:34, padding:"0 12px", borderRadius:9,
                  border:`1px solid ${active?T.mintLine:T.border}`, background:active?T.mint:T.surface2, opacity:active?1:0.5 }}>
                  <Icon name={active?"checkCircle":e.icon} size={14} color={active?T.okDot:T.faint} />
                  <span style={{ fontSize:12, fontWeight:500, color:active?T.deep:T.faint }}>{e.label}</span>
                </div>
              );
            })}
          </div>
        </MCard>
      </div>

      {/* sticky create */}
      <div style={{ position:"absolute", left:0, right:0, bottom:0, padding:`12px 16px ${HOME_H+12}px`,
        background:`${T.panel}F2`, backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
        borderTop:`1px solid ${T.border}`, zIndex:20 }}>
        <button onClick={()=>go("console")} style={{ width:"100%", height:48, borderRadius:13, border:"none", background:T.deep,
          color:"#EAF3ED", fontSize:15, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <Icon name="sparkle" size={17} color="#EAF3ED" /> Approve & create Cronlet</button>
      </div>
    </div>
  );
}

/* ---------- shell + routing ---------- */
function MobileApp() {
  const [route, setRoute] = React.useState("console");
  const [sel, setSel] = React.useState(null);
  const [seed, setSeed] = React.useState(null);
  const scrollRef = React.useRef(null);

  const go = (r)=>{ setRoute(r); if(r!=="builder") setSeed(null); };
  const openCronlet = (c)=>{ setSel(c); setRoute("detail"); };
  const openBuilder = (item)=>{ setSeed({ name:item.text.split(" ").slice(0,4).map(w=>w[0].toUpperCase()+w.slice(1)).join(" "), text:item.text }); setRoute("builder"); };
  const showTab = !["detail","builder"].includes(route);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:T.bg, position:"relative" }}>
      <div style={{ flex:1, minHeight:0, position:"relative" }}>
        {route==="console" && <MConsole go={go} onOpen={openCronlet} />}
        {route==="detail" && sel && <MDetail c={sel} onBack={()=>go("console")} go={go} />}
        {route==="builder" && <MBuilder go={go} seed={seed} />}
        {route==="inbox" && <MInbox go={go} openBuilder={openBuilder} />}
        {route==="review" && <MReview go={go} />}
      </div>
      {showTab && <TabBar route={route} go={go} />}
    </div>
  );
}

function Mount() {
  return (
    <div style={{ minHeight:"100vh", width:"100%", display:"grid", placeItems:"center",
      background:"#E9EBEC", padding:"40px 20px",
      backgroundImage:"radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)", backgroundSize:"22px 22px" }}>
      <IOSDevice width={390} height={844}>
        <MobileApp />
      </IOSDevice>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Mount />);
