#!/bin/bash
# status.sh — show current Ralph Loop progress via GitHub issues or prd.json

PROJECT="$(basename "$(pwd)")"
echo "=== Ralph Loop Status: ${PROJECT} ==="
echo ""

if gh auth status &>/dev/null; then
    python3 -c "
import subprocess, json
try:
    r = subprocess.run(
        ['gh', 'issue', 'list', '--state', 'open', '--limit', '100', '--json', 'number,title,labels'],
        capture_output=True, text=True, timeout=8
    )
    if r.returncode == 0:
        issues = json.loads(r.stdout)
        counts = {'ready-for-agent': 0, 'needs-triage': 0, 'needs-info': 0, 'ready-for-human': 0}
        ready_list = []
        for iss in issues:
            label_names = {l['name'] for l in iss.get('labels', [])}
            for k in counts:
                if k in label_names:
                    counts[k] += 1
            if 'ready-for-agent' in label_names:
                ready_list.append(f\"#{iss['number']} {iss['title']}\")

        print('GitHub Issue Counts:')
        for k, v in counts.items():
            print(f'  {k}: {v}')
        print('')
        print('Ready for agent:')
        if ready_list:
            for s in ready_list:
                print(f'  {s}')
        else:
            print('  (none)')
        print('')
except Exception:
    pass
" 2>/dev/null || true
fi

if [ -f prd.json ]; then
    echo "PRD Stories Summary:"
    python3 -c "
import json
try:
    with open('prd.json') as f:
        data = json.load(f)
    stories = data.get('stories', [])
    passed = [s for s in stories if s.get('passes', False)]
    pending = [s for s in stories if not s.get('passes', False)]
    print(f'  Passed:  {len(passed)} / {len(stories)}')
    print(f'  Pending: {len(pending)} / {len(stories)}')
    if pending:
        print('  Next pending:')
        for s in pending[:5]:
            print(f\"    [{s.get('id')}] {s.get('title', '')}\")
except Exception as e:
    print(f'  Error reading prd.json: {e}')
" 2>/dev/null || true
    echo ""
fi

echo "--- Last 10 lines of progress.txt ---"
if [ -f progress.txt ]; then
    tail -n 10 progress.txt
else
    echo "(no progress.txt yet)"
fi

