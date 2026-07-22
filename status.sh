#!/bin/bash
# status.sh — show current Ralph Loop progress via GitHub issues
set -e

echo "=== Ralph Loop Status: $(basename $(pwd)) ==="
echo ""

if ! gh auth status &>/dev/null; then
    echo "Not authenticated with GitHub."
    exit 1
fi

# Show issue counts by label
echo "Issue counts:"
echo "  ready-for-agent: $(gh issue list --label ready-for-agent --state open --json number --jq 'length' 2>/dev/null || echo 0)"
echo "  needs-triage: $(gh issue list --label needs-triage --state open --json number --jq 'length' 2>/dev/null || echo 0)"
echo "  needs-info: $(gh issue list --label needs-info --state open --json number --jq 'length' 2>/dev/null || echo 0)"
echo "  ready-for-human: $(gh issue list --label ready-for-human --state open --json number --jq 'length' 2>/dev/null || echo 0)"
echo "  closed (recent): $(gh issue list --state closed --json number --jq 'length' 2>/dev/null || echo 0)"
echo ""

# Show ready-for-agent issues
echo "Ready for agent:"
gh issue list --label ready-for-agent --state open --json number,title --jq 'reverse | .[] | "  #\(.number) \(.title)"' 2>/dev/null || echo "  (none)"
echo ""

echo "--- Last 10 lines of progress.txt ---"
tail -10 progress.txt 2>/dev/null || echo "(no progress.txt yet)"
