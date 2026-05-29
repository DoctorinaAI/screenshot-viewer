#!/usr/bin/env bash
# Stop hook: reminds about the right verification step when the turn touched
# UI source, Firebase rules, or the manifest schema.
#
# Reads the Stop-hook JSON event on stdin, walks the transcript for
# Edit/Write/NotebookEdit tool_use entries, and emits the documented
# {"hookSpecificOutput":{"hookEventName":"Stop","additionalContext":"…"}} JSON.

set -euo pipefail

# stop_hook_active=true means we're being re-entered from our own decision —
# bail out to avoid infinite loops (per Claude Code hook spec).
event=$(cat)
if printf '%s' "$event" | jq -e '.stop_hook_active == true' >/dev/null 2>&1; then
    exit 0
fi

transcript=$(printf '%s' "$event" | jq -r '.transcript_path // empty')
if [[ -z "$transcript" || ! -f "$transcript" ]]; then
    exit 0
fi

# Collect Edit/Write/NotebookEdit targets. Transcript is JSONL: one message per line.
paths=$(jq -r '
    select(.type == "assistant")
    | .message.content[]?
    | select(.type == "tool_use" and (.name == "Edit" or .name == "Write" or .name == "NotebookEdit"))
    | .input.file_path // empty
' "$transcript" 2>/dev/null || true)

touched_tsx=false
touched_rules=false
touched_schema=false

while IFS= read -r p; do
    [[ -z "$p" ]] && continue
    case "$p" in
        */src/*.tsx|*/src/*.ts|*/src/*.css) touched_tsx=true ;;
        */firebase/*.rules|*/firebase/firestore.indexes.json) touched_rules=true ;;
        */docs/manifest-schema.md|*/src/shared/lib/schema.ts) touched_schema=true ;;
    esac
done <<< "$paths"

if ! $touched_tsx && ! $touched_rules && ! $touched_schema; then
    exit 0
fi

msg="Reminder before reporting task as done:"
if $touched_tsx; then
    msg+=$'\n  src/ changed -> bun run check && bun run typecheck && bun run build'
    msg+=$'\n                  Playwright walk at 360/768/1280/1920 px in light + dark (verify-changes skill)'
    msg+=$'\n                  Sanity: no destructured props, no ternaries-with-JSX, no useEffect'
fi
if $touched_rules; then
    msg+=$'\n  firebase/ rules or indexes changed -> confirm @doctorina.com gate + sign_in_provider check'
    msg+=$'\n                                       no allow read/write: if true anywhere'
    msg+=$'\n                                       plan /deploy-firebase when ready'
fi
if $touched_schema; then
    msg+=$'\n  schema changed -> mirror in scripts/upload_integration_screenshots.py on DoctorinaAI/doctorina'
    msg+=$'\n                    bump schemaVersion if not backward-compatible'
    msg+=$'\n                    add a Zod parse test in src/shared/lib/schema.test.ts'
fi

# additionalContext feeds the reminder back into the model without blocking.
jq -n --arg c "$msg" '{hookSpecificOutput: {hookEventName: "Stop", additionalContext: $c}}'
