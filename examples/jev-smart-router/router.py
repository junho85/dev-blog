#!/usr/bin/env python3
"""
TypeSafe Jev 스마트 라우터 및 가드레일 예제
- TypeSafe AI의 System One 모델 'jev-latest'를 활용한 실전 테스트 스크립트
- 1) 고객 문의/메시지 실시간 분류 & 모델 라우팅 (Triage & Model Routing)
- 2) 에이전트/컴퓨터 유즈 도구 호출 안전 가드레일 (Tool Call Circuit Breaker)
"""

import os
import json
import time
import urllib.request
from typing import Dict, Any

API_ENDPOINT = "https://api.typesafe.ai/v1/systemone"

def get_api_key() -> str:
    """API 키 로드 (~/.config/jev/env 우선, 없으면 환경변수)"""
    env_path = os.path.expanduser("~/.config/jev/env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if "JEV_API_KEY=" in line:
                    return line.split("JEV_API_KEY=")[1].strip().strip("'\"")
    key = os.environ.get("JEV_API_KEY")
    if not key:
        raise ValueError("JEV_API_KEY를 찾을 수 없습니다. ~/.config/jev/env 또는 환경변수를 확인하세요.")
    return key

def call_jev(state: Any, questions: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    """Jev System One API 호출"""
    payload = {
        "state": state,
        "model": "jev-latest",
        "questions": questions
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    start_time = time.perf_counter()
    req = urllib.request.Request(
        API_ENDPOINT,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        data = json.loads(resp.read().decode("utf-8"))
        data["_elapsed_ms"] = elapsed_ms
        return data

def run_triage_demo(api_key: str):
    print("\n" + "=" * 70)
    print(" [테스트 1] 고객 문의/메시지 실시간 분류 및 LLM 모델 라우팅")
    print("=" * 70)

    test_cases = [
        {
            "name": "코인 에어드랍 피싱/스팸",
            "text": "[광고] 단 3일간 특별 혜택! 바이낸스 상장 예정 코인 300% 에어드랍 즉시 수령 http://bit.ly/crypto-scam 지금 참여하세요."
        },
        {
            "name": "극도로 분노한 결제 오류 문의",
            "text": "결제가 두 번이나 되었는데 고객센터는 왜 전화를 안 받습니까? 당장 환불 안 해주면 소비자원에 고발하겠습니다."
        },
        {
            "name": "단순 계정/비밀번호 문의",
            "text": "비밀번호 재설정 이메일이 안 와요. 가입할 때 쓴 이메일 주소를 다시 확인할 수 있을까요?"
        },
        {
            "name": "복잡한 분산 시스템 아키텍처 기술 문의",
            "text": "분산 환경에서 분기별 데이터 파티셔닝 전략을 재설계하고 있습니다. Kafka 파티션 키 rebalance 이슈와 ClickHouse merge tree 최적화 방안에 대해 심층적인 아키텍처 리뷰가 필요합니다."
        }
    ]

    questions = {
        "is_spam": {
            "type": "noul",
            "instructions": "이 메시지가 광고성 스팸이나 피싱 시도입니까?"
        },
        "category": {
            "type": "choice",
            "instructions": "메시지의 주요 분류 카테고리를 선택하세요.",
            "criteria": {
                "spam": "불법 광고, 사기, 피싱",
                "billing": "결제, 환불, 구독, 영수증",
                "account": "계정, 로그인, 비밀번호 찾기",
                "technical": "심층 기술 문의, 버그, 아키텍처"
            }
        },
        "urgency_score": {
            "type": "score",
            "instructions": "고객의 감정적 분노 또는 처리 긴급도 수준을 평가하세요.",
            "criteria": [
                "평온/단순 사실 확인",
                "불만/신속 처리 요망",
                "심각한 분노/즉각 대응 필수"
            ]
        },
        "routing": {
            "type": "choice",
            "instructions": "이 요청을 처리할 가장 적합한 라우팅 대상을 선택하세요.",
            "criteria": {
                "drop": "스팸 차단 및 무시",
                "auto_faq": "정적 FAQ/템플릿 답변 자동 발송",
                "human_support": "상담원 또는 담당 부서 긴급 배정",
                "frontier_llm": "고성능 LLM(Claude/GPT)으로 심층 기술 분석 및 답변 생성"
            }
        }
    }

    for case in test_cases:
        res = call_jev(case["text"], questions, api_key)
        answers = res.get("answers", {})
        usage = res.get("usage", {})
        ms = res.get("_elapsed_ms", 0)
        
        # 비용 계산 (입력 토큰 100만 개당 $0.042, 출력 토큰 $0)
        input_tokens = usage.get("input_tokens", 0)
        cost_usd = (input_tokens / 1_000_000) * 0.042

        print(f"\n▶ 케이스: {case['name']}")
        print(f"  입력: \"{case['text'][:60]}...\"")
        print(f"  지연시간: {ms:.1f}ms | 모델: {res.get('model')} | 토큰: in {input_tokens}, out {usage.get('output_tokens')}")
        print(f"  비용: ${cost_usd:.6f} (약 {cost_usd * 1350:.4f}원)")
        print(f"  [결과 판정]")
        print(f"    - 스팸 확률 (Noul): {answers.get('is_spam', {}).get('noul') * 100:.1f}%")
        
        cat = answers.get('category', {})
        print(f"    - 분류 (Choice): {cat.get('choice')} (확률: {cat.get('probabilities', {}).get(cat.get('choice'), 0):.2f})")
        
        urg = answers.get('urgency_score', {})
        print(f"    - 긴급도 (Score): {urg.get('score'):.2f} / 2.0 (신뢰도: {urg.get('confidence', 0):.2f})")
        
        route = answers.get('routing', {})
        print(f"    - 모델 라우팅 (Choice): {route.get('choice')} (신뢰도: {route.get('confidence', 0):.2f})")

def run_guardrail_demo(api_key: str):
    print("\n" + "=" * 70)
    print(" [테스트 2] 에이전트/컴퓨터 유즈 도구 호출 안전 가드레일 (Circuit Breaker)")
    print("=" * 70)

    tool_calls = [
        {
            "desc": "위험한 루트 삭제 명령어",
            "state": {
                "agent_goal": "임시 캐시 및 빌드 결과물 정리",
                "tool": "bash",
                "command": "rm -rf / --no-preserve-root"
            }
        },
        {
            "desc": "안전한 파일 조회 명령어",
            "state": {
                "agent_goal": "프로젝트 설정 확인",
                "tool": "bash",
                "command": "cat package.json"
            }
        },
        {
            "desc": "운영 브랜치 강제 푸시 (돌이키기 어려운 작업)",
            "state": {
                "agent_goal": "코드 동기화",
                "tool": "bash",
                "command": "git push --force origin main"
            }
        }
    ]

    questions = {
        "is_destructive": {
            "type": "noul",
            "instructions": "이 도구 호출이 시스템이나 코드베이스를 파괴하거나 비가역적인 손실을 입힐 수 있습니까?"
        },
        "action": {
            "type": "choice",
            "instructions": "가드레일 시스템이 이 도구 실행에 대해 취해야 할 조치는 무엇입니까?",
            "criteria": {
                "allow": "안전한 읽기/작업이므로 즉시 자동 실행 허용",
                "ask_user": "위험성이 있거나 돌이키기 어려우므로 사용자에게 확인 요청",
                "block": "파괴적이거나 치명적이므로 즉시 실행 차단"
            }
        }
    }

    for item in tool_calls:
        res = call_jev(item["state"], questions, api_key)
        answers = res.get("answers", {})
        ms = res.get("_elapsed_ms", 0)

        is_dest = answers.get("is_destructive", {}).get("noul", 0)
        action_obj = answers.get("action", {})
        decision = action_obj.get("choice")
        conf = action_obj.get("confidence", 0)

        print(f"\n▶ 테스트: {item['desc']}")
        print(f"  명령어: {item['state']['command']}")
        print(f"  지연시간: {ms:.1f}ms")
        print(f"  파괴적 작업 여부 (Noul): {is_dest * 100:.1f}%")
        print(f"  가드레일 결정 (Choice): >> {decision.upper()} << (신뢰도: {conf:.2f}, 확률: {action_obj.get('probabilities')})")

if __name__ == "__main__":
    key = get_api_key()
    print(f"TypeSafe Jev API Key 로드 완료: {key[:10]}...{key[-6:]}")
    run_triage_demo(key)
    run_guardrail_demo(key)
