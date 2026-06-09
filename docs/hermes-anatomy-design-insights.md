# Hermes Anatomy Design Insights for MyCron

> Status: product reference
> Scope: what MyCron should learn from Hermes Agent's skill/memory/cron architecture

## 1. Why this matters

Hermes Agent demonstrates a practical version of "AI that gets better with use" without retraining the model. The model is not modified. The operating context around the model becomes better: skills, memory, safe tool access, cron jobs, and verification patterns accumulate as human-readable artifacts.

For MyCron, this is a direct product lesson:

```text
Better agent work does not only come from a better model.
It comes from a better harness around the model.
```

MyCron should therefore treat agent-operated work as a durable operating system problem, not as a chat response problem.

## 2. Hermes anatomy, translated

Hermes separates several concepts that MyCron should preserve rather than collapse.

### 2.1 Memory vs skill

Hermes distinction:

```text
Memory = durable facts/context about the user, environment, or project.
Skill = reusable procedure for doing work better next time.
```

MyCron implication:

```text
Memory is future context.
Skill/process is method.
Evidence is past proof.
Cronlet is scheduled delegated work.
```

MyCron should not mix these into one opaque "agent state" blob. The product value is that a user can inspect, migrate, attach, detach, approve, and audit each layer separately.

### 2.2 Human-readable improvement

Hermes skills are readable documents. Improvement is not hidden inside unknown model weights; it is captured as procedures, pitfalls, and verification steps.

MyCron implication:

- `.mc` should be a human-inspectable portable Cronlet artifact.
- `.mmy` or future memory artifacts should expose summaries, references, provenance, freshness, and sensitivity policy.
- policy/safety artifacts should be reviewable by humans before enterprise execution.
- Done Policies should be explicit acceptance criteria, not implicit LLM confidence.

Thesis:

```text
If agent work cannot be inspected, it cannot be operated.
```

### 2.3 Improvement happens in pitfalls and verification

Hermes skills improve most where real work exposes traps: pitfalls and verification steps. The basic recipe may stay stable, but the "do not fall here" signs accumulate.

MyCron implication:

The most important compounding layer is not just more scheduled tasks. It is the operating knowledge around those tasks:

- why a run failed;
- what evidence was missing;
- what approval was ambiguous;
- which action needed stricter confirmation;
- which source became unreliable;
- which runtime binding produced better results;
- which Done Policy should be tightened.

This should feed future Cronlet recommendations, policy defaults, and verification guidance.

### 2.4 Safe background reflection

Hermes can review completed work and save skills, but the reflective worker has restricted powers. It can write/read skills; it cannot perform arbitrary dangerous actions or recursively spawn uncontrolled workers.

MyCron implication:

AgentOps reflection should be safe by design:

- post-run analysis can propose policy, skill, Done Policy, or memory improvements;
- external actions must remain gated;
- reflective agents must not bypass approval;
- recursive background work must be bounded;
- proposed improvements should remain human-readable and reviewable.

### 2.5 Next-run application

Hermes does not inject newly created skills into the already-running context because doing so would break caching and increase cost. New skills apply on the next task/session.

MyCron implication:

Cronlet updates should respect execution boundaries:

- a running Run should not silently mutate its own Done Policy, schedule, action schema, or approval policy mid-flight;
- improvements should become proposed revisions for future runs;
- versioning should preserve which policy/memory/skill was active for each Run;
- audit should show when a recommendation became an active contract.

This is a core reliability rule:

```text
Do not rewrite the contract while the run is executing.
```

## 3. Product design implications

### 3.1 MyCron as the harness, not the brain

Hermes anatomy supports MyCron's central framing:

```text
Agent = reasoning worker
Model = intelligence substrate
Harness = operating layer that makes work durable, safe, inspectable, and improvable
```

MyCron should own the harness for scheduled delegated work:

- schedule persistence;
- account ownership;
- approval gates;
- memory attachment;
- evidence capture;
- deterministic verification;
- policy and safety artifacts;
- migration between runtimes;
- audit and run history.

### 3.2 Recurring knowledge work is the stronger wedge

Conventional developer cron already has mature tools: Airflow/Prefect for data pipelines, Kubernetes CronJob/GitHub Actions/native cron for infrastructure, and deployment products for CI/CD.

MyCron's stronger wedge is recurring agent-operated knowledge work:

- research monitoring;
- recurring information gathering;
- market/competitor/news summaries;
- portfolio or operations briefings;
- email triage and draft workflows;
- evidence-backed recurring reports;
- multi-agent work where the problem is approval, memory, verification, and audit.

### 3.3 Done is not a message

Hermes can produce good-looking responses, but MyCron's role is to ask whether the delegated goal was actually completed.

MyCron should separate:

```text
process status = did the agent/script run?
data status = were required sources/inputs collected?
goal status = was the user's intended outcome achieved?
```

If any required layer fails, the run should not produce a padded pseudo-success report. It should mark the appropriate failure state and provide the smallest next action.

### 3.4 Standards are the moat

Hermes shows the power of readable, durable procedure artifacts. MyCron's analogous moat is portable, frictionless standards for agent-operated work:

```text
.mc       = delegated scheduled work / Cronlet
.mmy      = memory migration / portable context
policy    = allowed actions, risk rules, approval matrix
safety    = guardrails and escalation rules
evidence  = proof package / verification material
capability grant = scoped permission to act
```

The UI matters, but the deeper moat is that heterogeneous agents and runtimes can all speak these contracts through a low-friction CLI/API.

## 4. OverEdge and enterprise implication

Hermes-style self-improvement is useful for individuals, but enterprise adoption requires an outer governance layer.

Nested model:

```text
OverEdge = enterprise governance layer
  policy / safety / guardrails / compliance / accountability
    governs
MyCron = operations ERP / control plane
  Cronlets / Runs / Approvals / Evidence / Memory / RuntimeBinding / Capability / Done Policy
    relies on
Portable standards
  .mc / .mmy / policy-safety artifacts / capability grants / evidence packages
```

In this model:

```text
MyCron operates agent work.
OverEdge governs agent actions.
The moat is the portable standard.
```

## 5. Non-goals

This document does not claim that MyCron should clone Hermes.

MyCron should not:

- become an agent builder;
- own the model brain;
- hide improvements inside opaque model state;
- auto-apply risky policy changes without review;
- compete head-on with Airflow, Prefect, Kubernetes CronJob, or CI/CD schedulers;
- treat a successful agent message as proof of completed work.

## 6. Design checklist

When adding a new MyCron feature, ask:

1. Which layer is this: Cronlet, Memory, Skill/process, Evidence, Policy, Safety, Capability, or RuntimeBinding?
2. Is it human-readable and inspectable?
3. Can it be migrated or exported as a portable artifact?
4. Can an agent operate it through a low-friction JSON CLI/API?
5. Does it support dry-run, confirmation, and read-back verification when side-effectful?
6. Does it preserve run-version history rather than mutating the past?
7. Does it improve future runs without fabricating success for the current run?
8. Does enterprise use require OverEdge policy/safety/guardrail wrapping?

## 7. One-line takeaway

```text
Hermes gets better by improving its readable operating instructions; MyCron should make agent work better by improving its readable operating contracts.
```
