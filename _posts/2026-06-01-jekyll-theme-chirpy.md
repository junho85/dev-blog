---
layout: post
title: "Jekyll 블로그 테마를 minima에서 Chirpy로 교체했습니다"
date: 2026-06-01
tags: ["Jekyll", "Chirpy", "blog", "theme", "GitHub Pages"]
image: /assets/images/2026-06-01-chirpy-theme-home.png
---

Jekyll 블로그를 운영하다 보니 기본 테마인 minima가 너무 단조롭다는 생각이 들었습니다. 그래서 개발 블로그에 더 잘 어울리는 [jekyll-theme-chirpy](https://github.com/cotes2020/jekyll-theme-chirpy)로 테마를 교체했습니다.

## 기존 테마 (minima)

기존에 사용하던 minima 테마는 Jekyll의 기본 테마로, 심플하지만 기능이 많지 않습니다.

![기존 minima 홈](/assets/images/2026-06-01-minima-theme-home.png)

![기존 minima 포스트 페이지](/assets/images/2026-06-01-minima-theme-before.png)

- 흰 배경의 단순한 레이아웃
- 사이드바 없음
- 검색 기능 없음
- 다크모드 미지원
- 태그/카테고리 페이지 없음

## 새 테마 (Chirpy)

Chirpy는 기술 블로그에 최적화된 Jekyll 테마입니다. GitHub 스타 10k를 넘기며 인기 있는 테마 중 하나입니다.

![Chirpy 테마 포스트 페이지](/assets/images/2026-06-01-chirpy-theme-post-page.png)

주요 개선사항을 비교해보면:

| 기능 | minima | Chirpy |
|------|--------|--------|
| 다크모드 | ❌ | ✅ (라이트/다크 자동 전환) |
| 사이드바 | ❌ | ✅ (프로필, 네비게이션) |
| 검색 | ❌ | ✅ (전문 검색 내장) |
| 목차(TOC) | ❌ | ✅ (포스트 우측 자동 생성) |
| 태그 페이지 | ❌ | ✅ |
| 카테고리 페이지 | ❌ | ✅ |
| 아카이브 | ❌ | ✅ |
| 읽기 시간 | ❌ | ✅ |
| 최종 수정일 | 별도 구현 | ✅ (front matter 자동 인식) |
| 코드 copy 버튼 | ❌ | ✅ |

## 교체 과정

### 1. Gemfile 수정

기존 `minima` gem을 제거하고 `jekyll-theme-chirpy`와 필요한 플러그인을 추가합니다.

```ruby
gem "jekyll-theme-chirpy", "~> 7.5"

group :jekyll_plugins do
  gem "jekyll-archives", "~> 2.2"
  gem "jekyll-include-cache", "~> 0.2"
  gem "jekyll-paginate", "~> 1.1"
  gem "jekyll-seo-tag", "~> 2.8"
  gem "jekyll-sitemap", "~> 1.4"
end
```

### 2. _config.yml 주요 설정

```yaml
theme: jekyll-theme-chirpy
lang: ko-KR
timezone: Asia/Seoul
avatar: /assets/img/avatar.jpg

paginate: 10
paginate_path: "/page:num/"

collections:
  tabs:
    output: true
    sort_by: order
```

### 3. index.markdown → index.html 교체

`jekyll-paginate`는 반드시 `index.html` 파일에서만 동작합니다. 기존 `index.markdown`을 삭제하고 `index.html`을 새로 만들어야 합니다.

```html
---
layout: home
---
```

이 단계를 빠뜨리면 홈 화면에 포스트 목록이 표시되지 않습니다.

### 4. _tabs/ 페이지 생성

Chirpy는 사이드바 네비게이션을 `_tabs/` 디렉토리의 파일로 관리합니다.

```
_tabs/
  about.md       # 정보 페이지
  categories.md  # 카테고리 페이지
  tags.md        # 태그 페이지
  archives.md    # 아카이브 페이지
```

### 5. GitHub Actions 배포 설정

Chirpy는 GitHub Pages의 기본 빌드를 지원하지 않아 GitHub Actions 파이프라인이 필요합니다. `.github/workflows/pages-deploy.yml` 파일을 추가했습니다.

GitHub 저장소 Settings → Pages → Source를 **"GitHub Actions"** 으로 변경해야 합니다.

### 6. 홈 화면

![Chirpy 테마 홈](/assets/images/2026-06-01-chirpy-theme-home.png)

왼쪽 사이드바에 프로필 이미지, 블로그 제목, 네비게이션이 표시되고 오른쪽 패널에 최근 업데이트 및 인기 태그가 자동으로 집계됩니다.

## 마무리

단순히 테마만 교체했는데도 블로그가 훨씬 실용적으로 바뀌었습니다. 특히 TOC(목차)와 태그/카테고리 페이지가 자동 생성되는 점이 마음에 들었습니다. 기술 블로그를 운영하고 계신다면 Chirpy 테마를 적극 추천합니다.

### 관련 링크

- [jekyll-theme-chirpy GitHub](https://github.com/cotes2020/jekyll-theme-chirpy)
- [Chirpy 공식 데모](https://chirpy.cotes.page)
