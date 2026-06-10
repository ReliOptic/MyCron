# Approval approve/reject는 user Actor만 유효 (self-approval 차단)

> Status: accepted — extends ADR-0002/0004. Kernel×ledger 설계: [ADR-0006](./0006-transition-kernel-event-ledger.md).

CLI는 "agent 진입구이자 통제 진입구"라서 host agent가 같은 CLI로 `approval approve`를
실행해 자기 external action을 self-approve할 수 있었다 — Approval Gate가 구조적으로 우회
가능했다. 행위의 유효성을 채널(CLI/Control Surface)이 아니라 **Actor**로 정의하고,
approve/reject는 `actor.kind=user`일 때만 유효하다는 kernel 불변식으로 잠갔다.

## Considered Options

- **actor 기록만, 강제는 backend auth 도입 시:** contract test 무수정이지만 Gate가 계속
  우회 가능하고 ledger가 self-approval을 정상 기록으로 정당화한다.
- **CLI에서 approve 제거(Control Surface 전용):** 가장 강하지만 "CLI는 통제 진입구"라는
  CONTEXT.md 정의 및 ADR-0004 grammar와 충돌하고 터미널 사용자의 승인 경로가 사라진다.
- **채택: kernel 불변식으로 강제.** 채널은 유지하되 actor로 판별한다.

## Consequences (잠근 결정)

- **불변식.** `approval approve/reject` event는 `actor.kind=user`여야만 유효하다. kernel이
  판정하므로 CLI/Control Surface/future backend가 같은 규칙을 공유한다.
- **CLI 기본 actor = host_agent.** agent가 그냥 CLI를 돌리면 approve는 kernel에서
  거부된다(전용 error code). 사용자가 CLI로 승인하려면 명시적 user actor 선언이 필요하다.
- **거부 시도도 ledger에 남는다.** 차단된 self-approval 시도는 outcome과 주장된 actor와
  함께 event로 기록된다 — 보안 포렌식 + Policy 학습 신호.
- **로컬 MVP의 한계 인정.** backend auth가 없는 동안 actor는 자기선언이다. 불변식과 error
  boundary를 지금 만들어 두고, 인증이 도입되면 같은 불변식을 실제 인증 주체와 연결해
  강화한다(승인 경로와 test를 다시 깨지 않기 위함).
- **`--confirm`과의 관계 불변.** `--confirm`은 여전히 CLI 쓰기 확정일 뿐이다(ADR-0004).
  user actor 선언이 `--confirm`을 대체하지 않고, 둘 다 필요하다.
