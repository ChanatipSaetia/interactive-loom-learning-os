#!/bin/bash
# bot-listener.sh — Telegram command listener for Ralph Loop
# Commands: /status /log /agent /llama /stop /help

PIDFILE="/tmp/ralph-bot-listener.pid"
if [ -f "$PIDFILE" ]; then
    OLD_PID=$(cat "$PIDFILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "[bot-listener] Already running (PID $OLD_PID) — exiting"
        exit 0
    else
        echo "[bot-listener] Stale PID file (PID $OLD_PID dead) — removing"
        rm -f "$PIDFILE"
    fi
fi
echo $$ > "$PIDFILE"
trap "rm -f $PIDFILE" EXIT

[ -f "$HOME/.config/ralph/notify.env" ] && source "$HOME/.config/ralph/notify.env"
[ -f .env.ralph ] && source .env.ralph

if [ -z "$TELEGRAM_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo "[bot-listener] No Telegram credentials — exiting"
    exit 0
fi

RALPH_PID="${1:-}"
PROJECT="$(basename $(pwd))"
API="https://api.telegram.org/bot${TELEGRAM_TOKEN}"
TMPFILE="/tmp/ralph-tg-updates.json"

OFFSET=$(curl -s "${API}/getUpdates?limit=100&timeout=0" | python3 -c "
import json,sys
d=json.load(sys.stdin)
r=d.get('result',[])
print(r[-1]['update_id']+1 if r else 0)
" 2>/dev/null || echo 0)

echo "[bot-listener] Started (PID $$, ralph PID: $RALPH_PID, offset: $OFFSET)"

while true; do
    curl -s "${API}/getUpdates?offset=${OFFSET}&timeout=15" > "$TMPFILE" 2>/dev/null

    RESULT=$(python3 - "$TMPFILE" "$TELEGRAM_CHAT_ID" "$PROJECT" "$RALPH_PID" "$TELEGRAM_TOKEN" << 'PYEOF'
import json, sys, os, re, urllib.request, urllib.parse, subprocess

tmpfile   = sys.argv[1]
chat_id   = sys.argv[2]
project   = sys.argv[3]
ralph_pid = sys.argv[4]
token     = sys.argv[5]
api       = f"https://api.telegram.org/bot{token}"

with open(tmpfile) as f:
    data = json.load(f)

if not data.get('ok'):
    sys.exit(0)

updates = data.get('result', [])
if not updates:
    sys.exit(0)

print(f"OFFSET={updates[-1]['update_id'] + 1}")

def send(text, code_block=False):
    """Send text, truncated to Telegram's 4096 char limit. Use code_block for monospace formatting."""
    text = text[:4096]
    if code_block:
        text = f"```\n{text}\n```"
    params = urllib.parse.urlencode({
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'Markdown' if code_block else '',
    }).encode('utf-8')
    try:
        req = urllib.request.Request(
            f"{api}/sendMessage",
            data=params,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        print(f"SEND_ERROR={e}", file=sys.stderr)

def clean_log(text):
    """Strip ANSI codes and blank lines, trim whitespace."""
    text = re.sub(r'\x1b\[[0-9;]*[mK]', '', text)
    text = re.sub(r'\r', '', text)
    lines = [l for l in text.splitlines() if l.strip()]
    return '\n'.join(lines)

def tail_file(path, n=40):
    """Return last n non-empty lines of a file, cleaned."""
    try:
        r = subprocess.run(['tail', f'-{n*2}', path], capture_output=True, text=True)
        lines = clean_log(r.stdout).splitlines()
        return '\n'.join(lines[-n:]) if lines else '(empty)'
    except Exception as e:
        return f'Error reading {path}: {e}'

def prd_summary():
    """Return a compact story status table from prd.json with loop info."""
    try:
        with open('prd.json') as f:
            stories = json.load(f)['stories']
        lines = []
        total = len(stories)
        passed = sum(1 for s in stories if s.get('passes'))
        failed = total - passed
        lines.append(f'Project: {project}')
        lines.append(f'Pass: {passed}  Fail: {failed}  Total: {total}')
        lines.append('')

        # Read current iteration and remaining from log
        try:
            with open('logs/ralph.log') as lf:
                log_content = lf.read()
            import re as re_mod
            iter_match = re_mod.search(r'Iteration (\d+) / (\d+)', log_content)
            if iter_match:
                current_iter = iter_match.group(1)
                max_iter = iter_match.group(2)
                lines.append(f'Iteration: {current_iter}/{max_iter}')
            rem_match = re_mod.search(r'Remaining: (\d+)', log_content)
            if rem_match:
                lines.append(f'Remaining: {rem_match.group(1)} stories')
            cur_match = re_mod.search(r'Story: (\S+)', log_content)
            if cur_match:
                lines.append(f'Current Story: {cur_match.group(1)}')
            lines.append('')
        except Exception:
            pass

        for s in stories:
            icon = 'PASS' if s.get('passes') else 'FAIL'
            lines.append(f"[{icon}] {s['id']}: {s['title'][:40]}")
        return '\n'.join(lines)
    except Exception as e:
        return f'Error reading prd.json: {e}'

for u in updates:
    msg       = u.get('message', {})
    text      = msg.get('text', '').strip()
    from_chat = str(msg.get('chat', {}).get('id', ''))

    if from_chat != chat_id:
        continue

    if text.startswith('/status'):
        out = prd_summary()
        send(f'[STATUS]\n\n{out}', code_block=True)

    elif text.startswith('/log'):
        out = tail_file('logs/ralph.log', 40)
        send(f'[LOG] {project}\n\n{out}', code_block=True)

    elif text.startswith('/llama') or text.startswith('/gpu'):
        try:
            r = subprocess.run(
                ['journalctl', '-u', 'llama-server', '--no-pager', '-n', '25', '--output=short'],
                capture_output=True, text=True, timeout=15
            )
            lines = r.stdout.strip().splitlines()
            out = '\n'.join(lines[-20:]) if lines else '(no output)'
        except Exception as e:
            out = f'Error: {e}'
        send(f'[LLAMA SERVER] last 20 lines\n\n{out}', code_block=True)

    elif text.startswith('/stop'):
        send(f'[STOP] Stopping Ralph Loop {project}...')
        if ralph_pid:
            os.system(f'kill {ralph_pid} 2>/dev/null')
            os.system(f'pkill -P {ralph_pid} 2>/dev/null')
            send(f'Loop stopped (PID {ralph_pid} killed).')
        print("STOP=1")

    elif text.startswith('/help') or text.startswith('/start'):
        send(
            f'Ralph Loop Bot - {project}\n\n'
            '/status  - prd pass/fail + loop info\n'
            '/log     - last 40 lines of logs/ralph.log\n'
            '/llama   - llama-server journal (last 20 lines)\n'
            '/stop    - kill the loop\n'
            '/help    - show this message'
        )
PYEOF
)

    NEW_OFFSET=$(echo "$RESULT" | grep "^OFFSET=" | cut -d= -f2)
    STOP=$(echo "$RESULT" | grep "^STOP=1")

    [ -n "$NEW_OFFSET" ] && OFFSET="$NEW_OFFSET"
    [ -n "$STOP" ] && { echo "[bot-listener] Stopped by /stop"; exit 0; }
done
