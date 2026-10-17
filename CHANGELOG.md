# Changelog

All notable changes to ArtCraft. Newest first.

The "Upstream history" section is summarized from the public commit log of
`storytold/artcraft` (commit hashes and PR numbers in parentheses) so a newcomer can see how the
project got here. The "Unreleased" section is the bug-fix work on the `rene751/artcraft` fork; see
`TRACKER.md` for the per-file detail of each item.

## Build 1: fork bug-fix pass (2026-10-17, unreleased)

The current build number lives in the `BUILD` file at the repo root. Increment it for each new batch and add
a "Build N" heading above this one.

### Fixed (Rust)
- Web login no longer panics: `handle_web_login_providers.rs` returned `unimplemented!()`; it now logs a
  warning and returns `GenerateError::NotYetImplemented`.
- World Labs Marble and Artcraft splat jobs were recorded with the wrong task type; they now use
  `TaskType::GaussianGeneration` (`handle_worldlabs_marble.rs`, `handle_artcraft_splat_via_router.rs`).
- Completion notifications no longer fail when a job has no CDN URL: new helper `cdn_url_or_placeholder`
  in `notify_frontend_of_completion.rs`.
- Failed Storyteller jobs now pass the server's failure message to the UI as `reason`
  (`handle_storyteller_failed_job.rs`).
- A failure inside the failed-job handler is logged instead of aborting the whole task-polling thread
  (`storyteller_task_polling_thread.rs`).
- Grok file upload for in-memory bytes is implemented (`grok_upload_file.rs`).
- Missing crate features added: `uuid` `v4` (grok and worldlabs consumer clients) and `indexmap` `serde`
  (worldlabs consumer client). These only compiled before because other crates enabled the features.

- Grok `GrokCreateMediaPost` and the Grok video-chat request no longer panic with `unimplemented!()` for the
  generated-image and video media types; they return the new `GrokClientError::UnsupportedMediaPostType`.
  The app only ever passes `UserUploadedImage` today, so this closes a trap for future callers.

- Fixed (Rust, second pass): Grok request signing no longer panics on short, multibyte or pre-epoch scraped
  data, a failed video-file flush or non-ASCII headers (typed errors instead), and the Grok cookie value is no
  longer printed; the FAL client returns an error instead of panicking on a missing API key or a deserialized
  `Queue`; a completed FAL job with no downloadable files is now marked failed instead of polled forever, and
  HTTP error pages are no longer uploaded as media; the router provider returns its real error instead of a
  "TODO" placeholder; stray `println!` calls became `log` macros.

- Fixed (Rust, third pass): file downloads in the desktop app (Sora results, WorldLabs splats and the shared
  temp-file helpers) no longer save an HTTP error page as the media file; a URL with no file extension no longer
  produces a temp-file name containing slashes; `flip_image` no longer prints to stdout or risks a panic on a
  short string.

### Changed (Rust)
- Three `println!` calls outside tests replaced with `log` macros, per `AGENTS.md`
  (`initially_size_and_position_windows.rs`, `position_main_window.rs`, `load_provider_priority_state.rs`).

### Fixed (frontend)
- Type-check is clean again (185 errors to 0 under `tsc -b`) and `npm run lint` reports 0 problems (113 to 0).
- Real bug: `handleDownload` in `DesktopGenerationGallery.tsx` had stale-closure dependencies; fixed.
- Accessibility: Storyboard sidebar labels are now tied to their inputs (`htmlFor`/`id`), the stroke color
  input has an `aria-label`, and a non-form `<label>` in `CostModal.tsx` is a `<div>`.
- Upload components (`UploadFilesMedia`, `UploadImageMedia`, `UploadImageMediaModal`, `UploadModalMedia`)
  had wrong `FileUploader` props, a bad import and a missing `default` case.
- Remix imports in `root.tsx`, `$sceneToken.tsx` and `_index.tsx` pointed at `@remix-run/deno`; they now use
  `@remix-run/node`.
- Vite configs of `libs/api`, `libs/api-enums` and `libs/model-list` import `shared-vite-config.js` (NodeNext
  needs the extension); their `tsconfig.spec.json` files were patched to match, plus about 48 other
  `tsconfig.spec.json` `rootDir` patches.
- `npm run lint` no longer aborts on the nonexistent `playground/*` directory; the vendored Ammo.js bundle is
  excluded from linting.
- Tests: the 18 scaffold specs were rewritten into real ones.

### Changed (frontend tests)
- The ApiManager suites under `apps/artcraft/test/` now run under vitest (`npm test` is `vitest run`; 20 files,
  167 tests pass). The old `jest` runner was never installed, so the suites had not run. `MediaFileApi` and
  `MediaUploadApi` tests now exercise the live `@storyteller/api` classes. A `jest` alias (`jest = vi`), a jsdom canvas stub and the
  localhost API host live in `test/setup/jestCompat.ts`.
- Stale expectations updated to match the code: `ApiManager.ApiTargets` shape, the studio enqueue endpoint
  (`/v1/workflows/enqueue_studio`) and the weight cover-image endpoint (`/v1/weights/weight/{token}/cover_image`).

- `frontend/vitest.workspace.ts` no longer fails on the duplicate "artcraft" project name.
- New root `npm test` in `frontend/` runs vitest inside each of the 61 packages (414 tests pass).
- `provider-billing-modal.spec.tsx` mocks the Tauri event listener (no Tauri runtime under jsdom).
- 40 new tests for previously untested helpers: relative-time formatting, keybind formatting, folder
  sorting/thumbnail resolution, media label formatting and token dedupe.

- The shared `MediaFile` type now describes the video thumbnail link fields, so the local cast in
  `useDesktopGenerationFeed.ts` is gone.
- A bare `npx vitest run` in `frontend/` passes: the wasm-dependent `video-editor` package is excluded from
  the shared run and still tested by `npm test`.
- `terser` is no longer listed twice in `apps/artcraft/package.json`.
- `model-list` model classes import `../../index.js` instead of the baseUrl-only `src/index.js`.
- New `apps/artcraft/test/tsconfig.json` so editors resolve `~` and vitest globals in `test/`.
- New `video-editor` specs: `utils/math.spec.ts` (17 tests) and `fps/utils.spec.ts` (12 tests).
- New `pagescene` spec: `engine/cameraMath.spec.ts` (22 tests).
- New `model-list` spec: `PromptFormatters.spec.ts` (6 tests).
- New `common` spec: `thumbnail-utils.spec.ts` (19 tests).
- New app spec: `utilities.spec.ts` (12 tests).
- New specs: `timelineUtils.spec.ts` (9 tests), `backgroundLoadedMedia/utilities.spec.ts` (5 tests).
- New `video-editor` specs: `timeline/timeline-math.spec.ts`, `masks/utils.spec.ts`, `media/media-utils.spec.ts` (22 tests).
- New `video-editor` specs: `timeline/ruler-utils.spec.ts`, `timeline/bookmarks/utils.spec.ts` (24 tests).
- New `video-editor` spec: `timeline/element-utils.spec.ts` (14 tests).
- New app specs: `hooks/useActiveJobs/utilities.spec.ts` (4), `hooks/useBackgroundLoadingMedia/utilities.spec.ts` (8).
- New `generation-list` spec: `media-prompt-token-cache.spec.ts` (7 tests: resolve, no-prompt, error recovery,
  caching, de-dupe, 50-token chunking).
- New `generation-list` specs: `pending-status.spec.ts` (7), `prompts-cache.spec.ts` (6).
- New app specs: `signals/toasts.spec.ts` (9), `signals/activeJobs.spec.ts` (8), `signals/scene.spec.ts` (3).
- Fixed: the duplicate-toast guard was inverted. It let repeats through inside the 2 second window and blocked
  them only after it, so error toasts from repeating polls piled up. It now drops an identical toast raised
  within 2 seconds.
- Fixed: `setJobs` compared the setter function (not the stored list) with the new jobs, so its "unchanged"
  check never matched and every poll replaced the list and re-rendered subscribers.
- Fixed: moving a timeline bookmark onto a frame that already has one no longer creates a duplicate.
- Fixed: `updateUserInfo` no longer logs the user's profile to the console.
- Fixed: `getFileName` / `getFileExtension` now handle a file name with no dot (previously an empty name and a
  whole-name "extension"); this fixes the file name sent by `uploadPlane.ts` for extension-less files.
- Fixed: `addCorsParam` now appends `&cors=1` to URLs that already have a query string (it used a second `?`).
- Fixed: `is3DModelUrl` matches the extension at the end of the URL path instead of anywhere in the string, so
  `scene.object.png` or `a.png?file=x.glb` are no longer treated as 3D models.

- Fixed: `useSessionMediaByClass` and `useGalleryData` let a slow response overwrite a newer feed (a mesh
  response could show up in the splat feed after switching, and a stale page could land after `refresh()` or a
  user/filter change). Each request now carries an id and superseded responses are dropped; turning the feed off
  also clears the loading flag. New specs: `useSessionMediaByClass.spec.ts` (5), `useGalleryData.spec.ts` (5).

- Fixed: `useGenerationJobs` kept its "already seen" job ids when the media type (or login state) changed, so
  every finished job of the new type showed up as newly completed on the first poll, and a slow poll for the
  old type could overwrite the new feed. State and refs now reset on change and superseded polls are dropped.
  New specs: `useGenerationJobs.spec.ts` (6), `useGalleryEntries.spec.ts` (3).

- Fixed: `useUserObjects` and `useFeaturedObjects` (pagescene asset menu) guarded against overlapping fetches
  with a flag set inside a `setState` updater, which React may run later, so the guard could silently fail. They
  now use a ref. A thrown request now ends as an ERROR status instead of leaving it stuck on IN_PROGRESS, and
  `useUserObjects` no longer drops the `nextPage` pagination info it was given. New spec: `useUserObjects.spec.tsx` (5).

- Fixed: in the video editor's sound search, a "load more" that finished after the query or the commercial-only
  filter changed appended the old search's page to the new results. It is now dropped. New spec:
  `sounds/use-sound-search.spec.ts` (5).

- Fixed: `useAnimationLibrary` (shared session store) stayed on IN_PROGRESS when a fetch threw, which blocked
  every later retry. A thrown request now ends as ERROR. New spec: `useAnimationLibrary.spec.tsx` (3).

- Fixed: `useStageSnapshot` (pagedraw) never stopped its animation-frame loop on unmount (the cleanup captured a
  stale null id) and re-rendered its host every frame. The frame id is now a ref. New spec:
  `useUpdateSnapshot.spec.ts` (4).

- Fixed: pasting an image into the moodboard canvas placed it at the raw screen centre, so after panning or
  zooming it landed off-screen; it now uses the canvas-space viewport centre. New spec: `usePasteHandler.spec.ts` (5).
- Fixed: in the prompt box reference deck, an image/video/audio upload that threw left its spinner on screen
  forever (and for video aborted the rest of the batch). It now clears the entry. New spec: `useDeckMedia.spec.tsx` (3).
- Fixed: `useActiveJobs` started its poll `setInterval` inside `setState` updaters, which StrictMode can run twice,
  leaking an untracked interval that could never be stopped. The timer now lives in refs. New spec:
  `useActiveJobs.spec.ts` (5).
- Fixed: the desktop generation feed could show stale data: overlapping task-queue loads (poll plus events) let a
  slow older response overwrite a newer one. Only the latest load now commits. New spec:
  `useDesktopGenerationFeed.spec.ts` (3).
- Fixed: opening a scene whose file was not valid JSON hung the loader forever (the parse error was thrown inside a
  `FileReader` callback and never rejected the promise), and a scene with no creator crashed on load. New spec:
  `useTauriPageSceneAdapter.spec.tsx` (3).
- Fixed: a failing app-preferences lookup in the sound manager swallowed the "generation complete/failed" and
  "enqueued" toasts (the hooks awaited the sound before showing them). Sounds now fail silent. New spec:
  `SoundManager.spec.ts` (3).
- Fixed: the 12 Tauri event hooks kept calling the callback from their first render, so handlers that depend on
  changing props or state saw stale values. They now always call the latest callback. New spec:
  `eventHooks.spec.tsx` (9).
- Added: `BUGS.md`, a bug-by-bug map with status and a review queue.

- Fixed: the four `useGeneration*Event` hooks no longer log every event payload to the console.
- Fixed: the background movie and audio pollers no longer stay stuck "in flight" after a thrown request (the
  movie poller used to skip every later poll). Auth `login`, `signUp`, `logout` and the user-info fetch no longer
  leave the app on a permanent spinner when a request throws, and the signup response is no longer logged.
  New spec: `fetchers.spec.ts` (5).
- Fixed: prompt box reference images no longer leak a blob URL each; moodboard paste now ignores contenteditable
  fields; the moodboard picker always closes even if measuring an item throws. New specs: `useBoardItemEntry.spec.tsx` (7).
- Fixed: saving a scene no longer reports failure when only the cover-image upload fails after the scene saved,
  an updated scene no longer calls `cover_image/undefined`, and a failed media lookup throws a clear error.
- Fixed in `libs/api`: the status-alert error text typo (`mesasge`), the studio enqueue error field, the scene
  snapshot upload going around `FetchProxy` and failing on non-JSON bodies, `pollJobSession` and password-reset
  redeem failing on HTTP errors / HTML error pages, multipart uploads rejecting with a SyntaxError on non-JSON
  errors, and a second `?` in query strings. New spec: `bugfixes.spec.ts` (11).
- Fixed: a slow older subscription fetch can no longer overwrite newer state or restore the previous user's
  subscription after logout; the keybind cheatsheet no longer updates a store inside a state updater; lightbox
  reference audio stops when the lightbox closes and a rejected `play()` no longer sticks. New specs:
  `subscription-state.spec.ts` (3), `useCheatsheetVisibility.spec.tsx` (3), `lightbox-modal.audio.spec.tsx` (3).
- Fixed: the gallery modal no longer shows a slow old filter's results after you switch filters, and a bulk
  delete where some deletes fail now only removes the ones that succeeded and tells you how many failed. New
  spec: `gallery-modal.race.spec.tsx` (2).
- Fixed: the Sora login listeners (`useSoraLoginListener`, `waitForSoraLogin`) no longer leak their Tauri listener
  when the component unmounts, or the event arrives, before the listener finishes registering. New spec:
  `soraLogin.spec.ts` (3).
- Fixed: `useCanvasBgRemovedEvent` always called the callback from its first render; it now calls the latest one.
  New spec: `CanvasBgRemovedEvent.spec.ts` (1).
- Fixed: `useWindowControls` no longer leaves three window listeners registered, or updates state on an unmounted
  component, when it unmounts during setup. New spec: `useWindowControls.spec.ts` (2).
- Fixed: the shared `Queue` kept dropping messages published before anyone subscribed instead of buffering them for
  replay (no live caller yet). New spec: `queue.spec.ts` (2).
- Fixed: a malformed referral cookie no longer throws out of the referral getters; they fall back to localStorage.
  New spec: `referral.spec.ts` (7).
- Fixed: the Sora session check no longer logs the account email to the console, and downloads no longer log the
  download URL.
- Fixed (Rust): Flux text-to-image requests for 4:5 and 5:4 came back in the wrong orientation (4:5 went to
  landscape, 5:4 to portrait) in all four Flux converters (`flux_1_dev`, `flux_1_schnell`, `flux_pro_1p1`,
  `flux_pro_1p1_ultra`). New orientation tests cover every model; `cargo test -p artcraft` is 139 passed, 0 failed.
- Fixed: in the help menu, going Back and picking another tutorial while the YouTube API was still loading could
  build a second video player. New spec: `help-menu-youtube.spec.tsx` (2).

### Documentation
- Added `docs/BEGINNERS_GUIDE.md`, a map of the repo for newcomers.
- Started the beginner comment pass: `handle_web_login_providers.rs` and `handle_storyteller_failed_job.rs`
  (comments only, no behavior change).

### Known open items
See `TRACKER.md` ("Open").

## Upstream history (storytold/artcraft)

### 2026-10-11
- artcraft-native: generate with Midjourney or fal, with a provider choice (#2115, d4e4ac6)

### 2026-10-10
- artcraft-native: Create Audio, in-app playback, animated previews and @Characters (#2079, 28a39a0)
- artcraft-native: custom title bar and Claude-style layout (#2068, bb27304)
- Added `artcraft-native`, a pure Rust (egui) desktop app starting with Create Image and Create Video
  (#2067, b5614ad)
- Relicensed under MIT OR Apache-2.0 (#2043, 8abde75)

### 2026-10-09
- artcraft 0.42.0 (#2026, 910bfe4)
- Error messages made user friendly (#2025, 7aebfc1)

### 2026-10-07
- PageScene: dispose GPU assets on desktop (#1972, 3e5793b)

### 2026-09-28
- New ArtCraft icon for the app icon and favicons (#1965, 3210977)
- Desktop app styling matched to the web app (#1963, 90c7a8a)
- Thumbnail speedup and a fix for thumbnails that did not render (#1964, 1b27c31)
- Client identity (origin, user agent) sent with requests (#1962, 93b664d)

### 2026-09-27
- Better dev script (#1961, 92e6f43)
- Performance changes (#1959, df707bf)
- Fixed the login video on desktop (#1958, 780e449)

### 2026-09-26
- ArtCraft 0.41 (#1957, c3844ac)
- Website-based login challenges (#1956, 8456e2f)

### 2026-09-18
- ArtCraft 0.40.0 (#1955, 95f8f65)
- New models and modes: GPT Image 2.5, Wan, output formats (#1954, 3c5038c)

### 2026-09-14
- Midjourney fixes backported from ArtCraft-X (#1953, 584fdb7)

### 2026-09-11
- README update (#1952, 5c7807a)
- 0.39: fix for CI builds, no-op build (#1950, 906447f)
- CI builds fixed; they had relied on build caches (#1949, 6cc5ce7)
- Bumped to 0.38 to test the repo reset (#1948, 9a9b406)
- Removed stale docs and files (#1947, 28e5d71)
- ArtCraft Desktop, fresh start (0004726)

Older history was removed by the 2026-09-11 repo reset. Only the 25 most recent upstream commits were
summarized here.
