# MyCron 제품 정의: 생성 + 검증 루프

> 이 문서는 MyCron 자체의 제품 스토리다. 별도 사업 기술서(추상 인프라 essay)와
> 별개로 둔다 — 그쪽은 "AI-native 서비스 기업용 조합 레이어"라는 일반론이고, 이 문서는
> "MyCron이 무엇을 하는 제품인가"의 구체 정의다. 둘을 한 파일에 섞지 않는다.
>
> 도메인 용어는 `CONTEXT.md`, 확정 결정은 `docs/adr/0001~0003`, MVP 범위는
> `docs/design-genui-mvp.md`. 이 문서는 그 위에 "왜 이 모양인가"를 얹는다.

## 한 줄

Host agent가 시간 기반 의도를 **GenUI Spec으로 생성**하고, 그 Spec이 제대로 된
**Surface로 렌더되는지 스스로 검증**한 뒤 사용자에게 내보내는 런타임. 생성은 agent가,
검증 표면과 렌더는 MyCron이 소유한다.

## 가려져 있던 문제 — GUI는 에이전트에게 불투명하다

기존 thesis(ADR-0001)는 생성 주체를 host agent로 옮겼다. MyCron은 서빙 런타임이다.
그런데 이 구조에는 드러나지 않은 틈이 있다:

**host agent는 GenUI Spec을 생성하지만, 그 Spec이 어떤 Surface로 렌더되는지 못 본다.**

agent는 `mycron create --json`으로 raw JSON을 던지고(ADR-0003), MyCron은 ingestion에서
Widget Catalog로 검증한다(ADR-0002). 하지만 그 검증이 보장하는 건 *"catalog-legal한가"*
뿐이다. *"실제로 제대로 렌더되는가"* — Countdown이 진짜 15분을 카운트하는가, 카드가
비어 있지 않은가, 위젯이 데이터를 실제로 표시하는가 — 는 아무도 확인하지 않는다.

agent 입장에서 이건 눈 감고 던지기다. Spec이 스키마를 통과했다는 것만 알 뿐, 사람이
볼 화면이 멀쩡한지는 모른다. 렌더 결과는 agent에게 "그냥 텍스처"다.

```
현재 (검증 틈):
  agent: Spec 생성 ──▶ create --json ──▶ ingestion 검증(catalog-legal?) ──▶ 영속화
                                                                              │
                                                          (agent는 여기서 끊긴다)
                                                                              ▼
                                                                  사용자가 Surface를 본다
                                                                  ← 처음으로 "제대로 떴나"가 드러남
```

## 제품 정의 — 두 절반

MyCron 제품은 두 절반으로 정의된다. 첫째는 기존 thesis, 둘째가 이 문서가 더하는 것이다.

**절반 1 — 생성 (governed).** host agent가 `mycron schema <pack>`로 Widget Catalog를
조회하고, 그 안의 위젯만으로 선언적 GenUI Spec을 만든다. 같은 파이프라인이 의도마다
시각적으로 완전히 다른 Surface를 만든다(alarm.basic의 카운트다운 vs daily-brief의
브리핑). LLM·비용은 agent가 부담한다.

**절반 2 — 검증 (do/wait/verify).** agent가 Spec을 던지고 끝내는 게 아니라, 그 Spec이
어떤 Surface로 렌더되는지 *되돌려 받아* 평가하고, 틀렸으면 다시 생성하는 닫힌 루프를
가진다. 사람이 깨진 Surface를 보기 *전에* agent가 자기 출력을 검증한다.

```
제품 정의 (검증 루프 포함):
  agent: Spec 생성 ──▶ render ──▶ wait(렌더 완료) ──▶ verify(구조·시각 상태 회수)
            ▲                                                  │
            └──────────── 틀리면 재생성 ◀──────────── 평가 ────┘
                                                               │ 통과
                                                               ▼
                                                    영속화 ──▶ 사용자가 멀쩡한 Surface를 본다
```

검증 프리미티브의 구현 설계는 `docs/design-agent-verify-loop.md`.

## 왜 중요한가 — variance가 신뢰를 죽인다

GenUI의 약점은 생성이 매번 같지 않다는 것이다. 같은 의도가 어떤 날은 멀쩡한 화면이,
어떤 날은 빈 카드가 된다. 이 편차(variance)가 신뢰를 죽인다 — 사용자는 한 번 깨진
화면을 보면 "AI가 만든 화면"을 다시 안 믿는다.

검증 루프가 이 편차를 흡수한다. **schema-valid는 renders-right와 다르다.** ingestion
검증(catalog-legal)이 첫 관문이라면, 검증 루프(renders-right)는 둘째 관문이다. 이 둘이
합쳐져야 "포장 아닌 진짜 governed"(design-genui-mvp.md의 P3)가 schema 수준을 넘어
*렌더 수준*까지 닫힌다.

## Spec-diff Theater는 새 scope가 아니다

design-genui-mvp.md의 Spec-diff Theater(의도 → spec JSON → Surface 3분할)는 이미 이
검증 루프를 **사람에게 보이게 만든 것**이다. Theater는 "검증을 시각화한 표면"이고, 그
밑에서 도는 엔진이 do/wait/verify다. 즉 검증 루프는 Theater에 덧붙는 별도 기능이 아니라
*Theater가 정직하려면 어차피 필요한 엔진*이다. 이 문서는 그 엔진에 이름을 준다.

## 방어가능성 — 한 줄

검증된 Surface가 쌓일수록 어떤 Spec 패턴이 실제로 잘 렌더되는지의 데이터가 MyCron
레이어에 누적된다. 이 누적이 cross-harness 레지스트리 해자의 씨앗이다(별도 사업 기술서의
해자 결정과 연결). 단, 이건 장기 thesis이고 MVP 성공 기준은 아니다 — 여기서는 한 줄로만
기록하고 더 끌어오지 않는다.

## 경계 — 무엇이 MyCron이고 무엇이 아닌가

- **MyCron이다:** Widget Catalog 소유, ingestion 검증, Surface 렌더, 검증 프리미티브
  (render/wait/verify 표면), Feedback Event 저장, Theater 시각화.
- **MyCron이 아니다:** GenUI Spec 생성, LLM 호출, 그 비용 — 전부 host agent 몫(ADR-0001).
  검증 루프도 *판단*(틀렸는지)은 agent가 하고, MyCron은 *판단할 재료*(렌더 상태)를 줄 뿐.
