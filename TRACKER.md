# Tracker

One row per change in the fork bug-fix pass. Paths are relative to the repo root. Nothing here is
committed yet; the maintainer commits from their own terminal (no tool-generated trailers).

The bug-by-bug map (fixed, noted, owner-gated, review queue) is `BUGS.md`; this file is the per-change log.

Build numbers: the current fork build is in the `BUILD` file at the repo root. Everything listed below
(the whole 2026-10-17 pass) is **build 1**. From the next committed batch on, increment `BUILD`, add a
`Build` mention to the new rows and a matching `CHANGELOG.md` heading ("Build N").

Verification at the time of writing (2026-10-17):
- `cargo check --workspace --all-targets`: pass (earlier in the day)
- `cargo test --workspace`: 5855 passed, 0 failed (earlier in the day, before the later batches)
- Final re-check after the last batch: `cargo test -p artcraft` 139 passed, 0 failed (16 aspect-ratio tests failed until B-72 was fixed); `cargo test -p fal_client` 877 passed, 0 failed
- `npx tsc -b` in `frontend/apps/artcraft`: 0 errors (final tree)
- `npm run lint` in `frontend/apps/artcraft`: 0 problems (final tree)
- `node tools/testing/run-all-unit-tests.mjs` in `frontend/` (vitest in each of 61 packages, plus the app suite of 41 files / 335 tests): 61 packages run, 0 failed, 898 tests passed in total

## Done

| Date | Area | Files | Summary |
|---|---|---|---|
| 2026-10-17 | Rust | `crates/desktop/artcraft/.../handle_web_login_providers.rs` | `unimplemented!()` panic replaced by `warn!` and `Err(GenerateError::NotYetImplemented)` |
| 2026-10-17 | Rust | `handle_worldlabs_marble.rs`, `handle_artcraft_splat_via_router.rs` | Task type set to `TaskType::GaussianGeneration` |
| 2026-10-17 | Rust | `notify_frontend_of_completion.rs` | `cdn_url_or_placeholder` helper for jobs with no CDN URL |
| 2026-10-17 | Rust | `handle_storyteller_failed_job.rs` | Failure message forwarded as `reason` |
| 2026-10-17 | Rust | `storyteller_task_polling_thread.rs` | Handler error logged instead of aborting the thread |
| 2026-10-17 | Rust | `initially_size_and_position_windows.rs`, `position_main_window.rs`, `load_provider_priority_state.rs` | `println!` converted to `log` macros |
| 2026-10-17 | Rust | `grok_upload_file.rs` | Bytes upload implemented |
| 2026-10-17 | Rust | `grok_consumer_client/Cargo.toml`, `worldlabs_consumer_client/Cargo.toml` | Missing feature flags: uuid `v4`, indexmap `serde` |
| 2026-10-17 | Frontend | `UploadFilesMedia.tsx`, `UploadImageMedia.tsx`, `UploadImageMediaModal.tsx`, `UploadModalMedia.tsx` | FileUploader props, import, missing `default` case |
| 2026-10-17 | Frontend | `libs/tauri-api/.../GenerateImage.ts`, `MediaUploadApi.ts`, `ApiManager.ts`, `MediaFilesApi.ts` | Type fixes |
| 2026-10-17 | Frontend | `switch.tsx`, `ProviderPrioritySettingsPane.tsx`, `withProtectedRoute.tsx`, `PageBackgroundChange.tsx`, `authentication.ts`, `scene.spec.ts` | Type and lint fixes |
| 2026-10-17 | Frontend | `libs/{api,api-enums,model-list}/vite.config.ts`, `tsconfig.spec.json` (x3), about 48 other `tsconfig.spec.json` | NodeNext `.js` import and `rootDir` fixes |
| 2026-10-17 | Frontend | `root.tsx`, `$sceneToken.tsx`, `_index.tsx` | `@remix-run/deno` replaced by `@remix-run/node` |
| 2026-10-17 | Frontend | `apps/artcraft/package.json`, `.eslintrc.cjs` | lint script fixed; vendored bundle ignored; `no-explicit-any` off for tests; `test` script changed from `jest` to `vitest run` |
| 2026-10-17 | Frontend | `DesktopGenerationGallery.tsx` | Real bug: `handleDownload` dependency list (stale closure) |
| 2026-10-17 | Frontend | `Storyboard.tsx`, `CostModal.tsx` | Accessibility label/input fixes |
| 2026-10-17 | Frontend | `ImageTo3DExperience.tsx`, `GlobalFileDropHandler.tsx`, `TopBar.tsx`, `TextToImageStore.ts`, `TaskQueue.tsx`, `Angles.tsx`, `MainApp.tsx`, `PageDraw.tsx`, `galleryModalTauriBindings.ts`, `DevConsoleFlags.ts`, `useDesktopGenerationFeed.ts`, `EngineApi.test.ts` | Lint and type cleanups (unused vars, `any`, casts); behavior unchanged |
| 2026-10-17 | Frontend tests | 18 scaffold specs | Rewritten into real specs |
| 2026-10-17 | Frontend tests | `apps/artcraft/vitest.config.ts`, `test/setup/jestCompat.ts`, `package.json` | ApiManager suites moved onto vitest (jest was never installed) |
| 2026-10-17 | Frontend tests | `ApiManager.test.ts`, `VideoApi.test.ts`, `WeightsApi.test.ts` | Stale expectations updated to current code |
| 2026-10-17 | Frontend tests | `MediaFileApi.test.ts`, `MediaUploadApi.test.ts` | Now test the live `@storyteller/api` classes; upload tests spy on `fetchMultipartFormData`; list/rename/batch expectations match the lib (repeated `tokens=` params, `/v1/media_files/rename/`, `username` in the user-list query) |
| 2026-10-17 | Frontend tests | `frontend/vitest.workspace.ts` | Duplicate "artcraft" project fixed by excluding `apps/artcraft/vite.config.ts` and `sb-vite.config.ts`, plus `node_modules` and `dist` |
| 2026-10-17 | Frontend tests | `frontend/tools/testing/run-all-unit-tests.mjs`, `frontend/package.json` | New root `npm test`: runs vitest inside each package (a combined root run breaks `video-editor`'s wasm loading) |
| 2026-10-17 | Frontend tests | `provider-billing-modal.spec.tsx` | Mocks the Tauri `listen` call (no Tauri runtime under jsdom); fixes an unhandled rejection; adds a listener assertion |
| 2026-10-17 | Frontend tests | New: `format-time-ago.spec.ts`, `keybinds/format.spec.ts`, `folderUtils.spec.ts`, `media-format.spec.ts`, `UniqueTokens.spec.ts` | 40 new tests for pure helpers that had none |
| 2026-10-17 | Docs | `CHANGELOG.md`, `TRACKER.md`; `artcraft-handoff.md` | Added; the handoff's round 3+4 detail was merged into the tracker and changelog (it duplicated them) and now points there |
| 2026-10-17 | Frontend | `apps/artcraft/package.json` | Removed the duplicate `terser` from `devDependencies` (kept in `dependencies`) |
| 2026-10-17 | Frontend | `libs/api/src/lib/models/MediaFile.ts`, `useDesktopGenerationFeed.ts` | `media_links` now types `maybe_thumbnail_template` and `maybe_video_previews`; the local `VideoMediaLinks` type and cast were removed |
| 2026-10-17 | Frontend | `apps/artcraft/test/tsconfig.json` (new) | Editors now resolve the `~` alias and vitest globals in `test/`; `tsc -p test/tsconfig.json` is clean (fixed 2 stale test mocks it exposed) |
| 2026-10-17 | Frontend | `libs/model-list/src/lib/classes/{Image,Object3D,Splat,Video}Model.ts` | `import "src/index.js"` (only resolved through that lib's `baseUrl`) changed to `"../../index.js"` |
| 2026-10-17 | Frontend tests | `frontend/vitest.workspace.ts` | `video-editor` excluded from the shared root run (its wasm asset only resolves inside the package); a bare `npx vitest run` in `frontend/` now passes (80 files, 402 tests) and `npm test` still runs video-editor on its own (12 tests) |
| 2026-10-17 | Frontend tests | New: `libs/components/video-editor/src/lib/utils/math.spec.ts` | 17 tests for clamp, step snapping, number formatting and the safe expression parser (no eval; rejects non-arithmetic input); all pass, no bugs found |
| 2026-10-17 | Frontend tests | New: `libs/components/video-editor/src/lib/fps/utils.spec.ts` | 12 tests for frame-rate conversion (NTSC snapping, gcd reduction), highest imported fps and the "only ever raise the project rate" rule; all pass, no bugs found |
| 2026-10-17 | Frontend tests | New: `libs/components/pagescene/src/lib/engine/cameraMath.spec.ts` | 22 tests for free-cam math: key-to-vector mapping, pan/zoom scaling, lookAt, velocity smoothing, key-slot tables, and the per-frame tick (disabled, idle, coasting, rotation); all pass, no bugs found |
| 2026-10-17 | Frontend tests | New: `libs/model-list/src/lib/classes/metadata/PromptFormatters.spec.ts` | 6 tests: aspect-ratio and resolution enum labels, unknown values pass through, duration suffix; all pass |
| 2026-10-17 | Frontend (bug) | `libs/common/src/lib/utils/thumbnail-utils.ts` | `addCorsParam` always appended `?cors=1`, producing a second `?` on URLs that already had a query string; it now uses `&` in that case. `is3DModelUrl` used substring matching, so `scene.object.png` matched `.obj` and `a.png?file=x.glb` matched `.glb`; it now checks only the path and requires the extension at the end |
| 2026-10-17 | Frontend tests | New: `libs/common/src/lib/utils/thumbnail-utils.spec.ts` | 19 tests covering every export, including regression tests for both fixes |
| 2026-10-17 | Frontend (bug) | `apps/artcraft/app/src/utilities.ts` | `getFileName` returned `""` and `getFileExtension` returned the whole name for a file with no `.` (`lastIndexOf` is -1). `getFileName` feeds the upload name in `uploadPlane.ts`, so an extension-less file uploaded with an empty name. Both now handle the no-dot case |
| 2026-10-17 | Frontend tests | New: `apps/artcraft/app/src/utilities.spec.ts` | 12 tests for the app helpers, including the no-dot regression |
| 2026-10-17 | Frontend (privacy) | `apps/artcraft/app/src/signals/authentication/utilities.ts` | `updateUserInfo` logged the whole user profile to the browser console on every update; the log was removed |
| 2026-10-17 | Frontend tests | New: `pagescene/.../Timeline/timelineUtils.spec.ts` (9), `app/src/signals/backgroundLoadedMedia/utilities.spec.ts` (5) | Timecode formatting, frame quantizing, fraction/time mapping; audio media mapping. The mapper's `length` is `seconds * 60` (frames at 60 fps?) and the unit is undocumented; the test pins current behavior and flags it |
| 2026-10-17 | Frontend tests | New in `libs/components/video-editor/src/lib/`: `timeline/timeline-math.spec.ts` (pixel, zoom and drag math; `../wasm` mocked), `masks/utils.spec.ts`, `media/media-utils.spec.ts` | 22 tests; video-editor package now 63; all pass, no bugs found |
| 2026-10-17 | Frontend (bug) | `libs/components/video-editor/src/lib/timeline/bookmarks/utils.ts` | `moveBookmarkInArray` could move a bookmark onto a frame that already had one, creating two bookmarks at the same time (the toggle logic assumes one per frame, so the pair could not be toggled off cleanly). Moving onto an occupied frame is now a no-op |
| 2026-10-17 | Frontend tests | New: `timeline/ruler-utils.spec.ts` (12), `timeline/bookmarks/utils.spec.ts` (12) | Ruler spacing (including the invariant that labels always land on ticks across 6 frame rates and 10 zoom levels), label formatting, bookmark CRUD and the duplicate-move regression |
| 2026-10-17 | Frontend tests | New: `libs/components/generation-list/src/lib/media-prompt-token-cache.spec.ts` (7) | Hook tests with `renderHook`: resolve, promptless media, unreturned tokens, thrown request, cache reuse, de-dupe, 50-token chunks. No bug found. Design note: a failed fetch is cached as "no prompt" for the rest of the session (no retry), by design in the source comments |
| 2026-10-17 | Frontend tests | New in `libs/components/generation-list/src/lib/`: `pending-status.spec.ts` (7), `prompts-cache.spec.ts` (6) | Progress clamping and time-left labels; prompt-cache fetch, de-dupe, reuse and failure recovery. No bug found. Note: the comment in `prompts-cache.ts` says failures are retried when `usePrompts` re-runs, but the effect re-runs only when the token set changes, so a failed batch is retried on the next change, not on re-render |
| 2026-10-17 | Rust (audit) | `crates/desktop/artcraft/src` (read-only) | Swept non-test code (everything before the first `#[cfg(test)]`) for `.unwrap()` on lock, parse, JSON, index and header input. Zero hits; the 4 raw matches were all in `storyteller_login_bridge_tests.rs`. `cargo test --workspace`: 0 failures |
| 2026-10-17 | Rust (bug) | `api_clients/grok_consumer_client/src/{error/grok_client_error.rs, requests/media_posts/create_media_post/grok_create_media_post.rs, requests/video_chat/grok_video_gen_chat_conversation.rs}` | Two `match`es on the media type ended in `unimplemented!()` for generated images and videos, which would panic a caller. They now return the new `GrokClientError::UnsupportedMediaPostType`. Unreachable from the app today (it only sends `UserUploadedImage`). `cargo check -p grok_consumer_client`: 0 errors. Left alone: `unimplemented_sora_job_status.rs:44`, a deprecated stub whose name says it is unimplemented |
| 2026-10-17 | Frontend tests | New: `app/src/signals/scene.spec.ts` (3) | Initial state, `signalScene` flags, mirroring into the page-scene store |
| 2026-10-17 | Frontend (bug) | `app/src/signals/toasts.ts` | `shouldAddToast` had its time comparison inverted: it let identical toasts through inside the 2 second window and blocked them only when older. It now drops an identical toast raised within 2 seconds |
| 2026-10-17 | Frontend (bug) | `app/src/signals/activeJobs.ts` | `setJobs` ran `deepEqual(setJobs, newJobList)` (the function, not `recentJobs.value`), so the unchanged-list check never matched and every poll re-rendered subscribers |
| 2026-10-17 | Frontend tests | New: `app/src/signals/toasts.spec.ts` (9), `signals/activeJobs.spec.ts` (8) | Fake-timer tests for toast dedupe, auto-dismiss times and sticky toasts; job-list filters and polling switch; regression tests for both fixes above |
| 2026-10-17 | Frontend tests | New: `app/src/hooks/useActiveJobs/utilities.spec.ts` (4), `hooks/useBackgroundLoadingMedia/utilities.spec.ts` (8) | Job polling (dev-flag skip, success, error toast, fallback message) and user movie/audio polling (login and in-flight guards, inference-only filter, in-flight flag cleared); API classes and signals mocked. Noted, not changed: these pollers do not use try/finally, so a thrown API error would leave the in-flight flag stuck |
| 2026-10-17 | Frontend (bug) | `generation-list/src/lib/useSessionMediaByClass.ts`, `useGalleryData.ts` | Stale-response race: a slow request resolving after a class/user/filter change or `refresh()` overwrote the newer feed (mesh items in the splat feed). Added a `requestIdRef` guard (superseded responses dropped) and cleared `isLoading` when the feed is disabled |
| 2026-10-17 | Frontend tests | New: `generation-list/src/lib/useSessionMediaByClass.spec.ts` (5), `useGalleryData.spec.ts` (5) | Load, disabled/logged-out, filters, and deferred-promise tests proving a superseded response is dropped on switch and on `refresh()` |
| 2026-10-17 | Frontend (bug) | `generation-list/src/lib/useGenerationJobs.ts` | Changing `mediaType` (or `enabled`) kept `prevCompletedIdsRef`/`prevFailedIdsRef`/`initialLoadDoneRef`, so all finished jobs of the new type were reported as newly completed, and an in-flight poll for the old type could overwrite the new feed. The poll effect now resets refs and state, and a `loadIdRef` drops superseded polls |
| 2026-10-17 | Frontend tests | New: `generation-list/src/lib/useGenerationJobs.spec.ts` (6), `useGalleryEntries.spec.ts` (3) | Media-type filtering, first-poll vs later completions, no flood after a type switch, stale poll dropped, dismissFailed; merge/sort/dedupe of the feed |
| 2026-10-17 | Frontend (bug) | `pagescene/src/lib/comps/AssetMenu/hooks/useUserObjects.tsx`, `useFeaturedObjects.tsx` | The in-flight guard set `breakFlag` inside a `setState` updater (not run synchronously by React), so overlapping fetches were not reliably blocked. Replaced with `inFlightRef`; a thrown request now yields ERROR instead of a stuck IN_PROGRESS; `useUserObjects` now keeps `nextPage` (it was dropped, so `nextUserObjects` was always undefined) |
| 2026-10-17 | Frontend tests | New: `pagescene/.../hooks/useUserObjects.spec.tsx` (5) | Items + pagination stored, concurrent call ignored then allowed again, page append vs replace, thrown request then retry, featured single fetch |
| 2026-10-17 | Frontend (bug) | `video-editor/src/lib/sounds/use-sound-search.ts` | `loadMore` had no stale guard: a page that arrived after the query or commercial-only filter changed was appended to the new search's results. Added a `latestSearchKeyRef` check |
| 2026-10-17 | Frontend tests | New: `video-editor/src/lib/sounds/use-sound-search.spec.ts` (5) | Empty query, debounced search, error, append next page, stale load-more dropped; real zustand store, mocked adapter |
| 2026-10-17 | Frontend (bug) | `pagescene/.../hooks/useAnimationLibrary.tsx` | The session-wide store stayed on IN_PROGRESS when a featured or user fetch threw, so featured never retried and user fetches were blocked for the rest of the session. Both fetches now end as ERROR on a throw |
| 2026-10-17 | Frontend tests | New: `pagescene/.../hooks/useAnimationLibrary.spec.tsx` (3) | Thrown fetch ends as ERROR with demo fallback, retry succeeds (user clips lead), next page appends and dedupes |
| 2026-10-17 | Frontend (bug) | `pagedraw/src/lib/hooks/useUpdateSnapshot.ts` | `useStageSnapshot`'s cleanup read a state value captured at mount (always null), so `cancelAnimationFrame` never ran and the snapshot loop kept running after unmount; it also set state every frame, re-rendering the host ~60x/s. The frame id now lives in a ref |
| 2026-10-17 | Frontend tests | New: `pagedraw/src/lib/hooks/useUpdateSnapshot.spec.ts` (4) | One frame queued while mounted, latest frame cancelled on unmount, no per-frame re-render, no-stage guard |
| 2026-10-17 | Frontend (bug) | `moodboard/.../interactions/usePasteHandler.ts` | A pasted image was placed at the raw screen centre, but nodes live in canvas coordinates, so after panning or zooming the image landed off-screen. New exported `viewportCenterOnCanvas` maps through the stage transform (same math as the upload button and gallery drop) |
| 2026-10-17 | Frontend tests | New: `moodboard/.../interactions/usePasteHandler.spec.ts` (5) | Centre maths (no stage, untouched, panned+zoomed), paste placement, inactive ignore |
| 2026-10-17 | Frontend (bug) | `promptbox/src/lib/deck/useDeckMedia.tsx` | An upload function that threw (rather than reporting an error through its callback) left the spinner card up forever and raised an unhandled rejection; for video it also aborted the rest of the batch. Image, video and audio uploads now catch, clear the entry and (video) toast; a `settled` flag stops a late throw from revoking a committed preview |
| 2026-10-17 | Frontend tests | New: `promptbox/src/lib/deck/useDeckMedia.spec.tsx` (3) | Upload success commits, reported error clears spinner, thrown upload clears spinner |
| 2026-10-17 | Frontend (bug) | `apps/artcraft/app/src/hooks/useActiveJobs/useActiveJobs.ts` | The poll timer was started with `setInterval` inside `setState` updater functions; React (StrictMode) may run an updater twice, creating a second untracked interval so polling could never be stopped, and every timer change re-rendered the host. Timer and interval now live in refs |
| 2026-10-17 | Frontend tests | New: `useActiveJobs/useActiveJobs.spec.ts` (5) | First pull, 10s timer then stop when jobs empty, exactly one timer, switch to 2s for TTS jobs, cleared on unmount |
| 2026-10-17 | Frontend (bug) | `apps/artcraft/app/src/components/generation-feed/useDesktopGenerationFeed.ts` | `load()` runs from a 5s poll, Tauri events and local enqueue events, so calls overlap; a slow older `GetTaskQueue` response could overwrite newer in-progress/failed lists (resurrecting finished or dismissed jobs). A sequence ref now lets only the latest load commit |
| 2026-10-17 | Frontend tests | New: `generation-feed/useDesktopGenerationFeed.spec.ts` (3) | Pending tasks shown, other media type ignored, stale response can't overwrite newer one |
| 2026-10-17 | Frontend (bug) | `apps/artcraft/app/src/pages/PageScene/useTauriPageSceneAdapter.tsx` | `loadScene` parsed the file with `JSON.parse` inside a `FileReader.onloadend` callback; a corrupt scene threw uncaught there and the returned promise never settled (loader hung). It now parses the response text directly so the error rejects. Also `maybe_creator_user.user_token` crashed on a scene with no creator; now optional |
| 2026-10-17 | Frontend tests | New: `PageScene/useTauriPageSceneAdapter.spec.tsx` (3) | `loadScene` happy path + metadata, missing creator, invalid JSON rejects |
| 2026-10-17 | Frontend (bug) | `libs/soundboard/src/lib/SoundManager.ts` | `playEvent` awaited the Tauri `GetAppPreferences()` call with no catch, and the generation/enqueue event hooks `await` it right before `toast.*`; a rejected lookup swallowed the notification toast. Sound playback now fails silent |
| 2026-10-17 | Frontend tests | New: `libs/soundboard/src/lib/SoundManager.spec.ts` (3) | Plays configured sound, silent when off/unset, does not throw when preferences fail |
| 2026-10-17 | Frontend (bug) | `libs/tauri-events/src/lib/events/{functional,warning}/*Event.ts` (12 hooks), new `common/useLatestRef.ts` | Each hook subscribed once (`useEffect(..., [])`) and closed over the first render's `asyncCallback`, so callers with changing props/state got stale values (the feed hook carried a comment working around it). The callback is now read through a ref that always holds the latest one; still a single subscription |
| 2026-10-17 | Frontend tests | New: `tauri-events/.../functional/eventHooks.spec.tsx` (9) | For 3 representative hooks: subscribes once with the payload data, calls the latest callback after a re-render, unsubscribes on unmount |
| 2026-10-17 | Docs | New: `BUGS.md` | Bug-by-bug map: fixed, noted, owner-gated, and the review queue |
| 2026-10-17 | Frontend tests | New: `timeline/element-utils.spec.ts` (14) | Element type guards, `build*Element` defaults and overrides, `getElementsAtTime` ordering and exclusive boundaries, font-family collection; wasm, registries and effect/graphic builders mocked |

| 2026-10-17 | Frontend (cleanup) | `libs/tauri-events/.../generation/useGeneration{Complete,Failed,EnqueueSuccess,EnqueueFailure}Event.ts` | Removed the leftover `console.log` that dumped every event payload (BUGS Q-02) |
| 2026-10-17 | Frontend (bug) | `apps/artcraft/app/src/hooks/useBackgroundLoadingMedia/utilities.ts` | `PollUserGeneratedMovies` / `PollUserAudioItems` had no try/finally, so a thrown API error left the in-flight flag stuck (movies poller then skipped every later poll) and rejected unhandled. They now always clear the flag, toast and return false (N-01) |
| 2026-10-17 | Frontend tests | `useBackgroundLoadingMedia/utilities.spec.ts` (+2, now 10) | Both pollers on a thrown request |
| 2026-10-17 | Frontend (bug) | `apps/artcraft/app/src/signals/authentication/fetchers.ts` | `login`, `signUp`, `logout` and `getUserInfoAndSubcriptions` did not handle a thrown request: auth status stuck on LOGGING / GET_USER_INFO (spinner forever), logout skipped its local clear, unhandled rejection. Each now falls back to `setLogoutStates`. Also removed three `console.log` calls, one of which printed the signup response |
| 2026-10-17 | Frontend tests | New: `signals/authentication/fetchers.spec.ts` (5) | Thrown requests no longer leave auth stuck on LOGGING / GET_USER_INFO |
| 2026-10-17 | Frontend (bug) | `promptbox/src/lib/deck/useDeckMedia.tsx` | Each image's `fullUrl` (`URL.createObjectURL`) was never revoked. It is now revoked once the ref has been seen in the store and later removed or replaced, and on unmount (N-06) |
| 2026-10-17 | Frontend tests | `promptbox/.../useDeckMedia.spec.tsx` (+3, now 6) | 3 new tests for the revoke behaviour (removal, replacement, unmount) |
| 2026-10-17 | Frontend (bug) | `moodboard/src/lib/boards/useBoardItemEntry.tsx` | The window paste handler already skipped input/textarea but not contenteditable hosts; new exported `isTextEntryTarget` covers them (N-07). `handlePicked` left the picker open if measuring threw; the loop is now try/catch/finally and items added before the failure are kept (N-08) |
| 2026-10-17 | Frontend tests | New: `moodboard/.../boards/useBoardItemEntry.spec.tsx` (7) | Text-entry targets, picker success, picker closes when measuring throws |
| 2026-10-17 | Frontend (bug) | `apps/artcraft/app/src/pages/PageScene/useTauriPageSceneAdapter.tsx` | `saveScene`: a cover-image failure after the scene saved made the whole save look failed (now caught, saved token still returned); an update with no `media_file_token` in the response now falls back to the given scene token instead of calling `cover_image/undefined`; `getMediaUrlByToken` throws a clear error naming the token instead of a TypeError on `data!` (N-09) |
| 2026-10-17 | Frontend tests | `PageScene/useTauriPageSceneAdapter.spec.tsx` (+6, now 9) | 4 `saveScene` tests and 2 `getMediaUrlByToken` tests |
| 2026-10-17 | Frontend (bug) | `libs/api/src/lib/MiscApi.ts`, `VideoApi.ts` | Typo `err.mesasge` made the status-alert error text always undefined; `EnqueueStudio` returned a nonexistent `error_reason` instead of `errorMessage` |
| 2026-10-17 | Frontend (bug) | `libs/api/src/lib/EngineApi.ts`, `PromptsApi.ts`, `PasswordResetApi.ts` | `uploadSceneSnapshot` bypassed `FetchProxy` (Mac cookie workaround) and rejected on a non-JSON body; `pollJobSession` threw unhandled on any HTTP error or missing `state`/`status`; `RedeemPasswordReset` parsed JSON before the ok check, so a 502 HTML page showed "Unexpected token <" |
| 2026-10-17 | Frontend (bug) | `libs/api/src/lib/ApiManager.ts` | `fetchMultipartFormData` rejected with a SyntaxError on a non-JSON error body (now `HttpApiError(status)`); `fetch` joined the query with `?` even when the endpoint already had one, and left a trailing `?` for an empty query |
| 2026-10-17 | Frontend tests | New: `libs/api/src/lib/bugfixes.spec.ts` (11) | One test group per `libs/api` fix above |
| 2026-10-17 | Frontend (bug) | `libs/state/subscription/src/lib/subscription-state.ts` | A slow older subscription fetch could overwrite newer state or bring back the previous user's subscription after logout; an undefined response threw. A fetch token now guards the commit and `reset()` bumps it |
| 2026-10-17 | Frontend tests | New: `subscription/.../subscription-state.spec.ts` (3) | Stale fetch dropped, reset invalidates an in-flight fetch, undefined response (per the fix description) |
| 2026-10-17 | Frontend (bug) | `libs/components/keybinds/.../cheatsheet/useCheatsheetVisibility.ts` | `onKeyUp` updated the pin store inside a `setHeld` updater (side effect while rendering, twice under StrictMode, cross-component warnings). A local `peeking` flag is tracked in the effect instead |
| 2026-10-17 | Frontend tests | New: `keybinds/.../useCheatsheetVisibility.spec.tsx` (3) | Covers the key-up pin update now done outside the state updater |
| 2026-10-17 | Frontend (bug) | `libs/components/lightbox-modal/src/lib/lightbox-modal.tsx` | Reference audio kept playing after the lightbox closed or unmounted, and a rejected `audio.play()` left the playing state stuck. Audio stops on close/unmount and `play()` has a `.catch` |
| 2026-10-17 | Frontend tests | New: `lightbox-modal/.../lightbox-modal.audio.spec.tsx` (3) | Audio stop on close and unmount, rejected `play()` (per the fix description) |
| 2026-10-17 | Frontend (bug) | `libs/components/gallery-modal/src/lib/gallery-modal.tsx` | `loadItems`: a refresh or filter switch was dropped by the `isLoadingRef` lock while an older request was in flight, so the old filter's slow response filled the new filter's list and cache (now a `loadRequestIdRef`; a reset supersedes the in-flight request and stale results/errors are discarded). `handleBulkDelete` removed every selected id after `Promise.allSettled` even when some deletes rejected (now only the fulfilled ids go, failures stay selected with a toast) |
| 2026-10-17 | Frontend tests | New: `gallery-modal/.../gallery-modal.race.spec.tsx` (2) | Filter-switch race; partial bulk-delete failure |
| 2026-10-17 | Frontend (security hygiene) | `libs/api/src/lib/MediaUploadApi.ts` | Removed three `console.log` calls in `UploadStudioShot` that printed the upload session token |
| 2026-10-17 | Rust (bug) | `grok_consumer_client`: `generate_xsid.rs`, `signature_xa.rs`, `signature_simulate_style.rs`, `grok_download_video.rs`, `get_index_page.rs` | Panics on short or multibyte scraped signature data, pre-epoch timestamps, disk-flush failure and non-ASCII header bytes became typed errors; `println!` (which printed a cookie value) became `log` macros. New unit tests for the three signature cases |
| 2026-10-17 | Rust (bug) | `fal_client`: `fal_request.rs`, `queue.rs` | A missing API key panicked in four send paths (now `FalError`); a `Queue` restored from serde panicked on `client.unwrap()` (now a default client). New test `missing_key_returns_error_not_panic` |
| 2026-10-17 | Rust (cleanup) | `openai_sora_client/.../wait_for_image_gen_status.rs`, three more Grok files | `println!` outside tests replaced with `log` macros |
| 2026-10-17 | Rust (bug) | `desktop/artcraft`: `handle_api_providers.rs`, `handle_fal_complete.rs` | Router builder error was replaced by a `NotYetImplemented` TODO message; a completed FAL job with no URLs was polled forever and HTTP error bodies were uploaded as media |
| 2026-10-17 | Rust (bug) | `desktop/artcraft`: `sora/.../handle_successful_generations.rs`, `core/utils/download_url_to_temp_dir.rs`, `simple_http_download.rs`, `simple_http_download_to_tempfile.rs`, `worldlabs_marble_task_polling.rs` | Downloads no longer save HTTP error bodies as media (`error_for_status`); temp-file extension for URLs with no dot no longer takes the whole path (new `extension_from_url_path`, 2 tests) |
| 2026-10-17 | Rust (bug) | `desktop/artcraft/src/core/commands/flip_image.rs` | `println!` replaced by `log::debug!`; `split_at(10)` could panic on a short string |
| 2026-10-17 | Frontend (lint) | `PageScene/useTauriPageSceneAdapter.spec.tsx` | Targeted suppression for the intentionally unused `_init` parameter of the fetch mock |
| 2026-10-17 | Frontend (bug) | `libs/common/src/lib/types/queue.ts` | `Queue.publish` shifted (dropped) the message even with zero subscribers because the subscriber map always exists, defeating the buffer `subscribe()` replays. It now drains only when `size > 0`. No live caller uses the queue today (only its spec), so there is no user-visible change |
| 2026-10-17 | Frontend tests | New: `libs/common/.../types/queue.spec.ts` (2) | Messages published before any subscriber are replayed in order; direct delivery once subscribed with no double replay |
| 2026-10-17 | Frontend (bug) | `libs/tauri-api/src/lib/sora/useSoraLoginListener.ts`, `waitForSoraLogin.ts` | The hook leaked its listener if cleanup ran before `listen()` resolved; `waitForSoraLogin` leaked it if the event fired before `listen()` resolved. A `cancelled`/`done` flag now unlistens as soon as the late `unlisten` arrives |
| 2026-10-17 | Frontend tests | New: `libs/tauri-api/.../sora/soraLogin.spec.ts` (3) | Both Sora login listener races |
| 2026-10-17 | Frontend (bug) | `libs/tauri-api/src/lib/events/CanvasBgRemovedEvent.ts` | `useCanvasBgRemovedEvent` had `[]` deps and kept the first render's callback forever; its `isUnmounted` branch could never run. The callback goes through a ref updated every render and the dead branch is gone |
| 2026-10-17 | Frontend tests | New: `libs/tauri-api/.../events/CanvasBgRemovedEvent.spec.ts` (1) | Latest callback is the one invoked |
| 2026-10-17 | Frontend (bug) | `libs/tauri-utils/src/lib/useWindowControls.ts` | Unmounting while the async setup was still awaiting left three Tauri listeners registered for good and kept calling `setIsMaximized` on the unmounted component. A `cancelled` flag skips `setState` and unlistens late listeners |
| 2026-10-17 | Frontend tests | New: `libs/tauri-utils/.../useWindowControls.spec.ts` (2) | Unmount before setup finishes; state update after unmount |
| 2026-10-17 | Frontend (security hygiene) | `libs/tauri-api/.../sora/CheckSoraSession.ts`, `download/LocalDownloads.ts` | Removed the `console.log` of the whole Sora session result (it includes the account email) and the one that logged every download URL |
| 2026-10-17 | Frontend (bug) | `libs/common/src/lib/utils/referral.ts` | `readCookie`'s `decodeURIComponent` threw a `URIError` on a malformed cookie, escaping the public getters; it now returns `undefined` so `read()` falls back to localStorage |
| 2026-10-17 | Frontend tests | New: `libs/common/.../utils/referral.spec.ts` (7) | Query-string capture and sanitising (lowercase/strip/20-char cap, code strip), first-landing-wins vs latest-referral-wins, nothing-captured, and two malformed-cookie cases (with and without a localStorage fallback) |
| 2026-10-17 | Rust (bug) | `crates/desktop/artcraft/src/core/api_adapters/aspect_ratio/convert/aspect_ratio_to_artcraft_flux_{1_dev,1_schnell,pro_1p1,pro_1p1_ultra}.rs` | B-72: tall 4:5 mapped to landscape 4:3 and wide 5:4 mapped to portrait 3:4 (the two arms were swapped), so those requests produced an image in the wrong orientation. Arms corrected in all four converters. The other converters (seedream, nano banana, gpt image, grok) were checked and are correct |
| 2026-10-17 | Rust tests | `.../aspect_ratio/common_aspect_ratio.rs` (test-only helpers `all_/wide_/tall_common_aspect_ratios`, variant-count guard) and tests in the four converters above | Wire strings are unique and round-trip; wide inputs never map to portrait, tall never to landscape; exact matches kept; Auto values fall back to square. 16 of these failed before the B-72 fix; `cargo test -p artcraft` is now 139 passed, 0 failed |
| 2026-10-17 | Frontend (bug) | `libs/components/help-menu/src/lib/help-menu.tsx` | B-73: the YouTube player effect now bails out after `await loadYouTubeIframeAPI()` if its cleanup already ran, so Back plus a new pick no longer builds a second player |
| 2026-10-17 | Frontend tests | New: `libs/components/help-menu/src/lib/help-menu-youtube.spec.tsx` (2) | Only the newest tutorial's player is built when the API loads late (fails with "Player called 2 times" if the check is removed); one player at the saved start position, destroyed on Back |

## Open

1. **Duplicated API classes.** `libs/api/src/lib/*Api.ts` (live, exported as `@storyteller/api`) and
   `apps/artcraft/app/src/Classes/ApiManager/*.ts` (legacy) have drifted apart (the app copy of
   `MediaFilesApi` has no `DeleteMediaFileByToken`; its uploads call `fetch` directly). The two
   ApiManager media suites now test the lib copy, but the ApiManager, Video and Weights suites still
   import the app copies. Deleting the app copies and importing the lib everywhere is a behavior-changing
   refactor (the lib `BillingApi` is 6.2K against the app's 1K), so it needs a running app to verify and was
   left out. **Tried and reverted (2026-10-17):** swapping the imports in six consumers made `tsc -b` fail
   in four places, because the app also keeps its own copies of the models and enums
   (`app/src/models/Job`, `MediaInfo` vs the lib's `MediaFile`, `USER_FEATURE_FLAGS` missing `API_KEY`), and
   the lib's `ListUserMediaFiles` requires a `username` that the app's callers never pass. So the real job is
   unifying models and enums first, then the classes. Plan: migrate the 7 app consumers (`signals/authentication/fetchers.ts`, `SceneTitleInput.tsx`,
   `uploadPlane.ts`, `useBackgroundLoadingMedia/utilities.ts`, `useActiveJobs/utilities.ts`, `MainApp.tsx`,
   `useTauriPageSceneAdapter.tsx`) one at a time, letting `tsc -b` flag signature differences; keep the app
   classes with no lib twin (`BetaKeysApi`, `CommentsApi`, `FeaturedItemsApi`, `ModerationApi`,
   `StudioGen2Api`); then repoint the legacy suites at the lib and delete the app copies.
2. **Test coverage is still partial.** Specs now cover the helpers, the tauri-events hooks, the feed/job hooks, the
   auth fetchers and every fix in `BUGS.md`; still unspecced: most React components, the video-editor UI, the
   popover / model-selector / pricing-modal / settings-modal / help-menu / login-modal stores (BUGS Q-09), and the Rust handlers
   (Q-07). More can be added in the same pattern.
   Noted, not changed: the `JobStatus` enum key `CANCCELLED_BY_SYSTEM` is misspelled (the value string is
   correct); renaming it touches every consumer, so it is left for a deliberate rename.
3. Needs the owner: a repro for issue #963; a live World Labs run to confirm #1126; comment on or close #960
   (likely already fixed upstream by #1964); real Grok auth cookie names for `grok_login_window_thread.rs`;
   a product decision on the three `service: Artcraft // FIXME` labels
   (`image_bg_removal/enqueue_image_bg_removal_command.rs`, `deprecated/image_inpaint/...`,
   `deprecated/image_edit/...`).
4. **Worker edits not yet itemized.** Seven parallel reviewers were cut off by a session limit on 2026-10-17 after
   editing files but before reporting. Their changes are in the tree and the tree is green (`tsc -b`, lint, the
   full frontend suite and `cargo test -p artcraft`), but they have no BUGS/TRACKER rows yet, so treat them as
   unreviewed until each is read and logged: gallery-modal (`promptFolderDrop.tsx`, `GalleryFolderChip.tsx`,
   `GalleryDraggableItem.tsx`, `galleryDnd.ts` and specs), `button-icon-select.tsx`, `gravatar.tsx`, pricing-modal
   (`useSplatCostEstimate.ts`, `credits-modal.tsx`), settings-modal account blocks and panes, `camera-settings-modal.tsx`,
   upload-modal `loadPreviewOnCanvas.ts`, `WaveformAudioPlayer.tsx`, new app specs under `signals/`, `hooks/` and
   `configs`, and comment-only annotation under `apps/artcraft/app/src/components` and `crates/api_clients/fal_client`.
5. **Beginner annotation pass** (requested after the bug fixes): comments only, in stages, re-running
   check/lint/tests after each stage. The codebase is about 3,200 Rust and 1,660 TypeScript files, so this
   is many sessions of work. Stage 1 done: `docs/BEGINNERS_GUIDE.md` (map, data flow, commands, gotchas)
   and line-by-line comments on `handle_web_login_providers.rs` and `handle_storyteller_failed_job.rs`
   (`cargo check -p artcraft`: 0 errors). Next stages: the rest of the files changed in this pass, then
   `crates/desktop/artcraft` by folder, then `frontend/libs`, then the app. The user asked for the broad test expansion to come
   last, so it follows this pass.
