/* ============================================================
   MyCron — "The Operating Ledger"
   theme.jsx : tokens, icon set, status system, shared primitives
   ============================================================ */

const T = {
  // surfaces (neutral porcelain — green reserved for brand + status only)
  bg:        "#F4F5F6",
  panel:     "#FAFBFB",
  surface:   "#FFFFFF",
  surface2:  "#F1F3F4",
  surface3:  "#E8EBED",
  border:    "#E5E7EA",
  borderStrong: "#D6DADE",
  hair:      "#ECEEF0",

  // ink (neutral graphite)
  ink:       "#181B1E",
  sub:       "#59616B",
  faint:     "#8B939B",
  mute:      "#AEB4BB",

  // brand greens
  deep:      "#0E5A3A",
  green:     "#157A4E",
  bright:    "#1FA46A",
  mint:      "#E8F3EC",
  mintLine:  "#CFE6D8",

  // status — verified / failed / stale / unverified
  okText:    "#11854B",   okDot:"#1AA862",  okBg:"#E7F4EC",  okLine:"#C5E6D2",
  badText:   "#C5362E",   badDot:"#E04B43",  badBg:"#FBEBEA",  badLine:"#F2CFCC",
  staleText: "#9A6608",   staleDot:"#D5920F", staleBg:"#FAF1DF", staleLine:"#EFDBB0",
  unvText:   "#4B55A6",   unvDot:"#6B73D6",  unvBg:"#EDEEF8",  unvLine:"#D6D9F0",

  // accent for "scheduled / informational"
  infoText:  "#2E6AC4",  infoBg:"#E9F0FB", infoLine:"#CFE0F6",
};

const STATUS = {
  verified:   { key:"verified",   label:"Verified",   text:T.okText,    dot:T.okDot,    bg:T.okBg,    line:T.okLine,    glyph:"check" },
  failed:     { key:"failed",     label:"Failed",     text:T.badText,   dot:T.badDot,   bg:T.badBg,   line:T.badLine,   glyph:"alert" },
  stale:      { key:"stale",      label:"Stale",      text:T.staleText, dot:T.staleDot, bg:T.staleBg, line:T.staleLine, glyph:"clock" },
  unverified: { key:"unverified", label:"Unverified", text:T.unvText,   dot:T.unvDot,   bg:T.unvBg,   line:T.unvLine,   glyph:"shield" },
  scheduled:  { key:"scheduled",  label:"Scheduled",  text:T.infoText,  dot:"#3F82E0",  bg:T.infoBg,  line:T.infoLine,  glyph:"clock" },
  running:    { key:"running",    label:"Running",    text:T.green,     dot:T.bright,   bg:T.mint,    line:T.mintLine,  glyph:"play" },
};

/* ---------- icon set (simple stroke line icons) ---------- */
const PATHS = {
  pulse:    "M3 12h3l2.5-7 4 14 2.5-7H21",
  calendar: "M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  clock:    "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  check:    "M5 12.5l4 4 10-10",
  checkCircle:"M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8.5 12l2.5 2.5 4.5-5",
  alert:    "M12 3.5l9.5 16.5H2.5L12 3.5zM12 10v4.5M12 17.6v.05",
  shield:   "M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z",
  shieldChk:"M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3zM8.7 11.5l2.2 2.2 4-4.3",
  link:     "M10 13.5a4 4 0 0 0 5.7.4l2.6-2.6a4 4 0 1 0-5.7-5.7l-1.5 1.5M14 10.5a4 4 0 0 0-5.7-.4L5.7 12.7a4 4 0 1 0 5.7 5.7l1.5-1.5",
  file:     "M14 3v5h5M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z",
  fileText: "M14 3v5h5M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM9 13h6M9 16.5h6M9 9.5h2",
  play:     "M8 5.5v13l11-6.5-11-6.5z",
  pause:    "M9 5h2v14H9zM15 5h2v14h-2z",
  bolt:     "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
  refresh:  "M3.5 12a8.5 8.5 0 0 1 14.5-6M20.5 12a8.5 8.5 0 0 1-14.5 6M17 6h3.5V2.5M7 18H3.5v3.5",
  chevR:    "M9 6l6 6-6 6",
  chevD:    "M6 9l6 6 6-6",
  chevUp:   "M6 15l6-6 6 6",
  plus:     "M12 5v14M5 12h14",
  search:   "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5",
  bell:     "M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0",
  inbox:    "M3 13h5l1.5 3h5L21 13M3 13l3-8h12l3 8M3 13v6a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6",
  list:     "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  grid:     "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  gauge:    "M12 13l4-4M5 19a9 9 0 1 1 14 0M12 13h.01",
  history:  "M3.5 12a8.5 8.5 0 1 0 2.5-6M3 4v4h4M12 8v4.5l3 1.8",
  copy:     "M9 9h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1",
  external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  lock:     "M7 11V8a5 5 0 0 1 10 0v3M5 11h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z",
  hash:     "M9 4L7 20M17 4l-2 16M4 9h16M3 15h16",
  terminal: "M5 5h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8 9.5l2.5 2.5L8 14.5M13 15h4",
  sparkle:  "M12 3l1.6 4.8L18 9.4l-4.4 1.6L12 16l-1.6-5L6 9.4l4.4-1.6L12 3z",
  wand:     "M5 19l9-9M14 6l1.5-1.5M14 6l-1.5 1.5M14 6l1.5 1.5M14 6l-1.5-1.5M18 10l.8-.8M18 10l-.8.8",
  x:        "M6 6l12 12M18 6L6 18",
  arrowR:   "M5 12h14M13 6l6 6-6 6",
  arrowUp:  "M12 19V5M6 11l6-6 6 6",
  beaker:   "M9 3h6M10 3v6L5 19a1 1 0 0 0 1 1.5h12A1 1 0 0 0 19 19l-5-10V3M7.5 14h9",
  git:      "M6 4v10M6 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM6 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18 9c0 4-6 2-6 6",
  flag:     "M5 21V4M5 4h11l-2 3 2 3H5",
  user:     "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0",
  robot:    "M12 3v3M8 8h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM9.5 13h.01M14.5 13h.01M9 17h6",
  dot:      "M12 12h.01",
  filter:   "M4 5h16l-6 7v5l-4 2v-7L4 5z",
  trend:    "M3 17l6-6 4 4 8-8M21 7v5M21 7h-5",
  cube:     "M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM4 7.5l8 4.5 8-4.5M12 12v9",
  eye:      "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  send:     "M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z",
  layers:   "M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5",
  more:     "M5 12h.01M12 12h.01M19 12h.01",
};

function Icon({ name, size = 18, sw = 1.7, color = "currentColor", style }) {
  const d = PATHS[name] || PATHS.dot;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "block", flex: "none", ...style }}>
      {d.split("M").filter(Boolean).map((seg, i) => <path key={i} d={"M" + seg} />)}
    </svg>
  );
}

/* ---------- brand mark : rounded square + check ---------- */
function Logo({ size = 24 }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:9 }}>
      <div style={{
        width:size, height:size, borderRadius:size*0.3, background:T.deep,
        display:"grid", placeItems:"center", boxShadow:"0 1px 0 rgba(0,0,0,0.04)",
      }}>
        <Icon name="check" size={size*0.66} sw={2.6} color="#EAF3ED" />
      </div>
      <span style={{ fontSize:size*0.62, fontWeight:700, letterSpacing:"-0.03em", color:T.ink }}>
        My<span style={{ color:T.deep }}>Cron</span>
      </span>
    </div>
  );
}

/* ---------- status primitives ---------- */
function StatusDot({ status, size = 8, ring = false }) {
  const s = STATUS[status] || STATUS.scheduled;
  return (
    <span style={{
      width:size, height:size, borderRadius:size, background:s.dot, flex:"none",
      boxShadow: ring ? `0 0 0 3px ${s.bg}` : "none", display:"inline-block",
    }} />
  );
}

function StatusBadge({ status, children, soft = true }) {
  const s = STATUS[status] || STATUS.scheduled;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:6, height:23, padding:"0 9px 0 8px",
      borderRadius:7, fontSize:11.5, fontWeight:600, letterSpacing:"0.01em", lineHeight:1,
      color:s.text, background:soft?s.bg:"transparent", border:`1px solid ${s.line}`,
      whiteSpace:"nowrap",
    }}>
      <StatusDot status={status} size={7} />
      {children || s.label}
    </span>
  );
}

/* mono tag for machine-verifiable values */
function Mono({ children, c, dim, style }) {
  return <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:12, letterSpacing:"-0.01em",
    color: c || (dim ? T.faint : T.sub), ...style }}>{children}</span>;
}

/* weekly health strip — ledger heatmap of last 7 runs */
function HealthStrip({ days, size = 13, gap = 4, labels = false }) {
  const D = ["M","T","W","T","F","S","S"];
  return (
    <div style={{ display:"flex", gap, alignItems:"flex-end" }}>
      {days.map((d, i) => {
        const s = STATUS[d] || null;
        return (
          <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div title={s?s.label:"No run"} style={{
              width:size, height:size, borderRadius:3,
              background: s ? s.dot : "transparent",
              border: s ? "none" : `1px solid ${T.border}`,
              opacity: d==="empty"||!s ? 1 : 1,
            }} />
            {labels && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9.5, color:T.mute }}>{D[i]}</span>}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- buttons ---------- */
function Btn({ kind = "ghost", icon, iconR, children, onClick, full, size = "md", style, active }) {
  const [hover, setHover] = React.useState(false);
  const H = size === "sm" ? 32 : size === "lg" ? 44 : 38;
  const base = {
    display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8,
    height:H, padding: children ? (size==="sm"?"0 12px":"0 16px") : 0, width: children ? (full?"100%":"auto") : H,
    borderRadius:9, fontSize: size==="sm"?12.5:13.5, fontWeight:600, letterSpacing:"-0.01em",
    cursor:"pointer", whiteSpace:"nowrap", transition:"background .14s, border-color .14s, box-shadow .14s", userSelect:"none",
    border:"1px solid transparent", ...style,
  };
  const ghostBg = active ? T.surface2 : hover ? T.surface2 : "transparent";
  const kinds = {
    primary: { background:T.deep, color:"#F0F7F2", borderColor:T.deep, boxShadow:"0 1px 2px rgba(14,90,58,.18)" },
    secondary:{ background: hover?T.surface2:T.surface, color:T.ink, borderColor:T.borderStrong, boxShadow:"0 1px 1.5px rgba(20,32,26,.04)" },
    ghost:   { background: ghostBg, color:T.sub, borderColor:"transparent" },
    danger:  { background: hover?T.badBg:T.surface, color:T.badText, borderColor:T.badLine },
    soft:    { background:T.mint, color:T.deep, borderColor:T.mintLine },
  };
  return (
    <button onClick={onClick} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ ...base, ...kinds[kind] }}>
      {icon && <Icon name={icon} size={size==="sm"?15:16.5} sw={1.9} />}
      {children}
      {iconR && <Icon name={iconR} size={size==="sm"?15:16} sw={1.9} />}
    </button>
  );
}

/* surface card */
function Card({ children, style, pad = 0, hover, onClick }) {
  const [h, setH] = React.useState(false);
  const lifted = hover && h;
  return (
    <div onClick={onClick}
      onMouseEnter={()=>hover&&setH(true)} onMouseLeave={()=>hover&&setH(false)}
      style={{
      background:T.surface, border:`1px solid ${lifted?T.borderStrong:T.border}`, borderRadius:14,
      padding:pad, boxShadow: lifted?"0 4px 16px rgba(20,32,26,.07)":"0 1px 2px rgba(20,32,26,.035)",
      transition:"border-color .14s, box-shadow .14s", cursor:onClick?"pointer":"default", ...style,
    }}>
      {children}
    </div>
  );
}

/* small section eyebrow label */
function Eyebrow({ children, style }) {
  return <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10.5, fontWeight:600,
    letterSpacing:"0.14em", textTransform:"uppercase", color:T.faint, ...style }}>{children}</div>;
}

/* agent chip */
function AgentChip({ name, runtime }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:6, height:24, padding:"0 9px 0 7px",
      borderRadius:7, background:T.surface2, border:`1px solid ${T.hair}`, fontSize:11.5, fontWeight:500, color:T.sub }}>
      <Icon name="robot" size={13} sw={1.8} color={T.green} />
      {name}{runtime && <span style={{ color:T.mute, fontWeight:500 }}>· {runtime}</span>}
    </span>
  );
}

Object.assign(window, { T, STATUS, Icon, Logo, StatusDot, StatusBadge, Mono, HealthStrip, Btn, Card, Eyebrow, AgentChip });
