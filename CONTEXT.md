# MyCron

에이전트가 사용자를 대신해 시간을 두고 실행하는 행동을, 사용자가 자기 계정에서
보고·승인·취소·감사하는 control plane. 어떤 행동을 할지의 지능과 실행은 host agent가
부담하고, MyCron은 등록·지속·통제(승인 게이트)·감사·표시를 담당한다.

## Language

**Host Agent**:
사용자 환경에서 도는 외부 AI 에이전트(예: Hermes)로, scheduled action을 결정·등록하고
실행과 그 LLM 비용을 부담하는 주체. MyCron은 여러 host agent를 cross-agent로 받는다.
_Avoid_: bot, assistant, LLM

**Scheduled Action**:
host agent가 등록한 "특정 시점/주기/조건에 무엇을 하라"는 실행 가능한 행동 단위.
MyCron의 입력.
_Avoid_: command, task, job(다른 뜻으로 예약됨), intent(단순 의도 함의)

**Action Type**:
행동의 종류. 크게 둘로 가른다 — **internal**(notify, brief 등 되돌릴 수 있는 행동)과
**external**(payment, email_send, account_op 등 되돌리기 어려운 외부 행동). 이 구분이
Approval Gate 적용 여부를 정한다.
_Avoid_: category, kind

**Cronlet**:
사용자 계정에 등록되어 실행·표시·통제되는 scheduled action의 인스턴스.
_Avoid_: automation, recipe, applet

**Account**:
MyCron 서버에서 cronlet 소유 경계를 정하는 인증된 사용자 신원. CLI 전송과 통제는 이
계정으로 스코프된다. 사용자가 *소유*하는 경계라는 점이 핵심(cross-agent 중립의 전제).
_Avoid_: user, profile, tenant

**MyCron CLI**:
host agent가 자기 Account의 cronlet 스토어를 CRUD하고 승인 큐를 조작하는 agent-first
클라이언트(gws CLI 패턴: raw-JSON 입력, 런타임 스키마 introspection, 입력 하드닝).
사용자 제품이 아니라 agent 진입구이며 통제 진입구다.
_Avoid_: tool, terminal app

**Approval Gate**:
external Action Type이 실행되기 전에 넘어야 하는 사용자 승인 관문. Policy가 승인 필요로
판정한 행동은 실행되지 않고 Approval Queue에 들어간다.
_Avoid_: confirmation, review(다른 뜻으로 예약됨)

**Approval Queue**:
Approval Gate에 걸려 사용자 승인/거부를 기다리는 행동들의 대기열.
_Avoid_: inbox, pending list

**Policy**:
어떤 Action Type이 auto-execute 가능하고 어떤 게 Approval Gate를 거쳐야 하는지를 정하는
규칙. 초기 규칙 기반(결정론) → 사용자 승인/거부 신호로 학습형(결정층). 엔터프라이즈
수익 기능의 핵심.
_Avoid_: rule(너무 일반), config

**Audit Log**:
실행된(또는 거부된) 행동의 불변 기록 — 무엇이/언제/어느 host agent가/결과가 무엇인지.
누적되어 해자 자산이 된다.
_Avoid_: history(약함), event log

**Control Surface**:
사용자가 cronlet을 보고, Approval Queue를 승인/거부하고, 취소·정지하고, Audit Log를
감사하는 화면.
_Avoid_: dashboard(너무 일반), screen, page

**Feedback Event**:
사용자가 Control Surface에서 한 조작(approve, reject, cancel, pause 등)으로, runtime
상태와 Policy 학습으로 되먹여지는 단위.
_Avoid_: action(Action Type과 혼동), interaction

## Relationships

- 한 **Host Agent**가 여러 **Scheduled Action**을 등록한다 (여러 agent가 한 Account에)
- **MyCron CLI**가 **Scheduled Action**을 **Account**로 스코프된 서버에 등록한다
- 등록된 **Scheduled Action**은 하나의 **Cronlet**으로 저장된다
- 한 **Cronlet**은 하나의 **Action Type**(internal/external)을 가진다
- **Policy**가 external **Action Type**에 **Approval Gate**를 적용한다 → **Approval Queue**
- 사용자가 **Control Surface**에서 **Approval Queue**를 승인/거부한다
- 승인된 행동은 실행되고, 실행·거부는 **Audit Log**에 불변 기록된다
- **Control Surface**에서의 조작이 **Feedback Event**로 runtime·**Policy** 학습에 되먹인다

## Example dialogue

> **Dev:** "에이전트가 '내일 9시에 거래처에 인보이스 메일 발송'을 등록하면, 그게 바로
> 나가나?"
> **Domain expert:** "아니. email_send는 external Action Type이라 **Approval Gate**에
> 걸려 **Approval Queue**로 가. 사용자가 **Control Surface**에서 승인해야 실행되고, 그
> 전엔 안 나가. 실행되면 **Audit Log**에 기록돼. 무엇을 보낼지 결정한 지능은 agent
> 거지만, 허가와 기록은 MyCron이야."

## Flagged ambiguities

- "에이전트가 실행한다"가 MyCron이 실행하는지 agent가 실행하는지 모호했음 — 해결:
  **지능·실행은 host agent**, MyCron은 **등록·승인 게이트·감사**만(ADR-0001). MyCron은
  외부 행동을 직접 실행하지 않고 승인 후 그린라이트를 준다.
- "통제"가 두 뜻으로 혼동됐음 — 해결: (1) *실행 전 승인*(Approval Gate)과 (2) *사후 감사*
  (Audit Log)는 다른 단계다. 통제 = 둘의 합.
- cross-agent 중립이 "아무 agent나 막 쓴다"로 오해됐음 — 해결: agent는 신뢰되지 않는
  입력원으로 취급하고 ingestion에서 하드닝한다(ADR-0002). 중립 = 특정 랩에 종속 안 함이지
  검증 없이 받는다는 뜻이 아니다.
