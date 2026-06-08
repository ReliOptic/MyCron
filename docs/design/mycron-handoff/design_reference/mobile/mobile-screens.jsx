/* ============================================================
   MyCron — mobile-screens.jsx : Detail+Proof, Inbox, Review (mobile)
   ============================================================ */

/* verification seal (mobile) */
function MSeal({ state }) {
  const map = {
    verified:   { c:T.okText,    line:T.okLine,    bg:T.okBg,    t:"VERIFIED",   g:"shieldChk" },
    unverified: { c:T.unvText,   line:T.unvLine,   bg:T.unvBg,   t:"UNVERIFIED", g:"shield" },
    failed:     { c:T.badText,   line:T.badLine,   bg:T.badBg,   t:"FAILED",     g:"alert" },
    stale:      { c:T.staleText, line:T.staleLine, bg:T.staleBg, t:"STALE",      g:"clock" },
  };
  const s = map[state] || map.unverified;
  const dashed = state !== "verified";
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:7 }}>
      <div style={{ width:58, height:58, borderRadius:"50%", display:"grid", placeItems:"center",
        background:s.bg, border:`2px ${dashed?"dashed":"solid"} ${s.c}`, position:"relative" }}>
        <div style={{ position:"absolute", inset:4, borderRadius:"50%", border:`1px solid ${s.line}` }} />
        <Icon name={s.g} size={25} sw={1.8} color={s.c} />
      </div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700,
        letterSpacing:"0.16em", color:s.c }}>{s.t}</div>
    </div>
  );
}

/* mobile section card */
function MCard({ children, style }) {
  return <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:15,
    boxShadow:"0 1px 2px rgba(20,32,26,.04)", overflow:"hidden", ...style }}>{children}</div>;
}
function MCardHead({ icon, title, right }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 15px 12px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <Icon name={icon} size={16} color={T.green} />
        <span style={{ fontSize:14, fontWeight:600, color:T.ink }}>{title}</span>
      </div>
      {right}
    </div>
  );
}

/* ---------- Cronlet Detail (mobile) ---------- */
function MDetail({ c, onBack, go }) {
  const showTriage = ["failed","stale"].includes(c.state);
  const met = c.donePolicy.filter(d=>d.state==="verified").length;
  const incomplete = c.evidence.some(e=>e.warn);
  const sT = STATUS[c.state];
  const [copied, setCopied] = React.useState(false);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <MHeader title={c.name} eyebrow="Cronlet" onBack={onBack}
        trailing={<StatusBadge status={c.state} />} />

      <div style={{ flex:1, overflow:"auto", padding:`16px 16px ${TAB_H+90}px` }}>
        {/* identity */}
        <div style={{ display:"flex", gap:13, marginBottom:14 }}>
          <div style={{ width:48, height:48, borderRadius:13, flex:"none", background:T.mint,
            border:`1px solid ${T.mintLine}`, display:"grid", placeItems:"center" }}>
            <Icon name={c.icon} size={24} sw={1.6} color={T.deep} />
          </div>
          <p style={{ fontSize:13.5, color:T.sub, margin:0, lineHeight:1.5, flex:1 }}>{c.intent}</p>
        </div>
        {/* meta chips */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
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

        {/* triage */}
        {showTriage && (
          <MCard style={{ borderColor:sT.line, background:sT.bg, marginBottom:14 }}>
            <div style={{ padding:"14px 15px", display:"flex", gap:12 }}>
              <div style={{ width:32, height:32, borderRadius:9, flex:"none", background:T.surface,
                border:`1px solid ${sT.line}`, display:"grid", placeItems:"center" }}>
                <Icon name={c.state==="failed"?"alert":"clock"} size={16} color={sT.dot} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13.5, fontWeight:700, color:sT.text }}>
                  {c.state==="failed"?"This run failed verification":"Schedule has drifted"}
                </div>
                <div style={{ fontSize:12.5, color:T.sub, marginTop:4, lineHeight:1.5 }}>{c.summary}</div>
                <div style={{ display:"flex", gap:18, marginTop:11 }}>
                  <div><Eyebrow style={{ fontSize:8.5 }}>Last verified</Eyebrow>
                    <Mono c={T.ink} style={{ fontSize:11.5, display:"block", marginTop:3 }}>{c.lastSuccess||"—"}</Mono></div>
                  {c.errorType && <div><Eyebrow style={{ fontSize:8.5 }}>Error</Eyebrow>
                    <Mono c={T.badText} style={{ fontSize:11.5, display:"block", marginTop:3 }}>{c.errorType}</Mono></div>}
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:8, padding:"11px 15px", borderTop:`1px solid ${sT.line}`, background:T.surface }}>
              <button style={{ flex:1, height:36, borderRadius:9, border:"none", background:T.deep, color:"#EAF3ED",
                fontSize:12.5, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <Icon name="refresh" size={15} color="#EAF3ED" />{c.state==="failed"?"Retry":"Re-arm"}</button>
              <button style={{ flex:1, height:36, borderRadius:9, border:`1px solid ${T.borderStrong}`, background:T.surface,
                color:T.ink, fontSize:12.5, fontWeight:600, cursor:"pointer" }}>Escalate</button>
            </div>
          </MCard>
        )}

        {/* facts strip */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:11, marginBottom:14 }}>
          <MCard style={{ padding:"12px 14px" }}>
            <Eyebrow style={{ fontSize:9 }}>Next run</Eyebrow>
            <div style={{ fontSize:14.5, fontWeight:700, color:T.ink, marginTop:7, letterSpacing:"-0.01em" }}>{c.nextRun}</div>
            <Mono dim style={{ fontSize:10.5, display:"block", marginTop:3 }}>{c.tz}</Mono>
          </MCard>
          <MCard style={{ padding:"12px 14px" }}>
            <Eyebrow style={{ fontSize:9 }}>Verified rate</Eyebrow>
            <div style={{ display:"flex", alignItems:"baseline", gap:5, marginTop:7 }}>
              <span style={{ fontSize:19, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                color:c.verifiedRate>0.85?T.okText:c.verifiedRate>0.7?T.staleText:T.badText }}>{Math.round(c.verifiedRate*100)}%</span>
              <Mono dim style={{ fontSize:10.5 }}>30-day</Mono>
            </div>
            <div style={{ marginTop:8 }}><HealthStrip days={c.health} size={11} gap={3} /></div>
          </MCard>
        </div>

        {/* PROOF — seal + done policy */}
        <div style={{ display:"flex", alignItems:"center", gap:8, margin:"4px 2px 11px" }}>
          <Icon name="lock" size={14} color={T.green} />
          <span style={{ fontSize:13.5, fontWeight:700, color:T.ink }}>Proof of completion</span>
        </div>

        <MCard style={{ marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, padding:"15px 15px 13px" }}>
            <MSeal state={c.state} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.ink }}>Done Policy</div>
              <Mono c={met===c.donePolicy.length?T.okText:T.sub} style={{ fontSize:11.5, fontWeight:600 }}>
                {met} / {c.donePolicy.length} conditions met</Mono>
              <div style={{ display:"flex", gap:3, marginTop:9 }}>
                {c.donePolicy.map((d,i)=>{
                  const col = d.state==="verified"?T.okDot:d.state==="failed"?T.badDot:d.state==="stale"?T.staleDot:T.unvLine;
                  return <div key={i} style={{ flex:1, height:4, borderRadius:3, background:col }} />;
                })}
              </div>
            </div>
          </div>
          <div style={{ borderTop:`1px solid ${T.hair}` }}>
            {c.donePolicy.map((d,i)=>{
              const s = STATUS[d.state]||STATUS.unverified;
              const glyph = d.state==="verified"?"check":d.state==="failed"?"x":d.state==="stale"?"clock":"dot";
              return (
                <div key={d.id} style={{ display:"flex", gap:11, alignItems:"flex-start", padding:"11px 15px",
                  borderTop:i?`1px solid ${T.hair}`:"none" }}>
                  <div style={{ width:20, height:20, borderRadius:"50%", flex:"none", marginTop:1,
                    background:s.bg, border:`1px solid ${s.line}`, display:"grid", placeItems:"center" }}>
                    <Icon name={glyph} size={12} sw={2.3} color={s.dot} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:T.ink }}>{d.label}</div>
                    <div style={{ fontSize:11.5, color:T.faint, marginTop:2 }}>{d.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </MCard>

        {/* EVIDENCE MANIFEST */}
        <MCard style={{ marginBottom:14 }}>
          <div style={{ padding:"13px 15px 11px", display:"flex", alignItems:"center", justifyContent:"space-between",
            borderBottom:`1px dashed ${T.border}` }}>
            <div>
              <Eyebrow style={{ letterSpacing:"0.14em", fontSize:10 }}>Evidence Manifest</Eyebrow>
              <Mono dim style={{ fontSize:10, display:"block", marginTop:3 }}>{c.runId} · {c.lastRun}</Mono>
            </div>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9.5, fontWeight:700, letterSpacing:"0.1em",
              color:STATUS[c.state].text }}>{c.evidence.length} ITEMS</span>
          </div>
          <div>
            {c.evidence.map((e,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:11, padding:"11px 15px",
                borderTop:i?`1px solid ${T.hair}`:"none" }}>
                <div style={{ width:30, height:30, borderRadius:8, flex:"none", display:"grid", placeItems:"center",
                  background:e.warn?T.staleBg:T.surface2, border:`1px solid ${e.warn?T.staleLine:T.hair}` }}>
                  <Icon name={e.icon} size={15} sw={1.7} color={e.warn?T.staleText:T.green} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12.5, fontWeight:500, color:T.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.label}</div>
                  <Mono dim style={{ fontSize:10, display:"block", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.meta}</Mono>
                </div>
                <Icon name={e.warn?"alert":"checkCircle"} size={16} color={e.warn?T.staleDot:T.okDot} />
              </div>
            ))}
          </div>
          {incomplete && (
            <div style={{ margin:"2px 12px 11px", padding:"9px 11px", background:T.staleBg, border:`1px solid ${T.staleLine}`,
              borderRadius:9, display:"flex", gap:8 }}>
              <Icon name="alert" size={14} color={T.staleText} style={{ marginTop:1, flex:"none" }} />
              <span style={{ fontSize:11.5, color:T.staleText, lineHeight:1.45 }}>
                Manifest incomplete — completion can't be proven until every required source is confirmed.
              </span>
            </div>
          )}
          {/* read-back */}
          <div style={{ margin:"0 12px 13px", borderRadius:9, overflow:"hidden", border:`1px solid ${T.borderStrong}` }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 11px",
              background:T.surface2, borderBottom:`1px solid ${T.hair}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <Icon name="terminal" size={12} color={T.faint} />
                <Mono dim style={{ fontSize:9.5 }}>read-back · re-verify</Mono>
              </div>
              <button onClick={()=>{ navigator.clipboard?.writeText(c.readback); setCopied(true); setTimeout(()=>setCopied(false),1200); }}
                style={{ display:"flex", alignItems:"center", gap:4, border:"none", background:"transparent", cursor:"pointer",
                  color:copied?T.okText:T.faint, fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>
                <Icon name={copied?"check":"copy"} size={12} />{copied?"copied":"copy"}</button>
            </div>
            <div style={{ padding:"10px 12px", background:"#11201A", overflowX:"auto" }}>
              <Mono c="#7FD0A2" style={{ fontSize:11, whiteSpace:"nowrap" }}>$ {c.readback}</Mono>
            </div>
          </div>
        </MCard>

        {/* summary */}
        <MCard>
          <MCardHead icon="fileText" title="Latest run summary"
            right={<span style={{ color:T.green, fontSize:12, fontWeight:600 }}>View output</span>} />
          <p style={{ fontSize:13, color:T.ink, lineHeight:1.6, margin:0, padding:"0 15px 15px" }}>{c.summary}</p>
        </MCard>
      </div>

      {/* sticky action bar */}
      <div style={{ position:"absolute", left:0, right:0, bottom:0, padding:`12px 16px ${HOME_H+12}px`,
        background:`${T.panel}F2`, backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
        borderTop:`1px solid ${T.border}`, display:"flex", gap:10, zIndex:20 }}>
        <button style={{ width:46, height:46, borderRadius:12, flex:"none", border:`1px solid ${T.borderStrong}`,
          background:T.surface, display:"grid", placeItems:"center", cursor:"pointer" }}>
          <Icon name="pause" size={18} color={T.sub} /></button>
        <button style={{ flex:1, height:46, borderRadius:12, border:"none", background:T.deep, color:"#EAF3ED",
          fontSize:14.5, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <Icon name="play" size={17} color="#EAF3ED" /> Run now</button>
      </div>
    </div>
  );
}

/* ---------- Routine Inbox (mobile) ---------- */
function MInbox({ go, openBuilder }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <MHeader eyebrow="Routine Inbox" title="Inbox" />
      <div style={{ flex:1, overflow:"auto", padding:`16px 16px ${TAB_H+20}px` }}>
        <p style={{ fontSize:13.5, color:T.sub, margin:"0 2px 16px", lineHeight:1.5 }}>
          Vague "do this every…" asks captured from your agents and tools, waiting to become verifiable routines.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {INBOX.map(item=>(
            <MCard key={item.id}>
              <div style={{ display:"flex", gap:12, padding:"14px 15px 12px" }}>
                <div style={{ width:34, height:34, borderRadius:9, flex:"none", background:T.surface2,
                  border:`1px solid ${T.hair}`, display:"grid", placeItems:"center" }}>
                  <Icon name="inbox" size={16} color={T.faint} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13.5, color:T.ink, fontWeight:500, lineHeight:1.45 }}>"{item.text}"</div>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginTop:6 }}>
                    <Mono dim style={{ fontSize:10 }}>via {item.source}</Mono>
                    <span style={{ width:3, height:3, borderRadius:3, background:T.mute }} />
                    <Mono dim style={{ fontSize:10 }}>{item.time}</Mono>
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", gap:9, padding:"11px 15px", borderTop:`1px solid ${T.hair}`, background:T.panel }}>
                <button style={{ flex:"none", height:36, padding:"0 14px", borderRadius:9, border:`1px solid ${T.border}`,
                  background:T.surface, color:T.sub, fontSize:12.5, fontWeight:600, cursor:"pointer" }}>Dismiss</button>
                <button onClick={()=>openBuilder(item)} style={{ flex:1, height:36, borderRadius:9, border:"none",
                  background:T.deep, color:"#EAF3ED", fontSize:12.5, fontWeight:600, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                  <Icon name="wand" size={15} color="#EAF3ED" /> Make Cronlet</button>
              </div>
            </MCard>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Weekly Review (mobile) ---------- */
function MStat({ label, value, sub, color, delta }) {
  return (
    <MCard style={{ padding:"12px 13px" }}>
      <Eyebrow style={{ fontSize:9 }}>{label}</Eyebrow>
      <div style={{ display:"flex", alignItems:"baseline", gap:6, marginTop:8 }}>
        <span style={{ fontSize:21, fontWeight:700, letterSpacing:"-0.03em", fontFamily:"'JetBrains Mono',monospace", color:color||T.ink }}>{value}</span>
        {delta && <span style={{ display:"inline-flex", alignItems:"center", gap:1, fontSize:11, fontWeight:600, color:T.okText }}>
          <Icon name="arrowUp" size={11} color={T.okText} />{delta}</span>}
      </div>
      <div style={{ fontSize:11, color:T.faint, marginTop:3 }}>{sub}</div>
    </MCard>
  );
}

function MReview({ go }) {
  const rate = Math.round((WEEK.verifiedRuns/WEEK.totalRuns)*100);
  const suggestions = [
    { icon:"alert", status:"failed", title:"Backup Health Check failed twice", body:"Both were UpstreamTimeout. Add a 2× retry with backoff and auto-escalate.", action:"Apply fix" },
    { icon:"shield", status:"unverified", title:"OSS Trend Watch can't prove completion", body:"github-trending returns partial responses ~25% of runs. Make it optional or require a retry.", action:"Edit policy" },
    { icon:"clock", status:"stale", title:"Weekly Repo Digest stopped firing", body:"The Actions trigger drifted with no error. Re-arm and enable silent-drift detection.", action:"Re-arm" },
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <MHeader eyebrow={`Weekly Review · ${WEEK.range}`} title="This week"
        trailing={<button style={{ width:36, height:36, borderRadius:10, border:`1px solid ${T.border}`, background:T.surface,
          display:"grid", placeItems:"center", cursor:"pointer" }}><Icon name="external" size={16} color={T.sub} /></button>} />
      <div style={{ flex:1, overflow:"auto", padding:`16px 16px ${TAB_H+20}px` }}>
        <p style={{ fontSize:13.5, color:T.sub, margin:"0 2px 16px", lineHeight:1.5 }}>
          One honest read on delegated work — what held, what drifted, and what to tighten next week.
        </p>
        {/* stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:11, marginBottom:14 }}>
          <MStat label="Verified rate" value={`${rate}%`} color={T.okText} delta={`${WEEK.verifiedRuns-WEEK.prevVerified}`} sub={`${WEEK.verifiedRuns}/${WEEK.totalRuns} runs`} />
          <MStat label="Failed runs" value={String(WEEK.failed)} color={T.badText} sub="across 1 cronlet" />
          <MStat label="Stale routines" value={String(WEEK.stale)} color={T.staleText} sub="schedule drift" />
          <MStat label="Compute cost" value={WEEK.cost} sub="all routines · 7d" />
        </div>

        {/* signal matrix */}
        <MCard style={{ marginBottom:14 }}>
          <MCardHead icon="pulse" title="Routine signal" />
          <div style={{ borderTop:`1px solid ${T.hair}` }}>
            {CRONLETS.map((c,ri)=>(
              <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 15px",
                borderTop:ri?`1px solid ${T.hair}`:"none" }}>
                <Icon name={c.icon} size={14} color={T.green} style={{ flex:"none" }} />
                <span style={{ fontSize:12.5, fontWeight:500, color:T.ink, flex:1, minWidth:0,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.name}</span>
                <div style={{ display:"flex", gap:3, flex:"none" }}>
                  {c.health.map((d,i)=> d
                    ? <div key={i} style={{ width:12, height:12, borderRadius:3, background:STATUS[d].dot }} />
                    : <div key={i} style={{ width:12, height:12, borderRadius:3, border:`1px solid ${T.border}` }} />)}
                </div>
              </div>
            ))}
          </div>
        </MCard>

        {/* improvement loop */}
        <div style={{ display:"flex", alignItems:"center", gap:8, margin:"4px 2px 11px" }}>
          <Icon name="wand" size={15} color={T.green} />
          <span style={{ fontSize:13.5, fontWeight:700, color:T.ink }}>Improvement loop</span>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
          {suggestions.map((sg,i)=>{
            const s = STATUS[sg.status];
            return (
              <MCard key={i}>
                <div style={{ display:"flex", gap:12, padding:"13px 15px" }}>
                  <div style={{ width:32, height:32, borderRadius:9, flex:"none", background:s.bg, border:`1px solid ${s.line}`,
                    display:"grid", placeItems:"center" }}><Icon name={sg.icon} size={16} color={s.dot} /></div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.ink }}>{sg.title}</div>
                    <div style={{ fontSize:12, color:T.sub, marginTop:3, lineHeight:1.5 }}>{sg.body}</div>
                    <button style={{ marginTop:10, height:32, padding:"0 13px", borderRadius:8, border:`1px solid ${T.borderStrong}`,
                      background:T.surface, color:T.ink, fontSize:12, fontWeight:600, cursor:"pointer",
                      display:"inline-flex", alignItems:"center", gap:6 }}>{sg.action}<Icon name="arrowR" size={13} color={T.sub} /></button>
                  </div>
                </div>
              </MCard>
            );
          })}
        </div>

        <div style={{ marginTop:14, padding:"13px 14px", background:T.mint, border:`1px solid ${T.mintLine}`,
          borderRadius:12, display:"flex", gap:10 }}>
          <Icon name="sparkle" size={16} color={T.deep} style={{ marginTop:1, flex:"none" }} />
          <span style={{ fontSize:12.5, color:T.deep, lineHeight:1.5 }}>
            Applying all 3 fixes would have lifted this week's verified rate to an estimated <b>92%</b>.
          </span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MDetail, MInbox, MReview, MSeal });
