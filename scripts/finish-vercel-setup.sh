#!/usr/bin/env bash
# Finishes the Vercel env-var setup. Tested env vars are pulled from tmp.env.
# Run from the repo root. You'll be prompted for ONE Vercel device auth.
set -e

cd "$(dirname "$0")/.."

if [ ! -f tmp.env ]; then
  echo "tmp.env not found — see README"
  exit 1
fi

VERCEL=./node_modules/.bin/vercel

if ! command -v "$VERCEL" >/dev/null 2>&1 && [ ! -x "$VERCEL" ]; then
  echo "Local vercel not found. Run: npm install --save-dev vercel"
  exit 1
fi

# Force one auth up front so subsequent calls can reuse it
echo "==> Verifying Vercel auth (you may need to authorize once in your browser)"
"$VERCEL" whoami

push() {
  local name=$1 envt=$2 val=$3
  echo "  $name [$envt]"
  printf '%s' "$val" | "$VERCEL" env add "$name" "$envt" 2>&1 | grep -v '^$\|💡\|To deploy' | tail -2 || true
}

source <(grep -E '^(SESSION_SECRET|MAILGUN_KEY|MAILGUN_DOMAIN|MAILGUN_HOST|MAIL_FROM|APP_URL_PRODUCTION|APP_URL_DEVELOPMENT)=' tmp.env | sed 's/^/export /')

for envt in production preview development; do
  push SESSION_SECRET "$envt" "$SESSION_SECRET"
  push MAILGUN_KEY "$envt" "$MAILGUN_KEY"
  push MAILGUN_DOMAIN "$envt" "$MAILGUN_DOMAIN"
  push MAILGUN_HOST "$envt" "$MAILGUN_HOST"
  push MAIL_FROM "$envt" "$MAIL_FROM"
done

push APP_URL production "$APP_URL_PRODUCTION"
push APP_URL development "$APP_URL_DEVELOPMENT"

echo
echo "==> Triggering production redeploy with new env vars"
"$VERCEL" deploy --prod --yes

echo
echo "✓ Setup complete."
