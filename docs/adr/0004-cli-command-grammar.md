# MyCron CLI 문법은 리소스-스코프로 잠근다 (gws/kubectl 패턴)

> Status: accepted — ADR-0003(agent-first CLI)의 동사 집합·`--json` 입력 부분을 supersede

`mycron` CLI는 `mycron <resource> <verb> [id] [flags]` 리소스-스코프 문법을 정식으로 채택한다.
MyCron은 cronlet·run·approval·memory·mygration·pack·account·schema 등 리소스가 많아 평면
동사(`mycron create`)는 곧 충돌한다("무엇을 create?"). `--json`은 **출력 전용**으로 고정하고,
입력은 `--file`(.mc/.my/JSON/YAML)과 `--input-json`(raw payload)으로 분리한다. ADR-0002의
Approval Gate를 보존하기 위해 통제 동사 `approval approve/reject`를 복원한다. 전체 문법은
[`docs/mycron-cli-grammar.md`](../mycron-cli-grammar.md)에 정식 기술한다.

## Considered Options

- **평면 동사(`mycron create` / `mycron approve`):** 사람에겐 짧지만 리소스가 늘면 동사가
  충돌한다. agent-first에서 agent는 외우지 않고 `schema`로 명령을 찾으므로 "외우기 쉬움"의
  이점도 약하다.
- **`--json` 입력/출력 겸용(ADR-0003 shorthand):** 한 플래그가 입력 페이로드이자 출력 포맷이면
  agent가 명령의 모드를 분간할 수 없다.
- **채택: 리소스-스코프 + `--json` 출력 전용 + `--file`/`--input-json` 입력 분리.** gws/gcloud/
  kubectl이 검증한 형태이며, agent가 명령 형태를 예측·발견·검증하는 루프를 닫는다.

## Consequences

- **삭제 동사 없음.** cronlet은 `pause/resume/cancel/archive`만 가진다. 하드 delete는 immutable
  Audit Log(run·approval·evidence·policy·feedback의 맥락)를 파괴하므로 금지한다. 프라이버시
  소거가 필요하면 account-level compliance 워크플로로 분리한다.
- **두 안전층을 코드 레벨에서 분리.** `--confirm`은 *CLI 쓰기 확정*일 뿐, external action *실행*
  승인이 아니다. 실행 승인은 항상 별도 Approval Gate(`approval approve`)를 거친다. mutation 결과는
  `confirmed_write`와 `external_execution_approved`를 항상 구분 노출한다(ADR-0002의 게이트 보존).
- **`client_ref`가 멱등성·리바인딩 앵커.** 파일/팩 기반 create는 안정적 `client_ref`(`<agent>:<slug>`)를
  필수로 가지며 `(account, client_ref)`로 upsert한다(`created`/`matched`/`conflict`). 재시도 중복
  생성을 막고 mygration rebind 기준점이 된다. `--idempotency-key`는 선택적 보조, content-hash는 경고만.
- **schema 네임스페이스 3분할.** `schema command|action|file`로 CLI 명령 계약·action_type 페이로드
  계약·파일 포맷 계약을 분리한다. ADR-0003의 `mycron schema <action-type>`는 `schema action get <type>`로
  승격한다.
- **구조화 에러 + exit code.** `--json` 시 stdout에 항상 에러 봉투(`error.code` SCREAMING_SNAKE),
  exit code 0/1/2/3/4/5(0=성공·needs_approval 포함). 행동 가능한 에러엔 `next_command` remediation.
- README의 평면-동사 예시는 이 문법으로 정합화한다.
