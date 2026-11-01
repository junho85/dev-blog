---
layout: post
title: "Gemini TTS로 내 목소리를 복제해 봤습니다 - 3.8 Flash, Flash-Lite, 로컬 Qwen3-TTS 비교"
date: 2026-09-27 12:00:00 +0900
tags: ["TTS", "Gemini", "Voice replication", "음성 복제", "Qwen3-TTS", "음성 합성"]
image:
  path: /assets/images/2026-09-27-gemini-tts-replication-intro.png
  alt: "Gemini API Voice replication 문서 첫 부분. Gemini 3.8 Flash TTS와 3.8 Flash-Lite TTS가 음성 복제를 지원한다는 문장과, 원본 음성과 동의 녹음을 검증해 voice ID를 받은 뒤 합성에 쓰는 흐름도"
---

> Gemini TTS 3.8 시험기 3편 중 2편입니다. [1편 네 모델 비교](/2026/09/27/gemini-tts-podcast-four-models-compared.html) · **2편 내 목소리 복제** · [3편 3.8 기능 시험](/2026/09/27/gemini-3-8-tts-features-tested.html)
{: .prompt-info }

[1편](/2026/09/27/gemini-tts-podcast-four-models-compared.html)에서 Gemini TTS 네 모델로 같은 팟캐스트를 만들어 비교했습니다. 이번에는 3.8에 새로 생긴 Voice replication(음성 복제)으로 제 목소리를 복제해 봤습니다. 짧은 녹음을 올려 목소리 ID를 받고, 이후 합성에서 Leda 같은 기본 목소리 대신 그 ID를 넣는 방식입니다.

문서상으로는 3.8 Flash와 3.8 Flash-Lite가 음성 복제를 지원하고 3.1과 2.5 Pro는 지원하지 않습니다. 직접 해 보니 문서와 다른 부분이 있었고, 제가 쓰던 로컬 음성 복제(Qwen3-TTS)와도 비교했습니다.

## 결론부터 {#tldr}

- **원본 음성과 동의 녹음은 같은 마이크, 같은 자리에서 녹음해야 합니다.** 예전에 녹음해 둔 샘플에 동의 녹음만 새로 붙였더니 "다른 사람"이라며 거절됐습니다.
- **복제는 3.8 Flash로만 만들 수 있습니다.** Flash-Lite를 지정하면 거절되지만, 만든 목소리는 Flash-Lite로도 읽힙니다. 문서상 미지원인 3.1도 읽었습니다.
- **복제한 목소리는 실제 녹음끼리만큼 원본과 닮았습니다**(화자 유사도 0.92~0.94). 같은 녹음을 참조한 로컬 Qwen3-TTS도 비슷했습니다.
- **크게 갈린 건 쓸 수 있는 결과의 비율입니다.** Gemini는 10개 모두 대본대로 읽었고, 로컬은 8개 중 4~7개만 쓸 수 있었습니다.
- **2인 대화를 한 번에 만드는 방식에는 넣을 수 없습니다.** 대사마다 따로 만들어 이어 붙여야 합니다.

![Gemini API Voice replication 문서 첫 부분. POST /v1beta/voices로 짧은 음성에서 목소리를 복제하며, Gemini 3.8 Flash TTS와 3.8 Flash-Lite TTS 모두 지원한다는 문장과, 원본 음성과 동의 녹음을 검증해 voice ID를 받은 뒤 합성에 쓰는 흐름도](/assets/images/2026-09-27-gemini-tts-replication-intro.png)
_voice-replication 문서 첫 부분(2026-09-27 캡처). 도식에는 합성 음성에 SynthID 워터마크가 들어간다고 적혀 있다_

## 녹음 두 개가 필요합니다 {#replication-requirements}

- **원본 음성**: 복제할 사람의 자연스러운 말소리 10~30초
- **동의 녹음**: 같은 사람이 정해진 동의 문장을 직접 읽은 녹음

서버가 두 녹음이 같은 사람인지, 동의 문장을 정확히 읽었는지 확인한 뒤에야 목소리를 만들어 줍니다. 문서는 두 녹음을 같은 마이크, 같은 공간에서 하라고 권합니다. Google AI Studio에서 브라우저로 바로 녹음하고 들어 볼 수도 있습니다.

![Voice replication 문서의 Audio and consent requirements 절. 10~30초 원본 음성과, 같은 화자가 동의 문장을 읽은 녹음이 필요하다는 내용](/assets/images/2026-09-27-gemini-tts-replication-consent.png)
_voice-replication 문서의 Audio and consent requirements 절_

동의 문장은 30개 언어를 지원하고, 한국어도 있습니다.

![지원 언어별 동의 문장 표 중 영어와 한국어 행. 한국어 문장은 "나는 이 음성의 소유자이며 구글이 이 음성을 사용하여 음성 합성 모델을 생성할 것을 허용합니다."](/assets/images/2026-09-27-gemini-tts-replication-korean.png)
_Supported consent phrases by language 표에서 영어와 한국어 행만 남기고 나머지를 가렸다_

복제한 목소리는 두 방식으로 보관합니다. 서버에 저장하면 프로젝트당 200개까지 1년간 쓸 수 있고, 저장하지 않으면 암호화된 `voicekey_...`를 받아 직접 보관하며 7일간 쓸 수 있습니다. 가격 페이지에서 복제 자체에 대한 별도 항목은 찾지 못했습니다.

## 예전에 녹음한 샘플로는 거절됐습니다 {#replication-mismatch}

처음에는 로컬 음성 클론(Qwen3-TTS)용으로 예전에 녹음해 둔 23초짜리 샘플을 원본으로 쓰고, 동의 문장만 새로 녹음했습니다. 동의 문장은 판정 모델 두 개가 한 글자도 틀리지 않았다고 확인했는데도 거절됐습니다.

```text
Consent flow failed. ...
Voice mismatch detected. The speaker in the consent audio does not match
the speaker in the voice sample.
```

동의 녹음의 음량이 원본보다 12dB 작아서 맞춰 봤지만 결과는 같았습니다. **원본 음성도 동의 녹음과 같은 마이크, 같은 자리에서 새로 녹음하자 4초 만에 통과했습니다.** 같은 사람인데도 녹음 환경이 다르면 다른 사람으로 판정될 수 있습니다. 아래 화자 유사도에서도 예전 샘플과 새 녹음은 0.842로, 같은 자리에서 녹음한 두 파일(0.912)보다 낮았습니다.

테스트라서 서버에 저장하지 않는 방식(`store: false`)으로 만들었습니다. 이 방식은 7일 뒤 만료됩니다.

## Flash-Lite로는 만들 수 없고, 3.1은 문서와 달리 읽었습니다 {#replication-models}

복제를 만들 때 모델을 지정하는데, 모델마다 결과가 달랐습니다.

| 모델 | 복제 만들기 | 만든 목소리로 읽기 |
|---|---|---|
| 3.8 Flash | 됨 | 됨 |
| 3.8 Flash-Lite | **거절**("Voice Replication을 지원하지 않는다") | 됨 |
| 모델 지정 안 함 | 됨(3.8 Flash로 만들어짐) | - |
| 3.1 Flash | - | **됨**(문서상 미지원) |
{: .compact}

Flash-Lite를 지정하면 서버가 "모델을 빼면 기본 생성 모델로 만들고, 그 목소리는 어떤 TTS 모델에서도 쓸 수 있다"고 안내합니다. 실제로 그렇게 만든 목소리를 Flash-Lite로 읽으면 잘 됐습니다. 문서의 "Flash-Lite도 지원"은 **읽기** 쪽 이야기로 보입니다.

3.1도 복제 키를 받아 읽었습니다. 키를 조금이라도 바꾸면 "복제 키를 해석할 수 없다"며 거절하고, 목소리를 아예 빼도 400이 납니다. 키를 무시하고 기본 목소리로 읽은 것은 아닙니다. 다만 문서에 없는 동작이라 언제든 바뀔 수 있습니다.

## 들어 보세요: 실제 목소리와 복제 목소리 {#replication-listen}

먼저 실제 녹음입니다. 복제에 쓴 원본 음성의 앞 10초만 잘랐습니다. 동의 문장 녹음은 공개하지 않습니다.

<p><b>실제 녹음</b> (원본 음성 앞 10초)</p>
<audio controls preload="none" src="/assets/audio/2026-09-27-clone-real-excerpt.mp3" style="width:100%"></audio>

아래는 모두 같은 문장을 복제한 목소리로 읽힌 것입니다. 모델마다 두 번씩 만들어 1회차를 실었습니다. 비교를 위해 파일마다 음량만 같은 수준으로 맞췄습니다.

> 오늘은 제 목소리를 복제해서 만든 음성을 비교해 보겠습니다. 같은 문장을 구글 제미나이와 로컬 모델로 각각 읽혀 봤는데요, 어느 쪽이 더 저처럼 들리는지 직접 들어 보시죠.

<p><b>3.8 Flash</b></p>
<audio controls preload="none" src="/assets/audio/2026-09-27-clone-38-flash.mp3" style="width:100%"></audio>

<p><b>3.8 Flash-Lite</b></p>
<audio controls preload="none" src="/assets/audio/2026-09-27-clone-38-lite.mp3" style="width:100%"></audio>

<p><b>3.1 Flash</b> (문서상 미지원)</p>
<audio controls preload="none" src="/assets/audio/2026-09-27-clone-31-flash.mp3" style="width:100%"></audio>

로컬 Qwen3-TTS(맥북에서 생성)는 참조 녹음을 세 가지로 바꿔 만들었습니다. 예전에 녹음해 둔 두 샘플(My Voice 28.3초, My Voice 2 23.3초)과, Gemini에 쓴 것과 같은 새 원본입니다.

<p><b>로컬 Qwen3-TTS ← 새 원본</b> (Gemini와 같은 참조)</p>
<audio controls preload="none" src="/assets/audio/2026-09-27-clone-local-qwen-new.mp3" style="width:100%"></audio>

<p><b>로컬 Qwen3-TTS ← My Voice</b> (예전 28초 샘플)</p>
<audio controls preload="none" src="/assets/audio/2026-09-27-clone-local-qwen-v1.mp3" style="width:100%"></audio>

<p><b>로컬 Qwen3-TTS ← My Voice 2</b> (예전 23초 샘플)</p>
<audio controls preload="none" src="/assets/audio/2026-09-27-clone-local-qwen.mp3" style="width:100%"></audio>

화자 임베딩 모델(resemblyzer)로 실제 녹음과의 유사도를 측정했습니다. 1에 가까울수록 같은 사람이고, 다른 사람인 Charon을 대조군으로 넣었습니다. 모델마다 5개씩 만들었습니다.

<link rel="stylesheet" href="/assets/css/gemini-tts-charts.css?v=2">
<script src="/assets/js/gemini-tts-charts.js?v=4" defer></script>
<div class="gviz" data-viz="similarity"></div>

<details markdown="1" style="margin-bottom:1.25rem">
<summary>표로 보기: 참조 녹음 세 가지와 비교한 전체 값</summary>

| 음성 | 새 원본과 | My Voice 2와 | My Voice와 |
|---|---|---|---|
| 실제 녹음: 동의 문장(새 원본과 같은 자리) | 0.912 | 0.838 | 0.850 |
| 실제 녹음: My Voice 2 샘플 | 0.842 | - | 0.844 |
| 실제 녹음: My Voice 샘플 | 0.865 | 0.844 | - |
| **Gemini 3.8 Flash ← 새 원본** ×5 | **0.917~0.936** (평균 0.927) | 0.78~0.82 | 0.82~0.87 |
| **Gemini 3.8 Flash-Lite ← 새 원본** ×5 | **0.892~0.936** (평균 0.920) | 0.79~0.83 | 0.81~0.85 |
| Gemini 3.1 Flash ← 새 원본 ×2 | 0.843, 0.855 | 0.77~0.82 | 0.78~0.79 |
| **로컬 Qwen3-TTS ← 새 원본** ×5 | **0.929~0.956** (평균 0.943) | 0.81~0.83 | 0.79~0.82 |
| 로컬 Qwen3-TTS ← My Voice 2 ×4 | 0.80~0.87 | **0.80~0.91** (평균 0.873) | 0.73~0.80 |
| 로컬 Qwen3-TTS ← My Voice ×7 | 0.83~0.88 | 0.81~0.84 | **0.85~0.92** (평균 0.880) |
| 대조: Charon | 0.60~0.63 | 0.65~0.66 | 0.65 |
{: .compact}

_코사인 유사도다. 굵게 표시한 칸이 자기 참조 녹음과의 비교다. 로컬은 쓸 수 있는 후보만 셌다(아래)_

</details>

- **복제한 목소리는 모두 자기 참조 녹음과 가장 닮았습니다.** 로컬도 Gemini도 참조를 바꾸면 결과가 그쪽으로 따라갑니다.
- **같은 참조(새 원본)로 비교하면 셋 다 0.92~0.94 안팎**입니다. 실제 녹음끼리(0.912)보다 높은 값도 나왔는데, 이 지표는 목소리뿐 아니라 마이크와 방 소리까지 닮은 것을 점수로 주는 것으로 보입니다. 그래서 0.91을 넘는 구간 안에서 순위를 매기지는 않았습니다.
- **3.1은 복제 키를 쓰지만 덜 닮았습니다**(0.84~0.86). 그래도 Charon(0.6 안팎)과는 확연히 다릅니다.

유사도보다 크게 갈린 건 **쓸 수 있는 결과의 비율**이었습니다. 모든 후보의 끝부분을 받아써 확인했습니다.

<div class="gviz" data-viz="usable"></div>

<details markdown="1" style="margin-bottom:1.25rem">
<summary>표로 보기: 불량 내역</summary>

| | 대본대로 끝까지 읽은 비율 | 불량 |
|---|---|---|
| Gemini 3.8 Flash | 5/5 | 없음 |
| Gemini 3.8 Flash-Lite | 5/5 | 없음 |
| 로컬 Qwen3-TTS ← 새 원본 | 5/8 | 버리는 문장이 남음 3(그중 1개는 끝부분도 다르게 읽음) |
| 로컬 Qwen3-TTS ← My Voice | 7/8 | 버리는 문장이 남음 1 |
| 로컬 Qwen3-TTS ← My Voice 2 | 4/8 | 버리는 문장이 남음 2, 끝 음절 잘림 2 |
{: .compact}

_로컬 도구는 끝 음절이 잘리는 문제를 피하려고 뒤에 버리는 문장("감사합니다")을 붙여 만든 뒤 잘라낸다. 그 제거가 실패하거나 끝이 잘린 것을 불량으로 셌다_

</details>

로컬은 여러 개를 만들어 골라내야 하고, Gemini는 한 번에 쓸 수 있는 결과가 나왔습니다. 실린 로컬 샘플은 기본 시드 순서대로 봤을 때 첫 번째로 정상인 후보입니다.

음 높이(F0)도 비교해 봤는데, Charon의 음 높이 중앙값(115.9Hz)이 실제 목소리(112.6Hz)와 비슷해서 같은 사람인지 가르는 데는 쓸 수 없었습니다.

## 팟캐스트에 넣으려면 대사별로 만들어야 합니다 {#replication-limit}

문서의 Limitations 절 둘째 항목에 따르면 **한 요청으로 두 사람 대화를 만드는 기능은 기본 제공 목소리 2명까지만 됩니다.**

![Gemini TTS 문서 Limitations 절. 한 요청의 다화자 생성은 prebuilt 음성 2명까지이고, 설계하거나 복제한 음성을 대화에 넣으려면 대사마다 따로 합성하라는 내용](/assets/images/2026-09-27-gemini-tts-limitations.png)
_speech-generation 문서의 Limitations 절(2026-09-27 캡처)_

 실제로 진행자에 복제 키, 게스트에 Charon을 넣어 한 번에 요청하자 400 오류가 났습니다.

그래서 진행자(내 목소리)와 게스트(Charon)를 대사마다 따로 만들고 0.35초 간격으로 이어 붙였습니다. 6줄을 동시에 요청해 6.4초 만에 34초짜리 대화가 나왔습니다.

<p><b>2인 대화</b> - 진행자 내 목소리(3.8 Flash 복제), 게스트 Charon</p>
<audio controls preload="none" src="/assets/audio/2026-09-27-clone-dialog.mp3" style="width:100%"></audio>

한 번에 만드는 방식과 달리 대사 사이 간격은 0.35초로 고정이고, 대사마다 따로 만들었으니 앞 대사의 말투를 이어받지도 않습니다. 제 팟캐스트 스킬에 넣으려면 gemini 경로에 대사별 합성 모드를 따로 만들어야 합니다.

한 가지 더 볼 것은 **무료 등급의 데이터 사용**입니다. TTS 모델 가격표에서 무료 등급은 "Used to improve our products"가 Yes로 적혀 있습니다. 복제용으로 올리는 녹음에도 같은 규정이 적용되는지는 문서에서 찾지 못했습니다. 적용된다면 내 목소리 녹음은 유료 등급 키로 올리는 편이 좋겠습니다.

## 읽을 때 감안할 점 {#caveats}

- **한 사람, 한 번의 녹음입니다.** 녹음 환경을 바꿔 가며 몇 번까지 거절되는지는 시험하지 않았습니다.
- **닮은 정도는 화자 임베딩 모델(resemblyzer) 하나로 측정했습니다.** 마이크와 방 소리까지 점수에 섞이는 것으로 보여, 0.91 이상에서는 순위를 매기지 않았습니다.
- **복제 키는 테스트용**(`store: false`, 7일)으로 만들었습니다. 서버에 저장하는 방식은 시험하지 않았습니다.

## 참고 자료 {#references}

- [Gemini API - Voice replication](https://ai.google.dev/gemini-api/docs/voice-replication)
- [Gemini API - Speech generation (text-to-speech)](https://ai.google.dev/gemini-api/docs/speech-generation)
- [Gemini API - Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [1편: Gemini TTS 네 가지로 같은 팟캐스트를 만들어 봤습니다](/2026/09/27/gemini-tts-podcast-four-models-compared.html)
- [3편: Gemini 3.8 TTS가 내세운 기능을 시험해 봤습니다](/2026/09/27/gemini-3-8-tts-features-tested.html)
