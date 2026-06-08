/* ============================================================
   MyCron — detail.jsx : Cronlet Detail + Proof / Evidence Panel
   ============================================================ */

/* verification seal — the visual proof of "done is a verified state" */
function Seal({ state }) {
  const map = {
    verified:   { c:T.okText,    line:T.okLine,    bg:T.okBg,    t:"VERIFIED",   g:"shieldChk" },
    unverified: { c:T.unvText,   line:T.unvLine,   bg:T.unvBg,   t:"UNVERIFIED", g:"shield" },
    failed:     { c:T.badText,   line:T.badLine,   bg:T.badBg,   t:"FAILED",     g:"alert" },
    stale:      { c:T.staleText, line:T.staleLine, bg:T.staleBg, t:"STALE",      g:"clock" },
  };
  const s = map[state] || map.unverified;
  const dashed = state !== "verified";
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
      <div style={{ width:72, height:72, borderRadius:"50%", display:"grid", placeItems:"center",
        background:s.bg, border:`2px ${dashed?"dashed":"solid"} ${s.c}`, position:"relative" }}>
        <div style={{ position:"absolute", inset:5, borderRadius:"50%", border:`1px solid ${s.line}` }} />
        <Icon name={s.g} size={30} sw={1.8} color={s.c} />
      </div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700,
        letterSpacing:"0.16em", color:s.c }}>{s.t}</div>
    </div>
  );
}

/* done policy — verification checklist */
function DonePolicy({ c }) {
  const met = c.donePolicy.filter(d=>d.state==="verified").length;
  const total = c.donePolicy.length;
  return (
    <Card pad={0}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"15px 18px 13px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <Icon name="checkCircle" size={17} color={T.green} />
          <span style={{ fontSize:14, fontWeight:700, color:T.ink, whiteSpace:"nowrap" }}>Done Policy</span>
        </div>
        <Mono c={met===total?T.okText:T.sub} style={{ fontSize:11.5, fontWeight:600 }}>
          {met} / {total} conditions met
        </Mono>
      </div>
      {/* progress segments */}
      <div style={{ display:"flex", gap:4, padding:"0 18px 14px" }}>
        {c.donePolicy.map((d,i)=>{
          const col = d.state==="verified"?T.okDot:d.state==="failed"?T.badDot:d.state==="stale"?T.staleDot:T.unvLine;
          return <div key={i} style={{ flex:1, height:4, borderRadius:3, background:col }} />;
        })}
      </div>
      {/* conditions */}
      <div style={{ borderTop:`1px solid ${T.hair}` }}>
        {c.donePolicy.map((d,i)=>{
          const s = STATUS[d.state] || STATUS.unverified;
          const glyph = d.state==="verified"?"check":d.state==="failed"?"x":d.state==="stale"?"clock":"dot";
          return (
            <div key={d.id} style={{ display:"flex", gap:13, alignItems:"flex-start", padding:"13px 18px",
              borderTop: i?`1px solid ${T.hair}`:"none" }}>
              <div style={{ width:22, height:22, borderRadius:"50%", flex:"none", marginTop:1,
                background:s.bg, border:`1px solid ${s.line}`, display:"grid", placeItems:"center" }}>
                <Icon name={glyph} size={13} sw={2.2} color={s.dot} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13.5, fontWeight:500, color:T.ink }}>{d.label}</div>
                <div style={{ fontSize:12, color:T.faint, marginTop:2 }}>{d.detail}</div>
              </div>
              <StatusBadge status={d.state} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* evidence manifest — the receipt of proof */
function EvidenceManifest({ c }) {
  const [copied, setCopied] = React.useState(false);
  const incomplete = c.evidence.some(e=>e.warn);
  return (
    <div style={{ position:"relative" }}>
      {/* notched top edge for "receipt" feel */}
      <div style={{ position:"absolute", top:-1, left:14, right:14, height:8, display:"flex", overflow:"hidden" }}>
        {Array.from({length:40}).map((_,i)=>(
          <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:T.bg, flex:"none",
            marginLeft: i?-1:0, transform:"translateY(-4px)" }} />
        ))}
      </div>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:"3px 3px 14px 14px",
        boxShadow:"0 1px 2px rgba(20,32,26,.04)", paddingTop:6 }}>
        {/* header */}
        <div style={{ padding:"14px 18px 12px", display:"flex", alignItems:"center", justifyContent:"space-between",
          borderBottom:`1px dashed ${T.border}` }}>
          <div>
            <Eyebrow style={{ letterSpacing:"0.16em" }}>Evidence Manifest</Eyebrow>
            <Mono dim style={{ fontSize:10.5, display:"block", marginTop:4 }}>{c.runId} · {c.lastRun}</Mono>
          </div>
          <Seal state={c.state} />
        </div>
        {/* evidence lines */}
        <div style={{ padding:"6px 0" }}>
          {c.evidence.map((e,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 18px" }}>
              <div style={{ width:30, height:30, borderRadius:8, flex:"none", display:"grid", placeItems:"center",
                background: e.warn?T.staleBg:T.surface2, border:`1px solid ${e.warn?T.staleLine:T.hair}` }}>
                <Icon name={e.icon} size={15} sw={1.7} color={e.warn?T.staleText:T.green} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:500, color:T.ink }}>{e.label}</div>
                <Mono dim style={{ fontSize:10.5, display:"block", marginTop:2 }}>{e.meta}</Mono>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <Mono c={e.warn?T.staleText:T.sub} style={{ fontSize:11 }}>{e.ref}</Mono>
                <Icon name={e.warn?"alert":"checkCircle"} size={15} color={e.warn?T.staleDot:T.okDot} />
              </div>
            </div>
          ))}
        </div>
        {incomplete && (
          <div style={{ margin:"2px 14px 12px", padding:"10px 12px", background:T.staleBg, border:`1px solid ${T.staleLine}`,
            borderRadius:9, display:"flex", gap:9, alignItems:"flex-start" }}>
            <Icon name="alert" size={14} color={T.staleText} style={{ marginTop:1 }} />
            <span style={{ fontSize:12, color:T.staleText, lineHeight:1.45 }}>
              Manifest incomplete — completion can't be proven until every required source is confirmed.
            </span>
          </div>
        )}
        {/* read-back command */}
        <div style={{ margin:"0 14px 14px", borderRadius:9, overflow:"hidden", border:`1px solid ${T.borderStrong}` }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"7px 11px", background:T.surface2, borderBottom:`1px solid ${T.hair}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <Icon name="terminal" size={13} color={T.faint} />
              <Mono dim style={{ fontSize:10 }}>read-back · re-verify from source</Mono>
            </div>
            <button onClick={()=>{ navigator.clipboard?.writeText(c.readback); setCopied(true); setTimeout(()=>setCopied(false),1200); }}
              style={{ display:"flex", alignItems:"center", gap:5, border:"none", background:"transparent",
                cursor:"pointer", color:copied?T.okText:T.faint, fontSize:10.5, fontFamily:"'JetBrains Mono',monospace" }}>
              <Icon name={copied?"check":"copy"} size={12} /> {copied?"copied":"copy"}
            </button>
          </div>
          <div style={{ padding:"10px 12px", background:"#11201A" }}>
            <Mono c="#7FD0A2" style={{ fontSize:11.5 }}>$ {c.readback}</Mono>
          </div>
        </div>
      </div>
    </div>
  );
}

/* failure triage — only for failed / stale */
function TriagePanel({ c, go }) {
  const isFail = c.state==="failed";
  const s = STATUS[c.state];
  return (
    <Card style={{ borderColor:s.line, background:s.bg, overflow:"hidden" }}>
      <div style={{ padding:"15px 18px", display:"flex", gap:13, alignItems:"flex-start" }}>
        <div style={{ width:34, height:34, borderRadius:9, flex:"none", background:T.surface,
          border:`1px solid ${s.line}`, display:"grid", placeItems:"center" }}>
          <Icon name={isFail?"alert":"clock"} size={17} color={s.dot} />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:s.text }}>
            {isFail ? "This run failed verification" : "Schedule has drifted"}
          </div>
          <div style={{ fontSize:12.5, color:T.sub, marginTop:4, lineHeight:1.5 }}>{c.summary}</div>
          <div style={{ display:"flex", gap:22, marginTop:13, flexWrap:"wrap" }}>
            <div>
              <Eyebrow style={{ fontSize:9 }}>Last verified</Eyebrow>
              <Mono c={T.ink} style={{ fontSize:12, display:"block", marginTop:4 }}>{c.lastSuccess||"—"}</Mono>
            </div>
            {isFail && <div>
              <Eyebrow style={{ fontSize:9 }}>Error type</Eyebrow>
              <Mono c={T.badText} style={{ fontSize:12, display:"block", marginTop:4 }}>{c.errorType}</Mono>
            </div>}
            <div>
              <Eyebrow style={{ fontSize:9 }}>Next attempt</Eyebrow>
              <Mono c={T.ink} style={{ fontSize:12, display:"block", marginTop:4 }}>{c.nextRun}</Mono>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display:"flex", gap:10, padding:"12px 18px", borderTop:`1px solid ${s.line}`, background:T.surface }}>
        <Btn kind="primary" size="sm" icon="refresh">{isFail?"Retry now":"Re-arm schedule"}</Btn>
        <Btn kind="secondary" size="sm" icon="terminal">Open logs</Btn>
        <Btn kind="secondary" size="sm" icon="flag">Escalate to human</Btn>
      </div>
    </Card>
  );
}

function InfoCard({ icon, label, children, action, onAction }) {
  return (
    <Card pad={0}>
      <div style={{ padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Icon name={icon} size={15} color={T.faint} />
          <Eyebrow style={{ fontSize:10 }}>{label}</Eyebrow>
        </div>
        {action && <button onClick={onAction} style={{ border:"none", background:"transparent", cursor:"pointer",
          color:T.green, fontSize:12, fontWeight:500, display:"flex", alignItems:"center", gap:3 }}>{action}<Icon name="chevR" size={13} /></button>}
      </div>
      <div style={{ padding:"0 16px 15px" }}>{children}</div>
    </Card>
  );
}

function CronletDetail({ c, onBack, go }) {
  const showTriage = ["failed","stale"].includes(c.state);
  return (
    <div>
      {/* breadcrumb + actions */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
        <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:7, border:"none",
          background:"transparent", cursor:"pointer", color:T.sub, fontSize:13, fontWeight:500 }}>
          <Icon name="chevR" size={15} style={{ transform:"rotate(180deg)" }} /> Run Console
        </button>
        <div style={{ display:"flex", gap:9 }}>
          <Btn kind="secondary" size="sm" icon="external">Export .mc</Btn>
          <Btn kind="secondary" size="sm" icon="pause">Pause</Btn>
          <Btn kind="primary" size="sm" icon="play">Run now</Btn>
        </div>
      </div>

      {/* title block */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:16, marginBottom:20 }}>
        <div style={{ width:54, height:54, borderRadius:14, flex:"none", background:T.mint,
          border:`1px solid ${T.mintLine}`, display:"grid", placeItems:"center" }}>
          <Icon name={c.icon} size={26} sw={1.6} color={T.deep} />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <h1 style={{ fontSize:24, fontWeight:700, letterSpacing:"-0.03em", color:T.ink, margin:0 }}>{c.name}</h1>
            <StatusBadge status={c.state} />
          </div>
          <p style={{ fontSize:13.5, color:T.sub, margin:"7px 0 11px", maxWidth:600, lineHeight:1.5 }}>{c.intent}</p>
          <div style={{ display:"flex", alignItems:"center", gap:9, flexWrap:"wrap" }}>
            <AgentChip name={c.agent} runtime={c.runtime} />
            <span style={{ display:"inline-flex", alignItems:"center", gap:6, height:24, padding:"0 9px",
              borderRadius:7, background:T.surface2, border:`1px solid ${T.hair}` }}>
              <Icon name="calendar" size={13} color={T.faint} /><Mono style={{ fontSize:11 }}>{c.scheduleHuman}</Mono>
            </span>
            <span style={{ display:"inline-flex", alignItems:"center", gap:6, height:24, padding:"0 9px",
              borderRadius:7, background:T.surface2, border:`1px solid ${T.hair}` }}>
              <Icon name="hash" size={12} color={T.faint} /><Mono style={{ fontSize:11 }}>{c.cron}</Mono>
            </span>
          </div>
        </div>
      </div>

      {showTriage && <div style={{ marginBottom:18 }}><TriagePanel c={c} go={go} /></div>}

      {/* operational facts row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:18 }}>
        <InfoCard icon="clock" label="Next run">
          <div style={{ fontSize:16, fontWeight:700, color:T.ink, letterSpacing:"-0.01em" }}>{c.nextRun}</div>
          <Mono dim style={{ fontSize:11, display:"block", marginTop:3 }}>{c.tz}</Mono>
        </InfoCard>
        <InfoCard icon="pulse" label="7-day health">
          <div style={{ marginTop:3 }}><HealthStrip days={c.health} size={15} gap={5} labels /></div>
        </InfoCard>
        <InfoCard icon="gauge" label="Verified rate">
          <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
            <span style={{ fontSize:21, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
              color: c.verifiedRate>0.85?T.okText:c.verifiedRate>0.7?T.staleText:T.badText }}>{Math.round(c.verifiedRate*100)}%</span>
            <Mono dim style={{ fontSize:11 }}>30-day</Mono>
          </div>
        </InfoCard>
        <InfoCard icon="bolt" label="Run cost (30d)">
          <div style={{ fontSize:16, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:T.ink }}>{c.cost}</div>
          <Mono dim style={{ fontSize:11, display:"block", marginTop:3 }}>last run {c.lastDuration}</Mono>
        </InfoCard>
      </div>

      {/* proof: done policy + evidence manifest */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 0.92fr", gap:18, alignItems:"start" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          <DonePolicy c={c} />
          <InfoCard icon="fileText" label="Latest run summary" action="View output" onAction={()=>{}}>
            <p style={{ fontSize:13.5, color:T.ink, lineHeight:1.6, margin:0 }}>{c.summary}</p>
          </InfoCard>
        </div>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:13 }}>
            <Icon name="lock" size={14} color={T.green} />
            <span style={{ fontSize:13.5, fontWeight:700, color:T.ink, whiteSpace:"nowrap" }}>Proof of completion</span>
          </div>
          <EvidenceManifest c={c} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CronletDetail, DonePolicy, EvidenceManifest, Seal });
