# Handoff: MyCron — Agent Action Control Surface

## Overview
**MyCron** is a user-owned **cross-agent control plane for scheduled actions** — the substrate where agent-initiated actions persist, are owned, and are controlled and audited over time. A **Cronlet** is a stored, controllable scheduled action. **Done Policy**, **evidence requirements**, and **Run Health** are *reliability extensions* layered on top: they make a delegated routine **verifiable** (intent, runtime, audit history, improvement loop) rather than just "fired".

The product's thesis drives every screen:

> **"Done is not a message. Done is a verified state."**

The UI must make scheduled agent work feel **inspectable, trustworthy, and calm** — an *operating ledger / agent cockpit*, not a decorative dashboard.

---

## About the Design Files
The files in `design_reference/` are **design references created in HTML/React-via-Babel** — runnable prototypes showing the intended look, hierarchy, and behavior. **They are not production code to copy directly.**

Your task is to **recreate these designs in the target codebase's environment** (React, Vue, SwiftUI, etc.) using its established patterns, component library, and styling solution. **If no environment exists yet, do not choose a production stack in this pass** — keep `src/` typecheck-only and framework-neutral. The `src/` scaffold in this package is written in **React + TypeScript**, but committing a bundler/app stack is deferred until the product implementation stack is explicitly decided.

> ⚠️ **Important — no fixtures.** The prototype contains rich hardcoded mock data (`design_reference/shared/data.jsx`) **purely to make the design legible**. Do **NOT** port that mock data into production. The `src/` folder is the real contract: typed interfaces + props/API-driven components + an `EmptyApi` that renders honest loading/empty states with **zero presets**. Wire real data through `MyCronApi`.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, and interaction model. Recreate pixel-faithfully using your component system. Exact tokens are in `src/styles/tokens.ts` and summarized below.

---

## What's in this package

```
design_handoff_mycron/
├── README.md                      ← you are here
├── src/
│   ├── types/mycron.ts            ← domain interfaces (the data contract)
│   ├── data/
│   │   ├── api.ts                 ← MyCronApi: endpoints the UI expects
│   │   ├── provider.tsx           ← ApiProvider + EmptyApi (zero-fixture default)
│   │   └── hooks.ts               ← useCronlets/useCronlet/useInbox/… + derivations
│   ├── components/
│   │   ├── primitives.tsx         ← StatusBadge, HealthStrip, Mono, EmptyState
│   │   └── CronletCard.tsx        ← reference container+presentational pattern
│   └── styles/tokens.ts           ← color / status / type / radius / shadow tokens
└── design_reference/
    ├── shared/   (theme.jsx, data.jsx)  ← loaded by both prototypes (data.jsx = mock only)
    ├── desktop/  (HTML + .jsx)          ← the desktop prototype
    └── mobile/   (HTML + .jsx)          ← the iOS prototype
```

**Implementation order we recommend:** `tokens.ts` → `types/mycron.ts` → `data/*` → primitives → screens. Build against `EmptyApi` first (everything renders empty), then replace it with a real `MyCronApi`.

---

## Architecture & Data Flow (the core of this handoff)

The whole point of this package is a **clean separation of data from UI** so no presets leak into the codebase.

```
            ┌─────────────────────────┐
            │   MyCronApi (api.ts)     │  ← your backend impl
            └─────────────┬───────────┘
                          │  injected at bootstrap
            ┌─────────────▼───────────┐
            │ ApiProvider (provider)  │  default = EmptyApi (no fixtures)
            └─────────────┬───────────┘
                          │  useContext
            ┌─────────────▼───────────┐
            │  hooks.ts                │  useCronlets() → {data, loading, error}
            └─────────────┬───────────┘
                          │  props
            ┌─────────────▼───────────┐
            │  Presentational comps    │  pure: read props + tokens only
            └─────────────────────────┘
```

- **Containers** call hooks, own `loading / empty / error`.
- **Presentational components** are pure — they take a typed prop (e.g. `cronlet: Cronlet`) and read `tokens.ts`. They never fetch and never embed sample data.
- Swap `EmptyApi` → real API incrementally, endpoint by endpoint.

Bootstrap:
```tsx
<ApiProvider api={realApi /* implements MyCronApi */}>
  <App />
</ApiProvider>
```

---

## Screens / Views

There are **5 surfaces**, shared across desktop (sidebar + main) and mobile (bottom tab bar + stacked cards). Open `design_reference/desktop/MyCron - Operating Ledger.html` and `design_reference/mobile/MyCron - Mobile.html` to see them live.

### 1. Run Console (main dashboard)
- **Purpose:** resolve every routine to a state you can trust; surface problems first.
- **Desktop layout:** page header (eyebrow + h1 + "New Cronlet") → **state triage strip** (5 tiles: Failed / Stale / Unverified / Verified + a deep-green "Verified this week %" tile) → **ledger table** with columns: *Cronlet · Run state · Last run · Next run · 7-day health · ›*. Rows sort by triage priority (failed→stale→unverified→verified). Clicking a tile filters; clicking a row opens detail.
- **Mobile layout:** sticky header → deep-green **verified-rate hero** with progress bar → horizontally-scrolling **triage chips** → "Needs attention" section (failed/stale cards) → "All routines" stacked `CronletCard`s.
- **Data:** `useCronlets()`, `countByState()`, `byTriagePriority()`, `useWeeklyReview()` for the rate tile.

### 2. Cronlet Detail + **Proof Panel** (the centerpiece)
- **Purpose:** prove a run actually completed — *"Done is a verified state."*
- **Layout:** title block (icon, name, `StatusBadge`, intent, agent chip + schedule chips) → optional **Triage panel** (only for failed/stale: last verified, error type, next attempt + Retry/Re-arm/Escalate) → **facts row** (Next run / 7-day health / Verified rate / Cost) → **Proof** two-column (desktop) / stacked (mobile):
  - **Done Policy** card: a checklist of `DoneCondition`s with a segmented progress bar; each row shows a state-colored check/x/clock/dot + label + detail + `StatusBadge`. Header reads "N / M conditions met".
  - **Evidence Manifest** card: receipt-styled (notched top edge on desktop), a **verification Seal** (solid circle + check for `verified`; **dashed** ring for non-verified), evidence line items (icon + label + meta + ✓/⚠ at row end), an "incomplete" warning when any item `warn`s, and a **read-back command** in a terminal block with copy-to-clipboard.
- **Data:** `useCronlet(id)` → `cronlet.latestRun.{donePolicy, evidence, readbackCommand, summary}`.

### 3. Cronlet Builder (create / edit)
- **Purpose:** define the routine **and what counts as done**.
- **Layout (desktop):** left = form (Intent & schedule: name, intent textarea, when/timezone/agent/deliver-to selects) + **Done Policy** toggles (first is `required`, several `producesEvidence`) + **Evidence requirements** (auto-derived chips, active/inactive). Right (sticky) = live **`.mc` manifest** preview (dark terminal card) + **next-4-runs** validator + "Approve & create". Mobile = same, stacked, with a sticky create bar.
- **Data:** local `CronletDraft` state; `deriveRequiredEvidence(draft.donePolicy)`; `previewSchedule(cron, tz, 4)`; submit via `createCronlet(draft)`.

### 4. Routine Inbox
- **Purpose:** capture vague "do this every…" asks and promote them to Cronlets.
- **Layout:** list of `InboxRequest` cards (raw text + source + time) with Dismiss / "Make Cronlet". "Make Cronlet" calls `promoteInbox(id)` → pre-filled `CronletDraft` → opens Builder.

### 5. Weekly Review + Improvement Loop
- **Purpose:** one honest read on delegated work — what held, what drifted, what to tighten. **No vanity metrics.**
- **Layout:** stat row (Verified rate +Δ / Failed / Stale / Unverified / Cost) → **routine signal matrix** (cronlets × 7 days heatmap) → **Improvement loop** (`ImprovementSuggestion`s, each state-colored with a concrete action) → **Your corrections** (`UserCorrection`s folded back in).
- **Data:** `useWeeklyReview()`; `applySuggestion(id)`.

---

## Interactions & Behavior
- **Navigation:** desktop = left sidebar (Run Console / Routine Inbox / Weekly Review + Library); mobile = bottom tab bar (Console / Inbox / Review). Detail & Builder are pushed views (mobile hides the tab bar, shows a back chevron + sticky action bar).
- **Triage filter:** clicking a state tile/chip filters the ledger to that state; re-click or "Clear" resets.
- **Copy read-back:** the terminal block copies `run.readbackCommand` to clipboard; icon flips to a check for ~1.2s.
- **Builder toggles:** the `required` Done-Policy condition can't be turned off; toggling conditions live-updates both the derived Evidence chips and the `.mc` manifest preview.
- **Transitions:** subtle only (140ms ease on hover bg/border/shadow). **Hover must be state-driven in React** (do not mutate `style.background` on DOM nodes — it races React reconciliation; we hit this exact bug in the prototype).
- **States to implement for every list/detail:** loading (skeleton), empty (see `EmptyState`), error, plus the four run states. `unverified` is **first-class** — ran ≠ done.

## State Management
- Route/selection state (current surface, selected cronlet id, builder seed) — local or your router.
- Server data via the hooks (`{data, loading, error, reload}`). Add your cache layer (React Query/SWR) by reimplementing `useAsync` — the hook signatures stay the same.
- Builder draft is local component state of type `CronletDraft` until submit.

---

## Design Tokens (summary — full values in `src/styles/tokens.ts`)

**Direction: neutral porcelain surfaces; green is a SIGNAL, not a background.** Use green only for the brand mark, primary buttons, the `verified` state, the verified-rate hero, and terminal blocks. Do not flood surfaces with green (this was a deliberate revision for global audiences).

- **Surfaces:** bg `#F4F5F6`, panel `#FAFBFB`, surface `#FFFFFF`, surface2 `#F1F3F4`, border `#E5E7EA`, hair `#ECEEF0`.
- **Ink:** ink `#181B1E`, sub `#59616B`, faint `#8B939B`, mute `#AEB4BB`.
- **Brand green (signal):** deep `#0E5A3A`, green `#157A4E`, bright `#1FA46A`, mint `#E8F3EC`, mintLine `#CFE6D8`.
- **Status palettes** (text / dot / bg / line):
  - verified `#11854B` / `#1AA862` / `#E7F4EC` / `#C5E6D2`
  - failed `#C5362E` / `#E04B43` / `#FBEBEA` / `#F2CFCC`
  - stale `#9A6608` / `#D5920F` / `#FAF1DF` / `#EFDBB0`
  - unverified `#4B55A6` / `#6B73D6` / `#EDEEF8` / `#D6D9F0`
- **Terminal:** bg `#11201A`, text `#7FD0A2`.
- **Radius:** chip 7, control 9, input 10, card 14, cardLg 16.
- **Shadow:** card `0 1px 2px rgba(20,32,26,.035)`, hover `0 4px 16px rgba(20,32,26,.07)`.

### Typography
- **Sans:** Inter — weights **400 / 500 / 600 / 700** only.
- **Mono:** JetBrains Mono — used for **all machine-verifiable values**: cron expressions, timestamps, run IDs (`run_8f2a91c`), evidence refs, counts, rates, the `.mc` manifest, read-back commands, and eyebrow labels. This sans/mono duality is a core part of the "operating ledger" feel — preserve it.
- **Scale (px):** h1 27/700/-0.032em · card title 14/700 · body 13.5/1.5 · label 12.5/600 · eyebrow 10.5/600/0.14em/uppercase/mono · large metric 30/700 mono.

---

## Assets & Icons
- **No raster assets.** All iconography is **stroke line icons** (1.7px stroke, 24px grid) defined in `design_reference/shared/theme.jsx` (`PATHS`). Replace with a line-icon library — **Lucide** is the closest match. `Cronlet.icon` / `ImprovementSuggestion.iconKey` are string keys; see `ICON_KEYS` in `tokens.ts` for the set used.
- **Fonts:** Inter + JetBrains Mono (Google Fonts).
- **Mobile frame:** the iOS bezel in the prototype (`design_reference/mobile/ios-frame.jsx`) is **prototype chrome only** — do not ship it. Build to the device's real safe areas.
- **Brand:** the logo is a rounded-square mark with a checkmark + "MyCron" wordtype (green "Cron"). Recreate or swap for your real brand asset.

---

## Files (design references)
- `design_reference/shared/theme.jsx` — tokens, icons, primitives. Loaded by **both** prototypes.
- `design_reference/shared/data.jsx` — **mock only — do not port.** Loaded by both prototypes purely to make the design legible.
- `design_reference/desktop/MyCron - Operating Ledger.html` — desktop app (open in a browser). Loads: `../shared/theme.jsx`, `../shared/data.jsx`, then `dashboard.jsx`, `detail.jsx`, `builder.jsx`, `review.jsx`, `app.jsx`.
- `design_reference/mobile/MyCron - Mobile.html` — iOS app. Loads: `../shared/theme.jsx`, `../shared/data.jsx`, then `ios-frame.jsx` (chrome only), `mobile.jsx`, `mobile-screens.jsx`, `mobile-app.jsx`.

> `theme.jsx`/`data.jsx` live in `shared/` so the two prototypes load identical tokens and fixtures with no duplication. (Originally both files sat only in `desktop/`, which left the mobile prototype referencing missing scripts — fixed here.)

> To view: open either `.html` directly in a browser. The desktop canvas is ~1240px wide; the mobile is a 390×844 frame.
