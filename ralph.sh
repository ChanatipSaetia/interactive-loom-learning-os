#!/bin/bash
# ralph.sh — Autonomous Ralph Loop runner (GitHub issues driven)
# Usage: ./ralph.sh [max_iterations] [model] [engine]
#        ./ralph.sh --engine agy|opencode [max_iterations] [model]
#        ./ralph.sh --agy|--opencode [max_iterations] [model]
# Options:
#   --engine <agy|opencode>, -e <agy|opencode>   Engine to use (default: opencode or ENGINE env var)
#   --agy                                        Shortcut for --engine agy
#   --opencode                                   Shortcut for --engine opencode
# Picks up issues labeled 'ready-for-agent', implements them, and closes on success.

# Ensure opencode and agy are in PATH — try common locations
for _p in "$HOME/.opencode/bin" "$HOME/.gemini/bin" "$HOME/.local/bin" /usr/local/bin /usr/bin; do
    if [ -d "$_p" ] && [[ ":$PATH:" != *":$_p:"* ]]; then
        export PATH="$_p:$PATH"
    fi
done

MAX=21
MODEL=""
ENGINE="${ENGINE:-opencode}"
THINKING="${THINKING:-true}"
VARIANT="${VARIANT:-}"

POSITIONAL=()
while [[ $# -gt 0 ]]; do
    case "$1" in
        --engine=*)
            ENGINE="${1#*=}"
            shift
            ;;
        --engine|-e)
            ENGINE="$2"
            shift 2
            ;;
        --agy)
            ENGINE="agy"
            shift
            ;;
        --opencode)
            ENGINE="opencode"
            shift
            ;;
        --thinking)
            THINKING="true"
            shift
            ;;
        --no-thinking)
            THINKING="false"
            shift
            ;;
        --variant=*)
            VARIANT="${1#*=}"
            shift
            ;;
        --variant)
            VARIANT="$2"
            shift 2
            ;;
        *)
            POSITIONAL+=("$1")
            shift
            ;;
    esac
done

set -- "${POSITIONAL[@]}"

for arg in "$@"; do
    if [[ "$arg" =~ ^[0-9]+$ ]]; then
        MAX="$arg"
    elif [[ "$arg" == "agy" || "$arg" == "opencode" ]]; then
        ENGINE="$arg"
    else
        MODEL="$arg"
    fi
done

MODEL_FLAG=""
if [ -n "$MODEL" ]; then
    MODEL_FLAG="--model $MODEL"
fi

OPENCODE_EXTRA_FLAGS=()
if [ "$THINKING" = "true" ]; then
    OPENCODE_EXTRA_FLAGS+=("--thinking")
fi
if [ -n "$VARIANT" ]; then
    OPENCODE_EXTRA_FLAGS+=("--variant" "$VARIANT")
fi

iteration=0
stuck_issue=""
stuck_count=0
AGENT_PID=""
PROJECT="$(basename $(pwd))"

mkdir -p logs
LOOP_LOG="logs/ralph.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOOP_LOG"
}

strip_ansi() {
    sed -u 's/\x1b\[[0-9;]*[mK]//g; s/\r//g'
}

filter_output() {
    strip_ansi | grep -iE \
        'Error|error:|ERROR|Build|PASS|FAIL|passed|failed|tests|commit|write|modified|deleted|created' |
        grep -vE '^\s*(filesystem|bash|read|write|edit|glob|grep)\s' |
        grep -vE '^\s*⚙' |
        grep -vE '^\s*>' |
        grep -vE '^\s*$' |
        grep -vE '^[0-9]+$'
}

log "=== Ralph Loop: $PROJECT started ==="
log "Engine: $ENGINE"
log "Max iterations: $MAX"
[ -n "$MODEL_FLAG" ] && log "Model override: $MODEL" || log "Model: ($ENGINE default)"
if [ "$ENGINE" = "opencode" ]; then
    log "Thinking stream: $THINKING"
    [ -n "$VARIANT" ] && log "Reasoning variant: $VARIANT"
fi

if ! command -v "$ENGINE" &>/dev/null; then
    log "ERROR: Command '$ENGINE' not found in PATH."
    exit 1
fi

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
start_bot_listener() {
    if [ -f bot-listener.sh ]; then
        rm -f "/tmp/ralph-bot-listener-${PROJECT}.pid" 2>/dev/null
        ./bot-listener.sh $$ &
        BOT_LISTENER_PID=$!
        sleep 0.3
        if kill -0 "$BOT_LISTENER_PID" 2>/dev/null; then
            log "[bot] Telegram listener active (PID: $BOT_LISTENER_PID)"
        else
            log "[bot] Telegram listener failed to start — check credentials or /tmp pidfile"
        fi
    fi
}

start_bot_listener
./notify.sh "Ralph Loop started! Project: $PROJECT | Engine: $ENGINE | Max: $MAX | Use /status /log /llama /stop"

echo $$ > "/tmp/ralph-${PROJECT}.pid"

cleanup() {
    rm -f "/tmp/ralph-${PROJECT}.pid" 2>/dev/null
    if [ -n "$AGENT_PID" ] && kill -0 "$AGENT_PID" 2>/dev/null; then
        pkill -TERM -P "$AGENT_PID" 2>/dev/null || true
        kill -TERM "$AGENT_PID" 2>/dev/null || true
        sleep 0.1
        pkill -9 -P "$AGENT_PID" 2>/dev/null || true
        kill -9 "$AGENT_PID" 2>/dev/null || true
        log "[ralph] $ENGINE child stopped"
    fi
    if [ -n "$BOT_LISTENER_PID" ] && kill -0 "$BOT_LISTENER_PID" 2>/dev/null; then
        pkill -TERM -P "$BOT_LISTENER_PID" 2>/dev/null || true
        kill -TERM "$BOT_LISTENER_PID" 2>/dev/null || true
        sleep 0.1
        kill -9 "$BOT_LISTENER_PID" 2>/dev/null || true
        log "[bot] Telegram listener stopped"
    fi
}
trap cleanup EXIT INT TERM

while [ $iteration -lt $MAX ]; do
    iteration=$((iteration + 1))

    # Health check: ensure bot listener is running, restart if it died
    if [ -f bot-listener.sh ]; then
        if [ -z "$BOT_LISTENER_PID" ] || ! kill -0 "$BOT_LISTENER_PID" 2>/dev/null; then
            log "[bot] Telegram listener was not running — restarting..."
            start_bot_listener
        fi
    fi

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

    # Collect existing context files to attach
    CONTEXT_FILES=()
    [ -f progress.txt ] && CONTEXT_FILES+=("@progress.txt")
    [ -f AGENTS.md ] && CONTEXT_FILES+=("@AGENTS.md")
    [ -f prompt.md ] && CONTEXT_FILES+=("@prompt.md")
    [ -f prd.json ] && CONTEXT_FILES+=("@prd.json")
    [ -f STEERING.md ] && CONTEXT_FILES+=("@STEERING.md")

    # Run selected engine with live streaming output to console and log file
    # Use process substitution so $! captures the actual engine PID, not tee
    if [ "$ENGINE" = "agy" ]; then
        PYTHONUNBUFFERED=1 agy -p "Implement issue $CURRENT_ISSUE. Issue body: $ISSUE_BODY. Read progress.txt, AGENTS.md, prompt.md, and STEERING.md (if present) and follow the instructions in prompt.md exactly." \
            $MODEL_FLAG --dangerously-skip-permissions \
            > >(tee -a "$LOOP_LOG") 2>&1 &
    else
        PYTHONUNBUFFERED=1 opencode run $MODEL_FLAG --auto "${OPENCODE_EXTRA_FLAGS[@]}" \
            "${CONTEXT_FILES[@]}" . \
            "Implement issue $CURRENT_ISSUE. Issue body: $ISSUE_BODY. Follow the instructions in prompt.md exactly." \
            > >(tee -a "$LOOP_LOG") 2>&1 &
    fi
    AGENT_PID=$!
    wait $AGENT_PID || true
    AGENT_PID=""

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
