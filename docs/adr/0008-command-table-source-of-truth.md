# Command table이 CLI contract의 단일 Source of Truth

> Status: accepted — extends ADR-0004/0005.

parser width 특례, 전역 flag 집합, schema registry, help가 각각 별도 구현이라 command가
늘수록 drift한다(실제로 commandSchemas에는 전체 command 중 2개만 등록된 상태였다).
하나의 command table에서 코드 아티팩트를 전부 파생하고, flag contract를 per-command로
강제하기로 했다.

## Consequences (잠근 결정)

- **table에서 파생.** parser positional width, command별 allowed/required flag,
  schema registry의 command 항목(전체 command), help text.
- **Per-command flag 강제.** 해당 command에 허용되지 않은 flag 조합은 `USAGE_ERROR`로
  거부한다. CLI는 agent-callable contract이므로 잘못된 호출은 조용히 통과시키지 않고
  가능한 한 초기에 닫는다. 지금 강제하지 않으면 잘못된 조합 허용이 누적되어 나중에
  더 큰 breaking change가 된다.
- **Consistency contract test.** table ↔ parser ↔ schema registry ↔ help 불일치를
  테스트로 잠근다.
- **docs는 생성하지 않는다.** `mycron-cli-grammar.md`는 ADR/제품 설명을 포함한 서술형
  문서로 유지한다. 생성 파이프라인의 비용·거버넌스 복잡도가 이득보다 크다.
