# ArtCraft MCP

**Brief:** [artcraft-mcp-brief.md](./artcraft-mcp-brief.md)
**Linear project:** https://linear.app/clickt/project/artcraft-mcp-6759fa1b04b7
**Team:** Hive Mind
**Lessons Log:** the Linear document named "Lessons Log" on this project
**Domain:** software
**Client-facing identity:** John Greenhow (personal tooling; fork of open-source storytold/artcraft)
**Tools & channels:** Fork at github.com/performance-clickt/artcraft (upstream storytold/artcraft), Linear (Hive Mind), Ollama MCP (devstral-small-2, muse-glimmer:30b-mlx) for token-efficient dispatch, Codex as optional executor, MCP inspector for testing

## Summary

Patch the open-source ArtCraft Tauri desktop app with an embedded loopback control server (axum, token-authenticated, ephemeral port + discovery file) and build a standalone TypeScript MCP server so Claude Code or Codex can drive the live app: image/video/3D generation, task queue, library, and real-time 3D scene editing via a webview bridge. The running release app has no external control surface, so the app is built from source on a fork kept rebasable on upstream (8 edited files, all logic in new files).

## Milestones

1. **M1 — Baseline** — fork wired, stock dev build runs, login reused
2. **M2 — Control server (Path A)** — axum server, auth, models/credits/cost, generation, tasks/media endpoints; curl matrix green
3. **M3 — Scene bridge** — Rust event↔oneshot bridge + frontend ControlBridge; live scene ops via curl
4. **M4 — MCP server** — mcp/artcraft-mcp, 16 tools, inspector green
5. **M5 — Verification & evals** — Claude Code end-to-end flow + 10 read-only evals

## Key decisions

See the brief's **Coordination** and **Architecture** sections — decisions made after planning live in the affected Linear issues, not here.

## How work happens here

All work is tracked in Linear; every issue is written to be executed as a standalone prompt. Session rules live in the root [CLAUDE.md](../CLAUDE.md). This document is orientation only — no status, no task lists (they would drift from Linear, and Linear wins).
