# TypeSafe Jev 실전 예제: 스마트 문의 라우터 및 도구 호출 안전 가드레일

TypeSafe AI의 첫 번째 System One 모델인 `jev-latest` (Jev 1.13)를 활용한 실전 테스트 스크립트입니다.

## 개요

기존 거대 언어 모델(LLM)은 텍스트를 한 글자씩 순차 생성(autoregressive)하므로, 단순 분류나 이진 판정, 상태 기반 분기 처리를 수행할 때 불필요하게 느리고 비용이 많이 들며, JSON 파싱 오류가 발생할 위험이 있습니다.

Jev는 입력 상태(State)와 질문(Choice, Score, Noul)을 단일 병렬 패스로 평가하여 정확한 확률과 신뢰도를 갖춘 구조화된 결정을 즉시 반환합니다.

## 포함된 테스트 시나리오

1. **고객 문의/메시지 실시간 분류 및 LLM 모델 라우팅 (Triage & Model Router)**
   - 스팸/피싱 탐지 (`Noul`: Yes/No 확률)
   - 업무 분류 (`Choice`: spam / billing / account / technical)
   - 고객 격앙도/긴급도 (`Score`: 0.0 ~ 2.0)
   - 처리 경로 결정 (`Choice`: drop / auto_faq / human_support / frontier_llm)
   - 4개 질문을 단 1회의 HTTP 요청으로 병렬 평가

2. **에이전트/컴퓨터 유즈 도구 호출 안전 가드레일 (Tool Call Circuit Breaker)**
   - 에이전트의 목표와 실행할 도구 명령어를 JSON 상태로 전달
   - 파괴적 행위 여부 판정 (`Noul`)
   - 실행 제어 조치 (`Choice`: allow / ask_user / block)
   - `rm -rf /`는 즉시 차단(BLOCK), `cat`은 자동 허용(ALLOW), `git push --force`는 사용자 확인(ASK_USER) 판정

## 실행 방법

```bash
# API 키 설정 (또는 ~/.config/jev/env 파일에 JEV_API_KEY 저장)
export JEV_API_KEY="your-api-key"

# 실행 (별도 외부 의존성 없이 표준 라이브러리로 동작)
python3 router.py
```
