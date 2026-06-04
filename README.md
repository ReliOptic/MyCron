# MyCron

> MyCron is a user-owned control plane for the actions your AI agents schedule on your behalf.

**MyCron** is a cross-agent control plane for agent-scheduled actions. Agents such as Hermes,
Codex, and Claude Code register time-based actions through an agent-first CLI; MyCron stores
them as **Cronlets**, gates risky **external actions** (payments, sends, account operations)
behind user approval, and records every execution in an immutable **Audit Log**. The
intelligence and execution stay with the agent; ownership, approval, and audit stay with the user.

User-facing sentence:

> 에이전트가 당신을 대신해 시간을 두고 행동한다. MyCron은 그것을 보고·승인·취소·감사하는, 당신이 소유한 통제면이다.

---

## Pivot note (2026-06-04)

This repository pivoted from a governed **GenUI utility runtime** to an **agent action
control plane**. The GenUI direction (generation/delivery of UI) is crowded by large
players and labs; the unfilled gap is the *substrate* — where agent-initiated actions
persist, who owns them, and how they are controlled and audited over time. The previous
GenUI direction is preserved under `docs/_archive-genui/`.

---

## What MyCron is / is not

MyCron is **not**:

- an alarm app
- a Unix cron dashboard
- a Zapier/IFTTT clone
- a GenUI rendering layer (the earlier, now-archived direction)

MyCron **is** the control and audit plane for agent-initiated background actions.

---

## The loop

```text
Host agent registers a Scheduled Action
→ Account-scoped Cronlet store
→ Policy decision: internal action = auto-execute / external action = Approval Gate
→ Approval Queue (external actions wait here)
→ User approves / rejects on the Control Surface
→ Execute / skip
→ Immutable Audit Log
→ Feedback Event back into runtime state and Policy
```

The first demo proves three things: **P1** cross-agent registration, **P2** the Approval
Gate (external actions do not run until approved), **P3** an immutable Audit Log. See
`docs/design-control-plane-mvp.md`.

---

## Core concepts

Defined in `CONTEXT.md`. In short:

- **Host Agent** — external agent (Hermes, Claude, GPT) that decides and registers actions; owns execution and its LLM cost.
- **Scheduled Action** — "do X at time/condition Y", registered by an agent.
- **Action Type** — `internal` (reversible: notify, brief) vs `external` (hard to reverse: payment, email_send, account_op).
- **Cronlet** — a stored, controllable instance of a scheduled action in an Account.
- **Account** — the user-owned ownership boundary (the basis for cross-agent neutrality).
- **Approval Gate / Approval Queue** — external actions wait for user approval before execution.
- **Policy** — which action types auto-execute vs require approval (rule-based now, learned later).
- **Audit Log** — immutable record of what executed/was rejected, when, by which agent.
- **Control Surface** — where the user sees, approves, cancels, and audits.

---

## Customer

- **Boot (now):** the coding/agent ecosystem (OMC, Claude Code, Hermes). Coding agents
  increasingly schedule background work (cron, deploys, monitoring) with no place to
  control it. Natural 0→1 — accumulates usage, approval patterns, and audit data.
- **Revenue:** enterprise. Where agents touch payments, sends, and accounts, pre-execution
  approval and audit trails are compliance-critical and paid for today (regulated /
  finance-adjacent).

## Moat

1. **Cross-agent neutrality.** A user-owned control plane any agent can write to. Labs keep
   users inside their own agent (lock-in); a *neutral* control plane that covers competing
   agents is something they structurally will not build. Neutrality is the defense.
2. **Accumulating approval/audit data.** Which actions users approve/reject, what is safe to
   auto-execute, compounds in MyCron's layer and cannot be taken by the host.

---

## Example (agent-first CLI)

```bash
# external action → goes to the approval queue, does not run yet
mycron create --json '{"action_type":"email.send","schedule":"tomorrow 09:00","args":{"to":"client@x.com","subject":"Invoice"}}'

# user (or script) approves a queued action
mycron approve crn_001

# internal action → auto-executes per policy
mycron create --json '{"action_type":"brief.daily","schedule":"daily 08:30","args":{"topic":"..."}}'
```

CLI is an agent-first CRUD client for the Cronlet store plus control verbs
(`approve` / `reject`). See `docs/adr/0003-agent-first-cli.md`.

---

## Repository status

Seed: domain model (`CONTEXT.md`), architecture decisions (`docs/adr/0001~0003`), and MVP
design (`docs/design-control-plane-mvp.md`). No production runtime or PWA exists yet.

## License

MIT
