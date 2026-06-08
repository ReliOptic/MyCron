# Case Study 001 — AI 자동화는 만든 다음이 진짜다

> Source: GPTers-style AI workspace operator discussion + agentwatch benchmark notes, captured 2026-06-08.

## 1. User situation

A power user combines Claude Code, Codex/GPT, OpenClaw/Hermes-like agents, Telegram, Obsidian, markdown folders, and cron jobs to run a personal AI workspace.

They are already beyond “trying AI chat.” They have multiple agents, scheduled jobs, file handoffs, and recurring routines. Their problem is no longer creation.

Their problem is operation.

## 2. Failure cases observed

The recurring pain is not “how do I create a cron job?” It is:

- **Execution distrust:** “It said it did it, but the file is missing.”
- **Failure discovered late:** repeated errors can run for days before the user notices.
- **Artifact loss:** outputs exist somewhere, but the user cannot quickly find where.
- **Agent quality drift:** reports become padded, vague, or stylistically off.
- **Manual improvement loop:** the user only improves the automation after feeling pain.

## 3. Existing workaround

Power users build their own harness:

```text
agent roles
+ markdown operating manuals
+ Obsidian/folder structure
+ cron jobs
+ changelogs
+ weekly review notes
+ Telegram notifications
```

This proves the market exists. It also proves that MyCron cannot win by being a prettier cron UI.

## 4. MyCron interpretation

The user wants trust, not scheduling.

```text
Bad framing:
AI cron job registration app

Better framing:
Scheduled agent work operating layer

Best question:
Did the delegated recurring work actually complete, with evidence?
```

MyCron should convert scattered scheduled AI work into Cronlets with:

- scheduled intent capture;
- run health;
- evidence/artifact index;
- cost and anomaly awareness;
- failure triage;
- weekly optimization loop;
- reusable routine templates.

## 5. MVP screens implied by this case

1. **Routine Inbox** — capture “do this every morning/week” intent.
2. **Cronlet Builder** — schedule, agent/runtime, output, evidence, Done Policy.
3. **Run Dashboard** — success / failed / stale / unverified.
4. **Proof Panel** — created files, links, logs, timestamps, summaries.
5. **Failure Triage** — error type, last success, retry/fix action.
6. **Weekly Review** — success rate, failed routines, cost, user feedback.
7. **Improvement Queue** — merge, pause, split, refactor, add evidence.

For MVP, the minimum strong wedge is:

```text
Routine Inbox + Run Dashboard + Proof Panel + Weekly Review
```

## 6. Cronlet shape from the case

```yaml
cronlet:
  name: Morning Briefing
  intent: 매일 아침 주요 정보를 요약한다
  trigger:
    type: schedule
    time: "08:30"
  agent:
    name: Ella
    role: planner/researcher
  output:
    expected_artifact: morning_briefing.md
    location: /notes/daily/
  evidence:
    required:
      - file_created
      - timestamp
      - summary
  health:
    status: success | failed | stale | unverified
  review:
    cadence: weekly
    metrics:
      - success_rate
      - usefulness_score
      - token_cost
      - user_correction_count
```

## 7. agentwatch benchmark implication

`agentwatch` validates a closely adjacent developer pain: local multi-agent observability.

Its useful signals for MyCron:

- unified timeline across Claude Code, Codex, Gemini CLI, Cursor, Hermes, OpenClaw-style tools;
- token/cost tracking;
- budget warnings;
- anomaly and stuck-loop detection;
- user-defined dangerous-command triggers;
- local-first / no-telemetry posture;
- adapter → normalized event → UI/MCP query architecture.

Boundary:

```text
agentwatch = what did my agents just do?
MyCron = what are my agents scheduled to do, under what policy, with what evidence of completion?
```

MyCron should treat agentwatch as a benchmark and possible integration source, not a competitor to attack.

## 8. Interview prompt

Use this question for early MyCron customer discovery:

> 반복 AI 업무를 만들어본 뒤, 가장 불안했던 것은 실행 여부, 결과 품질, 비용, 산출물 위치, 실패 감지 중 무엇이었나요?

## 9. Product conclusion

AI automation’s next bottleneck is not generation. It is operation.

MyCron’s opportunity is to turn scheduled agent work into verifiable, reviewable, improvable Cronlets.

> Done is not a message. Done is a verified state.
