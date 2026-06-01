# MyCron

> My Routine-inspired control dashboard for Hermes Agent cron routines.

**MyCron** is an early product/design repository for a Hermes Agent dashboard that turns scheduled agent work into a visible, inspectable, and controllable routine board.

The name intentionally braids three ideas:

- **My**: the user's personal control room
- **Cron**: scheduled autonomous work
- **Routine UI**: a MyRoutine-style traffic-light / checklist board

This repo starts from a product hypothesis, not an implementation claim: agentic cron jobs need more than a Unix schedule. They need observable state, validation, prompt/version history, and owner control.

> Naming note: "MyCron" is a working name. Because it sounds like "Micron", this repo should keep trademark/brand-confusion review open before any commercial use.

---

## Product thesis

MyRoutine asks:

> Did I complete my habits today?

MyCron asks:

> Did my Hermes Agent routines execute correctly, produce trustworthy output, and stay under owner control?

A normal cron dashboard can say whether a job ran. MyCron should say whether an **agentic routine** remained useful, safe, and aligned.

---

## Core UI: traffic-light routine board

```text
[ MyCron: Hermes Agent Control Room ]

Mon  Tue  Wed  Thu  Fri  Sat  Sun   Routine                         Controls
🟢   🟢   🟢   🟢   ⚪   ⚪   ⚪    📰 Morning news research          ⚙️  ⏸  ❌
🟡   🟢   🟢   🔴   ⚪   ⚪   ⚪    📈 Crypto volatility watch        ⚙️  ⏸  ❌
🟢   🟢   🟢   🟢   ⚪   ⚪   ⚪    📝 Blog draft generation          ⚙️  ⏸  ❌
```

### Status semantics

- 🟢 **Green / Pass**: ran on schedule and passed output validation.
- 🟡 **Yellow / Degraded**: ran, but output was incomplete, schema-invalid, low-confidence, over-budget, or required human review.
- 🔴 **Red / Failed**: scheduler/runtime/tool/auth/network failure prevented a valid run.
- ⚪ **White / Pending**: scheduled window has not arrived yet.
- ⚫ **Skipped / Paused**: disabled by owner or intentionally skipped by policy.

---

## Why this is not just cron

Agentic AI routines are not binary batch jobs.

A run can return HTTP 200 and still be bad:

- empty summary
- hallucinated source
- missing citations
- schema mismatch
- context overflow
- token/API budget violation
- prompt drift after a configuration edit

Therefore MyCron needs a validation layer before the UI is allowed to show 🟢.

---

## Validation model

MyCron should classify each run through multiple gates:

1. **Scheduler gate**
   - Did the job start on time?
   - Did it finish within the configured timeout?

2. **Runtime gate**
   - Did all required tools return successfully?
   - Were auth/token/network errors absent?

3. **Schema gate**
   - Does the output satisfy the routine's declared contract?
   - Recommended: JSON Schema / Zod / Pydantic-style validation.

4. **Quality gate**
   - Are required fields non-empty?
   - Are citations present when required?
   - Does the output match the requested language, length, and format?

5. **Judge gate** *(optional)*
   - Lightweight LLM-as-judge or deterministic evaluator for tasks where schema alone is insufficient.

Only after these gates pass should a run become 🟢.

---

## Prompt/version control

Prompt edits change the meaning of success.

So every routine should track:

- `routine_id`
- `schedule_version`
- `prompt_version`
- `validator_version`
- `model_version`
- `tool_policy_version`
- `created_by`
- `changed_at`
- `change_note`

A green run under prompt v1 is not directly comparable to a green run under prompt v4 unless the dashboard exposes that lineage.

---

## Toward a small language for agent routines

The hard part may not be UI alone. It may require a small domain language for scheduled agent work.

Working name: **Routine Contract Language** / **RCL**.

Example sketch:

```yaml
routine: morning-news
schedule: every weekday at 07:30 Asia/Seoul
owner_intent: "Summarize major AI and semiconductor news for Kiwon."

agent:
  model: default
  tools: [web]
  budget:
    max_minutes: 8
    max_tokens: 12000

output_contract:
  format: markdown
  language: ko
  sections:
    - title: "Top 5"
      required: true
    - title: "Why it matters"
      required: true
    - title: "Sources"
      required: true
  citations:
    min_count: 5

status_policy:
  green_if:
    - schedule.completed
    - output.schema_valid
    - citations.count >= 5
  yellow_if:
    - output.partial
    - citations.count < 5
    - judge.confidence < 0.75
  red_if:
    - runtime.failed
    - auth.failed
    - timeout.exceeded
```

The point of the language is to make agent operations inspectable:

> not just "run this prompt every morning", but "run this prompt under this contract, validate it this way, and explain the status color."

---

## Proposed architecture

```text
Hermes cron runtime
      │
      ▼
Run event collector ──► Run store
      │                   │
      ▼                   ▼
Validation pipeline ──► Status classifier
      │                   │
      ▼                   ▼
Prompt/version store ─► MyCron dashboard
```

### Components

- **Dashboard UI**
  - Next.js + Tailwind recommended for a polished MyRoutine-like board.
  - Streamlit may be acceptable only for an ultra-fast internal prototype.

- **API layer**
  - FastAPI or Next.js API routes.
  - Reads Hermes cron metadata and run outputs.

- **Run store**
  - SQLite for local-first prototype.
  - Postgres if multi-user / hosted.

- **Validation engine**
  - Deterministic schema validation first.
  - LLM-as-judge only when needed.

- **Hermes integration**
  - Import/list cron jobs.
  - Pause/resume/remove jobs.
  - Record run outputs and tool errors.
  - Attach prompt and validator versions to each run.

---

## Initial milestones

### M0 — Product contract

- Define status semantics.
- Define routine/run/version data model.
- Define RCL draft.
- Document Hermes integration boundaries.

### M1 — Static dashboard prototype

- Render traffic-light weekly board from fixture JSON.
- Click status cell to inspect run log, output, validator results.
- Show prompt/version diff panel.

### M2 — Local Hermes import

- Read existing Hermes cron job metadata.
- Show real scheduled jobs in the dashboard.
- No mutation yet.

### M3 — Control plane

- Pause/resume/remove jobs.
- Edit routine prompt with versioning.
- Create new routine from natural language + generated RCL.

### M4 — Validation pipeline

- Add schema validators.
- Add deterministic quality checks.
- Add optional judge evaluator.
- Make 🟢/🟡/🔴 explainable.

---

## Repository status

This repository is currently a seed: product framing, architecture direction, and implementation milestones.

No production dashboard exists yet.

---

## License

MIT
