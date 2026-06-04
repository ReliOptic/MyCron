# 외부 행동은 Approval Gate를 거친다 (행동 governance)

되돌리기 어려운 외부 행동(payment, email_send, account_op 등)은 Policy에 따라 실행 전
사용자 승인을 필수로 거친다. 내부 행동(notify, brief 등 되돌릴 수 있는 것)은 Policy가
허용하면 auto-execute한다. host agent는 신뢰되지 않는 입력원으로 취급하고, MyCron은
ingestion에서 하드닝한다(Action Type 검증, 제어문자·악성 인자·범위 밖 요청 거부).

## Considered Options

- **모든 행동 자동 실행:** 최대 자동화지만, 되돌리기 어려운 외부 행동(결제·발송·계정
  조작)에서 사용자 통제가 사라져 신뢰가 붕괴한다. 자율성이 커질수록 채택을 막는다.
- **채택: external은 Approval Gate, internal은 Policy로 auto.** 어떤 행동이 자동 실행
  가능하고 어떤 게 승인 필요인지를 Policy가 가른다. governance(승인·감사)가 곧 제품
  가치(신뢰)다.

## Consequences

- 새 external Action Type은 default-deny(승인 필요)이며, 명시적 Policy로만 auto로 승격한다.
- Policy는 초기 규칙 기반(결정론) → 사용자 승인/거부 신호로 학습형(결정층). 학습형 정책
  엔진이 엔터프라이즈 수익 기능의 핵심.
- 데모의 P2(외부 행동이 승인 전 미실행, 승인 후 실행되는 것을 시연)가 이 결정의 증명.
