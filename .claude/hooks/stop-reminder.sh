#!/usr/bin/env bash
# Stop-hook: nudge the agent toward the right verification when the turn
# touched UI code. Reads the conversation transcript from stdin (Claude Code
# wiring) — but the heuristic is just "look at the modified file list".

set -euo pipefail

# Files modified in the last turn — Claude Code exposes them via env.
changed="${CLAUDE_CHANGED_FILES:-}"

# Skip when there's nothing to remind about.
if [[ -z "$changed" ]]; then
  exit 0
fi

touched_tsx=false
touched_rules=false
touched_schema=false

while IFS= read -r path; do
  case "$path" in
    src/*.tsx|src/**/*.tsx) touched_tsx=true ;;
    firebase/*.rules)        touched_rules=true ;;
    docs/manifest-schema.md|src/shared/lib/schema.ts) touched_schema=true ;;
  esac
done <<< "$changed"

remind() { printf '\n%s\n' "$1" >&2; }

if $touched_tsx; then
  remind "→ UI touched. Before claiming done:
  • bun run check && bun run typecheck
  • Playwright walk at 360 / 768 / 1280 / 1920 px in light + dark (see verify-changes skill)
  • Confirm: no destructured props, no ternaries-with-JSX, no useEffect"
fi

if $touched_rules; then
  remind "→ Rules touched. Before claiming done:
  • Confirm the @doctorina.com domain regex is still in place
  • Confirm no allow read/write: if true anywhere
  • Plan a firebase deploy --only firestore:rules,storage when ready"
fi

if $touched_schema; then
  remind "→ Schema touched. Before claiming done:
  • Mirror the change in scripts/upload_integration_screenshots.py (Python writer) in DoctorinaAI/doctorina
  • Bump schemaVersion if the change is not backward-compatible
  • Add a Zod parse test in src/shared/lib/schema.test.ts"
fi

exit 0
