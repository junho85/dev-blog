---
layout: post
title:  "macOS에서 Jekyll 블로그 ffi 빌드 오류 해결하기 - Docker로 해결"
date:   2025-06-07 12:00:00 +0900
categories: [jekyll, docker, ruby]
tags: [macos, ffi, error, github-pages]
---

## 문제 상황

오랜만에 github pages에 운영중인 블로그에 포스팅을 하기위해 macOS에서 Jekyll 블로그를 설정하려고 `bundle install`을 실행했더니 다음과 같은 오류가 발생했습니다.

```bash
An error occurred while installing ffi (1.15.5), and Bundler cannot continue.
Make sure that `gem install ffi -v '1.15.5' --source 'https://rubygems.org/'` succeeds before bundling.
```

### 오류 원인

이 문제는 다음과 같은 환경에서 발생합니다.
- macOS 15 (Darwin 24) 사용
- 시스템 Ruby 2.6.10 사용
- Apple Silicon (M1/M2) Mac 사용

주요 원인은 ffi gem의 native extension이 최신 macOS와 호환되지 않는 문제입니다. 특히 다음과 같은 컴파일 오류가 발생합니다.

```
/var/folders/y1/qmgwjppx26z9x211fs3d89b40000gn/T/sysv-729e60.s:27:2: error: invalid CFI advance_loc expression
 .cfi_def_cfa x1, 32;
 ^
```

## 해결 방법: Docker 사용

여러 해결 방법 중 Docker를 사용하는 방법이 가장 깔끔하고 확실합니다. Ruby 버전 관리자(rbenv, rvm)를 설치하는 것보다 환경을 격리할 수 있어 더 안정적입니다.

### 1. Dockerfile 생성

프로젝트 루트에 `Dockerfile`을 생성합니다.

```dockerfile
FROM ruby:3.2-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy only Gemfile (not Gemfile.lock since it needs to be regenerated)
COPY Gemfile ./

# Install gems (this will create a new Gemfile.lock)
RUN bundle install

# Copy the rest of the application
COPY . .

# Expose port 4000 for Jekyll
EXPOSE 4000

# Run Jekyll server
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--livereload"]
```

### 2. docker-compose.yml 생성

더 편리한 사용을 위해 `docker-compose.yml`을 생성합니다.

```yaml
version: '3.8'

services:
  jekyll:
    build: .
    ports:
      - "4000:4000"
      - "35729:35729"  # LiveReload port
    volumes:
      - .:/app
      - bundle:/usr/local/bundle
    environment:
      - JEKYLL_ENV=development
    command: bundle exec jekyll serve --host 0.0.0.0 --livereload --force_polling

volumes:
  bundle:
```

### 3. .dockerignore 생성

불필요한 파일이 Docker 이미지에 포함되지 않도록 `.dockerignore`를 생성합니다.

```
_site
.sass-cache
.jekyll-cache
.jekyll-metadata
vendor
.bundle
node_modules
.git
.gitignore
*.swp
*.swo
*~
.DS_Store
Thumbs.db
```

### 4. 기존 Gemfile.lock 삭제

이전 Bundler 버전으로 생성된 `Gemfile.lock`을 삭제합니다.

```bash
rm Gemfile.lock
```

### 5. Docker 컨테이너 실행

이제 Docker를 사용하여 Jekyll을 실행할 수 있습니다.

```bash
# 컨테이너 빌드 및 실행
docker-compose up

# 백그라운드에서 실행
docker-compose up -d

# 컨테이너 중지
docker-compose down
```

## 실행 결과

Docker 컨테이너가 성공적으로 실행되면 다음과 같은 메시지를 볼 수 있습니다.

```
jekyll-1  | Configuration file: /app/_config.yml
jekyll-1  |             Source: /app
jekyll-1  |        Destination: /app/_site
jekyll-1  |  Incremental build: disabled. Enable with --incremental
jekyll-1  |       Generating... 
jekyll-1  |        Jekyll Feed: Generating feed for posts
jekyll-1  |                     done in 0.184 seconds.
jekyll-1  |  Auto-regeneration: enabled for '/app'
jekyll-1  |     Server address: http://0.0.0.0:4000/
jekyll-1  | LiveReload address: http://0.0.0.0:35729
jekyll-1  |   Server running... press ctrl-c to stop.
```

이제 브라우저에서 `http://localhost:4000`으로 접속하면 Jekyll 블로그를 볼 수 있습니다.

## Docker 사용의 장점

1. **환경 격리**: 시스템 Ruby와 충돌 없이 독립적인 환경에서 실행
2. **버전 관리**: Ruby와 gem 버전을 프로젝트별로 관리 가능
3. **팀 협업**: 모든 팀원이 동일한 환경에서 작업 가능
4. **LiveReload**: 파일 변경 시 자동으로 브라우저 새로고침
5. **빠른 재빌드**: bundle 볼륨을 사용하여 gem 캐싱

## 다른 해결 방법들

Docker 외에도 다음과 같은 방법들이 있습니다.

1. **rbenv 또는 rvm 사용**: Ruby 버전 관리자를 사용하여 최신 Ruby 설치
2. **GitHub Pages gem 사용**: `gem "github-pages"`를 사용하여 의존성 관리
3. **특정 빌드 플래그 사용**: `gem install ffi -- --with-cflags="-Wno-error=implicit-function-declaration"`

하지만 Docker를 사용하는 방법이 가장 깔끔하고 재현 가능한 환경을 제공합니다.

## 결론

macOS에서 Jekyll 블로그 설정 시 발생하는 ffi gem 빌드 오류는 Docker를 사용하여 해결할 수 있습니다. Docker는 환경 격리와 버전 관리 측면에서 우수하며, 특히 팀 프로젝트에서 일관된 개발 환경을 제공합니다.
