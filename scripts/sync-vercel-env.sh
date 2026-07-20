#!/usr/bin/env bash
set -euo pipefail

# 로컬 .env.local 값을 Vercel production 환경변수로 동기화한다.
# 사전 조건: `npm i -g vercel` 설치 + `vercel login` 완료 + 이 저장소 루트에서 `vercel link` 완료.
# 실행: ./scripts/sync-vercel-env.sh

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env.local"
TARGET_ENV="production"

if ! command -v vercel &>/dev/null; then
  echo "vercel CLI가 없습니다. 'npm i -g vercel' 설치 후 'vercel login'을 먼저 실행하세요."
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo ".env.local 파일을 찾을 수 없습니다: $ENV_FILE"
  exit 1
fi

get_value() {
  local key="$1"
  grep -E "^${key}=" "$ENV_FILE" | head -1 | cut -d '=' -f2-
}

require_public_url() {
  local name="$1"
  local value="$2"

  case "$value" in
    http://localhost*|https://localhost*|http://127.0.0.1*|https://127.0.0.1*)
      echo "  [FAIL] ${name}에 로컬 주소를 Production으로 올릴 수 없습니다."
      exit 1
      ;;
  esac
}

set_var() {
  local name="$1"
  local value="$2"

  if [ -z "$value" ]; then
    echo "  [SKIP] ${name} (로컬 값 없음)"
    return
  fi

  vercel env rm "$name" "$TARGET_ENV" -y &>/dev/null || true
  if printf '%s' "$value" | vercel env add "$name" "$TARGET_ENV" &>/dev/null; then
    echo "  [OK]   ${name}"
  else
    echo "  [FAIL] ${name}"
  fi
}

echo "== 1순위: 로그인 크리티컬 =="
set_var "MONGODB_URI" "$(get_value MONGODB_URI)"

echo "== 2순위: 인증 시스템 =="
set_var "NEXTAUTH_SECRET" "$(get_value NEXTAUTH_SECRET)"
set_var "NEXTAUTH_URL" "$(get_value NEXTAUTH_URL)"
set_var "NAVER_CLIENT_ID" "$(get_value NAVER_CLIENT_ID)"
set_var "NAVER_CLIENT_SECRET" "$(get_value NAVER_CLIENT_SECRET)"

echo "== 3순위: 핵심 기능 =="
set_var "REDIS_URL" "$(get_value REDIS_URL)"
# 주의: 앱 워커는 TASK_WORKER_CONCURRENCY를 읽음. 로컬 키 이름(WORKER_CONCURRENCY)과 다름.
set_var "TASK_WORKER_CONCURRENCY" "$(get_value WORKER_CONCURRENCY)"
set_var "GOOGLE_SERVICE_ACCOUNT_EMAIL" "$(get_value GOOGLE_SERVICE_ACCOUNT_EMAIL)"
set_var "GOOGLE_PRIVATE_KEY" "$(get_value GOOGLE_PRIVATE_KEY)"
PRODUCTION_CONTENT_API_URL="${CONTENT_API_URL_PRODUCTION:-https://blog-analyzer.fly.dev}"
require_public_url "CONTENT_API_URL" "$PRODUCTION_CONTENT_API_URL"
set_var "CONTENT_API_URL" "$PRODUCTION_CONTENT_API_URL"
set_var "COMMENT_GEN_API_URL" "$(get_value COMMENT_GEN_API_URL)"
set_var "NEXT_PUBLIC_COMMENT_GEN_API_URL" "$(get_value NEXT_PUBLIC_COMMENT_GEN_API_URL)"
set_var "NEXT_PUBLIC_COMMENT_API_URL" "$(get_value NEXT_PUBLIC_COMMENT_API_URL)"
set_var "GOOGLE_IMAGE_API_URL" "$(get_value GOOGLE_IMAGE_API_URL)"
set_var "DEEPSEEK_API_KEY" "$(get_value DEEPSEEK_API_KEY)"
set_var "GEMINI_API_KEY" "$(get_value GEMINI_API_KEY)"
set_var "OPENAI_API_KEY" "$(get_value OPENAI_API_KEY)"

echo ""
echo "완료. 반영하려면 재배포: vercel --prod"
