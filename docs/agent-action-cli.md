# MyCron Agent Action CLI

## Purpose

MyCron CLI is not a push-only write port. It is the agent-callable CRUD surface for a user's Cronlet store, analogous to how `gws` or Google Drive CLIs let an agent list, create, edit, and delete user-owned resources.

```text
Google Drive file ≈ MyCron Cronlet
```

The same Cronlet can be created or edited by an agent through CLI/API/MCP and inspected or edited by the user through the PWA.

---

## Resource model

### Primary resource: Cronlet

A Cronlet is the primary CLI resource.

```text
Cronlet = schedule + Pack reference + current GenUI spec + runtime state + feedback/history
```

The GenUI Spec is normally an attached property/version of the Cronlet, not a top-level user-facing resource.

Why:

- Agents and users usually want to operate on the scheduled utility, not on abstract specs.
- `create`, `update`, `delete`, and `get` stay simple.
- The PWA and CLI both read/write the same object.
- Spec versioning can exist internally without exposing premature CRUD complexity.

### Secondary internal resources

These may have debug/export commands later but should not be first-class MVP commands:

```text
ui_specs
jobs
executions
feedback_events
pack_versions
```

---

## Initial command set

### Auth

```bash
mycron login
mycron whoami --json
```

### Read

```bash
mycron list --json
mycron get <cronlet_id> --json
mycron history <cronlet_id> --json
```

### Create

Agent supplies intent and Pack. Server/CLI may call the LLM generator and store the validated GenUI Spec with the Cronlet.

```bash
mycron create \
  --pack alarm.basic \
  --after 15m \
  "세탁기 확인" \
  --json
```

```bash
mycron create \
  --pack daily-brief.basic \
  --schedule "daily 08:30" \
  --topic "Polymarket 재미있는 주제" \
  --lang ko \
  --json
```

### Create with agent-provided spec

If the host agent generated the GenUI Spec itself, it can attach it during create.

```bash
mycron create \
  --pack alarm.basic \
  --after 15m \
  "세탁기 확인" \
  --spec ./spec.json \
  --json
```

The runtime still validates the spec against the Pack catalog before accepting it.

### Update

Schedule/state/spec updates operate on the Cronlet.

```bash
mycron update <cronlet_id> --schedule "daily 09:00" --json
mycron update <cronlet_id> --title "세탁기 다시 확인" --json
mycron update <cronlet_id> --spec ./new-spec.json --json
```

### Delete / pause

Deletion is destructive enough to support dry-run and confirmation.

```bash
mycron pause <cronlet_id> --json
mycron resume <cronlet_id> --json
mycron delete <cronlet_id> --dry-run --json
mycron delete <cronlet_id> --confirm --json
```

### Feedback / action events

The PWA will usually submit feedback, but CLI should support it for agent tests and MCP parity.

```bash
mycron action <cronlet_id> complete --json
mycron action <cronlet_id> snooze --minutes 5 --json
mycron action <cronlet_id> more_like_this --topic-id topic_123 --json
```

---

## JSON output contract

Every agent-facing command should return machine-readable output by default when `--json` is present.

Create response:

```json
{
  "ok": true,
  "action": "cronlet.create",
  "cronlet_id": "crn_001",
  "job_id": "job_001",
  "pack_id": "alarm.basic",
  "scheduled_at": "2026-06-03T21:15:00+09:00",
  "surface_url": "http://localhost:3000/c/crn_001",
  "spec": {
    "status": "accepted",
    "source": "llm_generated",
    "validation": "passed",
    "spec_id": "ui_001"
  },
  "verification": {
    "read_back_command": "mycron get crn_001 --json"
  }
}
```

Validation failure response:

```json
{
  "ok": false,
  "action": "cronlet.create",
  "error_code": "SPEC_WIDGET_NOT_ALLOWED",
  "message": "Widget FreeformHTML is not allowed by pack alarm.basic",
  "details": {
    "widget": "FreeformHTML",
    "allowed_widgets": ["AlarmHeader", "Countdown", "SnoozeButton", "CompleteButton"]
  }
}
```

---

## Side-effect safety

Risk levels:

- Low risk: `list`, `get`, `history`, `whoami`
- Medium risk: `create`, `update`, `pause`, `resume`, `action`
- High risk: `delete`, future share/publish/install commands

Rules:

- Read commands never require confirmation.
- Create/update should support `--dry-run` for agent preview.
- Delete/share/publish require `--confirm`.
- All writes return IDs and read-back commands.
- Runtime validation cannot be bypassed by CLI, MCP, or PWA.

---

## Spec ownership decision for MVP

Default:

```text
Spec is attached to a Cronlet.
```

Do not expose `mycron spec create/delete` in MVP.

Possible future debug/export commands:

```bash
mycron spec get <cronlet_id> --json
mycron spec validate --pack alarm.basic ./spec.json --json
mycron spec regenerate <cronlet_id> --json
```

These are developer/debug operations, not the core product surface.

---

## MCP mapping later

MCP tools should wrap the CLI/API semantics:

```text
mycron.list_cronlets  -> mycron list --json
mycron.get_cronlet    -> mycron get <id> --json
mycron.create_cronlet -> mycron create ... --json
mycron.update_cronlet -> mycron update ... --json
mycron.delete_cronlet -> mycron delete ... --confirm --json
mycron.submit_action  -> mycron action ... --json
```

CLI/API first, MCP later.

---

## Open questions

1. Should `create` default to server-side LLM spec generation, host-agent spec generation, or both?
2. Should `--spec` accept file path only, stdin, or both?
3. How much of spec validation error should be shown to end users versus agents?
4. Should `delete` soft-delete by default for recoverability?
