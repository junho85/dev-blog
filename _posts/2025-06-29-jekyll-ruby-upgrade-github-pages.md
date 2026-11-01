---
layout: post
title: "Jekyll 프로젝트를 GitHub Pages Ruby 3.3.4로 업그레이드하기"
date: 2025-06-29
categories: jekyll ruby rbenv github-pages
image: /assets/images/2025-06-29-jekyll-ruby-upgrade-github-pages.png
---

![Jekyll Ruby 업그레이드]({{ page.image | relative_url }})

앞서 Jekyll 빌드 시 bundler 버전 오류를 해결한 후, GitHub Pages가 사용하는 Ruby 버전과 동일하게 맞추기 위해 Ruby를 업그레이드하는 작업을 진행했습니다.

## 배경

[GitHub Pages 의존성 버전](https://pages.github.com/versions/)을 확인해보니 Ruby 3.3.4를 사용하고 있었습니다. 제 로컬 환경은 macOS 시스템 Ruby 2.6.10을 사용 중이어서, 더 나은 호환성과 최신 기능을 위해 업그레이드가 필요했습니다.

## rbenv를 사용한 Ruby 버전 관리

### 1. rbenv 설치

먼저 Homebrew를 통해 rbenv와 ruby-build를 설치합니다:

```bash
brew install rbenv ruby-build
```

### 2. Ruby 3.3.4 설치

GitHub Pages와 동일한 Ruby 버전을 설치합니다:

```bash
rbenv install 3.3.4
```

설치에는 몇 분이 소요됩니다. 설치가 완료되면 다음과 같은 메시지가 나타납니다:

```
==> Installed ruby-3.3.4 to /Users/junho85/.rbenv/versions/3.3.4
```

### 3. 프로젝트에 Ruby 버전 설정

Jekyll 프로젝트 디렉토리에서 Ruby 3.3.4를 사용하도록 설정합니다:

```bash
rbenv local 3.3.4
```

이 명령은 프로젝트 루트에 `.ruby-version` 파일을 생성하며, 이 디렉토리에서는 자동으로 Ruby 3.3.4가 사용됩니다.

### 4. 최신 bundler 설치

Ruby 3.3.4에서는 최신 bundler를 사용할 수 있습니다:

```bash
gem install bundler
```

bundler 2.6.9가 설치됩니다.

## Jekyll 업그레이드

Ruby 3.3.4와의 호환성을 위해 Jekyll도 업그레이드했습니다.

### 1. Gemfile 수정

`Gemfile`에서 Jekyll 버전을 수정합니다:

```ruby
gem "jekyll", "~> 4.3.0"
```

### 2. 의존성 업데이트

```bash
bundle update jekyll
```

이 명령으로 Jekyll 4.3.4와 관련 의존성들이 업데이트됩니다.

### 3. bundler 버전 업데이트

Gemfile.lock의 bundler 버전을 최신으로 업데이트합니다:

```bash
bundle update --bundler
```

## Shell 설정 정리

### 1. .zshrc 수정

기존 시스템 Ruby의 gem 경로를 제거하고 rbenv 설정을 추가합니다:

```bash
# 기존 설정 제거
# export PATH="/Users/junho85/.gem/ruby/2.6.0/bin:$PATH"

# rbenv 설정 추가
eval "$(rbenv init - zsh)"
```

### 2. 중복 설정 제거

`~/.zprofile`에 자동으로 추가된 rbenv 설정이 있다면 제거합니다. rbenv는 `.zshrc`에만 있으면 충분합니다.

## 결과 확인

모든 설정이 완료되면 다음 명령으로 확인할 수 있습니다:

```bash
ruby --version
# ruby 3.3.4 (2024-07-09 revision be1089c8ec) [arm64-darwin24]

bundle exec jekyll build
# Configuration file: /Users/junho85/WebstormProjects/junho85.github.io/_config.yml
#             Source: /Users/junho85/WebstormProjects/junho85.github.io
#        Destination: /Users/junho85/WebstormProjects/junho85.github.io/_site
#  Incremental build: disabled. Enable with --incremental
#       Generating... 
#                     done in 0.854 seconds.
```

## 주요 이점

1. **GitHub Pages와 동일한 환경**: Ruby 3.3.4를 사용하여 로컬과 프로덕션 환경의 일관성 확보
2. **최신 기능 사용**: Ruby 3.x의 성능 개선과 새로운 기능 활용
3. **프로젝트별 Ruby 버전 관리**: rbenv를 통해 다른 프로젝트와 독립적으로 Ruby 버전 관리
4. **최신 bundler 사용**: bundler 2.6.9로 더 나은 의존성 관리

## 마무리

이제 Jekyll 프로젝트가 GitHub Pages와 동일한 Ruby 환경에서 실행됩니다. rbenv를 사용하면 프로젝트별로 다른 Ruby 버전을 쉽게 관리할 수 있어, 여러 프로젝트를 동시에 작업할 때 매우 유용합니다.