# GenUI는 Widget Catalog로 제약된 선언적 Spec이다 (자유 컴포넌트 저작 금지)

host agent는 MyCron이 소유·구현한 Widget Catalog의 위젯을 참조하는 선언적 JSON
(GenUI Spec)만 생성한다 — "어떤 위젯을 어떤 props로"의 명세이지 컴포넌트 코드·로직이
아니다. MyCron은 ingestion 시 Spec을 Catalog로 검증하고, Catalog 밖 위젯·잘못된 입력은
거부한다. PRD 4.3("AI arbitrary UI generation ❌, catalog-governed ✅")을 강제한다.

## Considered Options

- **자유 컴포넌트 저작:** agent가 실제 UI 컴포넌트(마크업/로직)를 만들어 보내고 그대로
  렌더. 최대 유연성이지만 임의 코드 렌더링 = XSS·주입 등 신뢰 경계 붕괴 + PRD 4.3 위반.
- **채택: governed 선언적 Spec.** 선언적 props만, 코드 없음. agent는 신뢰되지 않는
  입력원으로 취급하고 ingestion에서 하드닝(catalog 검증, 제어문자·악성 ID 거부).

## Consequences

- 새 위젯이 필요하면 MyCron Widget Catalog에 추가해야 한다(agent가 임의 생성 불가).
- 안전성·일관성이 확장 자유도보다 우선. 데모의 P3(악성 spec 거부 시연)가 이 결정의 증명.
