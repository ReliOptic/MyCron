# MyCron Product Direction

Source: 2026-06-12 first-user/onboarding conversation.

## One-line thesis

MyCron is a user-owned control plane for recurring agent work: it turns scattered cron jobs into portable, reviewable Cronlets.

## Pain point

Agent-created cron jobs are currently fragmented across machines, chats, and local scheduler state:

- the schedule is hard to inspect visually;
- execution results are buried in Telegram or other message history;
- completion criteria are unclear;
- multiple agents cannot easily share or hand off recurring work;
- users cannot quickly see whether a routine is actually healthy over time.

## Product job

MyCron should let the user answer:

- what recurring agent jobs exist;
- which agent/runtime owns each routine;
- when each routine runs;
- whether routines cluster and overload one machine/time window;
- what each run produced;
- whether the job met its done policy;
- how the routine has changed over time;
- whether a routine should move to another agent.

## Core object: Cronlet

A Cronlet is a portable unit of delegated recurring agent work.

It should eventually include:

- title;
- schedule;
- task/prompt;
- owning account/user;
- source agent/runtime;
- delivery target;
- approval state;
- done policy;
- run history;
- evidence/result history;
- portability metadata for handoff or migration.

The `.mc` file/schema is the portable representation of this idea, but the product should not expose schema complexity before the user understands the routine.

## UX implication

The MyCron interface should not feel like a generic cron table. It should feel like a control plane for routines:

- timeline/calendar view for recurring load;
- agent/runtime grouping;
- Cronlet detail page;
- run/evidence archive per Cronlet;
- trend/history view for repeated outputs;
- move/assign flow between agents;
- explicit draft/pending/approved/running/failed/completed states.

## Differentiation

MyCron is not:

- a generic scheduler;
- a chatbot;
- a Zapier clone;
- a hidden Hermes feature;
- a plain wrapper around local cron.

Hermes is one runtime that can create or run Cronlets. MyCron should remain runtime-agnostic enough to manage recurring work across multiple agents.

## Product invariant

A recurring agent job is not done because an agent says it is done. It is done when the Cronlet's done policy, evidence, and review state make the result inspectable.

## Near-term PR implications

The next product work should prefer small PRs that clarify:

1. canonical Cronlet schema and lifecycle;
2. creation flow from agent/CLI instruction into draft Cronlet;
3. UI empty state and onboarding for first real use;
4. run/evidence archive per Cronlet;
5. done policy and approval semantics;
6. agent/runtime ownership and handoff.
