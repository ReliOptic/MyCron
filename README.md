# MyCron

> MyCron is a user-owned control plane for the actions your AI agents schedule on your behalf.

**MyCron** is a cross-agent control plane for agent-scheduled actions. Agents such as Hermes,
Codex, and Claude Code register time-based actions through an agent-first CLI; MyCron stores
them as **Cronlets**, gates risky **external actions** (payments, sends, account operations)
behind user approval, and records every execution in an immutable **Audit Log**. The
intelligence and execution stay with the agent; ownership, approval, and audit stay with the user.

User-facing sentence:

> 에이전트가 당신을 대신해 시간을 두고 행동한다. MyCron은 그것을 보고·승인·취소·감사하는, 당신이 소유한 통제면이다.

---

## Pivot note (2026-06-04)

This repository pivoted from a governed **GenUI utility runtime** to an **agent action
control plane**. The GenUI direction (generation/delivery of UI) is crowded by large
players and labs; the unfilled gap is the *substrate* — where agent-initiated actions
persist, who owns them, and how they are controlled and audited over time. The previous
GenUI direction is preserved under `docs/_archive-genui/`.

---

## Canonical implementation standard

Read these before asking Claude Code to scaffold implementation:

- [`docs/product-implementation-spec.md`](docs/product-implementation-spec.md): latest CTO-level build direction for moving this docs-only seed repo toward a real MyCron runtime, CLI, and control surface.
- [`docs/strategy.md`](docs/strategy.md): ShareIdee portfolio/gateway strategy and current MyCron/Campsite/BALTAM boundary.
- [`docs/adr/0003-agent-first-cli.md`](docs/adr/0003-agent-first-cli.md): current agent-first CLI ADR from the pivoted control-plane direction.
- [`docs/adr/0004-cli-command-grammar.md`](docs/adr/0004-cli-command-grammar.md) + [`docs/mycron-cli-grammar.md`](docs/mycron-cli-grammar.md): canonical CLI command grammar (resource-scoped, `--json` output-only, `client_ref` idempotency, `--confirm` vs Approval Gate).
- [`docs/mygration-memory-portability.md`](docs/mygration-memory-portability.md): Mygration as migration of Cronlets plus agent memory, including the proposed `.my` memory migration artifact.

CTO standard:

```text
GWS CLI-level responsiveness
+ Google Calendar-grade schedule/sync discipline
+ Rust-grade reliability on correctness-critical runtime paths
```

---

## What MyCron is / is not

MyCron is **not**:

- an alarm app
- a Unix cron dashboard
- a Zapier/IFTTT clone
- a GenUI rendering layer (the earlier, now-archived direction)

MyCron **is** the control and audit plane for agent-initiated background actions.

---

## The loop

```text
Host agent registers a Scheduled Action
→ Account-scoped Cronlet store
→ Policy decision: internal action = auto-execute / external action = Approval Gate
→ Approval Queue (external actions wait here)
→ User approves / rejects on the Control Surface
→ Execute / skip
→ Immutable Audit Log
→ Feedback Event back into runtime state and Policy
```

The first demo proves three things: **P1** cross-agent registration, **P2** the Approval
Gate (external actions do not run until approved), **P3** an immutable Audit Log. See
`docs/design-control-plane-mvp.md`.

---

## Core concepts

Defined in `CONTEXT.md`. In short:

- **Host Agent** — external agent (Hermes, Claude, GPT) that decides and registers actions; owns execution and its LLM cost.
- **Scheduled Action** — "do X at time/condition Y", registered by an agent.
- **Action Type** — `internal` (reversible: notify, brief) vs `external` (hard to reverse: payment, email_send, account_op).
- **Cronlet** — a stored, controllable instance of a scheduled action in an Account.
- **Account** — the user-owned ownership boundary (the basis for cross-agent neutrality).
- **Approval Gate / Approval Queue** — external actions wait for user approval before execution.
- **Policy** — which action types auto-execute vs require approval (rule-based now, learned later).
- **Audit Log** — immutable record of what executed/was rejected, when, by which agent.
- **Control Surface** — where the user sees, approves, cancels, and audits.

---

## Customer

- **Boot (now):** the coding/agent ecosystem (OMC, Claude Code, Hermes). Coding agents
  increasingly schedule background work (cron, deploys, monitoring) with no place to
  control it. Natural 0→1 — accumulates usage, approval patterns, and audit data.
- **Revenue:** enterprise. Where agents touch payments, sends, and accounts, pre-execution
  approval and audit trails are compliance-critical and paid for today (regulated /
  finance-adjacent).

## Moat

1. **Low-friction agent operation.** Like `gws`, `mycron` should be fast, schema-driven,
   JSON-readable, dry-run/confirm safe, and read-back verifiable. The faster agents can
   register, inspect, and verify Cronlets, the stronger the control-plane moat.
2. **Cross-agent neutrality.** A user-owned control plane any agent can write to. Labs keep
   users inside their own agent (lock-in); a *neutral* control plane that covers competing
   agents is something they structurally will not build. Neutrality is the defense.
3. **Accumulating approval/audit data.** Which actions users approve/reject, what is safe to
   auto-execute, compounds in MyCron's layer and cannot be taken by the host.

---

## Example (agent-first CLI)

The CLI is resource-scoped — `mycron <resource> <verb> [id] [flags]`. `--json` is **output**
only; input is `--file` / `--input-json`. Full grammar: [`docs/mycron-cli-grammar.md`](docs/mycron-cli-grammar.md).

```bash
# external action → cronlet is registered, but execution waits on the Approval Gate
mycron cronlet create --file invoice.mc --confirm --json
# → { "status":"created","id":"crn_001","requires_approval":true,
#     "approval":{"id":"apr_001","next_command":"mycron approval approve apr_001 --json"} }

# user (or script) approves the queued external action — only now may it execute
mycron approval approve apr_001 --json

# internal action → auto-executes per Policy (no approval needed)
mycron cronlet create --file daily-brief.mc --confirm --json
```

`--confirm` confirms only the CLI write; it never approves external execution (that is the
Approval Gate). CLI is an agent-first CRUD client for the Cronlet store plus control verbs
(`approval approve` / `approval reject`). See
[`docs/adr/0004-cli-command-grammar.md`](docs/adr/0004-cli-command-grammar.md),
`docs/adr/0003-agent-first-cli.md`, and `docs/product-implementation-spec.md`.

---

## UI foundation and app shell

The React + TypeScript **UI contract** lives in `src/`: domain types, API
interfaces, hooks, primitives, and mock-free components. The runnable Vite app
lives in `app/` and injects a `MyCronApi` implementation at bootstrap.

```
src/
  types/mycron.ts        # domain types: Cronlet, Run, DonePolicy, EvidenceItem, InboxRequest, WeeklyReview
  data/api.ts            # MyCronApi — the endpoints the UI expects
  data/provider.tsx      # ApiProvider + EmptyApi (mock-free default)
  data/hooks.ts          # useCronlets / useCronlet / useInbox / useWeeklyReview + derivations
  components/             # StatusBadge, HealthStrip, Mono, EmptyState, CronletCard, RunConsole
  styles/tokens.ts       # color / status / type / radius / shadow tokens
docs/design/mycron-handoff/
  design_reference/       # desktop + mobile HTML/JSX prototypes — VISUAL REFERENCE ONLY
```

Rules this foundation enforces:

- **`docs/design/mycron-handoff/design_reference/` is visual reference only.** It is never
  imported by `src/`. Its `shared/data.jsx` is mock data **for the prototype's legibility —
  do not port it into production.** Do not copy Builder presets (`Staging Deploy Watch`,
  `OpsAgent`, etc.) or any fabricated cronlets / run IDs / metrics into `src/`.
- **The `src/` contract is mock-free.** Components are pure: they read typed props and
  `tokens.ts`, and pull data only through the hooks in `src/data/`.
- **`EmptyApi` is the honest default.** Reads resolve to empty data (UI renders loading →
  empty states with zero presets); **writes throw `NotImplementedError`** — a control plane
  must never report a silent success for an action it did not perform.
- **Backends implement `MyCronApi`** and are injected at bootstrap via
  `<ApiProvider api={realApi}>`, replacing `EmptyApi` endpoint by endpoint. Demo
  data is confined to `SeededDemoApi` behind `?demo=1`.

Validate with `npm run typecheck`, `npm test`, and `npm run build`.

## Roadmap checkpoint (2026-06-13)

This is the current handoff state for the next agent or maintainer. Treat this
section as the repo-level "where are we?" marker until the first-real-user track
is merged.

### What is already real

- **Preview web app:** Vite SPA on Vercel with demo mode (`?demo=1`) and honest
  empty states when no backend is configured.
- **Agent-first CLI MVP:** resource-scoped CLI commands exist for schema
  introspection, artifact validation/preview, Cronlet lifecycle, approval, run,
  evidence, mygration, memory, and account scope.
- **Canonical `.mc` schema:** PR #66 / issue #60 promoted the Cronlet / Pack /
  Memory artifact schemas into `packages/schema`; the CLI imports that canonical
  schema instead of owning a private copy.
- **Design/contract surface:** `src/` remains mock-free and API-driven; the app
  chooses between `SeededDemoApi`, `EmptyApi`, and a backend implementation at
  bootstrap.

### Active roadmap tracks

1. **Trust surface hardening**
   - PR #58: enforce the ADR-0007 user-actor invariant on approval
     approve/reject.
   - PR #59: allocate store ids from max suffix, not record count.
   - Issues #61-#65: approval/audit API contract, Run tri-state
     process/data/goal status, audit list, shared Evidence definition, and the
     P1/P2/P3 denial-gate walkthrough.
2. **First real user E2E**
   - Epic #76 is the entry point.
   - Ordered issues: #67 -> #68 -> #69 -> #70 -> #72, with #71 consuming #61
     and #68, and #73 depending on the account/auth/onboarding pieces.
   - Draft PR #74 implements #67's hosted account spine in code, but it is not
     ready to merge as a live slice until a MyCron-owned Supabase project is
     active and configured.

### Hosted storage boundary

Do **not** point MyCron at the Supabase project
`ybvgltbfrllxenvfkynr`. That project is **cronbell** and is used by Campsite.
It was briefly tested as a MyCron reuse target, then reverted after the Campsite
dependency was discovered.

Current Supabase/Vercel truth:

- `ybvgltbfrllxenvfkynr` is named `cronbell` again and must be treated as
  Campsite-owned.
- `dobzpikndbmnmugivnxf` is reserved/named `mycron`, but is currently
  paused/inactive.
- MyCron's Vercel project currently has **no** `VITE_SUPABASE_URL` or
  `VITE_SUPABASE_ANON_KEY` env vars on Production, Preview, or Development.
  This is intentional so hosted MyCron cannot accidentally read/write Campsite
  storage.
- Activating a separate MyCron Supabase project is blocked by the current
  Supabase free active-project limit. Resolve by freeing a slot, upgrading, or
  otherwise unpausing/activating the reserved `mycron` project.

### Next safe sequence

1. Activate or create a **MyCron-owned** Supabase project; do not reuse
   `cronbell`.
2. Link this repo to that MyCron project and apply
   `supabase/migrations/0001_init.sql`.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the MyCron Vercel
   project only after the target project is confirmed MyCron-owned.
4. Configure Google OAuth redirects for the hosted app.
5. Re-run #67 validation: `npm run typecheck && npm test && npm run build`, then
   smoke the no-env path and the signed-in read path.
6. Only then make PR #74 merge-ready and continue to #68 server-side mutation
   kernel.

## Hosted account spine

Supabase is optional in local development. If either value is absent, the Vite
app keeps the existing `EmptyApi` behavior: honest empty states and failing
writes.

```bash
cp .env.example .env.local
# fill these from the MyCron-owned Supabase project dashboard
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

With both values present, Google sign-in is available on the Account tab. A
signed-in session selects the read-only Supabase API path for account-scoped
Cronlet reads. Mutations remain out of scope for this slice and still fail
explicitly.

Apply `supabase/migrations/0001_init.sql` to create `accounts` and `cronlets`
with owner-only SELECT RLS and no client INSERT/UPDATE/DELETE policies.

## Repository status

Main has moved past the original docs-only seed: the repo now contains the Vite
preview app, the mock-free UI contract, the agent-first CLI MVP, ADRs for the
kernel/ledger/approval actor model, and the canonical artifact schema package.

Still not real yet: hosted writes, server-side invariant enforcement, CLI remote
mode, scheduler/executor ownership, verified evidence provenance, Google OAuth
configuration, and the first-user onboarding path. The product is currently at
the boundary between "local agent-first prototype" and "hosted account-scoped
control plane."

## License

MIT
