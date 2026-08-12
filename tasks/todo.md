# Local scratchpad — ArtCraft MCP

Linear is the record; this file is the resume map for the next session.

## 2026-08-12 — Round 1 in flight (orchestrator)

1. **Phase:** round 1, single lane launched, waiting on executor. Board: HM-914 Done; HM-915 In Progress (owned by this session's executor); HM-916..927 Backlog, all gated on HM-915→HM-916.
2. **Running background work:** Opus executor on HM-915 (agent notification pending in this session; not resumable cross-session — if session died, treat lane as stale, see step below).
3. **Lane HM-915:** verification-only issue; runs in the LIVE tree /Users/johngreenhow/Artcraft/artcraft-src on `main` @ bed3bad43c (accepted deviation, disclosed on the issue: no branch/worktree/PR, zero commits — stock dev-build proof). Executor will post one wrap-up comment and move to In Review. Hazard: two dev processes (Vite :5173, cargo tauri dev) may be running; executor terminates them on success.
4. **Open decisions:** none.
5. **Cold-start successor:** step 1 — check HM-915 in Linear: if In Review with wrap-up, proceed to round 2 (lane = HM-916, worktree branch `john/hm-916-...` off main, Opus); if still In Progress with no wrap-up and no live build processes (`pgrep -f 'cargo tauri'`), the executor died — kill stray Vite/cargo processes, re-run HM-915 per its plan comment, in the live tree, no commits.

Coordination docs committed and pushed as bed3bad43c on main (origin=performance-clickt/artcraft).
