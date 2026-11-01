#!/usr/bin/env bash
# 로컬 미리보기 (Docker). 초안, 미발행, 미래 날짜 글까지 보이게 띄운다.
#   bash scripts/preview.sh          띄우고 바로 돌아온다 → http://localhost:4003/
#   bash scripts/preview.sh --stop   내린다
# 포트 4003, LiveReload 35732. world(4000), 이코노준(4001), 생활노트(4002)와 겹치지 않게 했다.
set -euo pipefail
cd "$(dirname "$0")/.."
NAME=dev-blog-preview
export CMUX_PORT="${PORT:-4003}" LR_PORT=35732

if [ "${1:-}" = "--stop" ]; then
  docker stop "$NAME" >/dev/null 2>&1 && echo "내렸습니다: $NAME" || echo "실행 중이 아닙니다"
  exit 0
fi
if docker ps --format '{{.Names}}' | grep -qx "$NAME"; then
  echo "이미 떠 있습니다 → http://localhost:$CMUX_PORT/"; exit 0
fi
docker rm -f "$NAME" >/dev/null 2>&1 || true
docker compose build
docker compose run --rm --service-ports -d --name "$NAME" jekyll \
  bundle exec jekyll serve --host 0.0.0.0 --livereload --livereload-port "$LR_PORT" --force_polling --future --drafts --unpublished
for i in $(seq 1 36); do
  if [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "http://localhost:$CMUX_PORT/" || true)" = "200" ]; then
    echo "준비됨 → http://localhost:$CMUX_PORT/"; exit 0
  fi
  sleep 5
done
echo "기동 확인에 실패했습니다. 로그:" >&2; docker logs "$NAME" 2>&1 | tail -30 >&2; exit 1
