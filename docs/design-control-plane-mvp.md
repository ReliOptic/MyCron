# Design: MyCron — Agent Action Control Plane MVP

Generated 2026-06-04 (GenUI 방향 폐기 후 재중심)
Branch: main
Repo: MyCron (greenfield)
Status: DRAFT

> 도메인 용어는 `CONTEXT.md`, 확정 결정은 `docs/adr/0001~0003`. 폐기된 GenUI 방향은
> `docs/_archive-genui/`. 이 문서는 control plane MVP의 범위·증명·계획을 정한다.

## Problem Statement

AI 에이전트가 사용자를 대신해 시간을 두고 *행동*하기 시작했다 — 스케줄, 결제, 메일
발송, 계정 조작. 그러나 그 행동은 채팅 세션마다 흩어져, 사용자가 "내 에이전트들이
무엇을 예약했고 무엇을 실행했는지"를 한곳에서 보고·승인·취소·감사할 면이 없다.
자율성이 커질수록 통제 부재가 신뢰를, 따라서 채택을 막는다.

## What Makes This Matter

핵심: **에이전트가 외부 행동(되돌리기 어려운 것)을 하기 전에 사용자가 승인하고, 실행된
모든 것을 감사할 수 있다.** 같은 control plane에 어느 에이전트든(Hermes·Claude·GPT)
행동을 등록하고, 사용자는 자기 계정에서 한 번에 통제한다.

진짜 증명 대상은 닫힌 통제 루프다:
`행동 등록 → Policy 판정 → (external이면) Approval Gate → 승인/거부 → 실행/미실행 → Audit`.

## Constraints

- 데모 창 짧음(다중 프로젝트 병행 — Fevio, Campsite, Go-Push 등 시간 예산 빠듯).
- MVP는 라이브가 아니라 **녹화 가능한 데모**가 성공 기준.
- mock/fixture 실행자 허용(실제 결제·발송 API 불필요 — 승인 게이트와 audit가 핵심).

## Premises

1. 증명할 핵심은 UI 생성이 아니라 **행동의 통제·감사**다(GenUI 폐기).
2. external action(결제·발송·계정조작)에 Approval Gate가 실제로 작동하는 것이 신뢰의
   증거다. internal action(notify·brief)은 auto-execute로 대조한다.
3. cross-agent 등록(어느 에이전트든 같은 계약으로 행동 등록)이 중립성·해자의 증거다.
4. 실제 외부 실행, 학습형 Policy, 엔터프라이즈 컴플라이언스 리포트는 MVP 보류.
5. 성공 = "에이전트가 내 대신 결제하려는 걸 내가 승인 전에 막았고, 다 기록됐다"가
   보이는 녹화 데모.

## Approaches Considered

### Approach A: Auto-execute only (게이트 없음)
모든 행동 자동 실행. 구현 단순하지만 **통제가 없다** — 핵심 가치(승인·신뢰)를 증명
못 함. Effort S / Risk Low (그러나 제품 명제 미증명).

### Approach B: Approval Gate + Audit — **선택됨**
external action은 Policy 판정 후 Approval Gate → Approval Queue → 사용자 승인/거부.
internal은 auto. 실행/거부는 Audit Log에 불변 기록. 신뢰 명제를 직접 증명. mock 실행자로
충분. Effort M / Risk Med (Policy·큐·감사 상태기계).

### Approach C: B + 학습형 Policy
B에 사용자 승인/거부 신호로 Policy 학습 추가. 진짜 결정층이지만 MVP엔 과함. post-MVP.

## Recommended Approach

**Approach B.** 제품 명제(통제·신뢰)를 가장 직접 증명하면서 7일 안에 닫힌다. 학습형
Policy(C)는 엔터프라이즈 진화 단계로 미룬다.

### MVP 범위

두 개의 대조되는 Action Type 흐름:

| Action Type | 분류 | 흐름 | 통제 |
|---|---|---|---|
| `brief.daily` | internal | 등록 → Policy: auto → 실행 → Audit | 승인 불필요(auto) |
| `payment.send` 또는 `email.send` | external | 등록 → Policy: gate → Approval Queue → 승인/거부 → 실행/미실행 → Audit | **실행 전 승인 필수** |

### 아키텍처 (ADR-0001~0003)

```
[host agent (Hermes 등) — 지능·실행 소유]
  → mycron schema <action-type>     : 행동 계약·필수 인자 조회 (런타임 introspection)
  → mycron create --json '{action}' : agent-first CLI, raw-JSON 등록
[MyCron 서버 — 통제·서빙 런타임]
  → ingestion 검증: Action Type·인자 검증, 악성·범위 밖 거부 (ADR-0002)
  → cronlet 영속화 (Account 스코프)
  → Policy 판정: internal→auto / external→Approval Gate
  → external: Approval Queue 적재 (실행 보류)
  → 웹 Control Surface: cronlet 목록 + Approval Queue + Audit Log
  → 사용자 approve/reject → 승인 시 실행 그린라이트(mock 실행자) / 거부 시 미실행
  → 모든 실행·거부 → Audit Log 불변 기록
  → Feedback Event(approve/reject/cancel) → runtime·(post-MVP)Policy 학습
```

CLI 동사: `login/list/get/create/update/delete` + `schema` + `approve/reject`(ADR-0003).
스택: Next.js PWA + TS, Supabase Postgres, Zod(ingestion 검증). **MyCron은 LLM을 호출하지
않는다**(지능·실행 = agent). 외부 실행은 MVP에서 mock 실행자.

## Success Criteria

증명해야 할 핵심은 **P1(cross-agent 등록) + P2(Approval Gate) + P3(Audit)**.

**P1 — cross-agent 등록:**
1. host agent가 `mycron schema <action-type>`로 행동 계약을 조회하고 `create --json`으로 등록
2. **코어 수정 0으로 새 Action Type 추가** — schema 엔트리만으로 같은 계약을 탐

**P2 — Approval Gate (신뢰 명제):**
3. external action(결제/발송)이 등록되면 실행되지 않고 Approval Queue에 뜬다
4. 사용자가 거부하면 **실행되지 않고**, 승인하면 실행된다 — 둘 다 시연
5. internal action(brief)은 승인 없이 auto-execute되어 대조된다

**P3 — Audit & 하드닝:**
6. 실행·거부가 Audit Log에 불변 기록된다(무엇이/언제/어느 agent가/결과)
7. catalog 밖·악성 action 입력을 ingestion에서 거부하는 걸 실제로 시연(ADR-0002)

## Open Questions

1. **mock 실행자 경계** — 승인 후 "실행"을 어디까지 mock하나(로그만 vs 가짜 응답).
2. **Policy 표현** — MVP는 Action Type별 정적 매핑(internal=auto/external=gate)으로 충분.
   학습형은 post-MVP.
3. **다중 agent 식별** — Audit Log에 어느 host agent가 등록했는지 기록할 신원 표현.

## Long-term Thesis

부팅(now): 코딩·에이전트 생태계(OMC·Claude Code·Hermes)에서 dogfooding → 채택·승인 패턴·
감사 데이터 축적. 진화/매출: 엔터프라이즈 — 에이전트가 결제·발송·계정을 건드리는 조직의
승인 워크플로우·감사·컴플라이언스 리포트·SLA에 과금. 해자는 cross-agent 중립성(Anthropic이
lock-in 탓 구조적으로 못 만듦) + 누적 승인·감사 데이터. 수익이 해자와 같은 flywheel로 돈다.

## Next Steps (7일 계획)

- **Day 1:** 데이터 모델(cronlets, action_types, approval_queue, audit_log, policy 자리) + Account.
- **Day 2:** agent-first CLI — `login/list/get/create/update/delete` + `schema` + `approve/reject`, raw-JSON.
- **Day 3:** ingestion 검증(Zod, 악성·범위 밖 거부 = **P3**) + cronlet 영속화.
- **Day 4:** Policy 판정 + Approval Gate(external→큐, internal→auto) + mock 실행자.
- **Day 5:** Control Surface(cronlet 목록 + Approval Queue 승인/거부 + Audit Log).
- **Day 6:** **P1 시연**: 코어 수정 0으로 새 Action Type 추가 + Audit 불변 기록.
- **Day 7:** P2(외부 행동 승인/거부) + P3(악성 거부) 시나리오 녹화.

## The Assignment

오늘, 코드 한 줄 쓰기 전에: external action 하나(예: `email.send`)와 internal action 하나
(`brief.daily`)의 JSON 페이로드를 **목으로 직접 써보고**, 둘이 Approval Gate를 통과하는
경로가 *시각적으로* 다른지 확인하라 — external은 큐에 멈추고, internal은 바로 실행·기록.
이 대비가 데모의 전부다. 통제가 보이지 않으면 데모는 실패한다.
