#!/bin/bash
# bot-listener.sh — Ultra-fast Telegram command listener for Ralph Loop
# Commands: /status /log /agent /llama /stop /help

PROJECT="$(basename "$(pwd)")"
PIDFILE="/tmp/ralph-bot-listener-${PROJECT}.pid"

if [ -f "$PIDFILE" ]; then
    OLD_PID=$(cat "$PIDFILE" 2>/dev/null)
    if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
        echo "[bot-listener] Already running for ${PROJECT} (PID $OLD_PID) — exiting"
        exit 0
    else
        rm -f "$PIDFILE"
    fi
fi

[ -f "$HOME/.config/ralph/notify.env" ] && source "$HOME/.config/ralph/notify.env"
[ -f .env.ralph ] && source .env.ralph

if [ -z "$TELEGRAM_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo "[bot-listener] No Telegram credentials — exiting"
    exit 0
fi

RALPH_PID="${1:-}"

exec python3 -u - "$TELEGRAM_TOKEN" "$TELEGRAM_CHAT_ID" "$PROJECT" "$RALPH_PID" << 'PYEOF'
import sys, os, re, time, json, urllib.request, urllib.parse, subprocess, html, atexit, signal

token     = sys.argv[1]
chat_id   = str(sys.argv[2]).strip()
project   = sys.argv[3]
ralph_pid = sys.argv[4]
api       = f"https://api.telegram.org/bot{token}"

# Record PID and register automatic cleanup
pid_file = f"/tmp/ralph-bot-listener-{project}.pid"
try:
    with open(pid_file, 'w') as f:
        f.write(str(os.getpid()))
except Exception:
    pass

def cleanup_pid():
    try:
        if os.path.exists(pid_file):
            os.remove(pid_file)
    except Exception:
        pass

atexit.register(cleanup_pid)
signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
signal.signal(signal.SIGINT, lambda *_: sys.exit(0))

def clean_ansi(text):
    text = re.sub(r'\x1b(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])', '', text)
    return '\n'.join(line for line in text.replace('\r', '').splitlines() if line.strip())

def send(text, code_block=False, title=None):
    text = clean_ansi(text)
    if code_block:
        max_len = 3800 - (len(title) + 15 if title else 0)
        if len(text) > max_len:
            text = "... [truncated]\n" + text[-max_len:]
        escaped_code = html.escape(text)
        if title:
            body = f"<b>{html.escape(title)}</b>\n<pre><code>{escaped_code}</code></pre>"
        else:
            body = f"<pre><code>{escaped_code}</code></pre>"
        payload = {'chat_id': chat_id, 'text': body, 'parse_mode': 'HTML'}
    else:
        text = text[:4000]
        if title:
            body = f"<b>{html.escape(title)}</b>\n{html.escape(text)}"
            payload = {'chat_id': chat_id, 'text': body, 'parse_mode': 'HTML'}
        else:
            payload = {'chat_id': chat_id, 'text': text}

    try:
        data = urllib.parse.urlencode(payload).encode('utf-8')
        req = urllib.request.Request(f"{api}/sendMessage", data=data, headers={'Content-Type': 'application/x-www-form-urlencoded'})
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        print(f"[bot-listener] send error: {e}", file=sys.stderr)

def get_log_path():
    return 'logs/ralph.log' if os.path.exists('logs/ralph.log') else 'ralph.log'

def tail_file(path, n=40):
    if not os.path.exists(path):
        return f'(file not found: {path})'
    try:
        r = subprocess.run(['tail', f'-n', str(n*2), path], capture_output=True, text=True, timeout=5)
        lines = clean_ansi(r.stdout).splitlines()
        return '\n'.join(lines[-n:]) if lines else '(empty)'
    except Exception as e:
        return f'Error reading {path}: {e}'

def get_agent_log(n=40):
    path = get_log_path()
    if not os.path.exists(path):
        return '(no log file yet)'
    try:
        p1 = subprocess.Popen(['tail', '-n', '500', path], stdout=subprocess.PIPE, text=True)
        p2 = subprocess.Popen(['grep', '-iE', 'Error|PASS|FAIL|commit|write|modified|deleted|created|Iteration|passed|failed'], stdin=p1.stdout, stdout=subprocess.PIPE, text=True)
        p1.stdout.close()
        out, _ = p2.communicate(timeout=5)
        lines = clean_ansi(out).splitlines()
        return '\n'.join(lines[-n:]) if lines else '(no meaningful agent output in recent logs)'
    except Exception as e:
        return f'Error: {e}'

def fast_gh_summary():
    try:
        r = subprocess.run(
            ['gh', 'issue', 'list', '--state', 'open', '--limit', '100', '--json', 'number,title,labels'],
            capture_output=True, text=True, timeout=8
        )
        if r.returncode != 0:
            return f"gh error: {r.stderr.strip()}"
        issues = json.loads(r.stdout)
        
        counts = {'ready-for-agent': 0, 'needs-triage': 0, 'needs-info': 0, 'ready-for-human': 0}
        ready_list = []
        for iss in issues:
            label_names = {l['name'] for l in iss.get('labels', [])}
            for k in counts:
                if k in label_names:
                    counts[k] += 1
            if 'ready-for-agent' in label_names:
                ready_list.append(f"#{iss['number']} {iss['title']}")

        lines = ['Issue counts:']
        for k, v in counts.items():
            lines.append(f"  {k}: {v}")
        lines.append('')
        lines.append('Ready for agent:')
        if ready_list:
            lines.extend(ready_list)
        else:
            lines.append('  (none)')
        return '\n'.join(lines)
    except Exception as e:
        return f"Error: {e}"

def kill_tree(pid):
    if not pid or int(pid) == os.getpid():
        return
    try:
        r = subprocess.run(['pgrep', '-P', str(pid)], capture_output=True, text=True)
        for cpid in r.stdout.split():
            if cpid.isdigit() and int(cpid) != os.getpid():
                kill_tree(int(cpid))
        os.system(f"kill -TERM {pid} 2>/dev/null")
        time.sleep(0.1)
        os.system(f"kill -9 {pid} 2>/dev/null")
    except Exception as e:
        print(f"Error killing {pid}: {e}", file=sys.stderr)

offset = 0
try:
    req = urllib.request.Request(f"{api}/getUpdates?limit=100&timeout=0")
    with urllib.request.urlopen(req, timeout=10) as resp:
        d = json.loads(resp.read().decode('utf-8'))
        res = d.get('result', [])
        if res:
            offset = res[-1]['update_id'] + 1
except Exception as e:
    print(f"[bot-listener] initial getUpdates error: {e}", file=sys.stderr)

print(f"[bot-listener] Started for {project} (PID {os.getpid()}, ralph PID: {ralph_pid}, offset: {offset})")

while True:
    try:
        req = urllib.request.Request(f"{api}/getUpdates?offset={offset}&timeout=20")
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        time.sleep(1)
        continue

    if not data.get('ok'):
        time.sleep(1)
        continue

    updates = data.get('result', [])
    if not updates:
        continue

    offset = updates[-1]['update_id'] + 1

    for u in updates:
        msg = u.get('message') or u.get('edited_message') or {}
        text = msg.get('text', '').strip()
        from_chat = str(msg.get('chat', {}).get('id', '')).strip()

        if from_chat != chat_id:
            continue

        cmd = text.split()[0].lower() if text else ''

        if cmd.startswith('/status'):
            out = fast_gh_summary()
            send(out, code_block=True, title=f"STATUS: {project}")

        elif cmd.startswith('/log'):
            log_path = get_log_path()
            out = tail_file(log_path, 40)
            send(out, code_block=True, title=f"LOG: {project} ({log_path})")

        elif cmd.startswith('/agent'):
            out = get_agent_log(40)
            send(out, code_block=True, title=f"AGENT: {project}")

        elif cmd.startswith('/llama') or cmd.startswith('/gpu'):
            try:
                r = subprocess.run(['journalctl', '-u', 'llama-server', '--no-pager', '-n', '25', '--output=short'], capture_output=True, text=True, timeout=10)
                out = '\n'.join(clean_ansi(r.stdout).splitlines()[-20:]) or '(no output)'
            except Exception as e:
                out = f'Error: {e}'
            send(out, code_block=True, title="LLAMA SERVER: last 20 lines")

        elif cmd.startswith('/stop'):
            send(f"Stopping Ralph Loop for {project}...", title="STOP")
            pids_to_kill = set()
            if ralph_pid:
                try:
                    pids_to_kill.add(int(ralph_pid))
                except Exception:
                    pass

            proj_pidfile = f"/tmp/ralph-{project}.pid"
            if os.path.exists(proj_pidfile):
                try:
                    with open(proj_pidfile) as f:
                        pids_to_kill.add(int(f.read().strip()))
                except Exception:
                    pass

            try:
                r = subprocess.run(['pgrep', '-f', f'ralph.*{project}|ralph.sh'], capture_output=True, text=True)
                for p in r.stdout.split():
                    if p.isdigit() and int(p) != os.getpid():
                        pids_to_kill.add(int(p))
            except Exception:
                pass

            killed_any = False
            for p in pids_to_kill:
                if p != os.getpid():
                    kill_tree(p)
                    killed_any = True

            os.system(f"rm -f /tmp/ralph-{project}.pid 2>/dev/null")
            if killed_any:
                send(f"Loop stopped (PID {list(pids_to_kill)} and child processes terminated).", title="STOPPED")
            else:
                send("No active Ralph Loop process was found running.", title="STOPPED")
            sys.exit(0)

        elif cmd.startswith('/help') or cmd.startswith('/start'):
            send(
                f"Ralph Loop Bot — {project}\n\n"
                "/status  — instant issue status\n"
                "/log     — last 40 lines of loop log\n"
                "/agent   — filtered agent actions & errors\n"
                "/llama   — llama-server journal (if running)\n"
                "/stop    — kill the loop & all children\n"
                "/help    — show this help message"
            )
PYEOF

