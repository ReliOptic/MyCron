# Cronlet Migration Experience Case

> Last updated: 2026-06-17
> Purpose: capture the product insight behind Cronlet from a real agent-operator experience: moving one running cron job from Agent A to Agent B was not a file-copy problem, but an execution-contract migration problem.

## 1. Case summary

A user asked an existing agent to move a Hormuz monitoring cron job to another agent.

The user request was simple:

```text
호르무즈 모니터링 크론잡을 다른 에이전트로 옮기려고 합니다.
CRON을 MD 파일로 출력해서 마이그레이션 준비해주세요.
```

The agent did not immediately export the job. Instead, it asked what scope should be exported:

```text
1. Export only one selected Hormuz cron as an MD file
2. Export the full cron list as MD, with emphasis on Hormuz jobs
3. Export the Hormuz cron with prompt / schedule / delivery / toolsets / model / script
4. Export original context plus execution checklist and security / environment TODOs for the new agent
```

This is the important product moment.

The user thought the migration target was a cron job. The agent revealed that the actual target was a scattered operating context.

## 2. What the case proves

### 2.1 The unit of migration is not the schedule

A traditional cron job can often be represented as:

```text
schedule + command
```

An agent-operated recurring job is closer to:

```text
intent + prompt + schedule + runtime + tools + auth assumptions + state + Done Policy + evidence + delivery + audit history
```

Therefore, exporting only Markdown is useful for human handoff, but insufficient for reliable runtime migration.

### 2.2 The problem is execution-contract loss

When an agent routine moves from Agent A to Agent B, the fragile parts are not the visible words in the prompt.

The fragile parts are:

- which runtime owns execution
- which tools are available
- which browser / API / CLI capabilities exist
- which credentials or sessions are required but must not be copied directly
- what counts as a successful run
- what evidence must be produced
- where results should be delivered
- what previous failures or user feedback should influence the next run

This is execution-contract loss.

### 2.3 The agent's clarification is a symptom of missing product structure

The agent asked multiple scope questions because the system did not expose a standard object boundary.

If the job had already been represented as a Cronlet, the user interaction could have been:

```text
mycron mygration inspect hormuz-monitoring --json
mycron mygration diff hormuz-monitoring --target agent-b --json
mycron mygration rebind hormuz-monitoring --target agent-b --dry-run --json
```

The user would not need to decide whether prompt, schedule, delivery, toolsets, model, script, and checklist belong to the export. The Cronlet schema should already define the migration envelope.

## 3. Product implication for MyCron

### 3.1 Cronlet definition sharpened

Cronlet should not be defined as a scheduled prompt.

Recommended definition:

> A Cronlet is a portable, user-owned execution contract for delegated recurring agent work.

Korean:

> Cronlet은 반복 실행되는 프롬프트가 아니라, 에이전트 간 이전 가능한 실행 계약이다.

This keeps MyCron away from being a cron dashboard and closer to being the control plane for delegated work.

### 3.2 `.mc` must be more than a cron YAML

The `.mc` artifact should carry enough structure for both human inspection and agent execution.

Minimum layers:

```yaml
schema: mycron/v0
kind: Cronlet
metadata:
  name: hormuz-monitoring
  description: Monitor Hormuz-related vessel and geopolitical risk signals
intent:
  user_goal: Track meaningful Hormuz risk changes and produce a compact brief
schedule:
  type: cron
  expression: "0 * * * *"
  timezone: Asia/Seoul
runtime:
  source_agent: hermes
  target_agent: agent-b
  required_capabilities:
    - browser_or_web_search
    - file_artifact_write
    - delivery_channel
security:
  auth_policy: placeholders_only
  required_secrets:
    - marine_traffic_session_or_equivalent
    - drive_or_artifact_store_token
    - delivery_channel_token
task:
  prompt_ref: prompts/hormuz-monitoring.md
  output_format: markdown_brief
done_policy:
  required_conditions:
    - source_checked
    - output_artifact_created
    - delivery_receipt_exists
    - no_placeholder_summary
evidence:
  required:
    - source_manifest
    - timestamped_summary
    - artifact_link
    - delivery_receipt
migration:
  status: needs_compatibility_check
  missing_bindings:
    - auth
    - tool_capability_mapping
    - delivery_target
```

### 3.3 Mygration should be a first-class workflow, not an export button

The product verb should be:

```text
Discover → Inspect → Diff → Rebind → Dry-run → Activate
```

Export is only one step. The more valuable feature is compatibility checking between runtime A and runtime B.

A useful MyCron migration screen should answer:

```text
Can this Cronlet run in the target agent?
What will be preserved?
What must be rebound?
What cannot be migrated safely?
What evidence will prove the migrated job is working?
```

## 4. Strategy direction

### 4.1 Positioning

MyCron should position Cronlet migration as an agent-operator painkiller.

The wedge is not generic automation users. The wedge is users who already operate multiple agents and have accumulated fragile background routines across Hermes, Claude Code, Codex, GitHub Actions, local scripts, Telegram, and future agents.

Strategic line:

> Vibe coding creates fragile agent routines. MyCron turns them into portable, inspectable, auditable Cronlets.

### 4.2 Product priority

Near-term MyCron should prioritize the migration spine before broad scheduling features:

1. Cronlet schema / `.mc` manifest
2. `mycron mygration inspect`
3. `mycron mygration diff`
4. `mycron mygration rebind --dry-run`
5. compatibility report
6. Done Policy and evidence requirements
7. activation only after user approval

This sequence forces the product to prove the core thesis: delegated recurring work can be inspected, moved, and verified.

### 4.3 Campsite relationship

Campsite can make the experience visible and comfortable, but MyCron should own the execution contract.

Recommended boundary:

```text
Campsite: shows migration cards, approval cards, Save Later, Share, cross-device continuation
MyCron: owns Cronlet schema, runtime binding, Done Policy, evidence, audit, migration diff, activation
Hermes / Agent B: executes or assists the work
```

This preserves the product architecture:

```text
Gateway / surface captures intent
→ MyCron normalizes it into Cronlet
→ target runtime executes only after compatibility + approval
→ evidence returns to MyCron
→ Campsite or Telegram renders the result
```

### 4.4 Moat

The durable moat is not schedule creation.

The moat is accumulated operational context:

- recurring work objects
- runtime compatibility mappings
- approval decisions
- Done Policy outcomes
- evidence patterns
- migration history
- user corrections

Labs can build stronger agents. They are less likely to build a neutral control plane that helps users move scheduled work away from their own runtime.

Cross-agent neutrality is therefore not just a product principle. It is the strategic defense.

## 5. Product requirements implied by the case

### 5.1 Migration readiness report

Every Cronlet should be able to produce a migration readiness report:

```json
{
  "cronlet_id": "crn_hormuz_monitoring",
  "source_runtime": "hermes",
  "target_runtime": "agent-b",
  "status": "needs_rebinding",
  "portable": [
    "intent",
    "prompt_ref",
    "schedule",
    "output_format",
    "done_policy",
    "evidence_requirements"
  ],
  "needs_rebinding": [
    "auth",
    "browser_session",
    "artifact_store",
    "delivery_channel"
  ],
  "unsafe_to_copy": [
    "raw_tokens",
    "private_session_cookie",
    "unredacted_chat_history"
  ],
  "recommended_next_command": "mycron mygration rebind crn_hormuz_monitoring --target agent-b --dry-run --json"
}
```

### 5.2 Human-readable handoff

MyCron should also generate a human-readable `migration.md` for review:

```text
What this Cronlet does
What must be preserved
What must be reconnected
What cannot be copied for security reasons
How to dry-run it in the target runtime
What evidence confirms success
```

### 5.3 Safety rule

Migration must never silently copy credentials or raw private memory.

Default policy:

```text
auth: placeholders only
memory: summarized refs only
evidence: links and hashes preferred over raw private payloads
activation: requires compatibility check + user approval
```

## 6. Open questions

1. Is the Cronlet minimum unit one task, one user goal, or one runtime binding?
2. Should `mygration import` create a staged draft only, never a live Cronlet?
3. How much source-agent memory should be portable by default?
4. When a target agent lacks a required tool, should MyCron fail the migration or propose an adapter?
5. Should Campsite expose migration as an approval card, or should migration stay inside MyCron with Campsite only showing a summary?

## 7. Decision

Treat this case as canonical evidence for the Cronlet concept.

Cronlet exists because users do not merely want to schedule agent work. They want delegated recurring work to survive movement across agents, runtimes, and surfaces without losing the contract that makes the work meaningful.
