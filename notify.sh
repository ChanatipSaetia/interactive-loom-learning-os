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
    echo "[notify] Set globally: ~/.config/ralph/notify.env"
    exit 0
fi

MESSAGE="$1"
PROJECT="$(basename $(pwd))"

# Send as plain text — no parse_mode to avoid Markdown 400 errors on special chars
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage" \
    -d chat_id="${TELEGRAM_CHAT_ID}" \
    -d text="[Ralph Loop] ${PROJECT}: ${MESSAGE}" > /dev/null

echo "[notify] Telegram sent"
