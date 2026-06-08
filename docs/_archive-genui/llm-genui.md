# Real GenUI: Catalog-Governed LLM Spec Generation

MyCron's demo should prove real governed GenUI, not only hand-written templates.

> 2026-06 strategy connection: governed GenUI is now framed as the **surface layer** of MyCron. The product center is the `.mc` Cronlet runtime with schedule, Done Policy, evidence, audit/history, and runtime migration. The GenUI spec renders and manipulates Cronlet state; it should not be treated as the whole product.

## Goal

```text
intent
→ API
→ LLM with Pack catalog context
→ structured JSON GenUI Spec
→ Zod validation
→ catalog/action validation
→ optional regenerate-on-fail
→ render
→ feedback event
→ runtime state in Supabase
```

The LLM is allowed to compose screens only from the selected Pack's catalog.

## Non-goal

The LLM must not generate arbitrary HTML, CSS, JavaScript, React components, or executable UI code.

## Contract

Input to generator:

```json
{
  "intent": "15분 뒤 세탁기 확인",
  "pack": {
    "pack_id": "alarm.basic",
    "allowed_widgets": ["AlarmHeader", "Countdown", "SnoozeButton", "CompleteButton", "ExecutionHistory"],
    "allowed_actions": ["snooze", "complete", "cancel"]
  },
  "cronlet_state": {
    "title": "세탁기 확인",
    "scheduled_at": "2026-06-03T21:15:00+09:00"
  }
}
```

Output from generator:

```json
{
  "root": "alarm-screen",
  "elements": {
    "alarm-screen": {
      "type": "AlarmLayout",
      "props": { "title": "세탁기 확인" },
      "children": ["countdown", "actions", "history"]
    }
  }
}
```

## Validation gates

1. Structured output parses as JSON.
2. GenUI Spec satisfies Zod schema.
3. Every element type is present in `pack.allowed_widgets` or renderer base layout catalog.
4. Every emitted action is present in `pack.allowed_actions`.
5. Props satisfy widget prop schemas.
6. Element graph is valid: root exists, children exist, no cycles.
7. If validation fails, regenerate once with the validation error. If it still fails, fall back to deterministic safe spec.

## Demo principle

For the recording, LLM variance is good only after validation. The demo should show that the AI really assembles the surface, while the runtime proves it cannot escape the catalog.

Recommended demo flow:

1. Create `alarm.basic` Cronlet from intent.
2. Show stored LLM-generated UI Spec.
3. Render alarm surface.
4. Create `daily-brief.basic` Cronlet from intent.
5. Show a visually different LLM-generated UI Spec.
6. Attempt or show test where invalid widget is rejected.
7. Click feedback actions and show Supabase state/history updated.
