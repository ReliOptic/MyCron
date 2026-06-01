# MyCron implementation plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build a local-first MyRoutine-style dashboard for Hermes Agent cron routines.

**Architecture:** Start with a static fixture-driven Next.js UI, then connect it to a local API that reads Hermes cron metadata and run history. Keep validation and prompt/versioning as first-class concepts rather than UI afterthoughts.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, SQLite, optional FastAPI bridge for Hermes-local integration.

---

## Phase 1 — Product contract before code

### Task 1: Define status model

**Objective:** Make 🟢/🟡/🔴/⚪/⚫ semantics precise and testable.

**Files:**
- Create: `docs/status-model.md`

**Content requirements:**
- Define each status.
- Define allowed transitions.
- Define why HTTP/tool success is insufficient for 🟢.
- Define required evidence per status.

**Verification:** A developer can classify a sample run without guessing.

### Task 2: Define routine/run/version schema

**Objective:** Define the data model before choosing storage.

**Files:**
- Create: `docs/data-model.md`

**Entities:**
- `Routine`
- `RoutineVersion`
- `PromptVersion`
- `ValidatorVersion`
- `Run`
- `RunValidationResult`
- `RunArtifact`

**Verification:** Every dashboard cell can be traced to one run and one version lineage.

### Task 3: Draft Routine Contract Language

**Objective:** Create a small language for scheduled agent contracts.

**Files:**
- Create: `docs/rcl.md`
- Create: `examples/morning-news.rcl.yaml`
- Create: `examples/blog-draft.rcl.yaml`

**Verification:** Each example explains schedule, owner intent, tool policy, output contract, and status policy.

---

## Phase 2 — Static dashboard prototype

### Task 4: Bootstrap Next.js app

**Objective:** Create a dashboard shell.

**Files:**
- Create: `apps/dashboard/`

**Command:**

```bash
pnpm create next-app apps/dashboard --ts --tailwind --eslint --app --src-dir
```

**Verification:**

```bash
cd apps/dashboard
pnpm dev
```

Expected: local dashboard opens.

### Task 5: Add fixture data

**Objective:** Render realistic MyCron board without Hermes integration.

**Files:**
- Create: `apps/dashboard/src/fixtures/routines.ts`

**Data:**
- 3 routines
- 7-day run grid
- mixed green/yellow/red/pending states
- prompt versions
- validator results

**Verification:** Fixture exports are typed and imported by the dashboard page.

### Task 6: Build weekly traffic-light board

**Objective:** Show the MyRoutine-inspired table.

**Files:**
- Modify: `apps/dashboard/src/app/page.tsx`
- Create: `apps/dashboard/src/components/RoutineBoard.tsx`
- Create: `apps/dashboard/src/components/StatusDot.tsx`

**Verification:** Every routine displays seven day cells and controls.

### Task 7: Add run detail drawer

**Objective:** Make status colors explainable.

**Files:**
- Create: `apps/dashboard/src/components/RunDetailDrawer.tsx`

**Content:**
- run status
- scheduler/runtime/schema/quality/judge gate results
- logs
- output preview
- prompt version

**Verification:** Clicking 🟡 or 🔴 reveals the reason.

---

## Phase 3 — Hermes integration

### Task 8: Define Hermes import adapter interface

**Objective:** Avoid binding UI directly to Hermes internals.

**Files:**
- Create: `packages/hermes-adapter/src/types.ts`

**Interface:**
- `listRoutines()`
- `getRoutine(id)`
- `listRuns(routineId, range)`
- `pauseRoutine(id)`
- `resumeRoutine(id)`
- `removeRoutine(id)`

**Verification:** Dashboard can swap fixture adapter with Hermes adapter.

### Task 9: Read Hermes cron job list

**Objective:** Pull real job metadata into MyCron.

**Files:**
- Create: `packages/hermes-adapter/src/local-cron.ts`

**Verification:** Existing Hermes cron jobs appear read-only in dashboard.

---

## Phase 4 — Control plane and validation

### Task 10: Add prompt versioning

**Objective:** Make prompt edits auditable.

**Files:**
- Create: `packages/core/src/versioning.ts`

**Verification:** Editing a prompt creates a new version; historical runs keep old versions.

### Task 11: Add validator pipeline

**Objective:** Make green/yellow/red status trustworthy.

**Files:**
- Create: `packages/core/src/validation.ts`

**Gates:**
- schedule
- runtime
- schema
- quality
- optional judge

**Verification:** Fixture runs classify into expected statuses.

### Task 12: Add routine creation from natural language

**Objective:** Convert natural language to RCL draft with human review.

**Files:**
- Create: `apps/dashboard/src/components/NewRoutineDialog.tsx`

**Verification:** User can enter “매일 오전 8시 AI 뉴스 요약” and receive editable RCL before saving.

---

## Non-goals for v0

- Multi-user hosted SaaS.
- Direct billing/cost accounting beyond simple token/tool-budget fields.
- Full Hermes internal rewrite.
- Unreviewed autonomous prompt mutation.
