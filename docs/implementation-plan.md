# MyCron implementation plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build a two-pack GenUI demo where agent-created scheduled intents become governed Utility Pack surfaces and user actions write runtime feedback.

**Architecture:** Start with Pack Schema v0.1, two built-in Packs (`alarm.basic`, `daily-brief.basic`), fixture-backed runtime state, and a PWA renderer. Defer robust scheduling, push notifications, real connectors, auth, and marketplace.

**Tech Stack:** TypeScript, Next.js PWA, Zod or JSON Schema, local JSON/SQLite demo store first, Node CLI.

---

## Phase 1 — Product contract and schemas

### Task 1: Define Pack Schema v0.1

**Objective:** Define the contract for Utility Packs before building UI.

**Files:**
- Create: `docs/pack-schema.md`
- Create: `packages/schema/src/pack.ts`

**Requirements:**
- `pack_id`, `version`, `category`, `job_type`
- `job_schema`
- `allowed_widgets`
- `allowed_actions`
- `blocked_actions`
- `required_permissions`
- `feedback_events`
- `marketplace` metadata

**Verification:** A developer can validate both `alarm.basic` and `daily-brief.basic` without guessing.

### Task 2: Add built-in Pack definitions

**Objective:** Create two visually distinct Packs for the demo.

**Files:**
- Create: `packs/alarm.basic.json`
- Create: `packs/daily-brief.basic.json`

**Verification:** Both Pack JSON files validate against Pack Schema v0.1.

### Task 3: Define runtime data model

**Objective:** Model the closed loop: Cronlet → Job/Execution → UI Spec → Feedback Event.

**Files:**
- Create: `docs/data-model.md`
- Create: `packages/schema/src/runtime.ts`

**Entities:**
- `UtilityPack`
- `Cronlet`
- `Job`
- `Execution`
- `UiSpec`
- `FeedbackEvent`

**Verification:** Both demo flows can be represented:
- one-time alarm
- daily brief with fixture topics

---

## Phase 2 — Runtime and CLI

### Task 4: Bootstrap package structure

**Objective:** Create a minimal monorepo shape.

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `packages/schema/`
- Create: `packages/runtime/`
- Create: `apps/web/`
- Create: `apps/cli/`

**Verification:** `pnpm install` and `pnpm -r typecheck` run locally.

### Task 5: Implement Pack Resolver

**Objective:** Select a Pack by explicit `--pack` first; natural-language inference is post-MVP.

**Files:**
- Create: `packages/runtime/src/pack-resolver.ts`

**Behavior:**
- `alarm.basic` returns AlarmKit catalog
- `daily-brief.basic` returns DailyBriefKit catalog
- unknown pack returns validation error

**Verification:** Unit tests cover known/unknown pack IDs.

### Task 6: Implement Cronlet creation

**Objective:** Convert CLI/API input into persisted Cronlet state.

**Files:**
- Create: `packages/runtime/src/create-cronlet.ts`
- Create: `packages/runtime/src/store.ts`

**Behavior:**
- Create `cronlet_id`
- Create first `job_id`
- Store schedule config
- Store creator metadata

**Verification:** Creating an alarm and daily brief produces two different Cronlet records.

### Task 7: Implement CLI create command

**Objective:** Let an agent create demo Cronlets from the shell.

**Files:**
- Create: `apps/cli/src/index.ts`

**Commands:**

```bash
mycron create --pack alarm.basic --after 15m "세탁기 확인"
```

```bash
mycron create --pack daily-brief.basic --topic "Polymarket 재미있는 주제" --schedule "daily 08:30" --lang ko
```

**Verification:** CLI returns JSON with `ok`, `cronlet_id`, `job_id`, `pack_id`, `surface_url`.

---

## Phase 3 — GenUI Spec generation

### Task 8: Define GenUI Spec format

**Objective:** Use a flat `root` + `elements` map compatible with catalog-governed rendering.

**Files:**
- Create: `docs/genui-spec.md`
- Create: `packages/schema/src/ui-spec.ts`

**Verification:** Spec validator rejects widgets not listed in the selected Pack.

### Task 9: Generate AlarmKit UI Spec

**Objective:** Render alarm Cronlets as countdown utility surfaces.

**Files:**
- Create: `packages/runtime/src/specs/alarm.ts`

**Widgets:**
- `AlarmHeader`
- `Countdown`
- `ActionRow`
- `SnoozeButton`
- `CompleteButton`
- `ExecutionHistory`

**Verification:** Spec includes only `alarm.basic.allowed_widgets`.

### Task 10: Generate DailyBriefKit UI Spec

**Objective:** Render daily brief Cronlets as digest surfaces using fixture topics.

**Files:**
- Create: `packages/runtime/src/specs/daily-brief.ts`
- Create: `packages/runtime/src/fixtures/daily-brief.ts`

**Widgets:**
- `DigestHeader`
- `TopicCard`
- `EvidenceDrawer`
- `FeedbackButtons`
- `ExecutionHistory`

**Verification:** Spec visually differs from AlarmKit and includes fixture topics.

---

## Phase 4 — PWA Renderer

### Task 11: Build minimal PWA shell

**Objective:** Render Cronlet cards and detail pages.

**Files:**
- Create: `apps/web/`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/c/[cronletId]/page.tsx`

**Verification:** Home shows active Cronlets; detail page loads one Cronlet spec.

### Task 12: Implement widget registry

**Objective:** Map allowed widget names to React components.

**Files:**
- Create: `apps/web/src/renderer/WidgetRegistry.tsx`
- Create: `apps/web/src/renderer/UtilityRenderer.tsx`

**Security rule:** Renderer never executes arbitrary code. Unknown widgets render as validation errors, not UI.

**Verification:** Injecting an unknown widget into fixture spec is rejected.

### Task 13: Implement Alarm widgets

**Objective:** Make alarm UI visibly distinct and interactive.

**Files:**
- Create: `apps/web/src/widgets/alarm/*`

**Verification:** Countdown, Snooze, Complete, History render.

### Task 14: Implement DailyBrief widgets

**Objective:** Make daily brief UI visibly distinct and interactive.

**Files:**
- Create: `apps/web/src/widgets/daily-brief/*`

**Verification:** DigestHeader, TopicCard, EvidenceDrawer, More/Less/Mute render.

---

## Phase 5 — Runtime feedback loop

### Task 15: Implement feedback API

**Objective:** Store user actions as feedback events.

**Files:**
- Create: `packages/runtime/src/feedback.ts`
- Create: `apps/web/src/app/api/cronlets/[cronletId]/feedback/route.ts`

**Behavior:**
- Validate action against Pack allowed actions
- Store feedback event
- Update Cronlet/Job state when relevant

**Verification:** Snooze updates alarm time; Complete changes status; More/Less/Mute update daily brief preferences/history.

### Task 16: Show history/state updates

**Objective:** Make closed loop visible in the demo.

**Files:**
- Modify: renderer history widgets

**Verification:** Clicking actions immediately changes visible history/state.

---

## Phase 6 — Demo recording polish

### Task 17: Add demo fixtures and script

**Objective:** Make the demo recordable without external services.

**Files:**
- Create: `docs/demo-script.md`

**Script:**
1. Run `mycron create --pack alarm.basic --after 15m "세탁기 확인"`
2. Open alarm surface, click Snooze/Complete
3. Run `mycron create --pack daily-brief.basic ...`
4. Open digest surface, click More/Less/Mute
5. Show feedback history

**Success reaction:** “AI가 저 화면을 만들었네.”

---

## Explicit non-goals for MVP

- Real push notification
- Robust production scheduler
- Real Polymarket/GitHub/web integrations
- Marketplace publish/install/fork
- Flutter/native app
- Multi-user auth and billing
- Arbitrary UI/code execution from Packs
