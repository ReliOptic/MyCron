# n8n Runtime Connector Strategy

> Status: proposal
> Scope: MyCron boundary and integration strategy
> Related: `README.md`, `docs/strategy.md`, `docs/product-implementation-spec.md`, `docs/mycron-cli-grammar.md`

## One-line definition

MyCron can treat n8n as a runtime target for Cronlets while preserving MyCron's ownership of intent, done policy, approval, evidence, and audit.

Korean:

> MyCron은 n8n을 Cronlet 실행 타깃으로 사용할 수 있다. 단, 반복 업무의 의도·완료 기준·승인·증거·감사는 MyCron이 소유한다.

## Why this matters

n8n already has broad integrations, a self-host adoption funnel, and a powerful node canvas. MyCron should not compete with that execution graph. MyCron should make n8n workflows reliable to operate as scheduled delegated work.

```text
Agents execute work.
MyCron verifies recurring work.
Campsite turns the results into durable company truth.
n8n can be one execution runtime among several.
```

Korean product sentence:

> 에이전트는 일을 하고, MyCron은 그 일이 제대로 끝났는지 검증하며, Campsite는 그 결과를 회사가 다시 믿고 쓸 수 있는 기준으로 남긴다.

## Boundary

```text
n8n owns:
- node graph
- integration credentials inside n8n
- workflow execution
- native execution logs
- self-hosted integration runtime

MyCron owns:
- Cronlet identity
- schedule intent and timezone policy
- done_policy and acceptance criteria
- risk classification
- approval requirement
- evidence requirements
- immutable audit events
- runtime portability metadata

Campsite owns:
- human operating surface
- inbox/result presentation
- approval and failure cards
- durable team-facing truth/artifacts
```

Short form:

```text
n8n runs the graph.
MyCron defines done.
Campsite makes the result operable.
```

## Connector role

The connector should be thin. It maps a Cronlet to an n8n workflow run and reads back enough evidence to verify completion.

```ts
type N8nRuntimeTarget = {
  runtime: "n8n";
  instance_id: string;
  workflow_id: string;
  workflow_name?: string;
  trigger_mode: "manual" | "webhook" | "native_schedule" | "external_schedule";
  open_in_runtime_url?: string;
};

type N8nRunEvidence = {
  execution_id: string;
  workflow_id: string;
  status: "success" | "error" | "waiting" | "running" | "unknown";
  started_at?: string;
  stopped_at?: string;
  failed_node_id?: string;
  failed_node_name?: string;
  error_message?: string;
  output_refs: string[];
  runtime_log_url?: string;
};
```

MyCron should store normalized evidence. It should not store raw secrets, credential payloads, or entire n8n execution blobs unless a future compliance pack explicitly defines retention.

## Cronlet mapping

Example `.mc` fragment:

```yaml
id: crn_portfolio_daily
name: Daily portfolio risk brief
schedule:
  cron: "30 8 * * *"
  timezone: Asia/Seoul
runtime:
  type: n8n
  instance_id: founder-selfhost
  workflow_id: portfolio-monitoring-v3
  trigger_mode: external_schedule
done_policy:
  requires:
    - at_least: 8
      metric: fresh_market_datapoints
    - no_stale_filler: true
    - delivered_to:
        - telegram
        - campsite
risk:
  external_actions:
    - telegram.send
approval:
  required_for:
    - credential_change
    - workflow_json_mutation
    - new_external_send_target
evidence:
  require:
    - n8n.execution_id
    - output.artifact_url
    - delivery.receipt
```

## Runtime modes

### 1. Shadow mode

n8n remains the operational source. MyCron observes executions and evaluates done policy.

Use when:

- user already has n8n workflows
- migration risk is high
- MyCron is proving monitoring/evidence value first

Acceptance:

- MyCron can show pass/fail/verdict for a real n8n execution without changing the workflow.

### 2. External schedule mode

MyCron owns the schedule and calls n8n to run the workflow.

Use when:

- schedule policy matters
- timezone/dst consistency matters
- approval gate should happen before execution

Acceptance:

- disabling the Cronlet stops future n8n runs even if the workflow remains present.

### 3. Compiled mode

MyCron/Cronlet is the source of truth, and n8n schedule/trigger config is generated or reconciled from it.

Use later, after connector reliability is proven.

Acceptance:

- read-back verifies n8n config matches the Cronlet contract.
- drift is detected and reported.

## Approval posture

MyCron should never silently mutate an n8n workflow.

Approval is required for:

- credential changes
- webhook URL changes
- schedule changes
- enabling a write/send/account operation node
- changing recipient/channel/account targets
- applying workflow JSON patches
- activating a previously paused workflow with external actions

Safe read-only operations:

- list workflows
- read workflow metadata
- read workflow JSON
- read recent executions
- read failed node/error summaries

Potentially safe but still auditable operations:

- manual run
- pause/activate
- test node/workflow

## Company truth relationship

The n8n execution log is not enough to become company memory. MyCron should transform runs into verified records, then Campsite can preserve them as durable team truth.

```text
n8n execution log
→ MyCron run evidence and done verdict
→ Campsite result artifact / decision record / searchable history
```

The durable truth should include:

- what was supposed to happen
- what actually ran
- what evidence was collected
- whether done policy passed
- who approved risky actions
- what artifact/result the team should reuse
- what changed after a failure

This supports onboarding, external contractors, compliance review, and agent handoff.

## Self-host + cloud dual motion

n8n's self-host community shows a useful GTM pattern:

```text
self-host adoption by technical founders
→ trusted workflow history and approval habits
→ hosted team workspace
→ enterprise compliance and audit pack
```

MyCron can follow the same motion without becoming a workflow builder:

- Self-host: local MyCron + n8n connector + Campsite surface for founder/operator workflows.
- Hosted: team workspace, shared approval queues, searchable audit/evidence, managed connectors.
- Enterprise: compliance pack, retention policy, SSO/RBAC, drift detection, export/audit APIs.

## MVP sequence

### M0 — Read-only connector

- Register an n8n instance target.
- List workflows.
- Read workflow metadata and recent executions.
- Store normalized `N8nRunEvidence`.

Validation:

- `mycron runtime n8n list-workflows --json` returns machine-readable workflow summaries.
- No write APIs are called.

### M1 — Cronlet runtime target

- Add `runtime.type: n8n` to Cronlet schema.
- Link a Cronlet to workflow ID and instance ID.
- Evaluate done policy against imported execution evidence.

Validation:

- A Cronlet can be `verified`, `breached`, or `unverified` from n8n read-back evidence.

### M2 — External schedule/manual run

- Allow MyCron to trigger an n8n workflow when configured.
- Record execution ID and status.
- Fail closed when execution ID cannot be read back.

Validation:

- Triggered run produces an audit event and read-back evidence.

### M3 — Campsite operating surface

- Emit an envelope for Campsite with summary, failure, evidence, and approval cards.
- Preserve fallback text.

Validation:

- A failed n8n run appears in Campsite as an actionable result item, not a raw log dump.

### M4 — Approval-gated patch workflow

- Agent proposes a workflow patch artifact.
- MyCron records risk and required approval.
- Campsite captures decision.
- Connector applies the patch only after approval and read-back verification.

Validation:

- Every mutation has a before/after diff, approval actor, timestamp, and verification result.

## Non-goals

- Rebuild n8n's node canvas.
- Store n8n credentials in MyCron by default.
- Make MyCron a general Zapier/n8n clone.
- Let LLM summaries replace execution evidence.
- Treat a successful HTTP trigger as completion without done-policy read-back.

## Open questions

- Which n8n API scopes are minimal for read-only evidence import?
- Should external schedule mode use n8n webhooks or API execution endpoints first?
- What is the smallest normalized evidence set that satisfies compliance without copying too much runtime data?
- How should MyCron detect drift between Cronlet contract and n8n workflow config?
- Which workflow mutation types should remain permanently manual inside n8n?
