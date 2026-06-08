# MyCron Strategy

> Last updated: 2026-06-08 00:56 UTC
> Source context: ShareIdee/MyCron/Campsite/BALTAM product strategy discussion + 2026-06-08 research packet on harness engineering + cron jobs, GPTers/operator pain, agentwatch, and Zero Trust agent CLI design.

## 0. Document relationship

This file is a strategy addendum to the existing MyCron docs, not a replacement.

- [`README.md`](../README.md): repository entry and current direction.
- [`docs/prd.md`](prd.md): canonical PRD and Utility Pack / GenUI product contract.
- [`docs/llm-genui.md`](llm-genui.md): governed GenUI spec generation contract.
- [`docs/competitive-landscape-agentwatch-cronicle.md`](competitive-landscape-agentwatch-cronicle.md): AgentWatch/Cronicle competitive-reference analysis for AI observability and scheduled job operations.
- [`docs/mygration-memory-portability.md`](mygration-memory-portability.md): Mygration as Cronlet + memory portability, including proposed `.mmy` Memory Migration artifacts.
- This file: 2026-06 portfolio/gateway update that connects the existing Utility Pack work to `.mc`, Cronlet, Done Policy, evidence, CronBell, Campsite surfaces, and BALTAM/OverEdge boundaries.

The previous `Utility Pack` thesis remains valid as the rendering/surface layer. The updated strategy makes the Cronlet runtime and verified completion semantics the operating center.

## 1. Strategic definition

MyCron is the scheduled-agent routine runtime and control plane for delegated work.

Korean:

> MyCron은 사용자가 AI agent에게 위임한 반복/예약 업무를 `.mc` Cronlet으로 정규화하고, 실행·검증·이전·승인·감사할 수 있게 만드는 scheduled agent routine control plane이다.

Short external line:

> Vibe coding makes agent workflows easy to create; MyCron makes them reliable to operate.

Core question:

> Did the delegated recurring work actually complete?

MyCron should not be framed primarily as a routine planner, generic dashboard, arbitrary GenUI app generator, or alarm app. The core is scheduled delegation reliability.

## 2. Product object hierarchy

- `.mc`: portable artifact/file format for delegated scheduled work.
- Cronlet: the runtime object representing one delegated scheduled action/routine.
- Done Policy: acceptance criteria that defines what completion means.
- Evidence: read-back/output/proof that the delegated goal was actually achieved.
- Runtime migration: ability to move Cronlets across Hermes cron, crontab, GitHub Actions, local scripts, Claude/Codex/Hermes workflows, and future runtimes.
- Surface: visual/control UI rendered for the Cronlet state, but not the product center.

Recommended hierarchy:

```text
User intent
→ guided onboarding / gateway capture
→ .mc Cronlet draft
→ schedule + timezone + runtime + risk + Done Policy
→ run / approval / block
→ evidence + audit history
→ migration / recommendation
```

## 3. Gateway relationship

Gateway principle:

> Gateway is the front door. MyCron is the operating room.

Korean:

> Gateway는 입구이고, MyCron은 운영실이다.

Telegram/Hermes/Campsite can capture intent, ask onboarding questions, show compact previews, and deliver notifications. MyCron remains the persistent operating room for Cronlet state, next runs, history, Done Policy, evidence, approval, and migration.

Recommended flow:

```text
User tells Hermes/Telegram/Campsite a recurring intent
→ Hermes/Campsite guides the user with cards/questions
→ MyCron Cronlet draft is produced
→ user approves compact preview
→ MyCron owns schedule, execution, Done Policy, evidence, history
→ Campsite/Telegram can show contextual surfaces and notifications
```

## 4. Campsite relationship

Campsite is not MyCron. Campsite is the agent-onboarding-first messenger/living camp where agents, routines, dashboards, and results can be experienced together.

MyCron appears inside Campsite as a connected surface, similar to opening a Hermes dashboard inside a Camp.

Example Campsite surface:

```text
Camp: 인스타 콘텐츠 자동화
Connected surface: MyCron / Weekly Content Brief
Status: 이번 주 루틴 3개 중 2개 완료
Cards:
- 월요일: 트렌드 리서치 완료
- 수요일: 콘텐츠 초안 생성 대기
- 금요일: 업로드 전 승인 필요
CTA:
[루틴 자세히 보기]
[MyCron에서 열기]
[이번 주만 일시정지]
[새 루틴 만들기]
```

Boundary:

```text
Campsite can embed or summarize MyCron.
MyCron owns Cronlet execution, Done Policy, evidence, audit, and migration.
```

## 5. CronBell as shared feature testbed

CronBell is **not MyCron**. Treat it as a conservative shared feature testbed for MyCron, Campsite, and BALTAM.

Core concept:

```text
CronBell proves and refines small agent-facing features in production
→ keep the testbed simple and maintainable
→ fold validated features into MyCron / Campsite / BALTAM separately
```

Deployed URL:

```text
https://cronbell.vercel.app
```

Verified smoke tests from deployment report:

```text
GET /                  -> 200
GET /api/state         -> 200
POST wrong token       -> 401
POST timer correct     -> 200, duration_sec=180
CLI alarm set 08:15    -> 200
CLI against Vercel:
  alarms: alarm_... 08:15 ON (once)
  timer: running 03:00 / 03:00
```

Current Hermes/GCP control status on 2026-06-06:

```text
Read/status against https://cronbell.vercel.app works.
Write control is blocked on this Hermes host because CRONBELL_API_TOKEN / ~/.cronbell/vercel-write-token is missing.
3-minute timer start was attempted and failed locally with the expected token-required error.
```

Current caveat:

```text
Vercel production currently has CRONBELL_API_TOKEN only.
Upstash Redis env is not yet configured.
The deployment uses Vercel memory fallback, so state may not persist across serverless instance changes.
```

Required persistent testbed env:

```bash
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
vercel deploy --prod
```

Hermes/GCP CLI target once token is copied:

```bash
export CRONBELL_API_URL="https://cronbell.vercel.app"
export CRONBELL_API_TOKEN="[REDACTED]"
cronbell timer start --minutes 3
cronbell alarm set --time "21:40" --label "회의 준비"
```

Role by product:

```text
MyCron: prove timer/alarm/routine control, token-gated writes, state/readback, future Done Policy UX.
Campsite: prove lightweight connected surfaces, action cards, returnable timer/routine state.
BALTAM: prove result/reminder loops for scheduled analysis and visual output review.
```

Maintenance philosophy:

```text
Keep CronBell conservative.
Use it to test thin vertical slices.
Do not let it become the product.
Graduate only validated features into the respective apps.
```

## 6. MVP spine

The new document set reinforces a sharper MVP wedge: MyCron is not a cron-registration app; it is the operating layer for scheduled agent work after users already have agents and cron jobs running.

Near-term MyCron MVP should prove:

1. `.mc` / Cronlet schema.
2. `register/list/approve/reject/audit` style runtime actions.
3. Schedule + timezone + runtime selection.
4. Done Policy / semantic completion gate.
5. Evidence/read-back history.
6. Risk tier / approval policy.
7. Migration/import from existing automations.
8. Compact surfaces consumable from Telegram/Campsite and full surfaces inside MyCron.
9. Run Health Monitoring: `success / failed / stale / unverified` per Cronlet.
10. Proof Panel: artifact links, file existence, timestamps, logs, summary, and user acknowledgement.
11. Weekly Review: success rate, failed routines, cost estimate, user feedback, and improvement suggestions.

MVP screens implied by the GPTers/operator case:

```text
Routine Inbox
→ Cronlet Builder
→ Run Dashboard
→ Proof Panel
→ Weekly Review
```

Failure Triage and Improvement Queue are next-layer features, but the product language should include them because they explain why MyCron is an operations layer rather than a scheduler UI.

Minimal `.mc` fields to preserve:

```yaml
schema: mycron/v0
kind: Cronlet
metadata: {name, description, tags}
schedule: {cron, timezone}
agent: {type, model}
task: {prompt, output_format}
surface: {type}
policy: {risk_tier, approval}
acceptance: {criteria, on_fail}
history: {retain}
```

## 7. Failure philosophy

MyCron’s strongest differentiation is semantic failure handling.

Thesis:

> Done is not a message. Done is a verified state.

A run that produced a plausible-looking message but failed to collect required sources or meet acceptance criteria should be marked as failed or partial, not successful.

Status vocabulary:

```text
completed
partial
semantic_fail
source_fail
acceptance_failed
missed
approval_required
```

Failure output policy:

```text
If the goal failed, do not produce a long pseudo-report.
Output only:
- what failed
- acceptance/evidence counts
- concrete next action
```

## 8. External benchmark: agentwatch and r/ClaudeCode

`agentwatch` (`https://github.com/mishanefedov/agentwatch`) is a useful ecosystem benchmark, not a direct replacement for MyCron.

Observed positioning:

```text
agentwatch = local-only observability for AI agents on your machine
```

It unifies local timelines across agents such as Claude Code, Codex, Gemini CLI, Hermes Agent, OpenClaw, and related tools. It focuses on what agents did, what they ran, which files they touched, costs, anomalies, budget alarms, and local/private multi-agent history.

Strategic signal:

```text
agentwatch validates that local multi-agent observability is becoming a real developer pain.
```

MyCron should use this as proof that the Claude Code / local-agent ecosystem is moving from “single-agent chat” toward operational tooling.

Boundary:

```text
agentwatch question: What did my agents just do?
MyCron question: What are my agents scheduled to do, under what policy, with what evidence of completion?
```

Positioning contrast:

```text
agentwatch = past-oriented observability
MyCron = future-oriented scheduled delegation control
```

Do not attack agentwatch. Treat it as complementary infrastructure and a benchmark for developer expectations around local-first, no-telemetry, multi-agent UX.

Possible integration/adjacency:

```text
agentwatch observes historical agent activity
→ MyCron imports recurring patterns or risky repeated actions
→ MyCron turns them into `.mc` Cronlets with schedule, Done Policy, risk tier, and evidence
→ future runs can still be observed by agentwatch-style local timelines
```

r/ClaudeCode is a relevant early feedback channel because its rules explicitly allow substantive Claude Code workflow/tooling posts when disclosure is clear. For any post, include:

- concrete Claude Code / Hermes / Codex workflow pain;
- commands, logs, screenshots, or reproducible examples;
- disclosure that ShareIdee/MyCron/CronBell is the author’s project/testbed;
- no clickbait or vague promotion;
- a feedback question, not a sales claim.

Best discussion angle:

```text
How should scheduled Claude Code / multi-agent tasks prove completion?
```

CronBell can be used as the conservative public testbed in that discussion, but the framing must stay clear:

```text
CronBell = small deployed proof bed
MyCron = product/runtime/control plane
```

## 9. External research update: harness + cron + zero-trust CLI

The three new source documents strengthen MyCron’s product thesis in different directions.

### 9.1 Harness engineering + cron jobs

The harness/cron material reframes scheduled AI work as:

```text
cron trigger
→ harness guardrails
→ agent execution
→ tests / evidence / handoff
→ human escalation on failure
```

Implication for MyCron:

- Scheduling alone is not the product.
- The harness around the scheduled agent is the product: sandbox, permissions, tests, Done Policy, evidence, retry limits, and human escalation.
- “Success quiet, failure loud” should be a default notification policy: successful runs can be logged silently; failed or unsafe runs must stop and alert.
- Context rot is a recurring-run risk. Cronlets need structured handoff artifacts and concise run memory, not infinite chat history.

Recommended MyCron phrase:

> MyCron is the harnessed scheduler for agent work — every recurring agent run has a trigger, guardrails, evidence, and a stop condition.

### 9.2 GPTers/operator case study

The GPTers-style case shows the real early user: an AI Workspace Operator who already runs multiple agents and cron jobs but lacks trustable operations.

Core pain translation:

```text
“했다는데 파일이 없음” → Proof of Work
“4일 연속 에러인데 모름” → Run Health Monitoring
“어디 있었지?” → Evidence / Artifact Index
“말투 이상, 빈말 보고” → Agent Behavior Feedback
“문제 느낄 때만 수동 개선” → Weekly Optimization Loop
```

Canonical case document:

- [`docs/case-study-001-ai-automation-after-creation.md`](case-study-001-ai-automation-after-creation.md)

The case study locks this product interpretation:

> The user wants trust, not scheduling.

### 9.3 Zero Trust for agent-facing CLI

The Google Workspace CLI / Zero Trust article is directly relevant to `mycron` CLI design.

Principles to preserve:

- Human DX optimizes for discoverability; Agent DX optimizes for predictability.
- Treat the agent as a good-natured but unreliable autonomous actor.
- Validate at every boundary: human → agent, agent → CLI, CLI → API, API → runtime.
- Prefer structured selections and schemas over free-form “just handle it.”
- Use dry-run / preview for side-effectful actions.
- Return field-masked, minimal, JSON-readable outputs to reduce context pollution.
- Preserve accountability: before-action preview, after-action read-back, audit evidence.
- Skills/docs are part of the harness: encode invariants such as “always include read-back command” and “never bypass runtime validation.”

`mycron` CLI should therefore be designed as an agent-safe action surface, not merely a human-friendly CLI.

## 10. Position in ShareIdee portfolio

```text
MyCron operates recurring agent work.
Campsite onboards and experiences agents in living camps.
BALTAM performs Python/scientific computation, visualization, and validation.
OverEdge governs high-impact agent actions.
```

Portfolio line:

> MyCron operates the work. Campsite preserves the workspace. BALTAM validates scientific engineering work. OverEdge governs the actions.

## 11. Near-term decisions

- Keep MyCron as the primary ShareIdee wedge unless explicitly deprioritized.
- Do not over-index on “dashboard” language externally.
- Show MyCron inside Campsite as a connected routine surface, but keep ownership of schedule/evidence/Done Policy in MyCron.
- Add Upstash Redis to CronBell if it is used as a durable public testbed.
- Keep `.mc` independent from LangChain/LangGraph renderer assumptions.
