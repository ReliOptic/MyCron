# MyCron CLI Grammar (canonical, contract v0)

> Status: canonical CLI syntax + envelope contract
> Last updated: 2026-06-08
> Decision records: [`adr/0004-cli-command-grammar.md`](adr/0004-cli-command-grammar.md), [`adr/0005-cli-contract-hardening.md`](adr/0005-cli-contract-hardening.md)
> Supersedes flat-verb / `--json`-as-input examples in `README.md`, ADR-0003, and the flat
> `mycron import/export` + `.mmy` examples in `docs/mygration-memory-portability.md`.

The `mycron` CLI is **agent-first** (ADR-0003). The real pipeline is:

```
human natural language → agent interpretation → mycron CLI command
→ machine-verifiable result → human-readable confirmation
```

The CLI is short to call; the **result envelope must confirm intent**, so the failure mode
"I deleted it, but it still runs" is structurally impossible.

## 1. Grammar shape

```
mycron <resource> <verb> [id] [flags]
```

Resource-scoped (gws / gcloud / kubectl style), never flat verbs.

```bash
mycron cronlet create --file routine.mc --confirm --json
mycron run evidence list --run run_001 --json
mycron approval approve apr_001 --actor user --confirm --json
```

## 2. Artifact files: `.mc` and `.my` (kind-discriminated)

Two extensions. Each file declares a `schema` and a `kind`; the `kind` decides the type.

| Extension | schema               | kind values                       | Purpose                          |
|-----------|----------------------|-----------------------------------|----------------------------------|
| `.mc`     | `mycron/v0`          | `Cronlet` \| `Pack`               | delegated scheduled work         |
| `.my`     | `mycron.memory/v0`   | `MemoryItem` \| `MemoryMigration` | portable user/agent memory       |

```yaml
# routine.mc
schema: mycron/v0
kind: Cronlet
metadata: { name: daily-brief }
client_ref: hermes:daily-brief
schedule: { timezone: Asia/Seoul, cron: "30 8 * * *" }
action: { type: brief.daily, args: { audience: self } }
done_policy: { require_evidence: true, require_delivery_receipt: true }
```

```yaml
# ops.mc  (a Pack bundles cronlet specs / templates / capability requirements)
schema: mycron/v0
kind: Pack
metadata: { name: ops-starter }
cronlets:
  - { kind: Cronlet, client_ref: hermes:daily-brief, ... }
  - { kind: Cronlet, client_ref: hermes:weekly-review, ... }
```

- `cronlet create --file` accepts only `kind: Cronlet`. A `kind: Pack` file returns
  `WRONG_ARTIFACT_KIND` with `next_command` → `pack preview`.
- `pack validate` / `pack preview` read both `Cronlet` and `Pack`.
- **`pack install`** (instantiating a Pack's cronlets, which entails multiple creates +
  capability grants + approval gates) is **deferred** beyond MVP — separate ADR/issue.
- `.mmy` is **deprecated** legacy draft naming. If seen, the CLI returns `LEGACY_EXTENSION`
  pointing to `.my` with `kind: MemoryMigration`.

## 3. Resource taxonomy

Top-level (MVP): `schema · pack · cronlet · run · approval · memory · mygration · account`.

Not top-level: `evidence` (under `run`), `policy` (attached to cronlet/approval),
`capability` (declared by action schema; grant system is future), `workspace` (deferred —
`account` is the canonical owner scope).

### 3.1 `schema` (read-only meta) — three separated namespaces

```bash
mycron schema command list|get <id>     # CLI command input contract (cronlet.create)
mycron schema action  list|get <type>   # action_type payload contract (email.send)
mycron schema file    list|get <id>     # .mc/.my file-format contract (pack.mc, memory.my)
```

`schema action get` closes the agent planning loop and **must expose required capabilities**:

```json
{
  "action_type": "email.send",
  "action_class": "external",
  "risk": "high",
  "required": ["to", "subject", "body"],
  "requires_capabilities": ["email:send"],
  "properties": { "...": {} }
}
```

`action_class` (`internal` | `external`) drives the Approval Gate. `risk` is planning
metadata only in MVP (no risk-tier confirm behavior yet). Capabilities are `<resource>:<verb>`.

### 3.2 `pack` (file-level, no persistence)

```bash
mycron pack validate --file routine.mc --json
mycron pack preview  --file ops.mc --json
```

### 3.3 `cronlet` (create + control; no hard delete)

```bash
mycron cronlet create  --file routine.mc --dry-run|--confirm --json
mycron cronlet list    --fields id,name,state,next_run --json
mycron cronlet get     crn_001 --json
mycron cronlet update  crn_001 --file patch.json --dry-run|--confirm --json
mycron cronlet pause   crn_001 --json
mycron cronlet resume  crn_001 --json
mycron cronlet run-now crn_001 --dry-run --json
mycron cronlet cancel  crn_001 --confirm --json
mycron cronlet archive crn_001 --confirm --json
```

- `pause`/`resume` temporary; `cancel` terminal (requires `--confirm`); `archive` hides from
  default list. **No `delete`** — erasure is a future account-level compliance flow.
- Intent-confirming result fields (see §7): `cancel`/`archive` return
  `future_runs_disabled: true` and `audit_retained: true`.
- `run-now` creates a fresh ad-hoc run from the **current** spec (`retry_of: null`); external
  actions remain gated.

### 3.4 `run` (read + control; not user-created) and `run evidence`

```bash
mycron run list   --cronlet crn_001 --json
mycron run get    run_001 --json
mycron run verify run_001 --json
mycron run retry  run_001 --json
mycron run escalate run_001 --reason "on-call" --json

mycron run evidence list --run run_001 --json
mycron run evidence get  ev_001 --run run_001 --json
mycron run evidence add  --run run_001 --file evidence.json --json
```

**Evidence trust ladder:** `self_reported → runtime_attested → verified → rejected`.

- `run evidence add` writes a **self_reported** candidate only:
  `provenance: self_reported`, `verification_state: unverified`, `counts_toward_done: false`,
  `run_state_changed: false`, `next_command` → `run verify`. Agent/user input can **never**
  set trusted provenance, verified state, `counts_toward_done`, or run state.
- Only `runtime_attested` evidence can satisfy Done Policy required-evidence.
- `evidence add ≠ verify ≠ approve`. Evidence is immutable; there is **no evidence delete**.
  `run evidence redact` (for sensitive content) is **future**, not MVP.

**`run verify`** = deterministic recalculation, not override:

- Evaluates `done_policy` against attached evidence + the trust ladder, then **persists** the
  computed `run_state` (as an audit event) if it changed. Idempotent.
- Not manual marking, not approval, not override. No "force verified" in MVP.
- Envelope: `previous_run_state`, `run_state`, `run_state_changed`, `override: false`,
  `manual_marking: false`, evaluated counts (incl. `self_reported_ignored`), done_policy
  passed/missing, `next_command` when not verified.

**`run retry` vs `cronlet run-now`** — different anchors:

- `run retry run_001` → new run with `retry_of: run_001`, `context_source: original_run`
  (failure-recovery lineage). If the original snapshot is gone: `RETRY_CONTEXT_UNAVAILABLE`
  → `next_command: cronlet run-now`.
- `cronlet run-now crn_001` → new run, `retry_of: null`, `context_source: current_cronlet_spec`.

### 3.5 `approval` (Approval Gate; not user-created)

```bash
mycron approval list    --json
mycron approval get     apr_001 --json
mycron approval approve apr_001 --actor user --confirm --json    # --confirm + user actor REQUIRED
mycron approval reject  apr_001 --actor user --reason "..." --json  # no --confirm; user actor REQUIRED
```

- `approve` is the highest-risk mutation (authorizes external execution/delivery/spend). It
  **requires `--confirm`**; without it → `MISSING_CONFIRM` (exit 2) + `next_command`.
  Envelope: `external_execution_approved: true`, `confirmed_write: true`, `outcome: approved`.
- `reject` is the safe direction → frictionless, no `--confirm`. Envelope:
  `external_execution_approved: false`, `confirmed_write: true`, `outcome: rejected`.
- **ADR-0007 actor invariant.** `approve`/`reject` are valid only for a **user** Actor. The
  CLI default actor is `host_agent`, so a user must claim `--actor user` explicitly
  (`--actor` accepts `user`/`host_agent`; `system` is runtime-reserved). A non-user attempt
  returns `APPROVAL_ACTOR_INVALID` (exit 4) and the denied attempt is recorded in the Audit
  Log with the claimed actor and `outcome: denied`. Until backend auth exists the actor is
  self-declared; the invariant and error boundary are locked in now (ADR-0007).

### 3.6 `memory` (personal context; forgettable, never proof)

```bash
mycron memory add    --file note.my --json
mycron memory list   --json [--domain product] [--type user_preference]
mycron memory get    mem_001 --json
mycron memory update mem_001 --file note.my --json     # audited revision/supersession
mycron memory forget mem_001 --confirm --json          # content purge + tombstone
```

- `add` accepts `kind: MemoryItem` only (`kind: MemoryMigration` → `WRONG_ARTIFACT_KIND`,
  → `mygration inspect`). MemoryItems carry `client_ref`.
- `update` = audited correction (`revision`, `supersedes_revision`), not silent overwrite.
- `forget` = content purge + tombstone, **requires `--confirm`**. Envelope: `content_purged`,
  `tombstone_retained`, `detached_from_future_context: true`, `affected_cronlets: [...]`.
  Forgotten memory must be excluded from future prompt/context assembly. **No `delete`.**
- **No `memory import`** — MemoryMigration bundles are consumed by `mygration` (§3.7).
- `domains`/`graph`/`view`/`attach`/`detach`/`summarize`/`search` and list filters
  `--cronlet`/`--agent`/`--project` are **future**, not MVP.

**memory vs evidence (hard boundary):** Evidence = run-scoped, immutable, proof-of-past-run,
runtime-attached, does not change future behavior. Memory = account-scoped, editable +
forgettable, context-for-future, user-owned, affects future behavior. Agents must not store
run proof in memory, nor user preferences in evidence.

### 3.7 `mygration` (import = stage only; rebind = runtime only)

```bash
mycron mygration import  --from hermes --dry-run|--confirm --json   # discover + stage only
mycron mygration inspect mygr_001 --json
mycron mygration diff    mygr_001 --json
mycron mygration rebind  mygr_001 --target claude-code --dry-run|--confirm --json
```

- `import` **never creates live cronlets**, enables schedules, or approves execution.
  `--dry-run` detects candidates; `--confirm` persists a staged candidate set only.
  Envelope: `live_cronlets_created: 0`, `future_runs_enabled: false`,
  `external_execution_approved: false`, `next_command` → `inspect` or `cronlet create`.
- Live activation goes through the normal `cronlet create` path (reusing idempotency,
  capability checks, Approval Gate). There is **no `mygration apply`** in MVP, and **no flat
  `mycron import`/`export`**.
- `mygration inspect/diff/import --file export.my` consumes `kind: MemoryMigration`.
- **`rebind` changes only the RuntimeBinding** (+capability binding if needed). It preserves
  `cronlet_id`, `client_ref`, history, schedule, done_policy, memory_refs, evidence_refs,
  audit trail, **and account/ownership**. Envelope: `client_ref_changed: false`,
  `history_preserved: true`, `future_runs_runtime_updated: true`. `client_ref` relabel and
  cross-account transfer are future, separate, dangerous commands (ADR-gated).

### 3.8 `account` (canonical owner scope)

```bash
mycron account get --json
mycron account settings get --json
mycron account budget get --json
mycron account alerts list --json
mycron account alerts set failure --enabled true --json
```

`account` is a logical owner scope; MVP resolves it via the token, but the grammar does not
hardcode remote-only (a future local-first daemon may host the account). No `workspace`.

## 4. Input vs output flags (never overloaded)

| Flag           | Meaning                                                        |
|----------------|---------------------------------------------------------------|
| `--json`       | **output** format only (machine envelope on stdout)           |
| `--input-json` | raw JSON **payload** string                                   |
| `--file`       | input file: `.mc` / `.my` / JSON / YAML                       |

Default output (no `--json`) is concise human text and is **not a stable contract** — scripts
and agents must use `--json`. `MYCRON_OUTPUT=json` makes the machine envelope the default.

## 5. Two safety layers — never conflate

| Layer            | Mechanism                  | Means                                   |
|------------------|----------------------------|-----------------------------------------|
| CLI write safety | `--dry-run` / `--confirm`  | "this CLI mutation may be written"      |
| Approval Gate    | `approval approve`         | "this external side effect may execute" |

`--confirm` confirms only the control-plane write. External execution stays pending until
`approval approve`. Mutation envelopes always expose `confirmed_write` ≠
`external_execution_approved`. `--confirm` must never mean "approve all future external actions."

## 6. Idempotency: `client_ref`

A `.mc`/pack-created Cronlet must carry a stable `client_ref` = `<origin-agent>:<slug>`. The
`<origin-agent>` prefix is the **immutable origin/owner namespace**, not the current executor
(rebind changes the executor without touching `client_ref`).

Upsert on `(account, client_ref)`:

| Situation                                    | `result.outcome` | exit |
|----------------------------------------------|------------------|------|
| first create                                 | `created`        | 0    |
| retry, same normalized spec                  | `matched`        | 0    |
| same `client_ref`, different normalized spec | `conflict` (`CLIENT_REF_CONFLICT`) | 3 |

`matched` is an expected idempotency success (agents must not retry-loop). `conflict` is
actionable-not-retryable → `cronlet update` or `mygration rebind`. `--idempotency-key` is an
optional request-level secondary; content-hash may warn but is never primary identity.

## 7. Envelope contract (every `--json` result)

```json
{
  "meta": {
    "api_version": "mycron/v0",
    "cli_version": "0.1.0",
    "command": "cronlet create",
    "request_id": "req_7f3a...",
    "account_id": "acct_123"
  },
  "status": "ok",
  "result": {
    "outcome": "created",
    "resource": "cronlet",
    "id": "crn_001",
    "client_ref": "hermes:daily-invoice",
    "changed": true,
    "confirmed_write": true,
    "requires_approval": true,
    "external_execution_approved": false,
    "required_capabilities": ["email:send"],
    "missing_capabilities": [],
    "future_runs_enabled": false,
    "approval": { "id": "apr_001", "state": "pending" }
  },
  "next_command": "mycron approval approve apr_001 --confirm --json"
}
```

Rules:

- `status` is `ok | error` only. The specific outcome (`created`/`matched`/`conflict`/
  `staged`/`needs_approval`/`approved`/`rejected`/`dry_run`/…) lives in `result.outcome`.
- `meta` is present on every `--json` envelope (success and error). `account_id` may be `null`
  for unauthenticated/local schema commands. `command` is the canonical resource-scoped
  command (not raw argv). `request_id` is per invocation.
- `next_command` stays top-level for frictionless agent continuation.
- `needs_approval` is **not** an error (`status: ok`, exit 0).
- Intent-confirming fields are mandatory where relevant: `future_runs_disabled`,
  `audit_retained`, `content_purged`, `detached_from_future_context`, `affected_cronlets`,
  `client_ref_changed`, `live_cronlets_created`.

Error envelope:

```json
{
  "meta": { "...": "..." },
  "status": "error",
  "error": { "code": "CLIENT_REF_CONFLICT", "message": "..." },
  "next_command": "mycron cronlet update crn_001 --file invoice.mc --dry-run --json"
}
```

## 8. Exit codes

| Code | Meaning                                                        |
|------|---------------------------------------------------------------|
| `0`  | success — incl. `needs_approval`, `matched`, `dry_run`        |
| `1`  | runtime / server error                                        |
| `2`  | usage / schema-validation (`USAGE_ERROR`, `SCHEMA_VALIDATION_FAILED`, `MISSING_CONFIRM`) |
| `3`  | conflict (`CLIENT_REF_CONFLICT`) — actionable, not retryable  |
| `4`  | unauthenticated / unauthorized                                |
| `5`  | not found                                                     |

Agents branch on exit code, then read `error.code` for fine handling.

## 9. ID / handle conventions

`crn_` cronlet · `run_` run · `apr_` approval · `mygr_` mygration · `mem_` memory · `ev_`
evidence (under run). `client_ref` = `<origin-agent>:<slug>` (immutable, owner-namespaced).

## 10. Auth, config, governance

- Auth via `MYCRON_TOKEN` (ADR-0003). Non-secret defaults (account, output) may come from a
  config file; secrets only via env/keychain. Local profile files (daemon) are future.
- `mycron status --json` / `mycron config doctor --json` for low-friction inspection.
- **Read shaping:** `--fields` applies to read commands (`get`/`list`) only, not mutations.
  Pagination: `--limit` / `--cursor`; `--page-all` streams NDJSON.
- **Forward compatibility:** new top-level resources require an ADR; experimental resources
  live under a hidden/flagged namespace (`mycron x <resource>` / `MYCRON_EXPERIMENTAL`) until
  promoted. New verbs require an ADR; prefer reusing the controlled verb set. **No aliases in
  MVP** — one canonical grammar for agents; human aliases (e.g. `routine`→`cronlet`) only via
  a future ADR, and alias-only (the canonical form always works and is what schema/docs show).

## 11. Global flags

| Flag                | Applies to        | Meaning                                   |
|---------------------|-------------------|-------------------------------------------|
| `--json`            | all               | machine output envelope                   |
| `--file <path>`     | create/update/add | `.mc` / `.my` / JSON / YAML input         |
| `--input-json <s>`  | create/update     | raw JSON payload string                   |
| `--dry-run`         | mutations         | validate + show diff, write nothing       |
| `--confirm`         | mutations         | confirm the CLI write (required: cancel, archive, memory forget, approval approve) |
| `--idempotency-key` | create            | optional request-level retry key          |
| `--fields a,b,c`    | get/list          | output projection (read only)             |
| `--limit`/`--cursor`| list              | pagination                                |
| `--page-all`        | list              | stream all pages as NDJSON                |
| `--reason <text>`   | reject/cancel/escalate | audited justification                |
