# MyCron implementation plan

> **2026-06 update:** This older plan is preserved as the Utility Pack / governed GenUI surface-layer plan. Do **not** treat it as the full product implementation sequence. Before scaffolding app/runtime code, read [`docs/product-implementation-spec.md`](product-implementation-spec.md), which makes `.mc` / Cronlet / Done Policy / Evidence / Run Health / Weekly Review the implementation center and positions Utility Pack / GenUI as a later governed surface layer.

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task only after reconciling it with the latest product implementation spec.

**Goal:** Build a real catalog-governed GenUI demo where an LLM assembles validated Utility Pack surfaces and user actions write runtime feedback.

**Architecture:** Start with Pack Schema v0.1, two built-in Packs (`alarm.basic`, `daily-brief.basic`), Supabase runtime state, an LLM GenUI generator constrained by Pack catalogs, Zod/catalog validation, safe fallback specs, and a PWA renderer. Defer robust scheduling, push notifications, real connectors, auth, and marketplace.

**Tech Stack:** TypeScript, Next.js PWA, Zod, Supabase Postgres, Node CLI, structured-output LLM API.

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

## Phase 2 — Supabase runtime and CLI

### Task 4: Bootstrap package structure and Supabase client

**Objective:** Create a minimal monorepo shape.

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `packages/schema/`
- Create: `packages/runtime/`
- Create: `apps/web/`
- Create: `apps/cli/`
- Create: `packages/runtime/src/supabase.ts`

**Verification:** `pnpm install` and `pnpm -r typecheck` run locally; Supabase env vars are documented but not committed.

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
- Persist to Supabase tables for `cronlets`, `jobs`, `ui_specs`, and `feedback_events`

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

## Phase 3 — Real catalog-governed GenUI Spec generation

### Task 8: Define GenUI Spec format and validator

**Objective:** Use a flat `root` + `elements` map compatible with catalog-governed rendering.

**Files:**
- Create: `docs/genui-spec.md`
- Create: `packages/schema/src/ui-spec.ts`
- Create: `packages/runtime/src/validate-ui-spec.ts`

**Verification:** Spec validator rejects widgets/actions not listed in the selected Pack and rejects invalid element graphs.

### Task 9: Implement LLM GenUI generator

**Objective:** Ask the LLM to assemble a GenUI Spec using only the selected Pack catalog.

**Files:**
- Create: `packages/runtime/src/llm/genui-generator.ts`
- Create: `packages/runtime/src/llm/prompts.ts`
- Create: `packages/runtime/src/llm/types.ts`

**Behavior:**
- Input: intent, selected Pack, Cronlet state, optional source data
- Output: structured JSON GenUI Spec
- No HTML/CSS/JS/React generation
- Include validation error feedback for one regenerate attempt

**Verification:** Mock LLM tests prove the generator passes Pack catalog into the prompt and returns parseable structured output.

### Task 10: Add validated generation pipeline and fallbacks

**Objective:** Make LLM variance safe enough for a live demo.

**Files:**
- Create: `packages/runtime/src/specs/generate-validated-spec.ts`
- Create: `packages/runtime/src/specs/fallbacks/alarm.ts`
- Create: `packages/runtime/src/specs/fallbacks/daily-brief.ts`
- Create: `packages/runtime/src/source-data/daily-brief-mock.ts`

**Behavior:**
- Generate with LLM
- Validate with Zod + catalog/action checks
- Regenerate once on validation failure
- Persist validation result
- Fall back to deterministic safe spec if still invalid

**Verification:** Tests cover valid spec, invalid widget, invalid action, regenerate success, and fallback after repeated failure.

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

## Phase 5 — Runtime feedback loop with Supabase

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
5. Show the stored LLM-generated specs
6. Show invalid-widget rejection test or log
7. Show feedback history from Supabase

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
