# The collaboration behavior suite (Artcraft's projections)

> The shared suite every Craft app runs before its CraftHub integration is enabled (the CraftHub
> specification §18.9): each row is one automated test with a written scenario, in the family's
> behaviour-suite tradition. This file is Artcraft's copy of the shared catalog: the scenarios
> are identical in every app, and the *projections* column is where each app writes what the
> scenario means for its own UI.

## The scenarios

| #  | Scenario                               | The guarantee under test                                                                                                   | Artcraft's projection                                                                                                                                          |
|----|----------------------------------------|----------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1  | Join by code, join by link             | One argument that recognizes itself; the file opens in its own tab, other sessions untouched                                | `artcraft://join?...` opens the project; the other open editors keep their state (the web UI tabs are per-project)                                              |
| 2  | Concurrent editing converges           | Snapshot-hash equality after arbitrary interleavings, drops and reconnects (per seed)                                      | The scene after convergence equals the reference render tree; the shared job log agrees on every job's status                                                  |
| 3  | Read-only, with its reason             | The reason is shown (view link, role without edit, region lock), never just a badge                                         | The mode bar shows "view link" / "viewer role" / "locked region" with the region tinted                                                                        |
| 4  | Batch refused with fixes               | The server's refusal carries the fixes; the client applies them and lands on the server state                              | A layer dropped into a `scene_3d` snaps back with a toast naming the project type it belongs to                                                                |
| 5  | Per-user undo                          | My steps are mine alone; later writes by others survive my undo                                                            | Undo after a peer's move undoes only my move; their placed object stays where they put it                                                                     |
| 6  | Offline, then resume as the same client| The recovery copy reattaches; unsent changes replay or land as a "(recovered copy)" beside the file                        | An unsent scene edit replays on reconnect; the generation jobs that finished offline appear in the shared job log on resume                                    |
| 7  | Cursor chat and its bounds             | ≤100 characters, ephemeral, never enters the document or the journal                                                       | The bubble renders at the peer's cursor over the viewport for its lifetime, then is gone                                       |
| 8  | Spotlight and follow                   | Follow tracks view and page; any view movement of mine stops the follow                                                    | The 3D viewport animates to the presenter's camera orbit; my own orbit breaks the leash instantly                                                             |
| 9  | Presence and per-app projections       | Ephemeral, throttled to change-only, bounded sizes                                                                         | Cursor, selection outlines, viewport — and the `generating: (job id, model)` badge while a peer's generation job is in flight                                  |
| 10 | Region locks                           | Locks sync as document properties; locked regions tint; the reason is shown                                                | A locked group or timeline track tints; editing inside it is refused with "locked by \<name\>"                                                                |
| 11 | Contribution, review, merge            | The branch lives inside the live session; merge is one undo step; each side's changes show                                 | The review panel shows both sides' property diffs over the scene tree and the team-output feed                                                               |
| 12 | Comments and their anchors             | Anchor kinds per app; comments are entries with ids and order                                                              | Artcraft anchors a comment to a scene object (the selection); the pin rides the object                                                                       |
| 13 | Background file notifications          | Delivered when the tab is not front; bounded, dismissible                                                                  | The tab badge shows "3 new" while a teammate's generations land in the feed behind the front editor                                                           |
| 14 | Closing a file ends its session alone  | Other sessions keep syncing behind the front tab                                                                          | Closing one shared project never drops another project's peers                                                               |
| 15 | The revert guard                       | `file.revert` is refused while its document is in a live session (including reconnect and pre-welcome)                     | The toast says "leave the session before reverting"; the project and its media references are intact                                                          |

## Artcraft's adapter surface (what the suite drives)

* **Property table** — the seven synchronized `SceneNode` fields (`name`, `kind`, `visible`,
  `locked`, `transform`, `media`, `payload`) with the compile-time guard
  (`artcraft-hub::props`); the editors' richer per-node JSON (poses, animations, effects,
  graph edges) rides `payload`, last-writer-wins — the honest carrier for what the TypeScript
  editors own.
* **The kind table** — per project type, mirroring the real `MediaFileProjectType`: `object`,
  `character`, `camera`, `skybox`, `group` in a `scene_3d`; `layer` in an `editor_2d`; `track`
  and `clip` in a `video_timeline`; `step` in a `workflow`; `boardImage` in a `mood_board`.
  The server validates kind-versus-type from the document's own `projectType` property.
* **Position keys** — the fractional sibling keys live beside the project (`ArtcraftHub`),
  assigned by current order at first sync, kept by the longest rising run under edits.
* **The shared inputs** — the job log (the `tasks` table's shape, keyed `job:<task id>`) and
  the team-output feed (keyed `output:<media token>`), plus the media references (keyed
  `reference:<token>`): three per-entry document lists with their orders
  (`artcraft-hub::schema`).
* **Presence** — cursor, selection, viewport, the timeline playhead when one is open, and the
  in-flight generation job `generating: (job id, model)` (`artcraft-hub::presence`) — §18.4
  row 12's projection. A generation is progress-like, so it rides presence, not batches:
  nothing enters the document until the backend reports the job into the shared job log.
* **Commands** — the unified `hub.*` catalog (`artcraft-hub::commands`): same names in every
  Craft app, the explicit lexical-unification rule.
* **Deep links** — `artcraft://join?<code\|token>&server=<url>` (`artcraft-hub::deeplink`).
* **The IPC path** — the Hub client lives in the Rust backend; the web UI calls the `hub.*`
  Tauri commands through the same `invoke` surface every other command uses
  (`frontend/libs/tauri-api/src/lib/<domain>/`), all behind the desktop app's `crafthub`
  feature flag.

## The enable rule

No app is enabled before its protocol core passes its simulation tests in CI for a full week
(nightly, fixed seeds) — and enabling happens through the app's own `crafthub` feature flag,
never through the core, so a regression is one flag flip away from off (§18.4).
