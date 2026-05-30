#!/bin/bash
# ralph.sh — Autonomous Ralph Loop runner
# Usage: ./ralph.sh [max_iterations] [model]

# Add opencode to PATH — try common locations so the skill works anywhere
# The user's opencode install location varies; check the most common ones
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
stuck_story=""
stuck_count=0
OPENCODE_PID=""
PROJECT="$(basename $(pwd))"

mkdir -p logs
LOOP_LOG="logs/ralph.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOOP_LOG"
}

strip_ansi() {
    sed -u 's/\x1b\[[0-9;]*[mK]//g; s/\r//g'
}

# Keep only meaningful opencode output — messages, errors, results, commits.
# Filter out: tool calls, file content, build noise.
filter_opencode() {
    strip_ansi | grep -iE \
        'Error|error:|ERROR|Build|PASS|FAIL|passed|failed|tests|commit|write|modified|deleted|created' |
        grep -vE '^\s*(filesystem|bash|read|write|edit|glob|grep)\s' |
        grep -vE '^\s*⚙' |
        grep -vE '^\s*>' |
        grep -vE '^\s*$' |
        grep -vE '^[0-9]+$'
}

log "=== Ralph Loop: $PROJECT started ==="
log "Max iterations: $MAX"
[ -n "$MODEL_FLAG" ] && log "Model override: $2" || log "Model: (opencode default)"

if [ ! -d .git ]; then
    git init
    git add -A
    git commit -m "chore: initial commit before ralph loop" || true
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

    REMAINING=$(python3 -c "
import json
with open('prd.json') as f:
    stories = json.load(f)['stories']
print(len([s for s in stories if not s.get('passes', False)]))" 2>/dev/null || echo "0")

    if [ "$REMAINING" -eq 0 ]; then
        log "All tasks complete!"
        ./notify.sh "Loop complete! All stories passed after $((iteration - 1)) iterations. Project: $PROJECT"
        break
    fi

    CURRENT_STORY=$(python3 -c "
import json
with open('prd.json') as f:
    stories = json.load(f)['stories']
done_ids = {s['id'] for s in stories if s.get('passes', False)}
for s in stories:
    if not s.get('passes', False):
        deps = s.get('dependencies', [])
        if all(d in done_ids for d in deps):
            print(s['id'])
            break
" 2>/dev/null || echo "unknown")

    log "========================================="
    log "Iteration $iteration / $MAX | Remaining: $REMAINING | Story: $CURRENT_STORY"
    log "========================================="

    if [ "$CURRENT_STORY" = "$stuck_story" ]; then
        stuck_count=$((stuck_count + 1))
    else
        stuck_story="$CURRENT_STORY"
        stuck_count=1
    fi

    if [ "$stuck_count" -ge 2 ]; then
        log "BLOCKED: $CURRENT_STORY failed $stuck_count iterations in a row"
        ./notify.sh "BLOCKED: $CURRENT_STORY failed $stuck_count times in a row. Check logs/ralph.log or run unstick-story skill."
        if [ -t 0 ]; then
            read -p "   Press Enter to continue the loop anyway, or Ctrl+C to stop: "
        else
            log "Running in background — continuing automatically in 5s"
            sleep 5
        fi
        stuck_count=0
    fi

    # Run opencode — filtered output to logs/ralph.log
    opencode run $MODEL_FLAG \
        @prd.json @progress.txt @AGENTS.md @prompt.md $STEERING_FLAG . \
        "Follow the instructions in prompt.md exactly." \
        2>&1 | filter_opencode >> "$LOOP_LOG" &
    OPENCODE_PID=$!
    wait $OPENCODE_PID || true
    OPENCODE_PID=""

    PASSED=$(python3 -c "
import json
with open('prd.json') as f:
    stories = json.load(f)['stories']
for s in stories:
    if s['id'] == '$CURRENT_STORY':
        print('yes' if s.get('passes') else 'no')
        break
" 2>/dev/null || echo "unknown")

    if [ "$PASSED" = "yes" ]; then
        log "Iteration $iteration PASSED: $CURRENT_STORY"
        ./notify.sh "PASSED: $CURRENT_STORY (iter $iteration/$MAX, $((REMAINING-1)) remaining)"
    else
        log "Iteration $iteration FAILED: $CURRENT_STORY"
    fi
done

log "=== Ralph Loop complete: $iteration iterations ==="
