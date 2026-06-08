/* ============================================================
   MyCron — builder.jsx : Cronlet Builder (Done Policy + Evidence)
   ============================================================ */

function Field({ label, hint, children }) {
  return (
    <div>
      <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:7 }}>
        <label style={{ fontSize:12.5, fontWeight:600, color:T.ink, whiteSpace:"nowrap" }}>{label}</label>
        {hint && <Mono dim style={{ fontSize:10.5 }}>{hint}</Mono>}
      </div>
      {children}
    </div>
  );
}

function Input({ value, onChange, mono, placeholder }) {
  return (
    <input value={value} placeholder={placeholder} onChange={e=>onChange&&onChange(e.target.value)}
      style={{ width:"100%", height:40, padding:"0 12px", borderRadius:9, border:`1px solid ${T.border}`,
        background:T.surface, fontSize:13.5, color:T.ink, outline:"none",
        fontFamily: mono?"'JetBrains Mono',monospace":"inherit",
        transition:"border-color .12s" }}
      onFocus={e=>e.target.style.borderColor=T.bright}
      onBlur={e=>e.target.style.borderColor=T.border} />
  );
}

function Select({ value, onChange, options }) {
  return (
    <div style={{ position:"relative" }}>
      <select value={value} onChange={e=>onChange(e.target.value)} style={{ width:"100%", height:40, padding:"0 36px 0 12px",
        borderRadius:9, border:`1px solid ${T.border}`, background:T.surface, fontSize:13.5, color:T.ink,
        outline:"none", appearance:"none", cursor:"pointer" }}>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
      <Icon name="chevD" size={15} color={T.faint} style={{ position:"absolute", right:12, top:13, pointerEvents:"none" }} />
    </div>
  );
}

function PolicyToggle({ on, onToggle, label, detail, required, evidence }) {
  return (
    <div style={{ display:"flex", gap:13, alignItems:"flex-start", padding:"14px 16px",
      borderTop:`1px solid ${T.hair}` }}>
      <button onClick={required?undefined:onToggle} disabled={required} style={{
        width:38, height:22, borderRadius:12, flex:"none", marginTop:1, position:"relative", cursor:required?"default":"pointer",
        background: on?T.deep:T.surface3, border:`1px solid ${on?T.deep:T.borderStrong}`, transition:"all .15s",
        opacity:required?0.85:1 }}>
        <span style={{ position:"absolute", top:2, left:on?18:2, width:16, height:16, borderRadius:"50%",
          background:"#fff", boxShadow:"0 1px 2px rgba(0,0,0,.2)", transition:"left .15s" }} />
      </button>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:13.5, fontWeight:500, color:T.ink }}>{label}</span>
          {required && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9.5, fontWeight:600,
            color:T.faint, letterSpacing:"0.08em", background:T.surface2, border:`1px solid ${T.hair}`,
            padding:"1px 6px", borderRadius:5 }}>REQUIRED</span>}
          {evidence && <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontFamily:"'JetBrains Mono',monospace",
            fontSize:9.5, fontWeight:600, color:T.green, letterSpacing:"0.06em" }}>
            <Icon name="lock" size={11} color={T.green} />PRODUCES EVIDENCE</span>}
        </div>
        <div style={{ fontSize:12, color:T.faint, marginTop:3, lineHeight:1.45 }}>{detail}</div>
      </div>
    </div>
  );
}

function CronletBuilder({ go, seed }) {
  const [name, setName] = React.useState(seed?.name || "Staging Deploy Watch");
  const [intent, setIntent] = React.useState(seed?.text || "Check if the staging deploy is healthy and report status each morning.");
  const [when, setWhen] = React.useState("Every weekday · 08:00");
  const [tz, setTz] = React.useState("Asia/Seoul");
  const [agent, setAgent] = React.useState("OpsAgent");
  const [output, setOutput] = React.useState("MyCron Inbox + Telegram");
  const [policy, setPolicy] = React.useState({
    ran:true, sources:true, output:true, evidence:true, goal:false, nofail:false,
  });
  const t = (k)=> setPolicy(p=>({ ...p, [k]:!p[k] }));

  const cronMap = { "Every weekday · 08:00":"0 8 * * 1-5", "Daily · 09:00":"0 9 * * *",
    "Mondays · 07:00":"0 7 * * 1", "Hourly · business hours":"0 9-18 * * 1-5" };
  const cron = cronMap[when] || "0 8 * * 1-5";

  const evid = [
    policy.output && "output_file",
    policy.sources && "source_manifest",
    policy.evidence && "delivery_receipt",
    policy.ran && "run_log",
  ].filter(Boolean);

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
        <button onClick={()=>go("dashboard")} style={{ display:"flex", alignItems:"center", gap:7, border:"none",
          background:"transparent", cursor:"pointer", color:T.sub, fontSize:13, fontWeight:500 }}>
          <Icon name="chevR" size={15} style={{ transform:"rotate(180deg)" }} /> Run Console
        </button>
      </div>
      <div style={{ marginBottom:22 }}>
        <Eyebrow style={{ marginBottom:10 }}>New Cronlet</Eyebrow>
        <h1 style={{ fontSize:27, fontWeight:700, letterSpacing:"-0.032em", color:T.ink, margin:0 }}>
          Define the routine — and what counts as done
        </h1>
        <p style={{ fontSize:14, color:T.sub, margin:"8px 0 0", maxWidth:620, lineHeight:1.5 }}>
          A Cronlet isn't finished when it runs. It's finished when its Done Policy is satisfied and the evidence is captured.
        </p>
      </div>

      {seed && (
        <div style={{ display:"flex", gap:11, alignItems:"center", padding:"11px 15px", marginBottom:18,
          background:T.mint, border:`1px solid ${T.mintLine}`, borderRadius:11 }}>
          <Icon name="inbox" size={16} color={T.deep} />
          <span style={{ fontSize:12.5, color:T.deep }}>Promoted from Routine Inbox · <span style={{ fontStyle:"italic" }}>"{seed.text}"</span></span>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:18, alignItems:"start" }}>
        {/* left: definition */}
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          {/* intent + schedule */}
          <Card pad={18}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:15 }}>
              <Icon name="calendar" size={16} color={T.green} />
              <span style={{ fontSize:14, fontWeight:700, color:T.ink, whiteSpace:"nowrap" }}>Intent & schedule</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:15 }}>
              <Field label="Routine name"><Input value={name} onChange={setName} /></Field>
              <Field label="What should the agent do?">
                <textarea value={intent} onChange={e=>setIntent(e.target.value)} rows={2}
                  style={{ width:"100%", padding:"10px 12px", borderRadius:9, border:`1px solid ${T.border}`,
                    background:T.surface, fontSize:13.5, color:T.ink, outline:"none", resize:"vertical",
                    fontFamily:"inherit", lineHeight:1.5 }} />
              </Field>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:13 }}>
                <Field label="When" hint={cron}><Select value={when} onChange={setWhen} options={Object.keys(cronMap)} /></Field>
                <Field label="Timezone"><Select value={tz} onChange={setTz} options={["Asia/Seoul","UTC","America/New_York","Europe/London"]} /></Field>
                <Field label="Agent / runtime"><Select value={agent} onChange={setAgent} options={["OpsAgent","FinAgent","TrendAgent","PlanAgent","CodeAgent"]} /></Field>
                <Field label="Deliver results to"><Select value={output} onChange={setOutput} options={["MyCron Inbox + Telegram","MyCron Inbox + Slack","MyCron Inbox only","GitHub + Inbox"]} /></Field>
              </div>
            </div>
          </Card>

          {/* DONE POLICY — the heart */}
          <Card pad={0}>
            <div style={{ padding:"16px 18px 14px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <Icon name="checkCircle" size={16} color={T.green} />
                <span style={{ fontSize:14, fontWeight:700, color:T.ink, whiteSpace:"nowrap" }}>Done Policy</span>
              </div>
              <p style={{ fontSize:12.5, color:T.sub, margin:"7px 0 0", lineHeight:1.5 }}>
                The run is only marked <b style={{ color:T.okText }}>Verified</b> when every enabled condition passes. Anything short of that stays <b style={{ color:T.unvText }}>Unverified</b>.
              </p>
            </div>
            <PolicyToggle on={policy.ran} required label="Process completes cleanly" detail="Agent exits 0 within the timeout window." evidence />
            <PolicyToggle on={policy.sources} onToggle={()=>t("sources")} label="All required sources reached" detail="Every declared input returns a valid response — partial responses fail." evidence />
            <PolicyToggle on={policy.output} onToggle={()=>t("output")} label="Output artifact generated" detail="A non-empty file or message is produced and stored." evidence />
            <PolicyToggle on={policy.evidence} onToggle={()=>t("evidence")} label="Evidence captured & linked" detail="Delivery receipts and artifact references are recorded to the manifest." evidence />
            <PolicyToggle on={policy.goal} onToggle={()=>t("goal")} label="User goal confirmed" detail="Wait for an explicit read-back or approval before counting as done." />
            <PolicyToggle on={policy.nofail} onToggle={()=>t("nofail")} label="No silent schedule drift" detail="Flag as Stale if a scheduled run is missed by more than one interval." />
          </Card>

          {/* EVIDENCE REQUIREMENTS */}
          <Card pad={18}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <Icon name="lock" size={16} color={T.green} />
              <span style={{ fontSize:14, fontWeight:700, color:T.ink, whiteSpace:"nowrap" }}>Evidence requirements</span>
            </div>
            <p style={{ fontSize:12.5, color:T.sub, margin:"0 0 14px", lineHeight:1.5 }}>
              Derived from your Done Policy. These artifacts must exist for the run to be provable.
            </p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:9 }}>
              {[
                { k:"output_file", icon:"fileText", label:"Output file" },
                { k:"source_manifest", icon:"link", label:"Source manifest" },
                { k:"delivery_receipt", icon:"send", label:"Delivery receipt" },
                { k:"run_log", icon:"terminal", label:"Run log" },
              ].map(e=>{
                const active = evid.includes(e.k);
                return (
                  <div key={e.k} style={{ display:"flex", alignItems:"center", gap:8, height:34, padding:"0 12px",
                    borderRadius:9, border:`1px solid ${active?T.mintLine:T.border}`, background:active?T.mint:T.surface2,
                    opacity:active?1:0.5 }}>
                    <Icon name={active?"checkCircle":e.icon} size={15} color={active?T.okDot:T.faint} />
                    <span style={{ fontSize:12.5, fontWeight:500, color:active?T.deep:T.faint }}>{e.label}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* right: live .mc manifest + validator */}
        <div style={{ position:"sticky", top:18, display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ background:"#11201A", borderRadius:14, border:`1px solid #1E3A2C`, overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 14px",
              borderBottom:"1px solid #1E3A2C" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9.5, fontWeight:700, color:"#7FD0A2",
                  letterSpacing:"0.1em", background:"#16302330", border:"1px solid #2A4A38", padding:"2px 6px", borderRadius:5 }}>.mc</span>
                <Mono style={{ fontSize:11, color:"#8FB39F" }}>{name.toLowerCase().replace(/[^a-z0-9]+/g,"_")}.mc</Mono>
              </div>
              <Icon name="copy" size={13} color="#5E8470" />
            </div>
            <div style={{ padding:"14px 15px", lineHeight:1.85 }}>
              {[
                ["name", `"${name}"`, "#E7F3EB"],
                ["intent", `"${intent.slice(0,40)}${intent.length>40?"…":""}"`, "#8FB39F"],
                ["schedule", "", null],
                ["  cron", `"${cron}"`, "#7FD0A2"],
                ["  tz", `"${tz}"`, "#7FD0A2"],
                ["agent", `"${agent}"`, "#E7F3EB"],
                ["deliver", `"${output}"`, "#8FB39F"],
                ["done_policy", "", null],
                ...Object.entries(policy).filter(([,v])=>v).map(([k])=>[`  - ${k}`, "true", "#7FD0A2"]),
                ["evidence", `[${evid.map(e=>e.replace(/_/g," ").split(" ")[0]).join(", ")}]`, "#D9C58A"],
              ].map((r,i)=>(
                <div key={i} style={{ display:"flex", gap:8, fontFamily:"'JetBrains Mono',monospace", fontSize:11.5 }}>
                  <span style={{ color:"#4E7361", minWidth:14, textAlign:"right" }}>{i+1}</span>
                  <span style={{ color:"#6E9883" }}>{r[0]}{r[2]?":":""}</span>
                  {r[1] && <span style={{ color:r[2], whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r[1]}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* next runs validator */}
          <Card pad={0}>
            <div style={{ padding:"13px 15px 10px", display:"flex", alignItems:"center", gap:8 }}>
              <Icon name="history" size={14} color={T.faint} />
              <Eyebrow style={{ fontSize:10 }}>Next 4 runs · {tz}</Eyebrow>
            </div>
            <div style={{ borderTop:`1px solid ${T.hair}` }}>
              {["Mon Jun 9 · 08:00","Tue Jun 10 · 08:00","Wed Jun 11 · 08:00","Thu Jun 12 · 08:00"].map((d,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 15px",
                  borderTop: i?`1px solid ${T.hair}`:"none" }}>
                  <Mono dim style={{ fontSize:10, minWidth:12 }}>{i+1}</Mono>
                  <Mono c={T.sub} style={{ fontSize:11.5 }}>{d}</Mono>
                  <span style={{ marginLeft:"auto" }}><StatusDot status="scheduled" size={7} /></span>
                </div>
              ))}
            </div>
          </Card>

          <Btn kind="primary" icon="sparkle" full size="lg" onClick={()=>go("dashboard")}>Approve & create Cronlet</Btn>
          <Mono dim style={{ fontSize:10.5, textAlign:"center" }}>Human-readable and machine-replayable. Stored to your account only.</Mono>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CronletBuilder });
