#!/bin/bash
# ralph.sh — Autonomous Ralph Loop runner (GitHub issues driven)
# Usage: ./ralph.sh [max_iterations] [model]
# Picks up issues labeled 'ready-for-agent', implements them, and closes on success.

# Add opencode to PATH — try common locations so the skill works anywhere
if ! command -v opencode &>/dev/null; then
    for _p in "$HOME/.opencode/bin" "$HOME/.local/bin" /usr/local/bin /usr/bin; do
        if [ -x "$_p/opencode" ]; then
            export PATH="$_p:$PATH"
            break
        fi
    done
fi

MAX=${1:-21}
MODEL_FLAG=""
if [ -n "$2" ]; then
    MODEL_FLAG="--model $2"
fi
iteration=0
stuck_issue=""
stuck_count=0
OPENCODE_PID=""
PROJECT="$(basename $(pwd))"

mkdir -p logs
LOOP_LOG="logs/ralph.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOOP_LOG"
}



log "=== Ralph Loop: $PROJECT started ==="
log "Max iterations: $MAX"
[ -n "$MODEL_FLAG" ] && log "Model override: $2" || log "Model: (opencode default)"

if [ ! -d .git ]; then
    git init
    git add -A
    git commit -m "chore: initial commit before ralph loop" || true
fi

# Verify GitHub auth
if ! gh auth status &>/dev/null; then
    log "ERROR: Not authenticated with GitHub. Run 'gh auth login' first."
    exit 1
fi

BOT_LISTENER_PID=""
if [ -f bot-listener.sh ]; then
    rm -f /tmp/ralph-bot-listener.pid
    ./bot-listener.sh $$ &
    BOT_LISTENER_PID=$!
    log "[bot] Telegram listener started (PID: $BOT_LISTENER_PID)"
    ./notify.sh "Ralph Loop started! Project: $PROJECT | Max: $MAX | Use /status /log /llama /stop"
fi

cleanup() {
    if [ -n "$OPENCODE_PID" ] && kill -0 "$OPENCODE_PID" 2>/dev/null; then
        kill "$OPENCODE_PID" 2>/dev/null
        log "[ralph] opencode child stopped"
    fi
    if [ -n "$BOT_LISTENER_PID" ] && kill -0 "$BOT_LISTENER_PID" 2>/dev/null; then
        kill "$BOT_LISTENER_PID" 2>/dev/null
        log "[bot] Telegram listener stopped"
    fi
}
trap cleanup EXIT

while [ $iteration -lt $MAX ]; do
    iteration=$((iteration + 1))

    STEERING_FLAG=""
    if [ -f STEERING.md ]; then
        STEERING_FLAG="@STEERING.md"
        log "[steering] STEERING.md detected"
    fi

    # Count remaining ready-for-agent issues
    REMAINING=$(gh issue list --label ready-for-agent --state open --json number --jq 'length' 2>/dev/null || echo "0")

    if [ "$REMAINING" -eq 0 ]; then
        log "No more ready-for-agent issues!"
        ./notify.sh "Loop complete! All ready-for-agent issues processed after $((iteration - 1)) iterations. Project: $PROJECT"
        break
    fi

    # Get the oldest ready-for-agent issue
    CURRENT_ISSUE=$(gh issue list --label ready-for-agent --state open --search "sort:created" --json number,title --jq '.[-1] | "#\(.number) \(.title)"' 2>/dev/null || echo "unknown")
    CURRENT_ISSUE_NUM=$(echo "$CURRENT_ISSUE" | grep -o '#[0-9]*' | tr -d '#')

    log "========================================="
    log "Iteration $iteration / $MAX | Remaining: $REMAINING | Issue: $CURRENT_ISSUE"
    log "========================================="

    if [ "$CURRENT_ISSUE" = "$stuck_issue" ]; then
        stuck_count=$((stuck_count + 1))
    else
        stuck_issue="$CURRENT_ISSUE"
        stuck_count=1
    fi

    if [ "$stuck_count" -ge 5 ]; then
        log "BLOCKED: $CURRENT_ISSUE failed $stuck_count iterations in a row — tagging as needs-info"
        gh issue edit "$CURRENT_ISSUE_NUM" --remove-label "ready-for-agent" --add-label "needs-info" 2>/dev/null
        ./notify.sh "BLOCKED: $CURRENT_ISSUE failed $stuck_count times. Tagged as needs-info, moving to next issue."
        stuck_count=0
    fi

    # Fetch the issue body for context
    ISSUE_BODY=$(gh issue view "$CURRENT_ISSUE_NUM" --json body --jq '.body' 2>/dev/null || echo "")

    # Run opencode — output to terminal and log
    opencode run $MODEL_FLAG \
        @progress.txt @AGENTS.md @prompt.md $STEERING_FLAG . \
        "Implement issue $CURRENT_ISSUE. Issue body: $ISSUE_BODY. Follow the instructions in prompt.md exactly." \
        2>&1 | tee -a "$LOOP_LOG" &
    OPENCODE_PID=$!
    wait $OPENCODE_PID || true
    OPENCODE_PID=""

    # Check if the issue was closed
    ISSUE_STATE=$(gh issue view "$CURRENT_ISSUE_NUM" --json state --jq '.state' 2>/dev/null || echo "OPEN")

    if [ "$ISSUE_STATE" = "CLOSED" ]; then
        log "Iteration $iteration PASSED: $CURRENT_ISSUE (issue closed)"
        ./notify.sh "PASSED: $CURRENT_ISSUE (iter $iteration/$MAX, $((REMAINING-1)) remaining)"
    else
        log "Iteration $iteration FAILED: $CURRENT_ISSUE (issue still open)"
    fi
done

log "=== Ralph Loop complete: $iteration iterations ==="
