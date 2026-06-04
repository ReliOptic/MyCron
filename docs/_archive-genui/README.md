# 폐기 보관 — GenUI 방향 (2026-06-04 폐기)

이 폴더의 문서들은 MyCron의 **이전 GenUI 방향**(host agent가 Widget Catalog로 제약된
GenUI Spec을 생성하고 MyCron이 렌더하는 governed GenUI 런타임)이다. 2026-06-04에 폐기됐다.

## 폐기 사유

GenUI 생성·전달 공간이 전문팀과 거대 플레이어로 과밀하고(Postman·Vercel JSON-render·
Goose·AG-UI), Anthropic이 first-party UI에 MCP Apps/visualizer로 직접 주도해 1인 창업의
사업 기회가 협소하다고 판단했다.

## 현행 방향

MyCron은 **에이전트 행동의 사용자-소유 control plane**으로 재중심됐다 — 에이전트가
사용자를 대신해 시간을 두고 실행하는 행동(스케줄·결제·발송·계정조작)을 사용자가
자기 계정에서 보고·승인·취소·감사하는 통제면. 현행 도메인·결정은 상위 `docs/`:
`CONTEXT.md`, `docs/adr/0001~0003`, `docs/design-control-plane-mvp.md`.

## 재활용된 자산

폐기됐지만 일부는 control plane으로 전환됐다: Cronlet/Account 데이터 모델(유지),
agent-first CLI(행동 등록 진입구로 유지, ADR-0003), ingestion 검증·하드닝(행동 승인
governance로 진화, ADR-0002), feedback event(승인/취소 액션으로 진화).

## 보관 파일

- `prd.md` — GenUI 유틸리티 런타임 PRD
- `llm-genui.md` — GenUI Spec 생성·검증 계약
- `implementation-plan.md` — GenUI 구현 마일스톤
- `agent-action-cli.md` — GenUI CLI 설계 노트
- `packs/` — `alarm.basic`·`daily-brief.basic` Utility Pack 정의
- `examples/` — cronlet fixture JSON
- `design-genui-mvp.md` — GenUI 7일 MVP 설계(Two-Pack GenUI Loop)
- `genui-product-story.md` — GenUI 생성+검증 루프 제품 정의
- `design-agent-verify-loop.md` — do/wait/verify 프리미티브 설계 노트
- `adr/0001~0003` — GenUI 전제 ADR 원본(현행 `docs/adr/`가 control plane 버전으로 대체)
