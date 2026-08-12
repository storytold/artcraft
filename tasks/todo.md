# Local scratchpad — ArtCraft MCP

Linear is the record; this file is the resume map for the next session.

## 2026-08-12 (later) — Round 1: cmake blocker resolved, executor resumed

1. **Phase:** round 1, lane HM-915 resumed after halt. Executor hit missing `cmake` (boring-sys2 build dep) at 621/810 crates and halted per rules; John approved `brew install cmake` (v4.4.2 installed); executor resumed in background to re-run the build, verify logged-in launch, post wrap-up, move HM-915 → In Review.
2. **Frontend already verified PASS** (Vite :5173, 200 OK). Toolchain: node v22.22.2, rustc/cargo 1.96.0, cargo tauri 2.11.4 (installed by executor), global nx v23.1.1 (installed by executor — undocumented prerequisite of unix_frontend_dev.sh).
3. **Lesson candidates queued for learnings loop:** (a) verify native build deps (cmake etc.) up front, not just language toolchains; (b) `_docs/dev_setup.md` omits cmake and global nx → new-issue candidate for a docs fix.
4. **Cold-start successor:** step 1 — check HM-915: In Review + wrap-up = done, start round 2 (lane HM-916); still In Progress with no build running (`pgrep -f 'cargo tauri'`) = executor died, re-run both dev scripts from repo root (cmake now present), verify, wrap up, In Review.

## 2026-08-12 — Round 1 in flight (orchestrator) (superseded)

1. **Phase:** round 1, single lane launched, waiting on executor. Board: HM-914 Done; HM-915 In Progress (owned by this session's executor); HM-916..927 Backlog, all gated on HM-915→HM-916.
2. **Running background work:** Opus executor on HM-915 (agent notification pending in this session; not resumable cross-session — if session died, treat lane as stale, see step below).
3. **Lane HM-915:** verification-only issue; runs in the LIVE tree /Users/johngreenhow/Artcraft/artcraft-src on `main` @ bed3bad43c (accepted deviation, disclosed on the issue: no branch/worktree/PR, zero commits — stock dev-build proof). Executor will post one wrap-up comment and move to In Review. Hazard: two dev processes (Vite :5173, cargo tauri dev) may be running; executor terminates them on success.
4. **Open decisions:** none.
5. **Cold-start successor:** step 1 — check HM-915 in Linear: if In Review with wrap-up, proceed to round 2 (lane = HM-916, worktree branch `john/hm-916-...` off main, Opus); if still In Progress with no wrap-up and no live build processes (`pgrep -f 'cargo tauri'`), the executor died — kill stray Vite/cargo processes, re-run HM-915 per its plan comment, in the live tree, no commits.

Coordination docs committed and pushed as bed3bad43c on main (origin=performance-clickt/artcraft).
