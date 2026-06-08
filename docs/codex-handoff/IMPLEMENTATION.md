# MyCron — Production UI Implementation (Codex Handoff)

> **This document is the source of truth for the Codex implementation task.**
> It defines *what to build*, *the rules that must not be broken*, and *how the work
> is sliced into GitHub Issues*. Claude Code produced the mock-free contract in `src/`
> (merged in PR #2); **Codex implements the production app and deploys it to Vercel.**

---

## 0. TL;DR for the implementer

- **Goal:** turn the merged design (the `design_reference/` prototypes) into a real,
  deployed React app, built on top of the existing `src/` contract, deployed to **Vercel**.
- **Stack (decided):** **Vite + React + TypeScript** + a client router. Do **not** use Next.js
  for this app pass (the repo deferred a framework decision; this handoff fixes it to Vite —
  see [§2](#2-stack-decision-fixed)).
- **Data (decided):** `EmptyApi` is the default (honest empty states, mock-free). A
  **`SeededDemoApi` behind a `?demo=1` / env flag** reproduces the screenshot fidelity for
  Vercel previews. The **real** backend direction is **Supabase + Google OAuth, account-scoped**.
- **Hard rule:** never break the separation in [§1](#1-non-negotiable-rules). `src/` stays
  mock-free; demo seed data lives only under the new app, never in `src/` or as a default.

---

## 1. Non-negotiable rules

These are inherited from `CONTEXT.md`, the ADRs, `docs/product-implementation-spec.md`, and PR #2.
Breaking any of them fails the task.

1. **`docs/design/mycron-handoff/design_reference/` is visual reference only.** Never import
   it from app code. Its `shared/data.jsx` is mock data for prototype legibility —
   **do not port it** into the app. Do not copy preset strings
   (`Staging Deploy Watch`, `OpsAgent`, `Daily Portfolio Brief`, fake `run_*` IDs, fake
   metrics) as production defaults.
2. **`src/` is the contract and stays mock-free.** Components read typed props +
   `src/styles/tokens.ts`; data flows only through the hooks in `src/data/`. Reuse these
   types/hooks/components — do not fork or re-declare the domain types.
3. **`EmptyApi` is the default API.** Reads resolve to empty (UI renders loading → empty →
   error honestly, zero presets). Writes throw `NotImplementedError` until a real backend
   exists — **never silently no-op a successful write.**
4. **Demo seed is opt-in and isolated.** Any `SeededDemoApi` lives under the new app folder
   (e.g. `app/src/demo/`), is selected only behind an explicit flag, and is clearly labeled
   as non-production. The default build path must still be mock-free.
5. **"Done is a verified state."** Preserve the product thesis: `unverified` is first-class
   (ran ≠ done); green is a **signal**, not a background (see tokens). Audit/proof framing
   over vanity dashboards.

---

## 2. Stack decision (fixed)

| Concern | Decision |
| --- | --- |
| Build tool / framework | **Vite + React 18 + TypeScript** (`strict: true`) |
| Routing | **React Router** (client-side; 5 surfaces + detail/builder pushed views) |
| Styling | Start from the contract's **inline styles + `src/styles/tokens.ts`**. May migrate to CSS variables derived from tokens; **do not** add Tailwind/CSS-in-JS libs without recording an ADR. |
| Icons | **Lucide** (closest to the prototype's 1.7px stroke set; map `ICON_KEYS` in `tokens.ts`). |
| Fonts | **Inter** + **JetBrains Mono** (Google Fonts). Mono for all machine-verifiable values. |
| Package manager | npm (repo already has `package.json` + `package-lock.json` for typecheck). |
| Deploy target | **Vercel** (static SPA build; preview + production). |
| Backend (real data) | **Supabase** (Postgres) + **Google OAuth**, account-scoped — implements `MyCronApi`. Phase 2. |

> Rationale aligns with `docs/product-implementation-spec.md` ("Next.js or Vite+React for PWA;
> SQLite or Supabase for early persistence"). This handoff picks **Vite + Supabase**.

---

## 3. Existing assets to build on

**Contract (reuse, do not rewrite) — `src/`:**

- `src/types/mycron.ts` — domain types for all 5 surfaces (`Cronlet`, `Run`, `DoneCondition`,
  `EvidenceItem`, `InboxRequest`, `WeeklyReview`, `CronletDraft`, …).
- `src/data/api.ts` — `MyCronApi` interface (every endpoint the UI needs).
- `src/data/provider.tsx` — `ApiProvider`, `useApi`, `EmptyApi`, `NotImplementedError`.
- `src/data/hooks.ts` — `useCronlets` / `useCronlet` / `useRunHistory` / `useInbox` /
  `useWeeklyReview` / `useCronletActions` + derivations (`countByState`, `byTriagePriority`,
  `deriveRequiredEvidence`, `STATE_ORDER`).
- `src/components/` — `primitives.tsx` (`StatusBadge`, `HealthStrip`, `Mono`, `EmptyState`),
  `CronletCard.tsx`, `RunConsole.tsx` (first shell).
- `src/styles/tokens.ts` — colors, status palette, radius, shadow, type scale, `ICON_KEYS`,
  `STATUS_LABEL`.

**Visual reference (look/behavior only) — `docs/design/mycron-handoff/`:**

- `README.md` — **full surface-by-surface spec** (layouts, interactions, states). Read this
  before implementing each surface.
- `design_reference/shared/theme.jsx` — icon `PATHS`, primitives, tokens (prototype form).
- `design_reference/desktop/*` and `design_reference/mobile/*` — runnable HTML/Babel
  prototypes. Open the `.html` files in a browser to see the target.

**Direction docs:** `CONTEXT.md`, `docs/adr/0001–0003`, `docs/product-implementation-spec.md`.

---

## 4. Target directory layout

Keep the framework-neutral `src/` contract at the repo root. The deployable app goes in `app/`
and **imports the contract** (path alias or relative import):

```
src/                         # contract (unchanged; mock-free) — the single source of types/api/hooks
app/
  index.html
  vite.config.ts
  tsconfig.json              # extends root, adds DOM app config + path alias @contract -> ../src
  src/
    main.tsx                 # mounts <ApiProvider api={resolveApi()}><App/></ApiProvider>
    app.tsx                  # router + shell
    shell/                   # Sidebar, TopBar, MobileTabBar, layout
    surfaces/
      run-console/           # surface 1
      cronlet-detail/        # surface 2 (+ Proof Panel)
      builder/               # surface 3
      routine-inbox/         # surface 4
      weekly-review/         # surface 5
      account/               # surface 6 (Workspace / Account)
    components/              # app-only presentational pieces not in the contract
    icons/                   # Lucide mapping for ICON_KEYS
    demo/                    # SeededDemoApi + seed fixtures (ISOLATED, opt-in only)
    backend/                 # Phase 2: Supabase client + MyCronApi impl + auth
vercel.json                  # or Vercel project settings (SPA rewrite to /index.html)
```

> The existing `RunConsole.tsx`/`CronletCard.tsx` in `src/components/` are reference
> implementations. Codex may promote/extend them into `app/src/surfaces/` while keeping the
> contract's pure-prop, token-driven pattern.

---

## 5. Data source strategy

`app/src/main.tsx` resolves which `MyCronApi` to inject:

```
resolveApi():
  if (authenticated Supabase session)      -> SupabaseApi   (Phase 2, account-scoped real data)
  else if (?demo=1 or VITE_MYCRON_DEMO=1)  -> SeededDemoApi  (demo/, opt-in, reproduces screenshots)
  else                                      -> EmptyApi       (default; honest empty states)
```

- **EmptyApi (default):** unchanged from `src/data/provider.tsx`. Mock-free.
- **SeededDemoApi (`app/src/demo/`):** implements the full `MyCronApi` with realistic seed
  fixtures so every surface renders like the prototype on a Vercel **preview**. Writes may
  mutate in-memory for the session. **Must be flag-gated; never the default.** Seed values may
  resemble the prototype but live only here, never in `src/`.
- **SupabaseApi (`app/src/backend/`, Phase 2):** implements `MyCronApi` against Supabase with
  **Google OAuth**; all Cronlets/Runs/Inbox/Review are **scoped to the signed-in account**
  (the `Account` ownership boundary in `CONTEXT.md`). Writes persist (this is where
  `NotImplementedError` is finally lifted). RLS policies enforce per-account isolation.

---

## 6. Surfaces — what to build

For each surface, the authoritative visual + interaction spec is in
`docs/design/mycron-handoff/README.md` (§"Screens / Views"). Implement **loading / empty /
error** for every list and detail, plus the four run states. `unverified` is first-class.

### Surface 1 — Run Console (main dashboard)
- Desktop: page header → triage strip (Failed/Stale/Unverified/Verified + deep-green
  "Verified this week %") → ledger table (Cronlet · Run state · Last run · Next run · 7-day
  health · ›), rows sorted by triage priority; tile click filters, row click opens detail.
- Mobile: sticky header → verified-rate hero → scrolling triage chips → "Needs attention" →
  "All routines" stacked `CronletCard`s.
- Data: `useCronlets()`, `countByState()`, `byTriagePriority()`, `useWeeklyReview()`.

### Surface 2 — Cronlet Detail + Proof Panel (centerpiece)
- Title block (icon, name, `StatusBadge`, intent, agent + schedule chips) → triage panel
  (failed/stale only: last verified, error type, next attempt + Retry/Re-arm/Escalate) →
  facts row (Next run / 7-day health / Verified rate / Cost) → **Proof** two-column:
  - **Done Policy** card: checklist of `DoneCondition`s + segmented progress, "N / M met".
  - **Evidence Manifest** card: receipt style, verification **Seal** (solid+check verified,
    dashed otherwise), line items with ✓/⚠, incomplete warning, **read-back command** terminal
    block with copy-to-clipboard.
- Data: `useCronlet(id)` → `latestRun.{donePolicy, evidence, readbackCommand, summary}`;
  actions via `useCronletActions()` (`retryRun`, `rearm`, `escalate`, `confirm`).

### Surface 3 — Cronlet Builder (create / edit)
- Left form (Intent & schedule + Done Policy toggles [first `required`] + auto-derived Evidence
  chips). Right sticky: live **`.mc` manifest** preview (dark terminal) + **next-4-runs**
  validator + "Approve & create". Mobile stacked + sticky create bar.
- Data: local `CronletDraft`; `deriveRequiredEvidence(draft.donePolicy)`;
  `previewSchedule(cron, tz, 4)`; submit via `createCronlet(draft)`.
- **No preset defaults** — start blank or from an `InboxRequest` seed only.

### Surface 4 — Routine Inbox
- List of `InboxRequest` cards (raw text + source + time) with **Dismiss** / **Make Cronlet**.
  "Make Cronlet" → `promoteInbox(id)` → pre-filled `CronletDraft` → opens Builder.
- Data: `useInbox()`, `useCronletActions().promoteInbox/dismissInbox`.

### Surface 5 — Weekly Review + Improvement Loop
- Stat row (Verified rate +Δ / Failed / Stale / Unverified / Cost) → **routine signal matrix**
  (cronlets × 7 days heatmap) → **Improvement loop** (`ImprovementSuggestion`s with concrete
  actions) → **Your corrections** (`UserCorrection`s). No vanity metrics.
- Data: `useWeeklyReview()`; `applySuggestion(id)`.

### Surface 6 — Account / Workspace  *(added 2026-06-08; see screenshot in the handoff request)*
- **Purpose:** account identity, compute budget/usage, and notification preferences for the
  workspace. Mobile gains a 4th bottom-tab (**Account**); on desktop it is reached from the
  sidebar footer user menu.
- **Layout (mobile):** `WORKSPACE` eyebrow + "Account" title + bell (notifications) →
  **profile card** (avatar, name, email, plan badge e.g. `PRO`, "Profile & identity → Edit")
  → **Compute budget** card (`$X.XX of $Y this cycle`, progress bar, `N routines · M runs/wk`,
  `% used`, `renews <date>`, "Manage subscription & invoices →") → **Alerts** list of toggles:
  *Failure alerts*, *Stale drift warnings*, *Weekly review digest* (with schedule line),
  *Run completion summaries* (off by default), etc.
- **⚠ Contract extension required.** The Account surface needs shapes **not yet in `src/`**.
  Extend the contract (mock-free, same pattern) — suggested additions to `src/types/mycron.ts`
  and `src/data/api.ts`:
  - `AccountProfile { id; name; email; plan; avatarInitials? }`
  - `ComputeBudget { usedLabel; limitLabel; usedFraction; routines; runsPerWeek; renewsLabel }`
  - `AlertPreference { key; label; detail?; enabled }` (+ `AlertPreferences = AlertPreference[]`)
  - `MyCronApi`: `getAccount(): Promise<AccountProfile>`,
    `getComputeBudget(): Promise<ComputeBudget>`,
    `getAlertPreferences(): Promise<AlertPreference[]>`,
    `setAlertPreference(key, enabled): Promise<void>` *(write → throws in `EmptyApi`)*,
    plus a hook `useAccount()` / `useComputeBudget()` / `useAlertPreferences()`.
  - Update `EmptyApi` (reads empty/zeroed, the toggle write throws `NotImplementedError`) and
    `SeededDemoApi` (populated to match the screenshot under `?demo=1`).
- **No real names/emails/amounts as defaults.** The screenshot's `Jiho Kang / jiho@hermes.dev /
  $12.40` are mock — demo-seed only, never in `src/`.

### Cross-cutting
- **Navigation:** desktop left sidebar (Run Console / Routine Inbox / Weekly Review + Library:
  Agents/Runtimes) with **Account reachable from the sidebar footer user menu**; mobile bottom
  tab bar is now **Console / Inbox / Review / Account** (4 tabs). Detail & Builder are pushed
  views (mobile hides tab bar, shows back chevron + sticky action bar).
- **Tokens/typography/icons:** per `src/styles/tokens.ts` and README §"Design Tokens". Hover
  must be **state-driven in React** (never mutate `style.background` on DOM nodes).
- **Mobile frame:** the iOS bezel in the prototype is chrome only — ship to real safe areas.

---

## 7. Acceptance criteria (whole task)

- `npm run typecheck` passes for both `src/` (root) and `app/`.
- Default build (no flag) renders all 6 surfaces with **honest empty states** (mock-free);
  writes surface `NotImplementedError` as error UI, never fake success.
- `?demo=1` (or `VITE_MYCRON_DEMO=1`) renders all 6 surfaces populated, visually matching the
  prototypes (desktop + mobile/responsive), including the mobile **Account** tab.
- The `src/` contract is extended (mock-free) to cover Account; `npm run typecheck` stays green.
- No import of `design_reference/**` or its `data.jsx` from `app/` or `src/`.
- Deployed to **Vercel**: production (default/empty or auth-gated) + preview (demo flag) URLs.
- Phase 2: signing in with Google scopes data to the account via Supabase; writes persist.

---

## 8. Work breakdown → GitHub Issues

Implement in dependency order. Each issue links back to this file and to the relevant README
section. Suggested slices (numbers assigned at creation time):

**Phase 0 — foundation**
1. **Scaffold Vite + React + TS app** in `app/`, importing the `src/` contract; root
   `<ApiProvider>`; `npm run typecheck`/`build` green. *(blocks all)*
2. **App shell + navigation** — sidebar, top bar (search, "running now"), mobile tab bar,
   router + selection state, Lucide icon mapping for `ICON_KEYS`, font loading, tokens wired.
3. **Data provider layer** — `resolveApi()` with `EmptyApi` default + `SeededDemoApi`
   (`app/src/demo/`, flag-gated) + honest loading/empty/error wrappers.

**Phase 1 — surfaces** *(depend on 0)*
4. **Run Console** surface (desktop ledger/triage + mobile hero/chips/cards).
5. **Cronlet Detail + Proof Panel** (Done Policy checklist, Evidence Manifest, read-back copy).
6. **Cronlet Builder** (`.mc` preview, done-policy toggles, derived evidence chips, next-4-runs).
7. **Routine Inbox** (cards, Dismiss / Make Cronlet → promote → builder seed).
8. **Weekly Review** (stat row, signal matrix heatmap, improvement loop, corrections).
9. **Account / Workspace surface** — first **extend the `src/` contract** (types + `MyCronApi`
   + hooks + `EmptyApi`/`SeededDemoApi`) for account/budget/alerts, then build the surface +
   mobile **Account** tab (4-tab bar) + desktop sidebar-footer entry. *(see §6 Surface 6)*

**Phase 2 — backend + deploy**
10. **Supabase + Google OAuth** — account-scoped `SupabaseApi` implementing `MyCronApi`
    (incl. the Account/budget/alerts endpoints from #9); persist writes (lift
    `NotImplementedError` for authed users); RLS per account.
11. **Vercel deployment** — SPA build, preview (demo flag) + production, env vars
    (Supabase URL/keys, Google OAuth), build/typecheck in CI.

> A tracking/epic issue links all of the above.
