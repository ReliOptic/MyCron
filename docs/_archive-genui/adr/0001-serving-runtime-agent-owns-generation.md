# MyCron은 Account 스토어 위의 서빙 런타임이고, GenUI 생성·LLM은 host agent가 소유한다

MyCron 백엔드는 GenUI Spec을 생성하지 않는다. host agent(Hermes 등)가 자기 LLM으로
spec을 생성해 MyCron CLI로 Account-스코프 서버에 전송하고(push-time 생성), MyCron은
그 cronlet 스토어를 저장·서빙·렌더하고 feedback을 받는 역할만 한다. LLM 비용·소스는
agent가 부담한다.

## Considered Options

- **서버가 LLM 호출(온디맨드):** 웹에서 "GenUI로 보기" 클릭 시 MyCron 서버가 LLM 호출.
  진짜 온디맨드지만 LLM 비용을 MyCron이 부담하고, "LLM은 agent 소유" 원칙과 충돌.
- **agent 콜백 큐:** 웹이 렌더 요청을 큐에 넣고 agent가 polling/webhook으로 처리.
  agent가 꺼져 있으면 동작 불가(생존 의존성).
- **채택: push-time 생성.** agent가 전송 시점에 spec을 함께 생성. 웹의 "선택"은 이미
  생성된 surface를 고르는 것. agent 생존 의존성 없음, LLM 비용 0.

## Consequences

- 웹에서의 실시간 "클릭-투-생성"은 MVP 비범위(push-time pre-generation으로 대체).
- 데이터 모델에 Pack `status`(draft/requested/pending/published)와 demand 카운터 자리를
  지금 남겨둔다 — 장기 thesis(수요 게이트 마켓플레이스)의 forward-compat.
