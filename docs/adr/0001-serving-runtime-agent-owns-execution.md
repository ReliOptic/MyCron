# MyCron은 통제·서빙 런타임이고, 행동 실행·지능은 host agent가 소유한다

MyCron은 행동을 *실행*하지 않고 *통제*한다. host agent(Hermes 등)가 자기 LLM으로
"언제/어떤 조건에 무엇을 하라"를 결정해 MyCron CLI로 Account-스코프 서버에 등록하고,
MyCron은 그 Cronlet 스토어를 저장·표시하고, 외부 행동에 Approval Gate를 걸고, 실행
결과를 Audit Log에 기록하는 통제·감사 역할만 한다. 어떤 행동을 할지의 지능과 LLM
비용은 agent가 부담한다.

## Considered Options

- **MyCron이 행동을 직접 실행/오케스트레이션:** 통제뿐 아니라 실행까지 소유. 실행
  책임·비용을 MyCron이 지고, 에이전트 생존 의존성이 생기며, "지능·실행은 agent 소유"
  원칙과 충돌.
- **채택: MyCron은 통제·감사면.** 실행은 agent(또는 agent가 호출하는 실행자)가 한다.
  MyCron은 "실행 전 승인 게이트 + 사후 감사"를 소유한다 — 즉 행동의 *허가와 기록*이
  MyCron, *결정과 수행*이 agent.

## Consequences

- MyCron은 외부 행동을 직접 실행하지 않을 수 있다(승인 후 agent/실행자에 그린라이트를
  주는 방식). MVP에서 실행 경로는 단순화한다.
- Audit Log는 불변이며 누적된다 — 어떤 행동을 사용자가 승인/거부했는지의 데이터가 control
  plane에 쌓이고, 이 자산이 해자의 핵심(호스트가 못 가져감).
- 데이터 모델에 Policy(자동/승인 정책)와 audit 자리를 지금 남겨둔다 — forward-compat.
