# MyCron CLI는 agent-first로 설계한다 (gws 패턴)

> Status: accepted — 단, **동사 집합과 `--json` 입력 부분은 ADR-0004가 supersede**한다.
> agent-first 원칙(raw-JSON 친화, schema introspection, env-var auth, 입력 하드닝)은 유효하고,
> 구체 문법은 [`0004-cli-command-grammar.md`](0004-cli-command-grammar.md) + [`../mycron-cli-grammar.md`](../mycron-cli-grammar.md)를 따른다.

MyCron CLI의 1차 소비자는 사람이 아니라 host agent다. Justin Poehnelt의 Google Workspace
CLI(`gws`) 패턴을 채택한다: raw-JSON 입력(`--json '{전체 action payload}'`, bespoke 플래그
아님), 런타임 schema introspection(`mycron schema <action-type>`로 행동 계약·필수 인자를
쿼리), 입력 하드닝(제어문자·경로 traversal·악성 인자 거부), env-var auth(`MYCRON_TOKEN`,
브라우저 OAuth 아님). CLI는 Cronlet 스토어에 대한 CRUD 클라이언트이자 통제 진입구다 —
Google Drive에서 파일 쓰고 지우듯 행동을 등록·취소한다.

## Considered Options

- **human-first 플래그(`--after 15m "..."`):** 사람에겐 편하지만 중첩된 action payload
  (조건·인자·정책)를 표현하기 어렵고 agent 생성 시 번역 손실. agent가 1차 소비자인데
  잘못된 최적화.
- **채택: agent-first.** action payload가 본질적으로 중첩 JSON(action type + 인자 + 스케줄
  + 정책 힌트)이라 raw-JSON 경로가 사실상 강제됨. schema introspection이 행동 계약을
  런타임에 노출해, agent가 유효한 행동을 등록하는 루프를 닫는다.

## Consequences

- MVP 필수: `--json` 입력 + ingestion 검증 + `mycron schema`(런타임 introspection).
- 동사 집합: `login / list / get / create / update / delete` + `schema` + **`approve` /
  `reject`**(통제 동사 — 승인 큐 조작). approve/reject는 사람이 Control Surface에서도,
  스크립트로도 호출 가능.
- MVP 비범위(나중): field masks/NDJSON(`--page-all`), MCP 표면(cross-harness 개방 게이트),
  `--dry-run`, `--sanitize`(prompt injection 방어), 다중 SKILL.md.
