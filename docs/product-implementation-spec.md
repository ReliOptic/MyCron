# MyCron Product Implementation Spec

> Status: canonical implementation direction for the next build pass
> Last updated: 2026-06-08
> Repository state: docs-only seed repo; no `package.json`, `app/`, `src/`, production runtime, or PWA exists yet.

## 0. Why this document exists

The current MyCron repository is intentionally a seed repository: domain model, ADRs, control-plane MVP notes, strategy, and implementation milestones. It does **not** yet contain a production app or runtime.

That means the next Claude Code / implementation pass should **not** try to “embed a design into an existing app.” There is no app yet. The correct first step is to turn the latest product direction into a buildable product contract, then scaffold the runtime and UI around that contract.

This document is the handoff spec for that work.

## 1. Product definition

**MyCron is a user-owned multi-agent operations interface and harness for scheduled actions.**

Host agents such as Hermes, Claude Code, Codex, or GPT register **Scheduled Actions** through an agent-first CLI/API. MyCron stores them as **Cronlets** under the user's Account, applies Policy, gates risky **external actions**, preserves Memory/Evidence boundaries, binds future runs to runtimes through **RuntimeBinding**, and verifies what actually happened.

MyCron is not the model, not the agent brain, and not an app for embedding agents. It is the operating harness around long-running agent work: memory, I/O, scheduling, orchestration, approval, evidence, verification, and audit. Its core usability value appears when a user has many agents across many runtimes and needs one place to understand, approve, pause, retry, rebind, verify, and audit what they are doing.

Short external line:

> Vibe coding makes agent workflows easy to create; MyCron makes them reliable to operate.

User-facing Korean line:

> 사용자는 Cron을 원하는 것이 아니라, 위임한 AI 업무가 실제로 수행됐는지 확인 가능한 상태를 원한다.

Product thesis:

> Done is not a message. Done is a verified state.

CTO thesis:

> MyCron’s moat is not that it has schedules. The moat is that agents can operate it with Google Workspace CLI-level speed, predictability, and read-back verification while the runtime preserves Calendar-grade consistency and Rust-grade reliability discipline.

The Hermes Agent anatomy reference should be understood as a harness design lesson, not a clone target: Hermes improves without retraining the model by accumulating human-readable skills, memory, safe background reflection, and verification procedures. MyCron's analogous job is to make agent work improve through readable operating contracts: `.mc` Cronlets, memory artifacts, policies, safety rules, evidence, capability grants, and Done Policies.

The Google Calendar / Google Workspace reference should be understood as an operational standard, not a clone target:

- **Hermes anatomy standard:** memory, skill/process, evidence, policy, safety, and runtime binding should remain separate, inspectable layers; future-run improvements must not silently rewrite the contract of an already-running Run.
- **GWS CLI standard:** agent commands should be fast, schema-driven, scriptable, JSON-readable, and easy to verify.
- **Google Calendar standard:** schedule/time/recurrence objects should be stable, syncable, permissioned, and conflict-aware.
- **Rust-grade standard:** critical runtime paths should be deterministic, memory-safe where appropriate, strongly typed, observable, and hard to corrupt through invalid state transitions.

## 2. What MyCron is not

MyCron is not:

- a generic Unix cron dashboard
- a simple alarm app
- a Zapier/IFTTT clone
- an arbitrary dashboard generator
- a Flutter-specific product
- an Airflow/Prefect/Kubernetes CronJob replacement for backend engineers
- a mock-heavy design demo pretending to be a product

MyCron can interoperate with schedulers, agents, messaging surfaces, and GenUI renderers, but its center is **operational trust for delegated scheduled agent work**.

## 3. Core user and wedge

The strongest wedge is **recurring agent-operated knowledge work**, not generic developer cron replacement.

Conventional developer scheduling already has mature tools:

- data engineering pipelines use Airflow, Prefect, Dagster-like orchestrators;
- backend/platform work uses Kubernetes CronJob, GitHub Actions schedules, native cron, and CI/CD tooling;
- deployment platforms already expose build logs, rollbacks, domains, and preview status.

MyCron should operate and verify agent work across those tools when they are present, not compete head-on with them.

The first strong users are AI-heavy knowledge operators and agent operators who repeatedly delegate research, information gathering, summarization, monitoring, briefings, triage, and external-action drafts to agents:

- founders, strategists, analysts, investors, marketers, SEO operators, PMs, consultants, and automation-heavy prosumers;
- OMC / OMX / Claude Code / Hermes / Codex users who accumulate recurring agent jobs across tools;
- teams where agents may touch external actions such as email sends, account operations, deployments, payments, or customer/workspace data;
- agent operators who need approval, cancellation, audit, memory attachment, evidence, and read-back across competing agents.

The wedge is:

```text
Agents increasingly schedule background actions
→ actions persist outside the originating chat/session
→ external actions need user approval before execution
→ users need one Account-scoped control plane to inspect, approve, reject, cancel, and audit them
```

Enterprise expansion comes where external actions require compliance-grade pre-execution approval and audit trails.

## 4. Core object hierarchy

### 4.1 `.mc` Cronlet artifact

`.mc` is the portable artifact representation of delegated scheduled work.

It should preserve enough information to move a routine across Hermes cron, crontab, GitHub Actions, Claude/Codex/Hermes workflows, local scripts, or future runtimes.

### 4.2 Cronlet runtime object

A Cronlet is the persisted runtime instance of one Scheduled Action under an Account.

A Cronlet includes:

- identity: id, name, description, tags
- account scope: user-owned boundary for cross-agent neutrality
- host agent: agent that registered the action and usually owns execution/LLM cost
- action type: `internal` or `external`
- schedule: cron/time expression, timezone, next run policy
- action payload: structured JSON arguments validated against the action schema
- policy decision: auto-execute, approval-required, rejected, paused, cancelled
- approval gate state: pending/approved/rejected/expired when external action requires approval
- risk tier: low/medium/high
- run/audit history: immutable record of execution, skip, rejection, and policy decisions
- feedback events: approve/reject/cancel/pause actions that update runtime state and future policy
- optional reliability extensions: Done Policy, evidence requirements, run health, Mygration metadata
- surface contract: how the user inspects/controls it

### 4.3 Done Policy

Done Policy defines completion semantics.

A run is not verified just because an agent emitted a message. A run becomes verified only when required conditions pass.

Example Done Policy conditions:

- process completed cleanly
- all required sources reached
- output artifact exists and is non-empty
- delivery receipt exists
- summary cites source/evidence refs
- user goal was confirmed or read back
- no silent schedule drift occurred

### 4.4 Evidence

Evidence is the proof layer.

Examples:

- generated file path or artifact URI
- source manifest
- delivery receipt
- execution log
- read-back command
- timestamped run summary
- user acknowledgement
- verification hash or storage ref where appropriate

### 4.5 Run health

Run health is not a vanity metric. It tells the user whether delegated work is trustworthy.

Canonical UI run states for the first product surface:

```text
verified    = done policy satisfied and evidence exists
failed      = execution or required proof failed
stale       = expected run is missing or schedule drifted
unverified  = agent ran, but proof/completion is incomplete
```

Deeper internal failure vocabulary can include:

```text
completed
partial
semantic_fail
source_fail
acceptance_failed
missed
approval_required
```

But the first UI should resolve these into the four user-facing states above.

## 5. Product loop

The canonical MyCron loop is:

```text
Host agent registers a Scheduled Action through mycron CLI/API
→ MyCron validates schema and stores an Account-scoped Cronlet
→ Policy classifies action type: internal vs external
→ internal action can auto-execute / external action enters Approval Queue
→ user approves, rejects, cancels, or pauses from the Control Surface
→ host agent executes only when allowed by Policy / Approval Gate
→ MyCron records execution, rejection, skip, and feedback in immutable Audit Log
→ read-back command/API proves current state to the host agent and user
→ approval/audit patterns improve future Policy
```

Done Policy, Evidence, Run Health, Weekly Review, and Mygration extend this loop for routines where “executed” is not enough and the user needs proof of actual completion.

## 6. MVP surfaces

The latest design handoff and strategy converge on five surfaces.

### 6.1 Run Console

Purpose: show the current state of delegated scheduled work.

Required elements:

- state triage: Failed / Stale / Unverified / Verified
- verified-rate indicator
- list/table of Cronlets sorted by triage priority
- 7-day health strip per Cronlet
- next run and last run labels
- click-through to detail

### 6.2 Cronlet Detail + Proof Panel

Purpose: prove whether one routine actually completed.

Required elements:

- Cronlet identity, intent, agent/runtime binding, schedule chips
- current state badge
- triage panel for failed/stale routines
- facts row: next run, 7-day health, verified rate, cost
- Done Policy checklist with per-condition state
- Evidence Manifest with artifact/source/log/delivery/read-back refs
- read-back command block

### 6.3 Cronlet Builder

Purpose: create or edit a delegated scheduled routine and define what counts as done.

Required elements:

- name
- intent
- schedule / timezone
- runtime / agent binding
- delivery surface
- risk tier
- approval policy
- Done Policy toggles
- derived evidence requirements
- `.mc` manifest preview
- next-run preview
- approve/create action

Important: production builder must **not** start with preset demo values like `Staging Deploy Watch`, `OpsAgent`, or fake schedules. It should start blank or from a real Routine Inbox seed.

### 6.4 Routine Inbox

Purpose: capture vague recurring asks and promote them to Cronlets.

Sources can include:

- Telegram / Hermes gateway
- Campsite camp/session
- Claude Code / Codex / Hermes agent output
- manual entry
- imported existing automation

Actions:

- dismiss
- promote to Cronlet draft
- classify risk / required approval

### 6.5 Weekly Review + Improvement Loop

Purpose: give one honest read on delegated work.

Required elements:

- verified runs / total runs
- failed / stale / unverified counts
- cost estimate
- routine signal matrix
- improvement suggestions
- user corrections folded back into policy/runtime

## 7. GenUI and Utility Pack relationship

The existing Utility Pack / governed GenUI direction is still useful, but it is the **surface layer**, not the whole product.

Updated hierarchy:

```text
Cronlet runtime object
→ state + Done Policy + evidence + audit history
→ surface contract
→ governed GenUI / Utility Pack renderer
```

Utility Packs can define:

- allowed widgets
- allowed actions
- feedback contract
- surface metadata
- risk/permission hints

But MyCron’s primary object is the Cronlet, not the Pack.

The renderer rule remains:

> The renderer never executes arbitrary code from a Pack. It only renders validated JSON specs from approved component catalogs and emits approved action events back to the runtime.

## 8. Design handoff usage rule

If using the Claude Design handoff package, treat it this way:

```text
design_reference/ = visual reference only
src/types         = domain contract inspiration
src/data          = API/provider/hook contract inspiration
src/components    = component pattern inspiration
src/styles        = token reference
```

Hard rules:

- Do not port `design_reference/desktop/data.jsx` into production.
- Do not port hardcoded Cronlets, fake run IDs, fake metrics, fake schedules, or fake evidence.
- Do not port Builder preset defaults from prototype files.
- Do not copy Babel/HTML prototype structure as production architecture.
- Keep rich prototypes as docs/reference artifacts only.
- Production UI must be driven by typed data, hooks, props, and an injected API boundary.
- Empty defaults may render honest empty states for reads.
- Mutations should fail fast with `Not implemented` until a real backend exists.

## 9. CLI responsiveness as technical moat

The Google Workspace CLI reference matters because it proves what agent-native operation should feel like:

```text
natural-language user intent
→ agent chooses exact command
→ CLI returns structured JSON quickly
→ agent reads back the created/updated object
→ user sees confirmation with stable id/link
```

MyCron should treat CLI responsiveness as a first-class product requirement, not an afterthought.

### 8.1 CLI product standard

The `mycron` CLI should be:

- **fast:** common read/write commands should return in sub-second to low-single-second time when network dependencies are healthy
- **predictable:** every command has stable input/output schemas
- **agent-readable:** `--json` is mandatory for all commands
- **human-readable:** default output remains concise and useful for terminal users
- **schema-discoverable:** agents can ask for command/resource schemas instead of guessing
- **dry-run-first:** side-effecting commands support `--dry-run`
- **confirmation-aware:** medium/high-risk commands require `--confirm` or explicit approval flow
- **read-back-verifiable:** every write result includes the next read-back command
- **idempotent where possible:** repeated agent calls should not silently duplicate work
- **low-friction:** auth, config, default workspace, and current runtime should be easy to inspect and fix

### 8.2 Minimum CLI command surface

Initial commands should center on Cronlets, not implementation internals:

```bash
mycron schema cronlet --json
mycron status --json
mycron config doctor --json

mycron cronlet create --file routine.mc --dry-run --json
mycron cronlet create --file routine.mc --confirm --json
mycron cronlet list --fields id,name,state,next_run,runtime --json
mycron cronlet get crn_123 --json
mycron cronlet update crn_123 --file patch.json --dry-run --json
mycron cronlet pause crn_123 --confirm --json
mycron cronlet resume crn_123 --confirm --json
mycron cronlet run-now crn_123 --dry-run --json

mycron run list --cronlet crn_123 --json
mycron run get run_123 --json
mycron evidence list --run run_123 --json

mycron mygration import --from hermes --dry-run --json
mycron mygration inspect mygr_123 --json
mycron mygration diff mygr_123 --json
mycron mygration rebind mygr_123 --target claude-code --dry-run --json
```

### 8.3 JSON result contract

Every successful write-like command should return:

```json
{
  "status": "created",
  "resource": "cronlet",
  "id": "crn_123",
  "changed": true,
  "requires_user_confirmation": false,
  "verification": {
    "read_back_available": true,
    "next_command": "mycron cronlet get crn_123 --json"
  },
  "links": {
    "web": "https://mycron.app/c/crn_123"
  }
}
```

Every dry-run should return:

```json
{
  "status": "dry_run",
  "would_change": true,
  "resource": "cronlet",
  "candidate_id": "draft_123",
  "requires_user_confirmation": true,
  "diff": []
}
```

This is a core technical moat: agents should be able to operate MyCron as reliably as they operate Google Workspace resources through `gws`.

## 10. Rust-grade reliability standard

Do not choose Rust as a fashion signal. Choose Rust where it materially improves correctness, safety, portability, and runtime durability.

### 9.1 Recommended stack posture

Near-term product/application layer:

```text
TypeScript + React/PWA + Node CLI + Zod schemas
```

Rust-suitable reliability layer:

```text
schedule expansion engine
RRULE/timezone validator
.mc import/export validator
local runtime daemon
sync engine
capability probe runner
memory graph normalization/indexing
sandbox/event-bridge boundary for generated surfaces
```

Practical architecture:

```text
TypeScript app/CLI/API for speed of product iteration
→ shared schema contracts
→ Rust crates for correctness-critical engines when needed
→ wasm/node bindings or CLI subprocess boundary
```

### 9.2 Reliability requirements independent of language

Whether implemented in TypeScript or Rust, critical runtime paths must have:

- explicit state machines
- schema validation at every boundary
- versioned resources and optimistic concurrency
- idempotency keys for side-effecting commands
- leases/locks for multi-agent execution
- deterministic schedule expansion tests
- timezone/DST fixture tests
- audit events for every mutation
- structured error codes
- read-back verification
- corruption-resistant import/export

### 9.3 Where Rust should not be first

Do not start with Rust for:

- marketing pages
- PWA UI
- early product iteration
- prototype-only GenUI renderer
- simple CRUD API before the schema stabilizes

Rust should be introduced at the point where the product has a stable enough contract and correctness risks dominate iteration speed.

## 11. Data contract: first implementation shape

The first app/runtime should define TypeScript domain types before building UI.

Minimum types:

```ts
type RunState = "verified" | "failed" | "stale" | "unverified";

type ApprovalMode = "auto" | "ask_before_run" | "ask_before_write" | "human_confirmed";
type RiskTier = "low" | "medium" | "high";

interface Cronlet {
  id: string;
  name: string;
  intent: string;
  schedule: {
    cron: string;
    timezone: string;
    nextRunAt?: string;
    lastRunAt?: string;
  };
  runtime: RuntimeBinding;
  policy: {
    riskTier: RiskTier;
    approvalMode: ApprovalMode;
    doneConditions: DoneCondition[];
    evidenceRequirements: EvidenceRequirement[];
  };
  state: RunState;
  health: (RunState | null)[];
  verifiedRate: number;
  latestRun?: Run;
  audit: AuditEvent[];
}

interface RuntimeBinding {
  kind: "hermes" | "claude_code" | "codex" | "github_actions" | "crontab" | "local" | "external";
  label: string;
  ref?: string;
}

interface DoneCondition {
  id: string;
  label: string;
  detail?: string;
  required: boolean;
  producesEvidence?: boolean;
  state?: RunState;
}

interface EvidenceRequirement {
  type: "file" | "links" | "delivery" | "log" | "summary" | "receipt" | "user_ack";
  label: string;
  required: boolean;
}

interface EvidenceItem {
  type: EvidenceRequirement["type"];
  label: string;
  ref: string;
  uri?: string;
  meta?: string;
  warn?: boolean;
}

interface Run {
  id: string;
  cronletId: string;
  state: RunState;
  startedAt: string;
  finishedAt?: string;
  summary?: string;
  donePolicy: DoneCondition[];
  evidence: EvidenceItem[];
  readbackCommand?: string;
  costLabel?: string;
  errorType?: string;
}

interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail?: string;
}
```

This can evolve, but the MVP should not start from UI mock data. It should start from this contract.

## 12. API contract: first implementation shape

The first runtime API should support the surfaces above.

Minimum interface:

```ts
interface MyCronApi {
  listCronlets(): Promise<Cronlet[]>;
  getCronlet(id: string): Promise<Cronlet>;
  listRuns(cronletId: string, opts?: { limit?: number; cursor?: string }):
    Promise<{ runs: Run[]; nextCursor?: string }>;

  createCronlet(draft: CronletDraft): Promise<Cronlet>;
  updateCronlet(id: string, patch: Partial<CronletDraft>): Promise<Cronlet>;
  pauseCronlet(id: string): Promise<void>;
  resumeCronlet(id: string): Promise<void>;
  runNow(id: string): Promise<{ runId: string }>;

  retryRun(runId: string): Promise<{ runId: string }>;
  confirmRun(runId: string): Promise<void>;
  escalateRun(runId: string, note?: string): Promise<void>;

  listInbox(): Promise<InboxRequest[]>;
  dismissInbox(id: string): Promise<void>;
  promoteInbox(id: string): Promise<CronletDraft>;

  getWeeklyReview(rangeStart?: string): Promise<WeeklyReview>;
  applySuggestion(id: string): Promise<void>;

  previewSchedule(cron: string, timezone: string, count: number): Promise<string[]>;
}
```

Default API behavior:

- read/list endpoints may return empty arrays for honest empty states
- detail endpoints for missing ids should throw
- write/mutation endpoints should throw `Not implemented` until real persistence exists
- no fake success for actions that change state

## 13. Repository architecture recommendation

Because the repo is currently docs-only, the first implementation should choose a small but real stack.

Recommended scaffold:

```text
apps/web/                 # PWA / React app
apps/cli/                 # agent-facing CLI
packages/schema/          # TypeScript types + Zod schemas
packages/runtime/         # Cronlet runtime API/store/validation
packages/renderer/        # governed GenUI renderer later
packs/                    # Utility Pack definitions
examples/                 # .mc examples and sample imports only
```

Recommended tech:

```text
TypeScript
Next.js or Vite+React PWA
Zod for schema validation
SQLite or Supabase for early persistence
Node CLI for mycron commands
```

Do not choose Flutter/native first. Renderer should remain optional.

## 14. First implementation milestones

### Milestone 0 — repo alignment

Goal: prevent old docs from misleading implementers.

Tasks:

- mark this document as the latest implementation spec
- update README document map
- update or supersede old `docs/implementation-plan.md` if it still centers only on two-pack GenUI
- preserve Utility Pack docs as surface-layer design, not product center

### Milestone 1 — schema-only foundation

Goal: define Cronlet, Done Policy, Evidence, Run, Audit, and `.mc` before UI.

Deliverables:

- `packages/schema` or `docs/schema` depending on whether code scaffold exists
- `.mc` example for one recurring research brief
- `.mc` example for one health-check routine
- validation rules and non-goals

### Milestone 2 — mock-free UI shell

Goal: implement Run Console + empty states without preset data.

Deliverables:

- PWA shell
- ApiProvider / hooks
- EmptyApi with read-empty / mutation-fail-fast behavior
- Run Console empty/loading/error states
- StatusBadge, HealthStrip, EmptyState primitives

### Milestone 3 — Cronlet Builder + Routine Inbox

Goal: create Cronlet drafts from blank form or real inbox seed.

Deliverables:

- Routine Inbox empty state
- Cronlet Builder
- `.mc` preview
- schedule preview endpoint stub
- Done Policy → evidence derivation

### Milestone 4 — persistence + audit

Goal: make Cronlets durable.

Deliverables:

- persistence store
- create/list/get/update
- audit events
- CLI create/list/inspect

### Milestone 5 — Proof Panel + Run Health

Goal: prove delegated work completion.

Deliverables:

- Run detail
- Done Policy result rendering
- Evidence Manifest
- run state resolution
- read-back command

### Milestone 6 — Weekly Review + improvement loop

Goal: turn failures/corrections into better routines.

Deliverables:

- weekly review rollup
- improvement suggestions
- apply suggestion action
- user corrections

### Milestone 7 — governed GenUI surface layer

Goal: reintroduce Utility Packs as validated renderer contracts.

Deliverables:

- Pack schema
- component catalog validation
- GenUI spec validation
- safe fallback rendering
- no arbitrary code execution

## 15. Non-goals for the next Claude Code pass

Do not implement these in the first pass:

- real scheduler execution
- real agent execution
- production auth
- payments
- marketplace
- public sharing
- native mobile app
- complex DAGs
- Airflow/Prefect replacement features
- fake demo cronlets in production code
- LLM-generated arbitrary React/HTML

## 16. Claude Code prompt for the next pass

Use this prompt when handing off to Claude Code:

```text
You are working in the MyCron repository.

Important repo fact:
This is currently a docs-only seed repo. There is no production runtime, PWA, package.json, app/, or src/ yet.

Goal:
Align the repository around the latest MyCron implementation direction before writing production app code.

Read first:
- README.md
- docs/product-implementation-spec.md
- docs/strategy.md
- docs/prd.md
- docs/agent-action-cli.md
- docs/llm-genui.md
- docs/mygration-memory-portability.md

Product center:
MyCron is a user-owned cross-agent control plane for scheduled actions. Host agents register Scheduled Actions through an agent-first CLI/API. MyCron stores Account-scoped Cronlets, applies Policy, gates external actions through Approval Gate / Approval Queue, records immutable Audit Log entries, and exposes a Control Surface for approve/reject/cancel/pause/audit. Done Policy, Evidence, Run Health, Weekly Review, Mygration, and governed GenUI are reliability/surface extensions, not the product center.

CTO direction:
Use Google Workspace / Google Calendar as an operational standard, not as a clone target. MyCron's moat is low-friction agent operation: fast CLI response, stable JSON output, schema discovery, dry-run/confirm safety, and read-back verification. Critical runtime paths should follow Rust-grade reliability discipline: explicit state machines, schema validation, idempotency keys, leases/locks for multi-agent execution, deterministic schedule expansion, timezone/DST tests, audit events, and corruption-resistant import/export. Do not start with Rust for UI/prototype work; introduce Rust later for correctness-critical engines such as schedule expansion, .mc validation, sync, capability probes, or memory graph normalization.

Task:
Create a plan-only PR or docs alignment PR. Do not scaffold app code yet unless explicitly asked.

Requirements:
1. Mark docs/product-implementation-spec.md as the canonical implementation spec.
2. Update README document map to link it.
3. Update docs/implementation-plan.md so future implementers do not treat the old two-pack GenUI demo as the whole product.
4. Keep Utility Pack / GenUI docs, but frame them as the surface layer.
5. Add a concise TODO or milestone section for the first real app scaffold:
   - schema foundation
   - mock-free UI shell
   - Cronlet Builder + Routine Inbox
   - persistence + audit
   - Proof Panel + Run Health
   - Weekly Review
   - governed GenUI later
6. Do not add hardcoded mock data.
7. Do not import the Claude Design prototype as production code.
8. Do not create fake demo cronlets in production paths.
9. Run git diff --check.
10. Open a PR with summary, non-goals, and next implementation step.

Branch:
docs/latest-mycron-implementation-spec

Commit message:
docs: define latest MyCron implementation spec
```

## 17. Success criteria

This repo is ready for product implementation when a new engineer or Claude Code can answer these without asking the founder:

- What is MyCron?
- What is the core object?
- What does “done” mean?
- What is evidence?
- What are the first UI surfaces?
- What is GenUI’s role?
- What should not be implemented yet?
- Where should production code begin?
- What mock data is forbidden?

If those answers are clear, the repo can safely move from docs-only seed to first real implementation.
