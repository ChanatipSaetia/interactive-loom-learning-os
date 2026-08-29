#!/bin/bash
# notify.sh — send a Telegram message from ralph.sh
# Usage: ./notify.sh "your message"
# Credentials: ~/.config/ralph/notify.env (global) or .env.ralph (per-project override)

# Load global credentials first, then allow per-project override
if [ -f "$HOME/.config/ralph/notify.env" ]; then
    source "$HOME/.config/ralph/notify.env"
fi
if [ -f .env.ralph ]; then
    source .env.ralph
fi

if [ -z "$TELEGRAM_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo "[notify] No Telegram credentials set — skipping notification"
    exit 0
fi

MESSAGE="$1"
PROJECT="$(basename "$(pwd)")"
FULL_MSG="[Ralph Loop] ${PROJECT}: ${MESSAGE}"

# Truncate to 4000 chars to respect Telegram's 4096 char limit
if [ ${#FULL_MSG} -gt 4000 ]; then
    FULL_MSG="${FULL_MSG:0:3950}... [truncated]"
fi

# Send using --data-urlencode to safely encode newlines, quotes, &, +, and special chars
curl -s --max-time 10 -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=${FULL_MSG}" > /dev/null

echo "[notify] Telegram sent"

