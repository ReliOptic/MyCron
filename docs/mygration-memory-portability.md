# Mygration — Cronlets, Agent Work, and Memory Portability

> Last updated: 2026-06-08
> Purpose: define Mygration as a key MyCron feature for people operating multiple agents. Mygration is not only cron import/export; it is migration of scheduled work, agent context, memory, evidence, and operational state.

## 1. Core thesis

MyCron의 또 하나의 핵심 feature는 **Mygration**이다.

Mygration의 전제:

> 여러 개의 AI agent를 돌리는 사람에게 migration 경험은 매우 중요하다.

하지만 이들이 옮기고 싶은 것은 단순히 cron schedule만이 아니다.

```text
They do not only want to move cron.
They want to move memory.
```

한국어:

```text
agent operator가 옮기고 싶은 것은 cron만이 아니다.
반복 업무의 맥락, 메모리, 증거, 실행 이력, 다음 행동까지 함께 옮기고 싶어한다.
```

Mygration은 scattered automation을 `.mc` Cronlet으로 바꾸는 기능이면서, 동시에 agent work memory를 inspect/export/import/rebind하는 기능이다.

## 2. Why this matters

Agent-heavy users increasingly operate across many runtimes:

- Hermes cron jobs
- Claude Code recurring instructions
- Codex tasks
- local scripts / crontab
- GitHub Actions schedules
- Slack/Telegram reminders
- Google Workspace automations
- n8n/Zapier/Make scenarios
- future custom agents

Their problem is not only:

```text
Where is my schedule registered?
```

The deeper problem is:

```text
Where is the context that makes this scheduled work meaningful?
```

When users move agent work across tools, they risk losing:

- the original intent
- prompt history
- agent memory
- acceptance criteria
- Done Policy
- evidence requirements
- previous outputs
- failure history
- user feedback
- approval policy
- next action
- artifact links

Without memory portability, migration becomes shallow.

## 3. Product definition

Short definition:

> Mygration is the MyCron feature that imports, inspects, exports, and rebinds scheduled agent work and its memory into portable `.mc` Cronlets.

Korean:

> Mygration은 여러 agent runtime에 흩어진 예약 업무와 메모리를 `.mc` Cronlet으로 가져오고, 검토하고, 내보내고, 다른 runtime에 다시 연결하는 MyCron의 migration 기능이다.

Mygration should support four actions:

```text
Discover → Inspect → Convert → Rebind
```

1. **Discover** existing scheduled/recurring agent work.
2. **Inspect** schedules, prompts, memory, evidence, history, and risk.
3. **Convert** them into `.mc` Cronlets with Done Policy and memory refs.
4. **Rebind** them to another runtime/agent/surface without losing operational context.

## 4. What gets migrated

### 4.1 Schedule layer

Traditional cron migration handles:

- schedule expression
- timezone
- command/script
- environment target
- next/last run

MyCron still needs this, but it is only the outer shell.

### 4.2 Work definition layer

Agent work also needs:

- task prompt
- output format
- runtime/agent identity
- model/tool requirements
- source dependencies
- trigger/event source
- risk tier
- approval policy

### 4.3 Done Policy layer

The most important MyCron-specific layer:

- acceptance criteria
- process/data/goal status split
- semantic failure rules
- evidence requirements
- read-back commands
- failure copy policy
- retry/escalation policy

### 4.4 Memory layer

This is the key expansion.

Memory migration should include structured references, not necessarily raw infinite chat logs:

- user preference memory
- project memory
- workflow memory
- recurring decisions
- constraints
- known failure modes
- artifact links
- run summaries
- feedback history
- handoff summaries

Memory should be portable enough for another agent/runtime to continue the work, but constrained enough to avoid dumping private or stale context blindly.

### 4.5 Evidence/history layer

Mygration should preserve:

- run history
- pass/fail status
- source collection status
- proof artifacts
- logs or compact logs
- user acknowledgements
- approval/rejection events
- previous semantic failures

## 5. `.mc` implication

`.mc` should not be only a cron YAML file.

It should become a portable object for delegated agent work:

```yaml
schema: mycron/v0
kind: Cronlet
metadata:
  name: daily-market-brief
  description: Daily portfolio and market brief
  tags: [finance, daily, agent]
schedule:
  cron: "30 8 * * *"
  timezone: Asia/Seoul
agent:
  runtime: hermes
  model: default
  tools: [web, terminal]
task:
  prompt_ref: prompts/daily-market-brief.md
  output_format: markdown
memory:
  refs:
    - type: user_preference
      key: concise-korean-technical-briefing
    - type: project_context
      key: portfolio-monitoring-watchlist
  export_policy: summarized_refs_only
  freshness: checked
acceptance:
  criteria:
    - required_sources_collected
    - no_placeholder_report
    - includes_next_action
  on_fail: semantic_fail_short_report
evidence:
  required:
    - source_urls
    - generated_report
    - timestamp
history:
  retain: 30d
policy:
  risk_tier: routine
  approval: none
```

Key principle:

> `.mc` moves the job, but memory refs make the job meaningful after it moves.

## 6. `.mmy` Memory Migration Artifact

`.mc` is the Cronlet artifact for delegated scheduled work.

Mygration likely also needs a separate memory migration artifact:

```text
.mmy = Memory Migration artifact
```

Working definition:

> `.mmy` is a portable, inspectable bundle format that lets agents send their memory map, user-domain understanding, project context, artifact links, and migration-ready summaries into MyCron.

Korean:

> `.mmy`는 각 agent가 가진 사용자/프로젝트/도메인 메모리를 MyCron으로 전달하기 위한 memory migration artifact다. MyCron은 이를 받아 Obsidian knowledge graph처럼 보여주고, 어떤 agent가 사용자를 어떤 domain으로 이해하고 있는지 시각화한다.

### 6.1 Why `.mmy` exists

Agents do not all remember the user in the same way.

Example:

```text
Hermes memory may know: ShareIdee / MyCron / Fevio / semiconductor strategy.
Claude Code may know: repository plans, PR decisions, code constraints.
Codex may know: current branch, test failures, implementation context.
Google Workspace may know: Docs, Sheets, Drive artifacts.
```

Users need a way to ask:

```text
What does each agent think it knows about me and my work?
Which domains exist?
Which memories should move with this Cronlet?
Which memories are stale, sensitive, or duplicated?
```

This is not only a text list. It should become a graph/map.

### 6.2 Knowledge graph view

MyCron can render `.mmy` imports like an Obsidian-style knowledge graph:

```text
User
├─ Domain: MyCron
│  ├─ Agent: Hermes
│  ├─ Memories: .mc, Done Policy, Mygration, CronBell
│  ├─ Artifacts: strategy docs, Google Docs, repo files
│  └─ Cronlets: daily brief, agent routine monitor
├─ Domain: Campsite
│  ├─ Memories: tab-based sessions, agent messenger, return state
│  └─ Artifacts: Campsite product memo
├─ Domain: Fevio
│  ├─ Memories: care_action_cards, partner_visible, migration slices
│  └─ Artifacts: GitHub PRs/issues
└─ Domain: Semiconductor / MBA Strategy
   ├─ Memories: PPA, benchmarking, EU/Korea coordination
   └─ Artifacts: research docs
```

The point is not only visualization. It is migration readiness:

- Which domains can be attached to a Cronlet?
- Which memory refs should be summarized before export?
- Which agent owns or last updated each memory?
- Which memories conflict?
- Which memories are too stale to migrate?

### 6.3 Proposed `.mmy` shape

```yaml
schema: mycron.memory/v0
kind: MemoryMigration
metadata:
  name: hermes-user-memory-export
  created_at: 2026-06-08T00:00:00Z
  source_agent: hermes
  source_runtime: telegram-gateway
  owner: user
scope:
  user_id: local-user-ref
  projects: [MyCron, Campsite, Fevio]
  export_mode: summarized_refs_only
  sensitivity_policy: redact_secrets
agent_profile:
  agent_id: hermes-default
  role: always-on control-plane assistant
  capabilities: [cron, web, github, google-workspace, docs]
domains:
  - id: domain_mycron
    name: MyCron
    summary: Scheduled agent routine control plane with Cronlets, Done Policy, evidence, and Mygration.
    confidence: high
    freshness: 2026-06-08
    memory_refs:
      - mem_mycron_positioning
      - mem_mycron_mygration
    artifact_refs:
      - type: google_doc
        title: MyCron Competitive Landscape — AgentWatch + Cronicle
        url: https://docs.google.com/...
  - id: domain_campsite
    name: Campsite
    summary: Agent-native messenger workspace with Camps, tabs, surfaces, artifacts, and return state.
    confidence: medium
    freshness: 2026-06-08
memory_items:
  - id: mem_mycron_mygration
    domain_id: domain_mycron
    type: product_decision
    summary: Mygration should move memory, not only cron schedules; .mmy may define memory migration payloads.
    provenance:
      source: voice_memo
      captured_at: 2026-06-08T00:00:00Z
    sensitivity: normal
    freshness: current
    attachable_to_cronlet: true
relations:
  - from: domain_mycron
    to: domain_campsite
    type: connected_surface
  - from: mem_mycron_mygration
    to: domain_mycron
    type: belongs_to
migration_policy:
  default_export: summaries_only
  require_confirm_for: [raw_transcripts, secrets, private_identity, external_account_data]
  allowed_targets: [mycron, campsite, hermes, codex, claude-code]
```

### 6.4 CLI commands for `.mmy`

Agents should be able to send `.mmy` files through CLI/API:

```bash
# Agent exports its memory map into .mmy
hermes memory export --format mmy --projects MyCron,Campsite > hermes-memory.mmy.yaml

# MyCron validates without importing
mycron memory import hermes-memory.mmy.yaml --dry-run --json

# MyCron imports and builds graph
mycron memory import hermes-memory.mmy.yaml --confirm --json

# Inspect graph / domains
mycron memory domains --json
mycron memory graph --format json
mycron memory graph --format mermaid

# View what a specific agent thinks it knows
mycron memory view --agent hermes --json
mycron memory view --domain MyCron --json

# Attach migration-ready memory to a Cronlet
mycron memory attach <cronlet_id> --domain MyCron --confirm --json
```

Possible CLI output:

```json
{
  "ok": true,
  "action": "memory.import.dry_run",
  "artifact": "hermes-memory.mmy.yaml",
  "domains_detected": 4,
  "memory_items": 38,
  "artifact_refs": 12,
  "sensitive_items_blocked": 2,
  "stale_items": 5,
  "graph_preview_url": "mycron://memory/graph/preview_001",
  "requires_confirm": true
}
```

### 6.5 Product implication

`.mmy` makes Mygration broader than automation import.

```text
.mc  = move the delegated scheduled work
.mmy = move the memory graph that makes the work portable
```

Together:

```text
.mc + .mmy = portable agent-native work
```

## 7. CLI-first memory view

If users want a memory viewing feature, CLI is the right first surface.

Reason:

- agent operators are already comfortable with CLI/API output
- memory inspection needs structured filters and export modes
- CLI can provide safe JSON output for agents
- PWA can later render the same data visually

Initial commands:

```bash
# Discover existing scheduled work and memory sources
mycron mygrate scan --source hermes --json
mycron mygrate scan --source crontab --json
mycron mygrate scan --source github-actions --json

# Inspect a candidate before conversion
mycron mygrate inspect <candidate_id> --include memory --json

# Show memory attached to a Cronlet
mycron memory list --cronlet <cronlet_id> --json
mycron memory get <memory_ref> --json

# Export a Cronlet with memory refs, not raw full memory by default
mycron export <cronlet_id> --include memory-refs --json > daily-brief.mc.json

# Export with summarized memory bundle after explicit confirmation
mycron export <cronlet_id> --include memory-summary --confirm --json > daily-brief.bundle.json

# Import and rebind to another runtime
mycron import daily-brief.mc.json --target codex --dry-run --json
mycron import daily-brief.mc.json --target hermes --confirm --json
```

Memory-specific commands:

```bash
mycron memory search "portfolio briefing" --json
mycron memory list --agent hermes --json
mycron memory list --project MyCron --json
mycron memory attach <cronlet_id> <memory_ref> --dry-run --json
mycron memory detach <cronlet_id> <memory_ref> --confirm --json
mycron memory summarize <memory_ref> --max-tokens 800 --json
```

## 8. Memory safety rules

Memory migration is sensitive. MyCron should avoid naive bulk export.

Rules:

1. Default to memory references and summaries, not raw full transcripts.
2. Mark freshness and confidence.
3. Separate user preference, project memory, workflow memory, run history, and artifacts.
4. Require confirmation for exporting raw or sensitive memory.
5. Include redaction and scope preview.
6. Never silently attach unrelated memory to a Cronlet.
7. Preserve provenance: where did this memory come from, and when was it last verified?
8. Allow users to inspect what memory an agent will receive before a run.

Preview example:

```json
{
  "cronlet_id": "crn_daily_brief",
  "memory_preview": {
    "refs": 4,
    "summaries": 2,
    "raw_items": 0,
    "sensitive_items_blocked": 1,
    "freshness": "checked_2026-06-08",
    "requires_confirm": false
  }
}
```

## 9. Mygration UX flow

Recommended user flow:

```text
Import Sources
→ Candidate Inbox
→ Memory Preview
→ Done Policy Builder
→ Risk/Approval Check
→ Convert to .mc Cronlet
→ Rebind Runtime
→ Run Dry Test
→ Save / Activate
```

The important screen is not only a cron table. It is a migration review surface:

- What will move?
- What memory will move?
- What will be summarized instead of copied?
- What evidence/history will be preserved?
- What is unsafe or stale?
- What runtime will own future execution?

## 10. Competitive implication

Cronicle can migrate jobs or operate schedules.

AgentWatch can observe agent behavior.

MyCron's Mygration can own the missing bridge:

```text
move scheduled agent work together with the memory and evidence that make it operable.
```

Short positioning:

> Mygration moves not just cron, but the memory behind the delegated work.

Korean:

> Mygration은 cron만 옮기는 기능이 아니라, 위임된 반복 업무의 메모리까지 옮기는 기능이다.

## 11. MVP version

MVP Mygration should not attempt full universal migration.

Start with:

1. Hermes cron job import.
2. crontab import.
3. GitHub Actions schedule import.
4. `.mc` export/import.
5. memory refs list/view for Cronlets.
6. memory summary export with explicit confirmation.
7. dry-run import showing schedule, prompt, memory refs, risk, Done Policy, and evidence gaps.

MVP success test:

```text
A user can take one existing recurring Hermes job,
inspect its schedule/prompt/memory/evidence expectations,
convert it into a `.mc` Cronlet,
view what memory will travel with it,
and dry-run import it into another runtime without losing the work meaning.
```

## 12. Final thesis

> Mygration is the portability layer for agent-native work. It moves schedules, but more importantly it makes memory, evidence, and Done Policy visible and portable enough for another agent to continue the work safely.

한국어:

> Mygration은 agent-native work의 portability layer다. schedule을 옮기는 것도 중요하지만, 진짜 가치는 memory, evidence, Done Policy를 보이게 만들고 다른 agent/runtime으로 안전하게 이어갈 수 있게 하는 데 있다.
