---
title: "Python 3.6에서 3.11로 업그레이드하며 MongoDB에서 PostgreSQL(Supabase)로 마이그레이션하기"
date: 2025-06-28
tags: ["Python", "Django", "Docker", "PostgreSQL", "Supabase", "MongoDB", "Migration", "Apple Silicon", "DevOps", "Backend"]
---

# Python 3.6에서 3.11로 업그레이드하며 MongoDB에서 PostgreSQL(Supabase)로 마이그레이션하기

오래된 Python 3.6.8 프로젝트를 최신 환경으로 업그레이드하면서 동시에 데이터베이스도 MongoDB에서 PostgreSQL로 마이그레이션한 경험을 공유합니다. Apple Silicon Mac에서 Python 3.6이 지원되지 않아 Docker로 불편하게 개발하던 문제도 함께 해결했습니다.

## 프로젝트 소개: 정원사들 시즌4

"정원사들"은 매일 GitHub에 커밋하며 1일 1커밋 습관을 만들어가는 개발자 커뮤니티입니다. Garden4는 이 커뮤니티의 네 번째 시즌을 위한 출석 관리 시스템입니다.

### 주요 기능
- **자동 출석 체크**: GitHub 커밋이 Slack 채널에 공유되면 자동으로 출석 처리
- **출석 현황 대시보드**: 사용자별 출석 현황을 웹에서 확인
- **미출석자 알림**: 정해진 시간까지 커밋하지 않은 멤버에게 Slack 알림
- **통계 제공**: 월별/주별 출석률 및 연속 출석 일수 등 다양한 통계

### 기술적 배경

- **기존 환경**: Python 3.6.8, Django 2.2.6, MongoDB, slackclient 2.3.1
- **문제점**: Apple Silicon에서 Python 3.6 미지원으로 Docker 의존적 개발
- **목표 환경**: Python 3.11+, Django 4.2.11, PostgreSQL (Supabase), slack-sdk

## 1. Python 버전 업그레이드

### 의존성 패키지 업데이트

`requirements.txt`를 Python 3.11 호환 버전으로 업데이트:

```txt
slack-sdk==3.27.1          # slackclient 대체
Django==4.2.11             # Django 2.2.6에서 업그레이드
psycopg2-binary==2.9.9     # pymongo 대체
pyyaml==6.0.1
markdown>=3.0,<4.0         # python-markdown-slack 제거
pytz==2025.2
```

### Django 설정 업데이트

`mysite/settings.py`에서 pathlib 사용 및 새로운 설정 추가:

```python
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Django 4.x 필수 설정
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# 환경 변수 지원
DEBUG = os.getenv('DEBUG', 'True').lower() in ['true', '1', 'yes']
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
```

### Slack API 마이그레이션

slackclient에서 slack-sdk로 변경:

```python
# 기존
from slackclient import SlackClient
self.slack_client = SlackClient(token=slack_api_token)

# 변경
from slack_sdk import WebClient
self.slack_client = WebClient(token=slack_api_token)
```

### Markdown 패키지 호환성 문제 해결

`python-markdown-slack`이 Python 3.11과 호환되지 않아 커스텀 함수로 대체:

```python
def process_slack_links(text):
    pattern = r'<([^|>]+)\|([^>]+)>'
    def replace_link(match):
        url = match.group(1)
        text = match.group(2)
        text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
        return f'<a href="{url}">{text}</a>'
    return re.sub(pattern, replace_link, text)
```

## 2. MongoDB에서 PostgreSQL로 마이그레이션

### PostgreSQL 연결 설정

```python
import psycopg2
import psycopg2.extras

def connect_postgres(self):
    conn = psycopg2.connect(
        host=self.pg_host,
        port=self.pg_port,
        database=self.pg_database,
        user=self.pg_user,
        password=self.pg_password,
        sslmode='require'
    )
    # 스키마 설정
    cursor = conn.cursor()
    cursor.execute(f"SET search_path TO {self.pg_schema}")
    cursor.close()
    return conn
```

### JSONB를 활용한 쿼리 변환

MongoDB의 유연한 스키마를 PostgreSQL JSONB로 대체:

```python
# MongoDB 쿼리
messages = collection.find({"attachments.author_name": user})

# PostgreSQL JSONB 쿼리
query = """
    SELECT ts, ts_for_db, attachments
    FROM slack_messages 
    WHERE attachments @> %s
    ORDER BY ts
"""
param = json.dumps([{"author_name": user}])
cursor.execute(query, (param,))
```

### 타임존 이슈 해결

KST 시간이 UTC로 저장되어 있던 문제 수정:

```python
# DB의 ts_for_db는 KST 시간이 UTC로 저장되어 있음
ts_datetime_raw = message['ts_for_db']
ts_datetime = ts_datetime_raw - timedelta(hours=9)  # 9시간 빼기
```

## 3. Docker 컨테이너화

### Dockerfile 작성

멀티 스테이지 빌드로 이미지 크기 최적화:

```dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc g++ libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 복사
COPY . .

# 정적 파일 수집
RUN python manage.py collectstatic --noinput

# 비루트 사용자로 실행
RUN adduser --disabled-password --gecos '' appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

### 멀티 플랫폼 빌드 스크립트

Apple Silicon(ARM64)과 x86_64 모두 지원:

```bash
#!/bin/bash
DOCKER_USER="junho85"
IMAGE_NAME="garden4"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Docker Hub 로그인 확인
if ! docker pull hello-world:latest > /dev/null 2>&1; then
    echo "Warning: Not logged in to Docker Hub"
    echo "Please run 'docker login' first"
    exit 1
fi

# 멀티 플랫폼 빌드
docker buildx create --name multiplatform --use 2>/dev/null || true
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag $DOCKER_USER/$IMAGE_NAME:latest \
  --tag $DOCKER_USER/$IMAGE_NAME:$TIMESTAMP \
  --push \
  "$SCRIPT_DIR"
```

## 4. 배포 및 Nginx 설정

### Docker Compose 설정

로컬 개발과 프로덕션 환경 분리:

```yaml
services:
  web-garden4:
    image: junho85/garden4:latest  # 프로덕션
    # build: .  # 로컬 개발
    environment:
      - DEBUG=0
      - ALLOWED_HOSTS=garden4.junho85.pe.kr
      - DB_HOST=aws-0-ap-northeast-2.pooler.supabase.com
      - DB_PORT=6543
      - DB_NAME=postgres
      - DB_USER=postgres.schejihwxwsvaduhpkbe
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_SCHEMA=garden4
    ports:
      - "8004:8000"
    restart: unless-stopped
```

### Nginx 리버스 프록시 설정

```nginx
server {
    listen 80;
    server_name garden4.junho85.pe.kr;

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 모든 요청을 Django로 프록시
    location / {
        proxy_pass http://127.0.0.1:8004;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 마무리

이번 마이그레이션을 통해:
- Python 3.6 → 3.11 업그레이드로 최신 기능 활용 가능
- Apple Silicon에서 네이티브 개발 환경 구축
- MongoDB → PostgreSQL 전환으로 관계형 데이터베이스의 이점 활용
- Docker 컨테이너화로 배포 프로세스 단순화
- 멀티 플랫폼 지원으로 다양한 환경에서 실행 가능

특히 JSONB 타입을 활용하여 MongoDB의 유연성을 유지하면서도 PostgreSQL의 안정성을 얻을 수 있었습니다. 타임존 처리나 패키지 호환성 같은 세부적인 이슈들도 있었지만, 하나씩 해결하며 더 현대적이고 유지보수가 쉬운 시스템으로 발전시킬 수 있었습니다.

## 참고 자료

- [Django 4.2 릴리스 노트](https://docs.djangoproject.com/en/4.2/releases/4.2/)
- [Slack SDK for Python](https://slack.dev/python-slack-sdk/)
- [PostgreSQL JSONB 문서](https://www.postgresql.org/docs/current/datatype-json.html)
- [Docker Buildx 멀티 플랫폼 빌드](https://docs.docker.com/build/building/multi-platform/)