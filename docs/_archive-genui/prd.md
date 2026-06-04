# MyCron PRD

## Renderer-agnostic Utility Pack Runtime for Scheduled AI Intents

문서 목적: 프로젝트 본격 착수용 제품기획안  
대상 독자: 개발자, 디자이너, 공동창업자, 초기 사용자 인터뷰 참여자  
핵심 방향: **PWA first / Renderer-agnostic / Pack Schema 중심 / Two-Pack GenUI Demo MVP**

---

## 1. 제품 한 줄 정의

> **MyCron은 AI 에이전트가 만든 시간 기반 의도를, 사용자가 실행·수정·공유할 수 있는 Utility Pack으로 바꾸는 런타임이다.**

English:

> **MyCron turns agent-created scheduled intents into shareable Utility Packs, rendered through governed GenUI component catalogs.**

사용자용 문장:

> **말하면 에이전트가 만들고, MyCron이 실행 가능한 화면으로 바꾸고, 사람들은 그것을 쓰고 공유한다.**

---

## 2. 핵심 결론

MyCron은 알람 앱이 아니다.  
MyCron은 cron scheduler도 아니다.  
MyCron은 Zapier/IFTTT 복제품도 아니다.

MyCron의 본질은 아래 루프다.

```text
Agent command
→ Scheduled intent
→ Utility Pack 선택
→ Cronlet 생성
→ GenUI Spec 생성
→ PWA에서 렌더링
→ 사용자 액션
→ Runtime feedback 저장
```

MVP가 증명해야 할 것은 다음이다.

> **에이전트가 만든 시간 기반 명령이 Utility Pack으로 변환되고, 사용자의 UI 액션이 다시 런타임 상태로 돌아온다.**

단, `alarm.basic` 하나만으로는 GenUI의 “다른 intent → 다른 화면”이 보이지 않는다. 또한 hand-written template만으로는 “AI가 surface를 조립한다”는 whoa가 약하다. 따라서 데모 MVP는 최소 두 개의 시각적으로 다른 Pack과 실제 catalog-governed LLM spec generation을 구현한다.

```text
alarm.basic + daily-brief.basic
+ LLM-generated validated GenUI Specs
```

---

## 3. 문제 정의

AI 에이전트는 명령을 만들고 외부 앱 action을 호출할 수 있다. 하지만 비어 있는 지점이 있다.

> **AI agents can create actions, but users lack a persistent, inspectable, interactive surface for time-based intents.**

한국어:

> **AI 에이전트는 명령을 만들 수 있지만, 시간 기반 의도를 지속적으로 실행·수정·확인·공유할 수 있는 사용자 surface가 부족하다.**

예:

```text
15분 뒤 세탁기 확인하라고 알려줘.
```

또는:

```text
Polymarket에서 매일 재미있는 주제들을 정리해줘.
```

기존 방식에서는 이것이 단순 알림, 텍스트 응답, 스크립트, cron job, 자동화 recipe로 흩어진다.

MyCron은 이것을 사용자가 볼 수 있고, 조작할 수 있고, 반복 실행할 수 있고, 공유할 수 있는 **Utility Pack surface**로 만든다.

---

## 4. 제품 철학

### 4.1 CLI는 제품이 아니다

일반 사용자는 CLI를 쓰고 싶어 하지 않는다. 하지만 Hermes, Codex, Claude Code 같은 에이전트는 CLI/MCP/REST API를 호출할 수 있다.

```text
CLI / MCP / REST API = agent entry
PWA = user surface
Runtime = state, schedule, execution, feedback 관리
```

### 4.2 PWA first, Flutter optional

MVP는 PWA/React 기반 minimal renderer가 맞다.

Flutter는 장기 선택지다. MyCron의 핵심은 Flutter가 아니라 **renderer-agnostic GenUI contract**다.

```text
MVP: PWA / React renderer
Later: Flutter / React Native / native shells
```

### 4.3 앱 생성이 아니라 Pack rendering

MyCron은 앱 binary를 생성하지 않는다. MyCron은 Utility Pack을 검증된 GenUI surface로 렌더링한다.

```text
AI arbitrary UI generation ❌
Catalog-governed Utility Pack rendering ✅
```

Renderer security principle:

> **The renderer never executes arbitrary code from a Pack. It only renders validated JSON specs from approved component catalogs and emits approved action events back to the runtime.**

---

## 5. 핵심 개념

### Utility Pack

공유·설치·수정 가능한 설계 단위.

```text
Utility Pack = reusable package template
```

포함 요소:

```text
job schema
allowed widgets
allowed actions
permissions
default schedule pattern
feedback contract
marketplace metadata
```

### Cronlet

사용자 계정에 생성되거나 설치된 실행 인스턴스.

```text
Cronlet = installed runtime instance of a Utility Pack
```

### Job

Cronlet에서 특정 시점에 실행되는 단위.

### Execution

Job이 실제로 한 번 실행된 기록.

### GenUI Spec

현재 Cronlet 상태를 화면으로 렌더링하기 위한 JSON UI 구조.

### Feedback Event

사용자가 PWA surface에서 수행한 조작.

```text
snooze
complete
cancel
save_topic
mute_topic
more_like_this
less_like_this
```

---

## 6. MVP 시나리오

### 6.1 AlarmKit

사용자 발화:

```text
Hermes, 15분 뒤 세탁기 확인하라고 알려줘.
```

CLI:

```bash
mycron create --pack alarm.basic --after 15m "세탁기 확인"
```

PWA surface:

```text
세탁기 확인
14:52 remaining
[5분 미루기] [완료]
```

Feedback:

```text
alarm.snoozed
alarm.completed
alarm.cancelled
```

### 6.2 DailyBriefKit Lite

사용자 발화:

```text
Hermes, Polymarket에서 재미있는 주제들을 매일 정리해줘.
```

CLI:

```bash
mycron create \
  --pack daily-brief.basic \
  --topic "Polymarket 재미있는 주제" \
  --schedule "daily 08:30" \
  --lang ko
```

MVP에서는 실제 Polymarket API를 붙이지 않는다. 간단한 mock/source data로 충분하다. 핵심은 LLM이 Pack catalog 안에서 GenUI Spec을 조립하고, runtime이 이를 검증한 뒤 렌더링하는 것이다.

PWA surface:

```text
Polymarket Daily Brief
오늘의 흥미로운 주제 3개

[TopicCard]
- 제목
- 왜 흥미로운가
- 근거

[Save] [Mute] [More like this] [Less like this]
```

Feedback:

```text
digest.topic_saved
digest.topic_muted
digest.more_like_this
digest.less_like_this
```

---

## 7. MVP 범위

### 반드시 구현

```text
1. Pack Schema v0.1
2. alarm.basic Pack
3. daily-brief.basic Pack with mock/source data
4. CLI/API create command
5. Supabase persistence
6. LLM-based GenUI Spec generation constrained by Pack catalog
7. Zod validation + catalog/action validation + safe fallback
8. PWA renderer
9. Feedback event persistence
10. History/state update
```

### 구현하지 않음

```text
real push notification
robust cron scheduling
real Polymarket integration
marketplace publish/install
Flutter/native app
payments
public sharing
```

### 성공 기준

```text
1. Two different intents create two different Cronlets.
2. Pack Resolver selects different catalogs.
3. The LLM generates two different GenUI Specs from the selected catalogs.
4. Zod/catalog validation rejects widgets or actions outside the Pack contract.
5. PWA renders visually different utility surfaces.
6. User actions write feedback events to Supabase.
7. Runtime state/history changes and is visible.
8. Demo recording makes viewers say: “AI가 저 화면을 만들었네.”
```

---

## 8. Pack Schema v0.1 examples

### alarm.basic

```json
{
  "pack_id": "alarm.basic",
  "name": "Basic Alarm Pack",
  "version": "0.1.0",
  "category": "AlarmKit",
  "job_type": "alarm",
  "allowed_widgets": [
    "AlarmHeader",
    "BigTime",
    "Countdown",
    "SnoozeButton",
    "CompleteButton",
    "CancelButton",
    "ExecutionHistory"
  ],
  "allowed_actions": ["snooze", "complete", "cancel"],
  "required_permissions": [],
  "feedback_events": [
    "alarm.snoozed",
    "alarm.completed",
    "alarm.cancelled"
  ]
}
```

### daily-brief.basic

```json
{
  "pack_id": "daily-brief.basic",
  "name": "Daily Brief Basic Pack",
  "version": "0.1.0",
  "category": "DailyBriefKit",
  "job_type": "scheduled_digest",
  "allowed_widgets": [
    "DigestHeader",
    "TopicCard",
    "EvidenceDrawer",
    "FeedbackButtons",
    "ScheduleControl",
    "ExecutionHistory"
  ],
  "allowed_actions": [
    "save_topic",
    "mute_topic",
    "more_like_this",
    "less_like_this"
  ],
  "blocked_actions": ["trade", "place_bet", "connect_wallet"],
  "required_permissions": [],
  "feedback_events": [
    "digest.topic_saved",
    "digest.topic_muted",
    "digest.more_like_this",
    "digest.less_like_this"
  ]
}
```

---

## 8.5 Real GenUI generation contract

MVP의 whoa는 template rendering이 아니라 실제 LLM 기반 surface 조립에서 나온다.

```text
intent
→ API
→ LLM with Pack catalog context
→ structured JSON GenUI Spec
→ Zod validation
→ catalog/action validation
→ optional regenerate-on-fail
→ safe fallback if still invalid
→ render
→ feedback
→ Supabase runtime state
```

Validation gates:

```text
1. JSON parse
2. GenUI Spec Zod schema
3. element.type ∈ allowed_widgets 또는 base layout catalog
4. emitted action ∈ allowed_actions
5. widget prop schema 통과
6. root/children graph valid
7. invalid 시 1회 regenerate, 실패 시 deterministic fallback spec
```

LLM은 HTML/CSS/JS/React component를 생성하지 않는다. LLM은 catalog 안의 JSON UI tree만 생성한다.

---

## 9. 데이터 모델

```text
utility_packs
cronlets
jobs
executions
ui_specs
feedback_events
```

MVP는 단순 구현을 위해 `jobs`와 `executions`를 합쳐도 된다. 단, 개념 모델은 분리한다.

---

## 10. 기술 스택 권장안

```text
Frontend: React / Next.js PWA
Backend: Node.js / TypeScript
DB: Supabase Postgres
CLI: Node CLI package
Schema validation: Zod first; JSON Schema later if needed
Auth: post-MVP
LLM: structured output API for catalog-governed GenUI Spec generation
Notification: post-MVP
```

---

## 11. 로드맵

### Phase 1 — Real Catalog-Governed GenUI Demo

```text
Pack Schema → Cronlet → LLM-generated validated GenUI Spec → PWA Render → Feedback Event
```

### Phase 2 — Real scheduling + notifications

```text
reliable scheduler
push/telegram delivery
job execution state
```

### Phase 3 — Real connectors

```text
Polymarket / GitHub / Web monitor
DailyBriefKit real data
```

### Phase 4 — Marketplace preview

```text
publish
install
fork
remix
permission review
```

---

## 12. 최종 결론

MyCron은 알람 수신기가 아니다.

MyCron은 AI 에이전트가 만든 시간 기반 의도를 **Utility Pack**으로 저장하고, 그것을 **검증된 GenUI component catalog**를 통해 사용자 surface로 렌더링하며, 사용자의 액션을 다시 **runtime feedback**으로 저장하는 제품이다.

첫 번째 목표는 크지 않다.

> **alarm.basic + daily-brief.basic 두 Pack으로 Pack Schema → Cronlet → LLM-generated validated GenUI Spec → PWA Render → Feedback Event 루프를 닫는다.**
