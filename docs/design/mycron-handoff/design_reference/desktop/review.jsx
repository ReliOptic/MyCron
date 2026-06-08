/* ============================================================
   MyCron — review.jsx : Weekly Review + improvement loop
   + inbox.jsx : Routine Inbox
   ============================================================ */

function Stat({ label, value, sub, color, delta }) {
  return (
    <Card pad={0} style={{ flex:1 }}>
      <div style={{ padding:"14px 16px" }}>
        <Eyebrow style={{ fontSize:10 }}>{label}</Eyebrow>
        <div style={{ display:"flex", alignItems:"baseline", gap:8, marginTop:10 }}>
          <span style={{ fontSize:26, fontWeight:700, letterSpacing:"-0.03em", fontFamily:"'JetBrains Mono',monospace",
            color: color||T.ink }}>{value}</span>
          {delta && <span style={{ display:"inline-flex", alignItems:"center", gap:2, fontSize:11.5, fontWeight:600,
            color:T.okText }}><Icon name="arrowUp" size={12} color={T.okText} />{delta}</span>}
        </div>
        <div style={{ fontSize:11.5, color:T.faint, marginTop:4 }}>{sub}</div>
      </div>
    </Card>
  );
}

function SignalMatrix() {
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  return (
    <Card pad={0}>
      <div style={{ padding:"15px 18px 13px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <Icon name="pulse" size={16} color={T.green} />
          <span style={{ fontSize:14, fontWeight:700, color:T.ink, whiteSpace:"nowrap" }}>Weekly routine signal</span>
        </div>
        <div style={{ display:"flex", gap:14 }}>
          {[["verified","Verified"],["unverified","Unverified"],["stale","Stale"],["failed","Failed"]].map(([s,l])=>(
            <div key={s} style={{ display:"flex", alignItems:"center", gap:6 }}>
              <StatusDot status={s} size={8} /><span style={{ fontSize:11, color:T.sub }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
      {/* header row */}
      <div style={{ display:"grid", gridTemplateColumns:"minmax(200px,1.4fr) repeat(7, 1fr)", gap:0,
        padding:"0 18px 8px", borderBottom:`1px solid ${T.hair}` }}>
        <Eyebrow style={{ fontSize:9.5 }}>Cronlet</Eyebrow>
        {days.map(d=><div key={d} style={{ textAlign:"center" }}><Eyebrow style={{ fontSize:9.5 }}>{d}</Eyebrow></div>)}
      </div>
      {CRONLETS.map(c=>(
        <div key={c.id} style={{ display:"grid", gridTemplateColumns:"minmax(200px,1.4fr) repeat(7, 1fr)",
          alignItems:"center", padding:"11px 18px", borderTop:`1px solid ${T.hair}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
            <Icon name={c.icon} size={15} color={T.green} />
            <span style={{ fontSize:13, fontWeight:500, color:T.ink, overflow:"hidden", textOverflow:"ellipsis",
              whiteSpace:"nowrap" }}>{c.name}</span>
          </div>
          {c.health.map((d,i)=>(
            <div key={i} style={{ display:"grid", placeItems:"center" }}>
              {d ? <div title={STATUS[d].label} style={{ width:15, height:15, borderRadius:4, background:STATUS[d].dot }} />
                 : <div style={{ width:15, height:15, borderRadius:4, border:`1px solid ${T.border}` }} />}
            </div>
          ))}
        </div>
      ))}
    </Card>
  );
}

function Suggestion({ icon, status, title, body, action }) {
  const s = STATUS[status];
  return (
    <div style={{ display:"flex", gap:13, padding:"15px 0", borderTop:`1px solid ${T.hair}` }}>
      <div style={{ width:34, height:34, borderRadius:9, flex:"none", background:s.bg, border:`1px solid ${s.line}`,
        display:"grid", placeItems:"center" }}>
        <Icon name={icon} size={16} color={s.dot} />
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13.5, fontWeight:600, color:T.ink }}>{title}</div>
        <div style={{ fontSize:12.5, color:T.sub, marginTop:3, lineHeight:1.5 }}>{body}</div>
      </div>
      <Btn kind="secondary" size="sm" iconR="arrowR" style={{ alignSelf:"center" }}>{action}</Btn>
    </div>
  );
}

function WeeklyReview({ go }) {
  const rate = Math.round((WEEK.verifiedRuns/WEEK.totalRuns)*100);
  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:22 }}>
        <div>
          <Eyebrow style={{ marginBottom:10 }}>Weekly Review · {WEEK.range}</Eyebrow>
          <h1 style={{ fontSize:27, fontWeight:700, letterSpacing:"-0.032em", color:T.ink, margin:0 }}>
            How your routines actually performed
          </h1>
          <p style={{ fontSize:14, color:T.sub, margin:"8px 0 0", maxWidth:560, lineHeight:1.5 }}>
            One honest read on delegated work — what held, what drifted, and what to tighten next week.
          </p>
        </div>
        <Btn kind="secondary" icon="external">Export report</Btn>
      </div>

      {/* stats */}
      <div style={{ display:"flex", gap:12, marginBottom:18 }}>
        <Stat label="Verified rate" value={`${rate}%`} color={T.okText} delta={`${WEEK.verifiedRuns-WEEK.prevVerified}`} sub={`${WEEK.verifiedRuns}/${WEEK.totalRuns} runs this week`} />
        <Stat label="Failed runs" value={String(WEEK.failed)} color={T.badText} sub="across 1 cronlet" />
        <Stat label="Stale routines" value={String(WEEK.stale)} color={T.staleText} sub="schedule drift" />
        <Stat label="Unverified" value={String(WEEK.unverified)} color={T.unvText} sub="ran, not proven" />
        <Stat label="Compute cost" value={WEEK.cost} sub="all routines · 7d" />
      </div>

      <div style={{ marginBottom:18 }}><SignalMatrix /></div>

      {/* improvement loop */}
      <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:18, alignItems:"start" }}>
        <Card pad={0}>
          <div style={{ padding:"16px 18px 6px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <Icon name="wand" size={16} color={T.green} />
              <span style={{ fontSize:14, fontWeight:700, color:T.ink, whiteSpace:"nowrap" }}>Improvement loop</span>
            </div>
            <p style={{ fontSize:12.5, color:T.sub, margin:"7px 0 4px", lineHeight:1.5 }}>
              Concrete changes drawn from this week's runs — not generic tips.
            </p>
          </div>
          <div style={{ padding:"0 18px 6px" }}>
            <Suggestion icon="alert" status="failed" title="Backup Health Check failed twice on storage timeout"
              body="Both failures were UpstreamTimeout after 30s. Add a 2× retry with backoff and auto-escalate to human if still failing."
              action="Apply fix" />
            <Suggestion icon="shield" status="unverified" title="OSS Trend Watch can't prove completion"
              body="github-trending returns partial responses ~25% of runs. Mark it optional, or require it with a retry so the manifest can close."
              action="Edit policy" />
            <Suggestion icon="clock" status="stale" title="Weekly Repo Digest stopped firing 9 days ago"
              body="The GitHub Actions trigger drifted with no error. Re-arm the schedule and enable silent-drift detection in its Done Policy."
              action="Re-arm" />
          </div>
        </Card>

        {/* your corrections */}
        <Card pad={18}>
          <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:6 }}>
            <Icon name="user" size={16} color={T.green} />
            <span style={{ fontSize:14, fontWeight:700, color:T.ink, whiteSpace:"nowrap" }}>Your corrections</span>
          </div>
          <p style={{ fontSize:12.5, color:T.sub, margin:"0 0 14px", lineHeight:1.5 }}>
            Feedback you gave this week, folded back into the routines.
          </p>
          {[
            { t:"Confirmed Portfolio Brief output", d:"Tue · marked goal satisfied", s:"verified" },
            { t:"Re-ran Backup Health Check manually", d:"Wed · escalated to on-call", s:"failed" },
          ].map((x,i)=>(
            <div key={i} style={{ display:"flex", gap:11, padding:"11px 0", borderTop:i?`1px solid ${T.hair}`:`1px solid ${T.hair}` }}>
              <StatusDot status={x.s} size={8} ring />
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:T.ink }}>{x.t}</div>
                <Mono dim style={{ fontSize:11, display:"block", marginTop:2 }}>{x.d}</Mono>
              </div>
            </div>
          ))}
          <div style={{ marginTop:14, padding:"12px 13px", background:T.mint, border:`1px solid ${T.mintLine}`,
            borderRadius:10, display:"flex", gap:9, alignItems:"flex-start" }}>
            <Icon name="sparkle" size={15} color={T.deep} style={{ marginTop:1 }} />
            <span style={{ fontSize:12, color:T.deep, lineHeight:1.5 }}>
              Applying all 3 fixes would have lifted this week's verified rate to an estimated <b>92%</b>.
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Routine Inbox ---------------- */
function RoutineInbox({ go, openBuilder }) {
  return (
    <div>
      <div style={{ marginBottom:22 }}>
        <Eyebrow style={{ marginBottom:10 }}>Routine Inbox</Eyebrow>
        <h1 style={{ fontSize:27, fontWeight:700, letterSpacing:"-0.032em", color:T.ink, margin:0 }}>
          Turn loose requests into Cronlets
        </h1>
        <p style={{ fontSize:14, color:T.sub, margin:"8px 0 0", maxWidth:560, lineHeight:1.5 }}>
          Vague "do this every…" asks captured from your agents and tools, waiting to become verifiable routines.
        </p>
      </div>

      <Card pad={0}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 18px" }}>
          <Mono dim style={{ fontSize:11 }}>{INBOX.length} captured requests</Mono>
          <Btn kind="ghost" size="sm" icon="refresh">Sync sources</Btn>
        </div>
        {INBOX.map(item=>(
          <div key={item.id} style={{ display:"flex", gap:14, alignItems:"center", padding:"16px 18px",
            borderTop:`1px solid ${T.hair}` }}>
            <div style={{ width:36, height:36, borderRadius:10, flex:"none", background:T.surface2, border:`1px solid ${T.hair}`,
              display:"grid", placeItems:"center" }}>
              <Icon name="inbox" size={17} color={T.faint} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, color:T.ink, fontWeight:500 }}>"{item.text}"</div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:5 }}>
                <Mono dim style={{ fontSize:10.5 }}>via {item.source}</Mono>
                <span style={{ width:3, height:3, borderRadius:3, background:T.mute }} />
                <Mono dim style={{ fontSize:10.5 }}>{item.time}</Mono>
              </div>
            </div>
            <Btn kind="secondary" size="sm">Dismiss</Btn>
            <Btn kind="primary" size="sm" icon="wand" onClick={()=>openBuilder(item)}>Make Cronlet</Btn>
          </div>
        ))}
      </Card>
    </div>
  );
}

Object.assign(window, { WeeklyReview, RoutineInbox });
