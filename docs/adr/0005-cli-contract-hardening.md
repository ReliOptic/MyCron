# MyCron CLI contract hardening (envelope, trust, artifacts)

> Status: accepted — extends ADR-0004. Full contract: [`../mycron-cli-grammar.md`](../mycron-cli-grammar.md).

#20 구현 전 "깨려고 보는" grill에서 CLI를 단순 명령이 아니라 **장기 제품 contract**로 잠갔다.
핵심은 자연어→agent→CLI 파이프라인에서 결과 봉투가 *의도 실현*을 증명해, "지웠는데 계속
돈다" 같은 실패 모드를 구조적으로 제거하는 것이다.

## Considered Options

- **느슨한 봉투(상태 enum만, 메타 없음):** 빠르지만 contract 진화·추적·멀티계정·위조방지를
  나중에 넣으면 모든 downstream parser/test가 깨진다.
- **채택: 버전·추적·의도확인을 day-1 contract로.** 봉투에 `meta`(api_version/cli_version/
  command/request_id/account_id) + `status: ok|error` + `result.outcome` + top-level
  `next_command`. 비용은 작고 retrofit 비용은 크다.

## Consequences (잠근 결정)

- **봉투 구조.** 모든 `--json` 결과는 `meta` + `status(ok|error)` + `result`(구체 outcome은
  `result.outcome`) + top-level `next_command`. `needs_approval`은 에러 아님(exit 0).
- **의도-확인 필드.** mutation 결과는 미래 효과를 명시한다: `confirmed_write` ≠
  `external_execution_approved`, `future_runs_disabled/enabled`, `audit_retained`,
  `content_purged`, `detached_from_future_context`, `affected_cronlets`, `client_ref_changed`,
  `live_cronlets_created`.
- **아티팩트 = kind 판별.** `.mc`(`kind: Cronlet|Pack`) + `.my`(`kind: MemoryItem|
  MemoryMigration`). `.mmy`는 폐기(`LEGACY_EXTENSION`). `cronlet create`는 Cronlet만,
  `memory add`는 MemoryItem만. `pack install`은 미래.
- **증거 위조 방지(trust ladder).** `self_reported → runtime_attested → verified → rejected`.
  `run evidence add`는 self_reported 후보만 기록하고 verified로 못 셈. `run verify`는
  done_policy 결정론적 재계산+persist이며 override/수동마킹/승인이 아니다. evidence는 불변,
  redact는 미래.
- **client_ref 불변.** `<origin-agent>:<slug>`의 agent는 *origin 네임스페이스*(executor 아님).
  `mygration rebind`는 RuntimeBinding만 바꾸고 id/history/account/client_ref를 보존한다.
- **import는 stage만.** `mygration import`는 라이브 cronlet을 만들지 않는다(활성화는 게이트를
  거치는 `cronlet create`). `mygration apply` 없음, 평면 `import/export` 없음.
- **2개 안전층 분리 강화.** `--confirm`=CLI 쓰기, Approval Gate=실행 승인. `approval approve`는
  `--confirm` 필수(`MISSING_CONFIRM`), `reject`는 마찰 없음.
- **메모리 ≠ 증거.** memory(account-scoped, editable+forgettable, 미래 맥락) vs evidence
  (run-scoped, immutable, 과거 증명). memory에는 `forget`(content purge+tombstone) 허용,
  delete 금지.
- **action 스키마가 capability 선언.** `schema action get`은 `requires_capabilities`/
  `action_class`/`risk`를 노출해 agent 계획 루프를 닫는다(grant 시스템은 미래).
- **거버넌스.** human 출력은 contract 아님(스크립트는 `--json`). 새 top-level 리소스/동사는
  ADR 필수, 실험 기능은 숨김 네임스페이스, MVP alias 없음. exit code: `matched`=0,
  `CLIENT_REF_CONFLICT`=3(retry 금지).
