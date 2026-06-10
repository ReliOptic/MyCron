# Transition kernel emits domain events; store는 snapshot + ledger (replay 없음)

> Status: accepted — extends ADR-0001/0005. Approval actor 불변식: [ADR-0007](./0007-approval-actor-user-invariant.md).

CLI 구현(#20~#29)에서 상태 전이가 resource별 command handler에 흩어지고 audit가
handler가 직접 push하는 보조 배열이 되어, "deterministic transition + 불변 Audit Log"라는
제품 1원칙이 코드 구조에 드러나지 않았다. 전이 로직을 pure transition kernel로 모으고,
Audit Log를 mutation의 부산물이 아니라 event ledger 자체로 승격하되, full event sourcing은
도입하지 않기로 했다.

## Considered Options

- **순차 refactor(kernel 먼저, ledger 나중):** 단계별 review는 쉬우나 kernel 반환 타입과
  contract test를 두 번 갈아엎는다.
- **Full event sourcing(state = replay projection):** 이론적으로 순수하나 로컬 JSON store
  MVP에 snapshot/migration/replay 기계를 끌고 온다.
- **채택: 통합 설계, snapshot + ledger.** transition은 pure function으로
  `{ nextState, events[] }`를 반환하고, store는 "events append + next state persist"만 한다.

## Consequences (잠근 결정)

- **Kernel purity.** transition kernel은 I/O·시계·난수에 접근하지 않는다. `ts`/`actor`/
  event `id`는 CLI adapter(transition context)가 주입하고, kernel은 주어진 입력으로
  `{ nextState, events[] }`만 반환한다.
- **불변식(단방향).** 모든 mutation은 최소 1개의 domain event를 동반한다 — event 없는
  mutation 금지. 역방향은 강제하지 않는다: state를 바꾸지 않은 gate 거부 시도(ADR-0007)도
  event가 될 수 있다.
- **Ledger에 들어가지 않는 것.** parse 오류·USAGE_ERROR·NOT_FOUND 같은 일반 실패는
  event가 아니다. event가 되는 비-mutation은 "gate를 넘으려다 kernel 불변식에 의해
  거부된 시도"로 한정한다(스팸 방지, Policy 학습 신호 가치 기준).
- **DomainEvent = Audit Log 4요소 완전형.** `{ id, ts, actor: {kind, id|null}, resource,
  action, target_id, outcome, details? }`. 호환 비용 최소화를 위해 기존 `aud_` id prefix와
  `resource`/`action` 필드는 유지한다(dotted past-tense event name 체계로 전환하지 않음).
- **Store 역할 제한.** events append, next state apply/persist, "event 없는 mutation 거부".
  FileStore는 이 Interface의 Adapter다. backend store가 실제로 올 때까지 abstraction은
  최소로 유지한다.
- **위치.** kernel은 `packages/domain`에 둔다(CLI 내부 아님) — domain contract이지 CLI
  helper가 아니다. 단 첫 refactor의 소비자는 CLI뿐이고, Control Surface의 kernel 소비는
  별도 후속 범위다.
- **구현 경로.** 전면 rewrite가 아니라 한 mutation의 tracer bullet부터 시작해 resource별로
  kernel로 이관한다.
