#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-8000}"

cd "$ROOT_DIR"

build_url() {
  echo "http://localhost:${1}/store_promotion/"
}

build_health_url() {
  echo "http://localhost:${1}/api/store-promotion/health"
}

port_is_listening() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

url_is_reachable() {
  curl --silent --fail "$1" >/dev/null 2>&1
}

echo "Serving: $ROOT_DIR"

if port_is_listening "$PORT"; then
  URL="$(build_url "$PORT")"
  HEALTH_URL="$(build_health_url "$PORT")"

  if url_is_reachable "$URL" && url_is_reachable "$HEALTH_URL"; then
    echo "Port $PORT 已有可用服务，直接复用"
    echo "URL: $URL"
    open -a "Google Chrome" "$URL"
    exit 0
  fi

  for candidate in $(seq $((PORT + 1)) $((PORT + 20))); do
    if ! port_is_listening "$candidate"; then
      PORT="$candidate"
      break
    fi
  done
fi

URL="$(build_url "$PORT")"
echo "URL: $URL"

npm run store-promotion:serve -- --port "$PORT" >/tmp/store_promotion_server.log 2>&1 &
SERVER_PID=$!

cleanup() {
  if kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

sleep 1

if ! kill -0 "$SERVER_PID" >/dev/null 2>&1; then
  echo "store-promotion server 启动失败，日志在 /tmp/store_promotion_server.log"
  exit 1
fi

open -a "Google Chrome" "$URL"

echo "Chrome 已打开。保持此窗口运行；完成后按 Ctrl+C 停止服务。"
wait "$SERVER_PID"
