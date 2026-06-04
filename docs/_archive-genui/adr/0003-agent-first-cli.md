# MyCron CLI는 agent-first로 설계한다 (gws 패턴)

MyCron CLI의 1차 소비자는 사람이 아니라 host agent다. 따라서 Justin Poehnelt의 Google
Workspace CLI(`gws`) 패턴을 채택한다: raw-JSON 입력(`--json '{전체 페이로드}'`, bespoke
플래그 아님), 런타임 schema introspection(`mycron schema <pack>`로 Widget Catalog를
쿼리), 입력 하드닝(제어문자·경로 traversal·악성 리소스 ID 거부), env-var auth
(`MYCRON_TOKEN`, 브라우저 OAuth 아님). CLI는 cronlet 스토어에 대한 CRUD 클라이언트로,
Google Drive에서 파일 쓰고 지우듯 cronlet을 쓰고 지운다.

## Considered Options

- **human-first 플래그(`--after 15m "..."`):** 사람에겐 편하지만 중첩 GenUI Spec을
  표현 불가하고 LLM 생성 시 번역 손실. agent가 1차 소비자인데 잘못된 최적화.
- **채택: agent-first.** GenUI Spec이 본질적으로 중첩 JSON이라 raw-JSON 경로가 사실상
  강제됨. schema introspection이 governance 계약(Widget Catalog)을 런타임에 쿼리 가능
  하게 해 agent가 유효한 spec을 생성하는 루프를 닫는다.

## Consequences

- MVP 필수: `--json` 입력 + ingestion 검증 + `mycron schema`(런타임 introspection).
- MVP 비범위(나중): field masks/NDJSON(`--page-all`), MCP 표면, `--dry-run`,
  `--sanitize`(prompt injection 방어), 다중 SKILL.md.
- 동사 집합: `login / list / get / create / update / delete` (+ `schema`).
