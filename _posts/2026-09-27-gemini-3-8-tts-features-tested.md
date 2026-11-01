---
layout: post
title: "Gemini 3.8 TTS가 내세운 기능을 시험해 봤습니다 - 한국어 목소리, Voice design, 태그, style, 긴 글"
date: 2026-09-27 13:00:00 +0900
tags: ["TTS", "Gemini", "gemini-3.8-flash-tts", "Voice design", "음성 합성", "팟캐스트"]
image:
  path: /assets/images/2026-09-27-gemini-tts-consistency.png
  alt: "Gemini TTS 문서의 Consistency across generations 절. 긴 Audio Profile 문단이 목소리 흔들림의 가장 흔한 원인이며 Voice design으로 만든 voice ID를 쓰라는 내용"
---

> Gemini TTS 3.8 시험기 3편 중 3편입니다. [1편 네 모델 비교](/2026/09/27/gemini-tts-podcast-four-models-compared.html) · [2편 내 목소리 복제](/2026/09/27/gemini-tts-voice-replication.html) · **3편 3.8 기능 시험**
{: .prompt-info }

[1편](/2026/09/27/gemini-tts-podcast-four-models-compared.html)에서 Gemini TTS 네 모델을 비교하면서 3.8의 가격과 API 변경, 품질을 봤습니다. 이번에는 문서가 3.8의 장점으로 내세운 기능을 하나씩 돌려 봤습니다. 판정 모델의 청취가 걸린 시험에는 **태그나 지시를 뺀 같은 문장을 대조군으로** 함께 만들어, 대조군에서도 같은 자리에서 같은 소리가 들렸다고 하면 그 판정은 쓰지 않았습니다.

## 결론부터 {#tldr}

| 기능 | 결과 |
|---|---|
| 한국어 목소리 | **117개 있습니다.** 기본 목소리 Leda·Charon은 미국 영어 목소리였습니다. 한국어 목소리 두 개로 바꾸자 청크 간 게스트 흔들림이 줄고, 다시 만들 때 차이는 커졌습니다. 3.1에서는 쓸 수 없습니다 |
| Voice design | 글로 설명하면 30초 만에 목소리를 만듭니다. **문서와 달리 2인 한 번 호출에 들어갑니다.** 흔들림은 줄지 않았습니다 |
| 영어 고유명사 | 목소리를 바꿔도 다른 단어로 읽었습니다 |
| 인라인 태그 | 웃음과 기침은 들어갔고, 한숨은 모델마다 달랐습니다 |
| style 지시 | 속삭임, 외침, 느리게가 수치로 분명히 드러났습니다 |
| 긴 글 한 번에 | 5분 분량도 뒷부분이 뭉개지지 않았습니다. 3.8이 3.1보다 3배 빨랐습니다 |
| 스트리밍 | 첫 소리가 1.7초에 나옵니다 |
{: .compact}

## 한국어 목소리가 117개 있습니다 {#korean-voices}

목소리 목록(`GET /v1beta/voices`)을 끝까지 넘겨 보니 기본 제공 목소리가 **2,089개**였고, 그중 **한국어(ko-KR)가 117개**였습니다. 팟캐스트 진행자, 내레이터, 상담원 같은 유형과 나이, 음 높이 설명이 붙어 있고, 103개가 서울말, **14개가 부산 사투리**로 분류돼 있습니다.

그런데 제 팟캐스트 스킬이 쓰던 **Leda와 Charon은 미국 영어(en-US) 목소리**였습니다. 한국어 대본을 미국 영어 목소리로 읽혀 온 셈입니다. 한국어 팟캐스트 진행자 목소리 두 개(`ko-kr-podcaster-4` 여성, `ko-kr-podcaster-8` 남성)로 바꿔 같은 시험을 돌렸습니다.

- 2인 대화를 한 번에 만드는 방식에 그대로 들어갑니다.
- 3.8 Flash로 [1편](/2026/09/27/gemini-tts-podcast-four-models-compared.html#consistency)과 똑같은 일관성 시험(같은 대본, 청크 4개, 3회)을 했습니다. 청크 간 게스트 흔들림이 15.6% → **8.4%**로 줄었고, 다시 만들 때의 차이는 1.2% → 6.6%로 커졌습니다. 언어만이 아니라 목소리 자체가 바뀐 비교이고, 두 목소리만 측정했습니다.
- [영어 고유명사](#proper-nouns-voices) 문제는 남았습니다. 3회 중 1회는 PostgreSQL을 알파벳 한 글자씩 읽었습니다.

<link rel="stylesheet" href="/assets/css/gemini-tts-charts.css?v=2">
<script src="/assets/js/gemini-tts-charts.js?v=4" defer></script>
<div class="gviz" data-viz="voices"></div>

<details markdown="1" style="margin-bottom:1.25rem">
<summary>표로 보기: 최악값과 다시 만들 때 차이 포함</summary>

| 3.8 Flash 목소리 | 청크끼리 평균 | 청크끼리 최악 | 다시 만들 때 |
|---|---|---|---|
| **한국어 목소리** | 8.0% / **8.4%** | 10.5% / 17.3% | 1.0% / 6.6% |
| Voice design 목소리 | 12.0% / 16.1% | 14.7% / 17.8% | 2.0% / 6.9% |
| Leda / Charon(1편) | 8.2% / 15.6% | 11.5% / 22.6% | 2.4% / 1.2% |
{: .compact}

_각 칸은 진행자 / 게스트다. 한 편 안에서 청크별 화자 음 높이 중앙값이 벌어진 정도(3회 평균과 최악)와, 세 회차의 편 평균이 서로 벌어진 정도다. 방법은 [1편](/2026/09/27/gemini-tts-podcast-four-models-compared.html#consistency)과 같다_

</details>
- **3.1에서는 쓸 수 없습니다.** "No matching speaker voice found"로 거절됩니다.

<p><b>3.8 Flash + 한국어 목소리</b> (<a href="/2026/09/27/gemini-tts-podcast-four-models-compared.html#listen">1편</a>의 네 모델과 같은 대본, 1회차)</p>
<audio controls preload="none" src="/assets/audio/2026-09-27-podcast-38-ko-voices.mp3" style="width:100%"></audio>

부산 사투리 목소리(`ko-kr-assistant-2`)는 확인하지 못했습니다. 표준어 문장을 읽히면 판정 모델 두 개가 모두 서울말 억양이라고 했고, 사투리 문장("억수로 좋네예")을 읽히면 판정이 갈렸습니다. 서울말 목소리에 같은 사투리 문장을 읽혀도 똑같이 갈려서, 판정 모델이 억양을 가리지 못한다고 봤습니다. 두 음성을 나란히 둡니다.

<p><b>부산 사투리 목소리</b> - 사투리 문장</p>
<audio controls preload="none" src="/assets/audio/2026-09-27-busan-voice-dialect-text.mp3" style="width:100%"></audio>

<p><b>서울말 목소리</b> - 같은 사투리 문장</p>
<audio controls preload="none" src="/assets/audio/2026-09-27-seoul-voice-dialect-text.mp3" style="width:100%"></audio>

## Voice design: 만들기는 쉬웠지만 더 흔들렸습니다 {#voice-design}

Voice design은 목소리를 글로 설명하면 새 목소리를 만들어 주는 기능입니다. 진행자와 게스트를 이렇게 설명해 만들었습니다.

- 진행자: 「30대 중반의 한국 여성 팟캐스트 진행자. 밝고 또렷한 목소리로, 호기심 많고 친근하게 질문을 던진다. 표준 서울말.」
- 게스트: 「40대 초반의 한국 남성 IT 분석가. 차분하고 낮은 목소리로, 설명을 조리 있게 풀어낸다. 표준 서울말.」

하나 만드는 데 30초 안팎이 걸렸고, 만들면서 37초짜리 미리 듣기 음성을 함께 돌려줍니다. 문서상 **프로젝트에 저장하는 방식만** 되고(1년 보관), 복제 목소리와 달리 동의 녹음은 필요 없습니다.

<p><b>설계한 진행자 목소리</b> - 미리 듣기</p>
<audio controls preload="none" src="/assets/audio/2026-09-27-designed-host-sample.mp3" style="width:100%"></audio>

<p><b>설계한 게스트 목소리</b> - 미리 듣기</p>
<audio controls preload="none" src="/assets/audio/2026-09-27-designed-guest-sample.mp3" style="width:100%"></audio>

**문서와 달리 2인 대화를 한 번에 만드는 방식에도 들어갔습니다.** 문서는 설계한 목소리도 대사별로 따로 만들라고 합니다. 들어가긴 하는데 다른 목소리로 바뀌는 건 아닌지 확인하려고, 진행자 대사만 넣어 한 번에 만든 결과를 미리 듣기 음성과 비교했습니다. 유사도가 0.965로, 같은 목소리를 단독으로 합성한 결과(0.960)와 같았고 다른 목소리(0.845)와는 달랐습니다. 복제 목소리는 같은 방식에서 400 오류가 났으니 둘의 처리가 다릅니다.

다만 이 대본에서는 나아진 점이 없었습니다. [위 표](#korean-voices)에서 진행자는 기본 목소리보다 더 흔들렸고 게스트는 비슷했으며, [영어 고유명사](#proper-nouns-voices)는 3회 모두 다른 단어로 읽었습니다. 문서가 흔들림 원인으로 든 긴 연기 지시문은 제 스킬이 원래 쓰지 않으므로, 문서의 주장을 반박하는 결과는 아닙니다.

<p><b>3.8 Flash + Voice design 목소리</b> (<a href="/2026/09/27/gemini-tts-podcast-four-models-compared.html#listen">1편</a>의 네 모델과 같은 대본, 1회차)</p>
<audio controls preload="none" src="/assets/audio/2026-09-27-podcast-38-designed-voices.mp3" style="width:100%"></audio>

## 목소리를 바꿔도 영어 고유명사는 틀렸습니다 {#proper-nouns-voices}

[1편](/2026/09/27/gemini-tts-podcast-four-models-compared.html#proper-nouns)에서 3.8 Flash가 대본의 두 번째 "PostgreSQL은"을 다른 단어로 읽었습니다. 목소리 탓인지 보려고 같은 15줄 대본을 목소리만 바꿔 3회씩 만들었습니다.

| 3.8 Flash 목소리(각 3회) | 두 번째 PostgreSQL을 판정 모델 두 개가 들은 것 |
|---|---|
| Leda / Charon(1편) | **포스트지피티**, **포스트클라우드**, 포스트그레스 |
| 한국어 목소리 | 포스트그레스 에스큐엘, **피오에스지알이**(알파벳을 한 글자씩), 포스트그레스 |
| Voice design 목소리 | **패스터지피티**, **포스트위스퍼**, **포스트지알아이** |
{: .compact}

목소리를 바꿔도 사라지지 않았고, 설계한 목소리는 3회 모두 틀렸습니다. 「위스퍼」는 대본 뒤쪽의 whisper가 섞여 든 것으로 보입니다. 대본에 영어 대신 한글 발음(`포스트그레스큐엘`)으로 적는 것이 여전히 가장 확실합니다.

## 인라인 태그: 웃음과 기침은 들어갔습니다 {#inline-tags}

대본 중간에 `<laugh>`, `<sigh>`, `<cough>`, `<short pause>`, `<breath>`를 넣고, 판정 모델에게 어떤 소리를 넣었는지 알려 주지 않은 채 "말이 아닌 소리가 들리면 위치에 표시하라"고 물었습니다. 판정 모델 두 개가 **같은 자리에서 같은 소리를 들은 경우만** 셌습니다.

| 모델(각 2회) | 웃음 | 한숨 | 기침 | 태그를 글자로 읽음 |
|---|---|---|---|---|
| 3.8 Flash | 2/2 | 0/2 | 2/2 | 없음 |
| 3.8 Flash-Lite | 2/2 | 2/2 | 2/2 | 없음 |
| 3.1 Flash | 1/2 | 1/2 | 2/2 | 없음 |
{: .compact}

_3.8 두 모델은 한국어 목소리(`ko-kr-podcaster-8`), 3.1은 한국어 목소리를 쓸 수 없어 Charon으로 만들었다_

- `<short pause>`와 `<breath>`는 판정할 수 없었습니다. 태그가 없는 대조군에서도 판정 모델이 숨소리를 들었다고 했습니다.
- 3.8 Flash 대조군 하나는 태그가 없는데도 두 판정 모델이 웃음을 들었습니다. 태그를 넣은 자리와는 다른 곳이라 위 표의 판정은 그대로 두었습니다. 모델이 스스로 웃음을 넣었을 수 있습니다.
- 3.1도 꺾쇠 태그를 글자로 읽지 않고 소리로 냈습니다.

> 와, 정말요? `<laugh>` 그건 전혀 몰랐네요. `<sigh>` 사실 저도 어젯밤을 꼬박 새웠거든요. `<cough>` 아, 실례했습니다. `<short pause>` 그럼 다시 시작해 볼까요? `<breath>` 좋습니다.

<p><b>3.8 Flash</b> - 태그 있음</p>
<audio controls preload="none" src="/assets/audio/2026-09-27-tags-38-flash.mp3" style="width:100%"></audio>

<p><b>3.8 Flash</b> - 태그 없음(대조군)</p>
<audio controls preload="none" src="/assets/audio/2026-09-27-tags-38-flash-control.mp3" style="width:100%"></audio>

<p><b>3.8 Flash-Lite</b> - 태그 있음</p>
<audio controls preload="none" src="/assets/audio/2026-09-27-tags-38-lite.mp3" style="width:100%"></audio>

## style 지시: 수치로 분명히 드러났습니다 {#style}

같은 문장("오늘 회의는 여기까지 하겠습니다. 다음 주에는 새로운 기능을 발표할 예정이니 많이 기대해 주세요.")을 `style` 필드만 바꿔 만들었습니다. 속삭이면 성대가 울리지 않으니 유성음 비율이 떨어지고, 느리게 말하면 길이가 늘어야 합니다.

<div class="gviz" data-viz="style"></div>

<details markdown="1" style="margin-bottom:1.25rem">
<summary>표로 보기: 음량과 판정 모델 결과 포함</summary>

| 3.8 Flash(각 2회) | 길이 | 음량 | 유성음 비율 | 음 높이 | 판정 모델 |
|---|---|---|---|---|---|
| 지시 없음 | 5.8~6.1초 | -17dB | 0.67~0.79 | 127~138Hz | 보통 2/2 |
| `whispering softly` | 8.2초 | -31~-36dB | **0.00~0.04** | - | 속삭임 2/2 |
| `shouting with excitement` | 6.9~7.0초 | -16~-17dB | 0.62 | **207~284Hz** | 신나게 외침 2/2 |
| `speaking very slowly and calmly` | **13.7~13.9초** | -17~-20dB | 0.62~0.68 | 114~118Hz | 느리고 차분함 2/2 |
{: .compact}

_외침은 음량이 거의 그대로인 대신 음 높이로 표현됐다_

</details>

Flash-Lite도 같은 방향으로 움직였습니다(속삭임 유성음 비율 0.00~0.06, 느리게 약 2배). 다만 외침과 느리게는 판정 모델이 2회 중 1회만 그렇게 들었습니다.

<p><b>지시 없음</b></p>
<audio controls preload="none" src="/assets/audio/2026-09-27-style-38-none.mp3" style="width:100%"></audio>

<p><b>whispering softly</b></p>
<audio controls preload="none" src="/assets/audio/2026-09-27-style-38-whisper.mp3" style="width:100%"></audio>

<p><b>shouting with excitement</b></p>
<audio controls preload="none" src="/assets/audio/2026-09-27-style-38-shout.mp3" style="width:100%"></audio>

<p><b>speaking very slowly and calmly</b></p>
<audio controls preload="none" src="/assets/audio/2026-09-27-style-38-slow.mp3" style="width:100%"></audio>

## 긴 글을 한 번에: 5분까지는 뭉개지지 않았습니다 {#long-form}

예전 모델은 긴 대본을 한 번에 만들면 뒤로 갈수록 발음이 뭉개져서, 제 팟캐스트 스킬은 대본을 620자씩 나눠 만듭니다. 문서는 3.8을 "긴 글에서도 흔들리지 않는" 모델로 소개합니다. 50줄, 2,309자 대본을 나누지 않고 한 번에 넣었습니다.

전체를 받아써 대본과 글자 단위로 맞추고, 앞·중간·뒤 세 구간의 오류율(CER, 공백과 문장부호 제외)을 구했습니다. 판정 모델 두 개로 받아쓴 결과의 범위입니다.

<div class="gviz" data-viz="longcer"></div>
<div class="gviz" data-viz="longtime"></div>

<details markdown="1" style="margin-bottom:1.25rem">
<summary>표로 보기: 회차별 범위</summary>

| 모델(각 2회) | 음성 길이 | 생성 시간 | 앞 | 중간 | 뒤 |
|---|---|---|---|---|---|
| 3.8 Flash | 5분 2초, 5분 11초 | **34~37초** | 2.5~3.3% | 0.9~3.4% | 0.0~2.4% |
| 3.1 Flash | 4분 37초, 4분 42초 | 106~108초 | 0.9~2.7% | 0.4~2.5% | 0.5~2.7% |
{: .compact}

</details>

**두 모델 모두 뒷부분 오류율이 늘지 않았습니다.** 예전에 겪은 문제는 이번 5분 분량에서는 재현되지 않았습니다. 3.8은 3배 빨랐습니다. 한 편을 네 구간으로 나눈 음 높이 편차는 3.8이 진행자 6%, 게스트 4%와 16%, 3.1이 진행자 9~12%, 게스트 6~8%로, 한 번에 만들어도 흔들림이 없어지지는 않았습니다. 3.1은 새 API(Interactions)에서 화자 지정을 받지 않아 예전 방식(`generateContent`)으로 만들었습니다.

## 스트리밍: 첫 소리는 1.7초 {#streaming}

`stream: true`로 요청하면 첫 음성 조각이 **1.65~1.74초** 만에 도착했습니다(3회). 같은 문장의 전체 완료는 스트리밍 16.5~23.5초, 일반 요청 13.5~14.8초로 스트리밍이 오히려 느렸습니다. 팟캐스트처럼 파일로 받을 때는 일반 요청이 낫고, 음성 비서처럼 바로 말을 시작해야 할 때 쓸 기능입니다.

## 측정하지 않은 것 {#not-tested}

130개 언어 지원, μ-law·A-law 같은 출력 형식, Batch·Flex 요금제는 이 글에서 시험하지 않았습니다.

## 읽을 때 감안할 점 {#caveats}

- **표본이 작습니다.** 인라인 태그와 style은 모델당 2회, 긴 글은 2회, 한국어·설계 목소리 일관성과 고유명사는 3회입니다.
- **판정을 모델에게 맡겼습니다.** 받아쓰기와 청취 판정은 Gemini 음성 인식 모델 두 개로 따로 받아, 둘이 일치한 것만 결론으로 썼습니다.
- **한국어 목소리와 설계 목소리는 한 쌍씩만** 시험했습니다. 다른 목소리에서는 결과가 다를 수 있습니다.

## 참고 자료 {#references}

- [Gemini API - Speech generation (text-to-speech)](https://ai.google.dev/gemini-api/docs/speech-generation)
- [Gemini API - Voice design](https://ai.google.dev/gemini-api/docs/voice-design)
- [1편: Gemini TTS 네 가지로 같은 팟캐스트를 만들어 봤습니다](/2026/09/27/gemini-tts-podcast-four-models-compared.html)
- [2편: Gemini TTS로 내 목소리를 복제해 봤습니다](/2026/09/27/gemini-tts-voice-replication.html)
