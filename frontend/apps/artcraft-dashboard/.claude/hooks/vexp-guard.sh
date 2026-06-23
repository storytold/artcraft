#!/bin/bash
# vexp-guard: block Grep/Glob when vexp daemon is running AND index is healthy.
# Fast path: if socket file or healthy marker doesn't exist, allow immediately.
# PID check: verify daemon process is alive (handles stale files after kill -9).
VEXP_DIR="${CLAUDE_PROJECT_DIR:-.}/.vexp"
SOCK="$VEXP_DIR/daemon.sock"
HEALTHY="$VEXP_DIR/healthy"
PID_FILE="$VEXP_DIR/daemon.pid"
if [ -S "$SOCK" ] && [ -f "$HEALTHY" ] && [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE" 2>/dev/null)" 2>/dev/null; then
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"vexp daemon is running. Use run_pipeline instead of Grep/Glob."}}'
else
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow","permissionDecisionReason":"vexp index not ready, allowing direct search fallback."}}'
fi
exit 0
