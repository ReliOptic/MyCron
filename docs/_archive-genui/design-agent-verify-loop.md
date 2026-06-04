# 설계 노트: Agent 검증 루프 (do/wait/verify)

> 출처 레슨 2편 (Justin Poehnelt, 2025-12 / 2026-05):
> - "Your App Should Ship an MCP Server" — 앱이 에이전트에게 do/wait/verify를 노출하면
>   개발 루프가 human-gated에서 agent-driven으로 바뀐다. ~200줄 in-app 서버 + lifecycle
>   wrapper(`rebuild`). 부수효과: behavioral 테스트, 자가 검증.
> - "Google Workspace Dev Tools MCP" — 남의 에이전트가 *내 표면으로 올바른 것을
>   생성*하게 하려면 권위 있는 최신 context를 MCP로 공급하라.
>
> 이 노트는 그 레슨을 MyCron 구조(ADR-0001~0003, CONTEXT.md)에 매핑하고 구현 계획으로
> 정착시킨다. 제품 정의 맥락은 `docs/genui-product-story.md`.

## 핵심 명제

이제 MyCron 표면의 청중은 사람 개발자가 아니라 **host agent**다. 에이전트가 필요한 건
멋진 문서·추상화가 아니라 셋뿐:

1. **do** — 무언가를 하기 (GenUI Spec을 보내 Surface를 렌더)
2. **wait** — 끝나기를 기다리기 (렌더·fixture 로드 완료까지 블록)
3. **verify** — 결과를 확인하기 (렌더된 Surface의 구조·시각 상태 회수)

MyCron은 이미 절반을 한다(do = `create --json`, ADR-0003). wait·verify가 비어 있다.

## Justin 프리미티브 → MyCron 매핑

| Justin (prose editor) | MyCron 대응 | 상태 |
|---|---|---|
| `set_text` / `type_text` | `create --json` (Spec 전송) | 있음 (ADR-0003) |
| `screenshot` | Surface 렌더 PNG 캡처 | 신규 |
| `get_state` (cursor/selection/text) | `get_surface_state` (렌더된 위젯·props·empty 여부) | 신규 |
| `wait_idle` (분석 완료까지 블록) | `wait_idle` (렌더 + fixture 로드 완료까지 블록) | 신규 |
| `get_diagnostics` (구조화 분석 결과) | ingestion 검증 결과 회수 (catalog 위반 목록) | 부분 (ADR-0002) |
| `rebuild` (stop→build→relaunch) | dev wrapper: 렌더러/catalog 수정 → 재렌더 | 신규 (dev 도구) |

## 프리미티브 설계

검증 루프의 최소 표면. 전부 MyCron 소유, agent가 호출한다.

**`render(spec)` → render_id.** Spec을 ingestion 검증한 뒤 *비영속* 렌더 세션으로 띄운다
(아직 cronlet으로 커밋하지 않는다). agent가 검증 후에만 `create`로 커밋하게 한다.

**`wait_idle(render_id)`.** Surface 렌더와 fixture 데이터 로드가 모두 끝날 때까지 블록.
daily-brief처럼 fixture를 끌어오는 Pack에서 필수 — 안 그러면 verify가 빈 화면을 본다.

**`get_surface_state(render_id)` → 구조화 JSON.** 렌더 결과를 *구조로* 회수:
어떤 위젯이 떴는지, 각 props 값, empty 여부, 카운트(예: TopicCard 개수), 핵심 값
(예: Countdown target 시각). screenshot보다 싸고 assert하기 좋다.

**`screenshot(render_id)` → PNG.** 시각 회수. 비싸므로(Justin도 명시) 구조로 부족할
때만. Theater의 3분할 우측 패널이 이 출력을 그대로 쓴다.

**거부 → 재생성.** ingestion이 거부하면(catalog 밖·악성, ADR-0002) 위반 목록을 agent에
돌려준다. agent가 고쳐 다시 `render`. 사용자는 이 왕복을 보지 않는다 — design-genui-mvp.md
Open Question #2(거부 시 fallback)의 부담이 줄어든다: fallback은 agent 검증을 다 통과한
*뒤*의 최후 안전망이 된다.

```
검증 루프 (agent가 닫는다):
  render(spec) ─▶ ingestion 검증 ─┬─ 거부 ─▶ 위반 목록 ─▶ agent 재생성 ─┐
                                  │                                      │
                                  └─ 통과 ─▶ wait_idle ─▶ get_surface_state / screenshot
                                                                │
                                              평가 ◀────────────┘
                                                │ OK            │ 이상
                                          create(커밋)    재생성 ─┘
```

## Behavioral 테스트 패턴

Justin의 둘째 레슨: 내부 상태가 아니라 **제품 표면(Surface)** 기준으로 테스트하라.
GenUI 렌더러는 끊임없이 churn하므로 구현 결합 테스트는 깨지기만 한다. Surface 기준
테스트는 렌더러를 리팩터해도 살아남는다.

```
# alarm.basic — Surface 기준 behavioral 테스트
render_id = render(alarm_spec)
wait_idle(render_id)
s = get_surface_state(render_id)

assert s.has_widget("Countdown")
assert s.countdown_target == now + 15m      # 진짜 15분을 가리키는가
assert not s.is_empty()                      # 빈 화면 금지

# daily-brief.basic — 시각적으로 다른가 (whoa의 핵심)
render_id = render(brief_spec)
wait_idle(render_id)
s = get_surface_state(render_id)

assert s.has_widget("BriefHeader")
assert s.count("TopicCard") >= 1             # 카드가 실제로 채워졌나
assert not s.shares_layout_with(alarm_surface)  # 두 Pack이 진짜 대조되나
```

이 테스트들은 design-genui-mvp.md의 P1(두 Pack이 시각적으로 다름)·P3(렌더 수준 안전)를
*주장이 아니라 assert*로 못 박는다.

## rebuild 패턴 — MyCron 빌드 루프 가속 (dev 도구)

Justin의 wrapper는 *제품*이 아니라 *개발 레버리지*다. MyCron 렌더러·Widget Catalog는
빠르게 churn한다. dev wrapper:

1. 코딩 agent가 렌더러/catalog 코드 수정
2. `rebuild` (앱 재빌드)
3. fixture Spec을 `render` → `wait_idle` → `screenshot`
4. agent가 PNG 판독·평가 → 재시도

사람이 빌드→실행→붙여넣기→squint를 도는 대신 agent가 ~10초 루프로 자율 검증한다. 이건
MyCron을 *짓는 속도*에 대한 AI operating leverage다.

## MVP vs post-MVP — 정직한 경계

7일 계획(design-genui-mvp.md)을 조용히 부풀리지 않는다. 무엇이 지금이고 무엇이 나중인가:

- **MVP 안 (값 큼·비용 작음):**
  - `get_surface_state` + behavioral 테스트 — P1/P3를 assert로 고정. Day 5~6에 자연 편입.
  - Theater 3분할(Day 6)은 이미 verify의 *사람용 표면* — 신규 아님.
- **post-MVP (dev 도구 / 확장):**
  - `screenshot` 기반 agent 자가 검증 루프 (full do/wait/verify).
  - `rebuild` wrapper — MyCron 빌드 가속, 데모 산출물 아님.
  - 비영속 `render` 세션 — MVP는 create 후 렌더로 충분, 분리는 나중.

## MCP 타이밍 — "나중"의 정의

레슨 2(MCP Abstraction Tax 포함)는 MCP가 공짜가 아님을 말한다. 각 층(App→API→MCP)은
fidelity를 잃고, skills/CLI는 on-demand라 초기엔 더 싸다. 그래서 **MCP는 나중**이 옳다.
단 "나중"을 막연히 두지 말고 게이트로 정의한다:

- **지금** — 검증 프리미티브는 *내부 표면*(CLI/내부 JSON-RPC)으로 짓는다. 청중은
  자기 host agent(Hermes) 하나. MCP 표준 준수 불필요.
- **나중(게이트)** — *남의 하네스가 MyCron으로 Surface를 생성·검증하게 여는 순간*이
  MCP 도입 트리거다. 이 cross-harness 개방이 곧 레지스트리 해자의 부팅 경로(별도 사업
  기술서의 해자 결정). 막연한 "언젠가"가 아니라 "채택 게이트"가 시점이다.

## 두 청중, 한 표면

Justin의 닫는 말: "내 개발 루프를 빠르게 하려 만들었는데, 같은 서버를 파워유저에게도
쓰게 할 수 있다." MyCron의 검증 프리미티브도 한 벌로 셋을 먹인다:

1. **MyCron 빌드 루프** (지금) — 코딩 agent가 렌더러를 자가 검증.
2. **host agent** (제품) — 자기 Spec이 제대로 렌더되는지 검증.
3. **Theater** (데모) — 같은 verify 출력을 사람에게 보이는 표면.

하나를 잘 지으면 셋이 산다.
