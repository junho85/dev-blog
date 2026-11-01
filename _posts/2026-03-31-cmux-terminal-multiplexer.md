---
layout: post
title: "cmux - AI 시대의 터미널, IDE가 필요 없어지는 날이 올까?"
date: 2026-03-31
last_modified_at: 2026-05-31
tags: ["cmux", "terminal", "Claude Code", "Ghostty", "developer-tools", "productivity"]
image: /assets/images/2026-03-31-cmux-overview.png
---

# cmux - AI 시대의 터미널, IDE가 필요 없어지는 날이 올까?

얼마 전까지 IntelliJ의 내장 터미널에서 Claude Code를 실행하며 개발하고 있었습니다. IDE 안에서 코드도 보고 AI 에이전트도 돌리면 편할 줄 알았는데, 여러 프로젝트를 동시에 작업하다 보니 한계가 느껴졌습니다. 그러다 [cmux](https://cmux.com)를 알게 되었고, 지금은 거의 모든 개발 작업을 cmux에서 하고 있습니다. IDE는 코드 확인이나 실행할 때 정도만 열게 되었는데, 이대로 가다가는 IDE가 정말 필요 없어질 것 같습니다.

cmux는 Ghostty 엔진 기반의 macOS 터미널 애플리케이션으로, AI 코딩 에이전트를 여러 개 동시에 돌리는 데 최적화되어 있습니다. 2026년 2월에 출시되어 한 달 만에 GitHub 스타 7,700개를 넘기며 개발자들 사이에서 큰 관심을 받고 있습니다. 이후에도 빠르게 성장하여 2026년 5월 기준으로 20,500개를 넘어섰습니다.

![cmux 전체 UI](/assets/images/2026-03-31-cmux-overview.png)

## Ghostty 엔진 기반의 빠른 렌더링

cmux는 [Ghostty](https://ghostty.org)의 libghostty를 렌더링 엔진으로 사용합니다. Ghostty가 독립 터미널 앱이라면, cmux는 그 렌더링 엔진 위에 워크스페이스와 AI 에이전트 관리 기능을 얹은 별도의 앱입니다.

GPU 가속 렌더링 덕분에 대량 로그 출력이나 빠른 스크롤 시 체감 성능이 좋습니다. Native Swift + AppKit으로 만들어져 Electron 기반 터미널들과는 확실히 다른 가벼움이 있습니다.

기존에 Ghostty를 사용하고 있었다면 설정을 따로 할 필요가 없습니다. cmux가 Ghostty의 config 파일을 읽어서 테마, 폰트, 색상을 그대로 적용해줍니다.

```bash
# Ghostty config 경로 - cmux가 이 설정을 그대로 읽어온다
cat ~/.config/ghostty/config
```

## 워크스페이스 관리 - 여러 프로젝트를 깔끔하게

cmux의 핵심 기능은 워크스페이스입니다. 각 워크스페이스는 독립된 개발 환경으로, 프로젝트별로 터미널과 브라우저 패널을 묶어서 관리할 수 있습니다.

![cmux 워크스페이스 탭](/assets/images/2026-03-31-cmux-workspace-tabs.png)

사이드바에 세로 탭(vertical tabs)으로 워크스페이스가 나열되는데, 각 탭에 다음 정보가 표시됩니다.

- **워크스페이스 이름**
- **Git 브랜치** 이름
- **작업 디렉토리** 경로
- **리스닝 포트** (dev server가 실행 중인 포트 번호)
- 최근 **알림** 텍스트

여러 프로젝트를 동시에 작업할 때 탭만 보면 각 프로젝트의 상태를 한눈에 파악할 수 있어서 편리합니다. `⌘ + N`으로 새 워크스페이스를 만들고, `⌘ + P`로 워크스페이스 간 빠르게 이동할 수 있습니다.

cmux는 4단계 계층 구조로 화면을 관리합니다.

![cmux 계층 구조](/assets/images/2026-03-31-cmux-concepts.png)

- **Workspace** (①) - 사이드바의 탭. 프로젝트 단위로 구분
- **Pane** (②③) - 워크스페이스 안의 분할 영역. `⌘ + D`로 생성
- **Surface** (④) - Pane 안의 탭. `⌘ + T`로 생성. 각각 터미널이나 브라우저를 담을 수 있음

## IDE를 대체하는 여정 - IntelliJ에서 cmux로

예전에는 이런 워크플로우였습니다.

1. IntelliJ에서 프로젝트 열기
2. IntelliJ 내장 터미널에서 Claude Code 실행
3. 코드 변경 사항을 IntelliJ 에디터에서 확인
4. 다른 프로젝트 작업하려면 IntelliJ 창을 새로 열기

지금은 이렇게 바뀌었습니다.

1. cmux에서 워크스페이스별로 프로젝트 관리
2. 각 워크스페이스에서 Claude Code 실행
3. 작업 완료 알림이 오면 해당 워크스페이스로 이동
4. IDE는 코드 리뷰나 디버깅이 필요할 때만 열기

Claude Code가 코드를 작성하고, 테스트를 돌리고, 커밋까지 하는 상황에서 IDE의 역할이 점점 줄어들고 있습니다. 아직 디버거, 코드 네비게이션, 그리고 diff 확인 같은 IDE 고유 기능이 필요한 순간이 있습니다. 특히 Claude Code가 변경한 코드를 리뷰할 때 IntelliJ의 Git diff 뷰가 유용합니다. 변경 전후를 한눈에 비교할 수 있어서 AI가 의도대로 코드를 수정했는지 빠르게 확인할 수 있습니다. 하지만 이 추세라면 IDE가 정말 보조 도구로 전락할 날이 올 수도 있겠다는 생각이 듭니다.

## 내장 WebKit 브라우저 - 터미널에서 바로 웹 확인

cmux에는 WebKit 기반 브라우저가 내장되어 있습니다. 터미널을 떠나지 않고 로컬 개발 서버의 화면을 바로 확인할 수 있습니다.

![cmux 내장 브라우저](/assets/images/2026-03-31-cmux-browser.png)

특히 인상적인 것은 브라우저 자동화 API입니다. `cmux browser open`으로 surface를 생성하고, 이후 모든 조작을 해당 surface ID에 대고 수행하는 구조입니다. CSS 셀렉터로 요소를 지정하며, `snapshot --interactive --compact`로 현재 페이지의 조작 가능한 요소를 텍스트로 확인할 수 있어 AI 에이전트가 웹 페이지와 상호작용하기에 훨씬 안정적입니다.

```bash
# 내장 브라우저로 로컬 개발 서버 열기 (surface ID가 출력됨)
cmux browser open http://localhost:3000
# OK surface=surface:2 pane=pane:1 placement=split

# 페이지 로드 대기
cmux browser surface:2 wait --load-state complete --timeout-ms 15000

# 스냅샷으로 조작 가능한 요소 확인
cmux browser surface:2 snapshot --interactive --compact

# CSS 선택자로 클릭
cmux browser surface:2 click "button[type='submit']"

# 폼에 텍스트 입력
cmux browser surface:2 fill "input[name='search']" --text "검색어"

# 스크린샷 캡처
cmux browser surface:2 screenshot --out ./screenshot.png
```

현재 Chrome에서 Claude in Chrome 확장 기능을 잘 활용하고 있는데, cmux용 브라우저 스킬을 만들어서 테스트해보니 잘 동작했습니다. 아직 발전 중인 기능이지만, 터미널 안에서 브라우저까지 제어할 수 있다는 점에서 잠재력이 큽니다. 좀 더 고도화되면 Chrome 확장보다 더 seamless한 경험을 제공할 수 있을 것으로 보입니다.

## 유용한 단축키 정리

cmux를 효율적으로 쓰려면 단축키를 익혀두는 게 좋습니다. 자주 쓰는 단축키들을 정리했습니다.

### 워크스페이스 & Surface 관리

| 단축키 | 기능 |
|--------|------|
| `⌘ + N` | 새 워크스페이스 생성 (사이드바 탭) |
| `⌘ + P` | 워크스페이스 빠른 이동 |
| `⌘ + ⇧ + R` | 워크스페이스 이름 변경 |
| `⌘ + T` | 새 Surface 생성 (Pane 안의 탭) |
| `⌘ + R` | Surface 이름 변경 |
| `⌘ + W` | Surface 닫기 |
| `⌘ + [` / `⌘ + ]` | Surface 간 이동 |

### 화면 분할 & Pane 이동

| 단축키 | 기능 |
|--------|------|
| `⌘ + D` | 세로 분할 |
| `⌘ + ⇧ + D` | 가로 분할 |
| `⌥ + ⌘ + ←→↑↓` | Pane 간 이동 |

### 커맨드 팔레트

| 단축키 | 기능 |
|--------|------|
| `⌘ + ⇧ + P` | 커맨드 팔레트 열기 |

커맨드 팔레트(`⌘ + ⇧ + P`)는 특히 유용합니다. `open`을 입력하면 현재 작업 경로를 기준으로 다양한 도구를 열 수 있습니다.

- **open finder** - 현재 경로에서 Finder 열기
- **open vscode** - 현재 경로에서 VSCode 열기

개인적으로 IntelliJ 계열 IDE도 open 기능으로 열 수 있게 되면 더 좋겠습니다. `open idea`나 `open webstorm` 같은 명령이 지원된다면 cmux와 IDE 간의 전환이 훨씬 매끄러워질 것입니다.

## 알림 시스템 - 멀티태스킹의 핵심

cmux의 알림 시스템은 여러 AI 에이전트를 동시에 돌릴 때 진가를 발휘합니다.

![cmux 알림 시스템](/assets/images/2026-03-31-cmux-notification.png)

알림이 오면 세 가지 시각적 피드백이 동시에 제공됩니다.

- 워크스페이스 탭에 **파란 링** 표시
- Dock 아이콘에 **미확인 알림 수** 뱃지
- **데스크톱 알림** (cmux에 포커스가 없을 때)

Claude Code에서 작업이 완료되면 자동으로 알림이 오기 때문에, 여러 워크스페이스에서 동시에 작업을 돌려놓고 완료된 것부터 확인하며 다음 작업을 진행시킬 수 있습니다. CLI로 직접 알림을 보낼 수도 있습니다.

```bash
# CLI로 알림 보내기
cmux notify --title "빌드 완료" --body "프로젝트 빌드가 성공했습니다"
```

## Claude Code와의 통합

cmux는 Claude Code와의 통합이 잘 되어 있습니다. Claude Code의 lifecycle hooks와 연동하여 세션 시작, 알림, 종료 등의 이벤트를 워크스페이스 상태에 반영할 수 있습니다.

![Claude Code 병렬 실행](/assets/images/2026-03-31-cmux-parallel-agents.png)

실제 사용 시나리오를 보면:

```
워크스페이스 1: frontend-refactor
└── Claude Code: "Header 컴포넌트를 반응형으로 리팩토링해줘"

워크스페이스 2: api-endpoints  
└── Claude Code: "사용자 프로필 API 엔드포인트 추가해줘"

워크스페이스 3: test-coverage
└── Claude Code: "인증 모듈 유닛 테스트 작성해줘"
```

각 워크스페이스의 사이드바 탭에서 진행 상태를 확인할 수 있고, 작업이 완료되면 알림이 옵니다. 한 번에 여러 기능을 병렬로 개발할 수 있어서 생산성이 크게 올라갑니다.

## 마무리

cmux는 AI 코딩 에이전트 시대에 맞춰 터미널이 어떻게 진화해야 하는지를 보여주는 도구입니다. 워크스페이스 관리, 알림 시스템, 내장 브라우저가 결합되어 여러 AI 에이전트를 동시에 관리하는 경험이 매우 좋습니다.

아직 아쉬운 점도 있습니다.

- **macOS 전용** - Linux나 Windows에서는 사용할 수 없습니다
- **IntelliJ open 미지원** - 커맨드 팔레트에서 IntelliJ 계열 IDE를 여는 기능이 없습니다
- **내장 브라우저 고도화** - 아직 발전 중이지만 더 안정화되면 훨씬 강력해질 것입니다

그럼에도 불구하고, cmux 덕분에 IDE를 여는 빈도가 확실히 줄었습니다. AI 코딩 에이전트 시대에 터미널이 이런 방향으로 진화하고 있다는 게 실감납니다.

### 관련 링크

- [cmux 공식 사이트](https://cmux.com)
- [cmux GitHub](https://github.com/manaflow-ai/cmux)
- [Ghostty](https://ghostty.org)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
