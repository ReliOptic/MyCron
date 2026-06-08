// ============================================================
// MyCron — Design Tokens
// ------------------------------------------------------------
// Extracted verbatim from the design prototype (theme.jsx).
// Direction: NEUTRAL porcelain surfaces; green is reserved as a
// SIGNAL only (brand mark, primary actions, Verified state,
// verified-rate, terminal). Do not flood surfaces with green.
// ============================================================

export const color = {
  // surfaces (neutral porcelain)
  bg:           "#F4F5F6",
  panel:        "#FAFBFB",
  surface:      "#FFFFFF",
  surface2:     "#F1F3F4",
  surface3:     "#E8EBED",
  border:       "#E5E7EA",
  borderStrong: "#D6DADE",
  hair:         "#ECEEF0",

  // ink (neutral graphite)
  ink:   "#181B1E",
  sub:   "#59616B",
  faint: "#8B939B",
  mute:  "#AEB4BB",

  // brand green — SIGNAL ONLY
  deep:     "#0E5A3A",   // primary buttons, logo, hero
  green:    "#157A4E",
  bright:   "#1FA46A",
  mint:     "#E8F3EC",   // soft green fill
  mintLine: "#CFE6D8",

  // terminal (read-back blocks)
  terminalBg:   "#11201A",
  terminalText: "#7FD0A2",
} as const;

/** Semantic run-state palette. Each state has text/dot/bg/line. */
export const status = {
  verified:   { text: "#11854B", dot: "#1AA862", bg: "#E7F4EC", line: "#C5E6D2" },
  failed:     { text: "#C5362E", dot: "#E04B43", bg: "#FBEBEA", line: "#F2CFCC" },
  stale:      { text: "#9A6608", dot: "#D5920F", bg: "#FAF1DF", line: "#EFDBB0" },
  unverified: { text: "#4B55A6", dot: "#6B73D6", bg: "#EDEEF8", line: "#D6D9F0" },
  scheduled:  { text: "#2E6AC4", dot: "#3F82E0", bg: "#E9F0FB", line: "#CFE0F6" },
  running:    { text: "#157A4E", dot: "#1FA46A", bg: "#E8F3EC", line: "#CFE6D8" },
} as const;

export const radius = {
  chip: 7, control: 9, input: 10, card: 14, cardLg: 16, pill: 9999,
} as const;

export const shadow = {
  card:    "0 1px 2px rgba(20,32,26,.035)",
  cardHover:"0 4px 16px rgba(20,32,26,.07)",
  primary: "0 1px 2px rgba(14,90,58,.18)",
} as const;

export const space = [0, 4, 7, 8, 11, 12, 14, 16, 18, 22, 28, 36] as const;

export const font = {
  sans: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
  mono: `'JetBrains Mono', monospace`,
  // weights actually used: 400 / 500 / 600 / 700
  // mono is used for ALL machine-verifiable values:
  // cron, timestamps, run IDs, evidence refs, counts, rates.
} as const;

/** Type scale (px). Desktop. Mobile shifts headers down ~4px. */
export const type = {
  h1:        { size: 27, weight: 700, tracking: "-0.032em" },
  cardTitle: { size: 14, weight: 700 },
  body:      { size: 13.5, weight: 400, line: 1.5 },
  bodySm:    { size: 12.5, weight: 400, line: 1.5 },
  label:     { size: 12.5, weight: 600 },
  eyebrow:   { size: 10.5, weight: 600, tracking: "0.14em", upper: true, mono: true },
  metricLg:  { size: 30, weight: 700, tracking: "-0.03em", mono: true },
} as const;

/** Icon keys referenced by `Cronlet.icon` / suggestion.iconKey, resolved
 *  against the prototype's stroke icon set (see theme.jsx PATHS).
 *  Use any 1.7px-stroke line-icon library (Lucide is a close match). */
export const ICON_KEYS = [
  "pulse", "calendar", "clock", "check", "checkCircle", "alert", "shield",
  "shieldChk", "link", "file", "fileText", "play", "pause", "bolt", "refresh",
  "inbox", "gauge", "history", "terminal", "sparkle", "wand", "lock", "hash",
  "trend", "git", "robot", "send", "cube", "layers", "user", "flag",
] as const;

/** Map status → human label used in badges. */
export const STATUS_LABEL: Record<string, string> = {
  verified: "Verified", failed: "Failed", stale: "Stale",
  unverified: "Unverified", scheduled: "Scheduled", running: "Running",
};
