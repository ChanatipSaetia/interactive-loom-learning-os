#!/bin/bash
# status.sh — show current Ralph Loop progress
set -e

if [ ! -f prd.json ]; then
    echo "No prd.json found. Run ralph-loop-setup first."
    exit 1
fi

echo "=== Ralph Loop Status: $(basename $(pwd)) ==="
echo ""

python3 -c "
import json
with open('prd.json') as f:
    data = json.load(f)

stories = data['stories']
done = [s for s in stories if s.get('passes', False)]
todo = [s for s in stories if not s.get('passes', False)]

print(f'  Done : {len(done)}/{len(stories)}')
print(f'  Todo : {len(todo)}')
print('')

for s in stories:
    icon = '[DONE]' if s.get('passes', False) else '[TODO]'
    print(f'  {icon}  {s[\"id\"]}: {s[\"title\"]}')
"

echo ""
echo "--- Last 10 lines of progress.txt ---"
tail -10 progress.txt 2>/dev/null || echo "(no progress.txt yet)"
