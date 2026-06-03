# MyCron

> MyCron turns agent-created scheduled intents into shareable Utility Packs, rendered through governed GenUI component catalogs.

**MyCron** is a renderer-agnostic GenUI utility runtime for scheduled AI intents. Agents such as Hermes, Codex, and Claude Code create time-based intents through CLI/MCP/API; MyCron stores them as **Cronlets**, renders them through approved **Utility Pack** catalogs, and records user feedback back into runtime state.

User-facing sentence:

> 말하면 에이전트가 만들고, MyCron이 실행 가능한 화면으로 바꾸고, 사람들은 그것을 쓰고 공유한다.

---

## Current direction

MyCron is not:

- an alarm app
- a Unix cron dashboard
- a Zapier/IFTTT clone
- a Flutter-specific product

MyCron is this loop:

```text
Agent command
→ Scheduled intent
→ Utility Pack selection
→ Cronlet creation
→ Catalog-governed GenUI Spec
→ PWA render
→ User action
→ Runtime feedback/history
```

The first demo should prove **real catalog-governed GenUI**, not only hand-written templates. The LLM should assemble a JSON UI spec from the selected Pack catalog, then the runtime validates it before rendering. The demo still uses two visually different Packs:

1. `alarm.basic` — countdown / snooze / complete / history
2. `daily-brief.basic` — digest cards / evidence / more-like-this / mute / history

This shows the core GenUI claim:

> Different scheduled intents produce different governed utility surfaces.

---

## Core concepts

### Utility Pack

A reusable package template that defines:

- job schema
- allowed widgets
- allowed actions
- permissions
- default schedule pattern
- feedback contract
- marketplace metadata

Examples:

- `alarm.basic`
- `daily-brief.basic`
- `routine.basic` later
- `monitor.basic` later

### Cronlet

A user-created or installed runtime instance of a Utility Pack.

Example:

```text
Utility Pack: alarm.basic
Cronlet: Kiwon’s Laundry Reminder
- run once in 15 minutes
- render Countdown / Snooze / Complete
- store feedback events
```

### GenUI Spec

A validated JSON UI tree generated from:

```text
Cronlet state + Pack widget catalog + allowed actions
```

Renderer rule:

> The renderer never executes arbitrary code from a Pack. It only renders validated JSON specs from approved component catalogs and emits approved action events back to the runtime.

---

## Renderer strategy

MyCron is **renderer-agnostic**.

MVP:

```text
PWA / React renderer
```

Later options:

```text
Flutter shell
React Native shell
Native iOS / Android bridge
```

Flutter is optional. The core product is the **Utility Pack contract**, not a frontend framework.

---

## MVP demo scope

MVP is a **two-pack GenUI loop demo**.

Must implement:

```text
1. Pack Schema v0.1
2. alarm.basic Pack
3. daily-brief.basic Pack with mock/source data
4. CLI/API create command
5. Supabase persistence for Cronlets, UI Specs, and feedback events
6. LLM-based GenUI Spec generation constrained by Pack catalog
7. Zod validation + catalog/action validation + safe fallback
8. PWA renderer
9. Feedback event persistence
10. History/state update
```

Explicit non-goals:

```text
real push notification
robust cron scheduling
real Polymarket integration
marketplace publish/install
Flutter/native app
payments
public sharing
```

Success criteria:

```text
1. Two different intents create two different Cronlets.
2. Pack Resolver selects different catalogs.
3. The LLM generates two different GenUI Specs from the selected catalogs.
4. Zod/catalog validation rejects widgets or actions outside the Pack contract.
5. PWA renders visually different utility surfaces.
6. User actions write feedback events to Supabase.
7. Runtime state/history changes and is visible.
8. Demo recording makes viewers say: “AI가 저 화면을 만들었네.”
```

---

## Real GenUI path

```text
intent
→ API
→ LLM with Pack catalog context
→ structured JSON GenUI Spec
→ Zod validation
→ catalog/action validation
→ render
→ feedback
→ Supabase runtime state
```

See `docs/llm-genui.md` for the generation and validation contract.

---

## Example commands

```bash
mycron create --pack alarm.basic --after 15m "세탁기 확인"
```

```bash
mycron create \
  --pack daily-brief.basic \
  --topic "Polymarket 재미있는 주제" \
  --schedule "daily 08:30" \
  --lang ko
```

Example JSON response:

```json
{
  "ok": true,
  "cronlet_id": "crn_001",
  "job_id": "job_001",
  "pack_id": "alarm.basic",
  "surface_url": "http://localhost:3000/c/crn_001"
}
```

---

## Repository status

This repository is currently a seed: product framing, Pack Schema direction, and implementation milestones.

No production runtime or PWA exists yet.

---

## License

MIT
