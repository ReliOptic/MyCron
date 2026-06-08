# Agent, Runtime, and Harness Spec

> Status: draft product contract
> Scope: MyCron vocabulary and product boundary for scheduled agent work

## 1. Product framing

MyCron is the user-owned multi-agent operations interface and harness for scheduled agent work.

A model or agent is not enough by itself. Useful AI work emerges when models and agents are wrapped in a harness: memory, I/O, scheduling, orchestration, approval, evidence, verification, and audit. MyCron owns that operating layer for work that continues after the originating chat or coding session ends.

MyCron does **not** claim to own the model, the agent brain, or every execution environment. It is not an app for embedding agents. External agents and runtimes may do the reasoning and execution. MyCron is the user-owned interface where those agents converge, so the user can see, approve, pause, retry, rebind, verify, and audit the growing set of agent-scheduled work under one Account.

The product value becomes clearer as a user accumulates more agents. A single agent can be managed inside its native tool. Many agents across many runtimes create operational sprawl: hidden schedules, unclear ownership, stale memory, risky sends, missing evidence, failed runs, duplicate work, and no shared audit trail. MyCron exists to make that multi-agent sprawl governable.

Short form:

```text
Agent = external reasoning worker
Runtime = place/body where work runs
RuntimeBinding = current execution binding
Cronlet = durable scheduled work unit
Memory = future context
Evidence = past proof
Verify = deterministic trust calculation
MyCron = user-owned multi-agent operations harness around the whole loop
```

## 2. Agent

An **Agent** is a reasoning worker that interprets intent, uses tools, may coordinate with other agents, and may improve through memory or skills.

In MyCron, agents are usually external host agents such as a coding agent, local assistant, cloud agent host, or future physical/robotic agent controller. MyCron records agent origin and execution metadata, but does not pretend to own the agent brain.

The purpose of tracking agents is not to build agents inside MyCron. The purpose is to help the user operate many external agents safely: which agent registered which Cronlet, which actions need approval, which runs failed, which evidence was produced, which runtime is currently bound, and which agent should be restricted, paused, or reconfigured.

MVP boundary:

- Agent is not a standalone registry feature yet.
- No `/agents` route is promised by this spec.
- No agent CRUD is in scope.
- Agent labels may appear as Cronlet metadata.
- Agent identity must not be treated as trusted input without validation.
- Future Agent surfaces must be framed as multi-agent operations and governance, not agent creation.

## 3. Runtime

A **Runtime** is the environment, host, or body where agent work actually runs.

Examples:

- cloud agent host
- local runner
- coding workstation
- GitHub Actions
- Kubernetes CronJob
- future robot or physical AI environment

MVP boundary:

- Runtime is not a standalone management feature yet.
- No `/runtimes` route is promised by this spec.
- No runtime CRUD, connection setup, runner health, or execution fleet management is in scope.
- Runtime labels may appear as Cronlet metadata.
- Runtime selection becomes product-critical through `RuntimeBinding` and `rebind`, not through a fake settings page.

## 4. RuntimeBinding

A **RuntimeBinding** is the current binding between a Cronlet and the runtime/executor that should perform future runs.

Rules:

- `RuntimeBinding` is mutable through explicit rebind operations.
- `client_ref` is immutable and remains the origin namespace anchor.
- Rebinding changes where future runs execute; it does not relabel the Cronlet's origin.
- Run lineage, history, evidence references, memory references, and audit trail must be preserved across rebind.

Example:

```yaml
client_ref: hermes:daily-invoice  # immutable origin namespace
runtime:
  kind: hermes
```

After rebind:

```yaml
client_ref: hermes:daily-invoice  # unchanged
runtime:
  kind: claude_code
```

## 5. Harness

A **Harness** is the operating layer around agent work.

For MyCron, the harness includes:

- schedule persistence
- account-scoped ownership
- schema introspection
- approval gates for risky external actions
- runtime binding and rebind semantics
- memory as future context
- evidence as past proof
- deterministic verification
- retry and run-now lineage
- immutable audit records
- intent-confirming JSON envelopes

This is the product center. MyCron should not become a generic agent marketplace, generic runner dashboard, or fake infrastructure console before the harness contract is reliable.

## 6. UI implications

Current app surfaces may show Agent and Runtime as Cronlet metadata. They should not imply working management features until those capabilities exist.

Allowed now:

- Cronlet detail displays `Agent · Runtime` metadata.
- Demo data may use readable agent/runtime labels when explicitly in demo mode.
- Specs may define `RuntimeBinding` for CLI and migration semantics.

Not allowed yet:

- global navigation that presents Agents/Runtimes as working surfaces without routes
- fake `/agents` or `/runtimes` pages
- fake runner health/status
- fake agent or runtime connection settings
- demo-only labels leaking as production capability claims

## 7. Future feature path

Before introducing first-class Agent or Runtime surfaces, create separate specs or ADRs for:

1. Agent registry: identity, trust, capabilities, ownership, and allowed actions.
2. Runtime registry: connection model, health, secrets, execution receipts, and failure modes.
3. Capability grants: which action types each runtime/agent may execute.
4. Attestation: how runtimes produce evidence that can become `runtime_attested`.
5. Physical/robotic execution: stricter approval, safety, and audit requirements.

Until then, Agents and Runtimes are product concepts and Cronlet binding metadata, not full management features.
