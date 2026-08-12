# ArtCraft MCP: Live App Control ("patched app + live control")

## Coordination (project-coordinator handoff)

- **Linear**: project "ArtCraft MCP" under team **Hive Mind**, with milestones below, every issue a standalone prompt (Objective/Context/Task/Acceptance/Notes), a "Lessons Log" project document, phase labels + priority ladder + blockedBy for true dependencies only.
- **Git**: fork `storytold/artcraft` → `performance-clickt/artcraft` (gh is authed as performance-clickt). `origin` = fork, `upstream` = storytold. Unshallow the clone (`git fetch --unshallow`). Per-issue branch + worktree + PR; agent claims the Linear issue before touching git; user approves merges — no self-merging.
- **Root docs**: `docs/PROJECT.md` + brief + `tasks/todo.md` + customized root `CLAUDE.md` in the repo clone at `/Users/johngreenhow/Artcraft/artcraft-src`. Repo already ships an upstream `CLAUDE.md` → merge, never overwrite (project sections appended with approval).
- **Token efficiency (Ollama MCP)**: local models verified present — `devstral-small-2:latest` (code) and `muse-glimmer:30b-mlx`. CLAUDE.md policy: use `mcp__ollama__ollama_dispatch` for mechanical, high-token, low-judgment work — summarizing long upstream files, extracting schemas/signatures, first-draft boilerplate (repetitive axum endpoint bodies, TS invoke wrappers, eval question drafts) with `files`/`file_globs` so file contents never enter frontier context. Ollama output is untrusted: Claude/Codex reviews and integrates; never use local models for final review, verification, or correctness judgments.
- **Codex handoff**: issues are written to be executable by Claude Code *or* Codex cold. Well-bounded implementation issues (single-file endpoint batches, TS tool wrappers) may be dispatched via the `codex:codex-rescue` agent / `codex:rescue` skill; verification still runs in the primary agent per CLAUDE.md gates.

### Milestones & issues

**M1 — Baseline: fork + stock build runs** (integration check: unmodified app builds, launches, reuses login)
1. Fork repo, rewire remotes, unshallow, branch strategy (Ops)
2. Verify toolchain + run stock dev build end-to-end (Node≥20/npm/tauri-cli/Rust; both dev scripts; app launches logged-in)

**M2 — Control server, Path A** (integration check: curl matrix green incl. 401s; cheap image gen via curl)
3. Control server skeleton: axum + spawn thread + discovery/state file (0600) + bearer auth + `/v1/health`
4. Read endpoints: `/v1/models`, `/v1/credits`, `/v1/estimate_cost`
5. Generation endpoints: `/v1/generate/{image,video,object,world,bg_removal}`
6. Task + media endpoints: `/v1/tasks`, `/v1/tasks/{id}`, `/v1/media/download`, `/v1/media` (list via artcraft_client)

**M3 — Scene bridge** (integration check: scene ops via curl with 3D tab open; SCENE_NOT_ACTIVE + timeout paths verified)
7. Rust bridge: `TauriEventName::ControlSceneRequest`, event struct, `ControlBridgeState` oneshot map, `control_bridge_reply_command`, `/v1/scene/{op}`
8. Frontend bridge: event hook (tauri-events), reply wrapper (tauri-api), `ControlBridge.tsx`, `root.tsx` mount, index exports

**M4 — MCP server** (integration check: all 16 tools green in MCP inspector)
9. Scaffold `mcp/artcraft-mcp` + control-client (discovery, auth, health, truncation) + status/models/cost tools
10. Generation + task tools: `generate_*`, `remove_background`, `list_tasks`, `wait_for_task`
11. Media + scene tools: `download_media`, `list_media`, `scene_list_objects`, `scene_get`, `scene_apply`, `scene_update_object`
12. README + Claude Code/Codex registration docs + inspector smoke run

**M5 — Verification & evals** (integration check: e2e prompt passes; eval suite recorded)
13. End-to-end via Claude Code: register MCP, run "generate image → place in scene → move it" flow live
14. Author + run 10 read-only evals per build-mcp skill (seeded 3-object scene + known library item)

Execution order: milestone order; within milestone, ascending issue number; 3↔4 and 9↔10↔11 pairs parallelizable across agents after their skeleton issue lands; blockedBy only across milestones' true gates (2→3, 3→4/5/6, 7→8, 9→10/11, 12→13, 13→14).


## Context

John wants to drive the ArtCraft desktop app (AI image/video/3D scene IDE, open-source Tauri app) from Claude Code or Codex — no LLM API keys inside the app. The running release app is a closed box (no local server, IPC, deep links, or devtools), so we patch the app source (cloned at `/Users/johngreenhow/Artcraft/artcraft-src`) to embed a loopback control server, and build a standalone MCP server that talks to it. John chose this over a backend-API-only MCP because he wants Claude to drive the *live* window (real-time scene edits he can watch). Built per the `mcp:build-mcp` skill.

Bonus alignment: the repo's own `pagescene/CLAUDE.md` describes a planned-but-unbuilt "LLM edits the scene-descriptor JSON" feature — this ships that design externally.

## Architecture

```
Claude Code ──stdio──> MCP server (TypeScript, mcp/artcraft-mcp/)
                          │ HTTP + Bearer token (discovery: ~/Artcraft/state/control_server.json)
                          ▼
              Control server (axum, in-app, 127.0.0.1:ephemeral)
               ├─ Path A: directly calls existing command handle_request fns via AppHandle state
               │   (generate image/video/mesh/world, models, cost, tasks, credits, downloads, library)
               └─ Path B: scene bridge → Tauri event → <ControlBridge/> in webview
                   → getActiveEditor() / applyJson() / getSceneJson() → reply command → oneshot correlation
```

Key facts (verified):
- Dev build works with no secrets: `SQLX_OFFLINE=true`, no signing/updater/integrity checks; local build shares `~/Artcraft` data dir + cookie jar (`~/Library/Caches/ai.artcraft.app/.cookies`) with the installed app, so it **reuses the existing login**.
- Webview CSP blocks `fetch` to 127.0.0.1 → control server lives Rust-side; webview only sees Tauri events/commands. No CSP/capability changes.
- `getActiveEditor(): Editor | null` is a module global explicitly for non-React callers ([EngineContext.tsx:16-26](frontend/libs/components/pagescene/src/lib/contexts/EngineContext/EngineContext.tsx)); `editor.applyJson(jsonString)` ([editor.ts:912]) + `editor.save_manager.getSceneJson({sceneGenerationMetadata})` ([save_manager.ts:142]) round-trip the scene. Null when the 3D tab isn't mounted → `SCENE_NOT_ACTIVE` error.
- Scene JSON: `{version, scene: ObjectJSON[], positivePrompt, cameraAspectRatio, timeline, skybox, camera_data, cameras, selectedCameraId}`; `ObjectJSON` in `proxy/storyteller_proxy_3d_object.ts`.
- Existing patterns to mirror: background thread (`core/threads/third_party_task_polling_thread/`), spawn task files (`core/lifecycle/startup/tasks/spawn_*.rs`), command file layout (`core/commands/media_files/media_file_delete_command.rs`), events (`BasicSendableEvent` + `TauriEventName` enum + hand-mirrored TS hooks in `frontend/libs/tauri-events`), invoke wrappers (`frontend/libs/tauri-api`, payload nests `{request: {...}}`).

## Control protocol

- Discovery file `~/Artcraft/state/control_server.json` (0600): `{version, pid, port, token, started_at}`; token 32-byte hex per launch; `Authorization: Bearer <token>` on every request.
- Envelope: `{"success": true, "data": ...}` | `{"success": false, "error": {"code", "message"}}`. Codes: `UNAUTHORIZED, BAD_REQUEST, NOT_LOGGED_IN, SCENE_NOT_ACTIVE, SCENE_BRIDGE_TIMEOUT, TASK_NOT_FOUND, UPSTREAM_API_ERROR, INTERNAL`.
- Endpoints: `GET /v1/health`, `GET /v1/models?kind=image|video`, `POST /v1/estimate_cost`, `POST /v1/generate/{image,video,object,world,bg_removal}`, `GET /v1/tasks[?limit&cursor]`, `GET /v1/tasks/{id}`, `POST /v1/media/download`, `GET /v1/media?search&cursor&limit` (new thin handler over `artcraft_client` + `StorytellerCredentialManager` — single auth path; do NOT parse the cookie jar in the MCP server), `GET /v1/credits`, `POST /v1/scene/{status,list_objects,get_scene,apply_scene,update_object}`.
- Scene bridge: endpoint makes `request_id: Uuid` + `oneshot::Sender` in managed `ControlBridgeState{pending: Mutex<HashMap<..>>}` → emits `ControlSceneRequestEvent{request_id, op, payload}` → `<ControlBridge/>` executes against `getActiveEditor()` → replies via new `control_bridge_reply_command` → handler fires the oneshot; HTTP side `tokio::time::timeout(10s)`.

## MCP tools (16, TypeScript, @modelcontextprotocol/sdk, stdio)

No `artcraft_` prefix (Claude Code namespaces as `mcp__artcraft__*`). List tools take `response_format: concise|detailed` (default concise), `limit`/`cursor`; responses capped ~25k chars with truncation notice.

| Tool | Notes |
|--------------------------|--------------------------------------------------------------|
| `get_status`             | version, logged_in, credits                                  |
| `list_models`            | kind=image\|video                                            |
| `estimate_cost`          | pre-flight credits                                           |
| `generate_image`         | wait=true default, timeout_seconds=180                       |
| `generate_video`         | returns task_id → "use wait_for_task" (minutes-long)         |
| `generate_3d_object`     | image → mesh, task_id                                        |
| `generate_3d_world`      | image → splat/world, task_id                                 |
| `remove_background`      | wait=true default                                            |
| `list_tasks`             | queue snapshot                                               |
| `wait_for_task`          | poll 3s, timeout cap 300s; timeout = normal outcome, not error |
| `download_media`         | media_token → local path                                     |
| `list_media`             | library list/search                                          |
| `scene_list_objects`     | token-light rows (uuid, name, transform, visible, locked)    |
| `scene_get`              | full scene JSON                                              |
| `scene_apply`            | replaces scene (description warns)                           |
| `scene_update_object`    | transform/rename/show-hide one object by uuid (bridge does get→patch→applyJson) |

Errors are actionable: "ArtCraft is not running. Launch the patched app, then retry."; "Open the 3D scene tab in ArtCraft first."

## File manifest

**New Rust** (under `crates/desktop/artcraft/src/core/`): `control_server/{mod.rs, state/control_server_settings.rs, state/control_bridge_state.rs, state_file/write_control_state_file.rs, auth/bearer_auth_layer.rs, envelope/control_response.rs, endpoints/*.rs (health, models, estimate_cost, generate_image, generate_video, generate_object, generate_world, bg_removal, tasks, media_download, media_list, credits, scene), scene_bridge/{emit_scene_request.rs, await_bridge_reply.rs, scene_op.rs}}`; `commands/control/control_bridge_reply_command.rs`; `events/control_scene_request_event.rs`; `lifecycle/startup/tasks/spawn_control_server_thread.rs` (bind `127.0.0.1:0`, write state file, `tauri::async_runtime::spawn(axum::serve(..))`, log-and-continue on failure — never crash the app).

**New frontend**: `frontend/libs/tauri-events/src/lib/events/functional/ControlSceneRequestEvent.ts` (EVENT_NAME `"control_scene_request"`); `frontend/libs/tauri-api/src/lib/control/ControlBridgeReply.ts`; `frontend/apps/artcraft/app/src/control/ControlBridge.tsx` (renders null).

**New MCP**: `mcp/artcraft-mcp/` top-level dir (outside Nx and cargo workspaces): `package.json, tsconfig.json, README.md, src/{index.ts, control-client.ts, format.ts, tools/{generation,tasks,media,scene,status}.ts}, evals/`.

**Edited upstream files (8, keep patch rebasable)**:
1. root `Cargo.toml` — axum in workspace deps
2. `crates/desktop/artcraft/Cargo.toml` — axum, uuid
3. `crates/desktop/artcraft/src/lib.rs` — `.manage(ControlBridgeState)` (~line 196-209) + register `control_bridge_reply_command` (~line 213-265; must stay in lib.rs) + mod wiring
4. `crates/desktop/artcraft/src/core/lifecycle/startup/handle_tauri_startup.rs` — import + one spawn call
5. `crates/schema/public/enums/src/tauri/ux/tauri_event_name.rs` — `ControlSceneRequest` variant (`#[serde(rename = "control_scene_request")]`, name ends `_event` convention check)
6. `frontend/apps/artcraft/app/src/root.tsx` — mount `<ControlBridge />` next to `<Outlet />` inside `<PostHogProvider>` (verified: App at line 45)
7. `frontend/libs/tauri-events/src/index.ts` — export line
8. `frontend/libs/tauri-api/src/index.ts` — export line
(+ append-only `mod.rs` lines in commands/, events/, startup/tasks/)

Repo conventions: two-space indent, `log` macros not `println!`, one command per file, constants-first file layout, `ResponseOrErrorMessage<T>` responses, `maybe_` optional fields.

## Implementation order

1. **Toolchain check + first build** (riskiest step, do first): Node ≥20, npm (pnpm blocked), `cargo install tauri-cli --version "^2"`; terminal 1 `./script/artcraft/unix_frontend_dev.sh`, terminal 2 `./script/artcraft/unix_rust_dev.sh` (both from repo root). Confirm stock app builds, launches, and reuses existing login before touching anything. Work on a branch (`git checkout -b mcp-control`).
2. Control server skeleton: health + models + credits → curl smoke test.
3. Remaining Path A endpoints (generate/tasks/media/cost/download) → curl a cheap image generation end-to-end. Audit each target command's `handle_request` signature first; prefer inner fns; widen visibility only in the command's own file; anything window-bound goes via scene bridge instead.
4. Scene bridge (enum variant, event, reply command, ControlBridge component, root.tsx mount) → curl scene ops with 3D tab open and closed.
5. MCP server + `npx @modelcontextprotocol/inspector` testing.
6. Claude Code registration (`claude mcp add artcraft -- node .../mcp/artcraft-mcp/dist/index.js`), end-to-end: "generate an image, place it in the scene, move it up 2 units".
7. Evals per build-mcp skill: 10 read-only Q&A (models count/providers, credits balance, cost estimate, task queue state, scene object count/positions/hidden objects, library search, login/version, aspect ratios) in the skill's XML format; seed a known 3-object scene + known library item first.

## Risks

- `handle_request` signature variance → audit per-command before wiring; fall back to scene-bridge-style dispatch for anything window-bound.
- Rebase drift → 8 edited files (5 append-only); all logic in new files; document edit points in README.
- Bridge hangs → hard 10s timeout, map cleanup on both paths; unknown request_id replies dropped with log.
- Stale discovery file → MCP health-checks and re-reads on connection-refused; pid in file.
- Credits spend in testing → estimate_cost first, cheapest model, batch_size 1; evals read-only.
- `scene_apply` clobbers work → warning in tool description; surgical edits go through `scene_update_object`.

## Verification

- Curl matrix: 401 without token; health/models/credits/tasks with token; `SCENE_NOT_ACTIVE` when 3D tab closed; timeout path.
- Inspector: every tool once; `scene_update_object` visually confirmed live in the open window; `scene_get`→`scene_apply` unmodified round-trip = no visual change.
- Claude Code end-to-end prompt exercising generate → wait → download → scene edit.
- Eval file run per build-mcp skill harness.
