# Bug register

Every bug found in the fork pass, one line each, with status. `TRACKER.md` has the per-file detail and
`CHANGELOG.md` the user-facing wording. Nothing is committed yet. Status: FIXED (code changed and a test or
check covers it), NOTED (seen, deliberately not changed), OWNER (needs a decision or access only the owner
has), QUEUE (not yet reviewed). Update this file when a row changes.

Last updated: 2026-10-17. Fixed: 73. Noted: 26 (N-02..N-05, N-10..N-31). Owner: 6. Queue: Q-03, Q-05, Q-07, Q-08 and Q-09 partly or fully open.

## Fixed

| ID | Area | Bug | Fix |
|---|---|---|---|
| B-01 | Rust | `unimplemented!()` panic in web-login provider handler | `warn!` plus `GenerateError::NotYetImplemented` |
| B-02 | Rust | World Labs / splat tasks recorded with the wrong task type | `TaskType::GaussianGeneration` |
| B-03 | Rust | Completion notice crashed or was blank for jobs with no CDN URL | `cdn_url_or_placeholder` |
| B-04 | Rust | Failed-job message dropped | Forwarded as `reason` |
| B-05 | Rust | One handler error aborted the whole task polling thread | Logged, loop continues |
| B-06 | Rust | `println!` in window sizing/provider code (breaks AGENTS.md rule) | `log` macros |
| B-07 | Rust | Grok bytes upload unimplemented | Implemented |
| B-08 | Rust | Missing feature flags (uuid `v4`, indexmap `serde`) | Added |
| B-09 | Rust | Grok media-post `match` ended in `unimplemented!()` | `GrokClientError::UnsupportedMediaPostType` |
| B-10 | Frontend | Upload components: wrong props, import, missing `default` case | Fixed |
| B-11 | Frontend | Stale closure in `handleDownload` (`DesktopGenerationGallery`) | Dependency list |
| B-12 | Frontend | `addCorsParam` produced a second `?`; `is3DModelUrl` matched substrings | `&` when needed; check path end |
| B-13 | Frontend | `getFileName`/`getFileExtension` wrong for names with no dot (empty upload name) | No-dot case handled |
| B-14 | Frontend | Whole user profile logged to console on every update | Log removed |
| B-15 | Frontend | `shouldAddToast` time comparison inverted (duplicates let through) | Corrected |
| B-16 | Frontend | `setJobs` compared the function, not the list (re-render every poll) | Compares `recentJobs.value` |
| B-17 | Frontend | Stale-response race in session media / gallery data hooks | `requestIdRef` guard |
| B-18 | Frontend | `useGenerationJobs` flooded "newly completed" after a media-type switch; stale poll overwrote feed | Reset refs, `loadIdRef` |
| B-19 | Frontend | AssetMenu object hooks: in-flight guard inside `setState`; stuck IN_PROGRESS; dropped `nextPage` | `inFlightRef`, ERROR on throw, keep `nextPage` |
| B-20 | Frontend | Video editor: stale "load more" appended to a new search | `latestSearchKeyRef` |
| B-21 | Frontend | Video editor: bookmark moved onto an occupied frame (duplicates) | No-op on occupied frame |
| B-22 | Frontend | Animation library stuck IN_PROGRESS after a thrown fetch | ERROR state, retry works |
| B-23 | Frontend | Draw snapshot loop never cancelled; host re-rendered ~60x/s | Frame id in a ref |
| B-24 | Frontend | Moodboard paste landed off-screen after pan/zoom | `viewportCenterOnCanvas` |
| B-25 | Frontend | Prompt box upload that threw left spinner forever (video aborted batch) | try/catch, `settled` flag |
| B-26 | Frontend | `useActiveJobs` started `setInterval` inside `setState` updaters (StrictMode leak) | Timer in refs |
| B-27 | Frontend | Desktop generation feed: slow older load overwrote newer state | Sequence ref |
| B-28 | Frontend | Corrupt scene file hung the loader; missing creator crashed it | Parse text directly; optional chaining |
| B-29 | Frontend | A rejected preferences lookup swallowed generation/enqueue toasts | `SoundManager.playEvent` fails silent |
| B-30 | Tooling | `@remix-run/deno` imports; lint script broken; `jest` never installed | `@remix-run/node`; lint fixed; vitest |
| B-31 | Tooling | NodeNext `.js` imports and `rootDir` errors in about 50 `tsconfig.spec.json` | Fixed |
| B-32 | Tooling | Duplicate "artcraft" vitest project; video-editor wasm broke combined runs | Workspace excludes; per-package runner |
| B-33 | Tooling | Duplicate `terser` in devDependencies | Removed |
| B-34 | Frontend | `model-list` classes imported via a `baseUrl`-only path | Relative path |
| B-35 | Frontend | Accessibility: unlabeled inputs in `Storyboard`, `CostModal` | Labels |
| B-36 | Frontend | Type and lint errors across about 20 files (unused vars, `any`, casts) | Cleaned, behavior unchanged |
| B-37 | Frontend | All 12 `tauri-events` hooks subscribed once with `[]` deps, so they called the first render's callback forever (stale props/state) | Callback read through new `useLatestRef` |
| B-38 | Frontend | Four `useGeneration*Event` hooks logged every event payload (Q-02) | Logs removed |
| B-39 | Frontend | `PollUserGeneratedMovies` / `PollUserAudioItems`: a thrown request left the in-flight flag stuck (movies poller then skipped every later poll) (was N-01) | try/catch/finally, toast, return false |
| B-40 | Frontend | Auth `login`/`signUp`/`logout`/user-info: a thrown request left status on LOGGING / GET_USER_INFO forever; signup response was logged | Fall back to `setLogoutStates`; logs removed |
| B-41 | Frontend | `useDeckMedia` image `fullUrl` blob never revoked (was N-06) | Revoked on removal, replacement, unmount |
| B-42 | Frontend | Moodboard paste handler hijacked pastes into contenteditable fields (was N-07) | `isTextEntryTarget` |
| B-43 | Frontend | `handlePicked` left the picker open if measuring threw (was N-08) | try/catch/finally |
| B-44 | Frontend | `saveScene` reported failure when only the cover image failed; update path called `cover_image/undefined`; `getMediaUrlByToken` threw an opaque TypeError (was N-09) | Cover step caught, token fallback, clear error |
| B-45 | Frontend | `libs/api`: `err.mesasge` typo in `MiscApi`; `VideoApi.EnqueueStudio` returned a nonexistent `error_reason` | `message` / `errorMessage` |
| B-46 | Frontend | `libs/api`: `EngineApi`/`PromptsApi` snapshot upload bypassed `FetchProxy` and rejected on non-JSON; `pollJobSession` threw on HTTP errors; `RedeemPasswordReset` parsed JSON before the ok check; multipart upload rejected with SyntaxError on non-JSON errors | Error shapes returned / `HttpApiError` |
| B-47 | Frontend | `ApiManager.fetch` joined the query with a second `?` and left a trailing `?` for an empty query | `&` when needed, nothing for empty |
| B-48 | Frontend | Subscription state: slow older fetch overwrote newer state or restored the previous user's subscription after logout | Fetch token, bumped by `reset()` |
| B-49 | Frontend | Cheatsheet `onKeyUp` updated a store inside a `setHeld` updater | Local `peeking` flag |
| B-50 | Frontend | Lightbox reference audio kept playing after close; rejected `play()` stuck the state | Stop on close/unmount, `.catch` |
| B-51 | Frontend | Gallery modal: filter switch dropped by the loading lock, so an old slow response filled the new filter | `loadRequestIdRef` |
| B-52 | Frontend | Gallery bulk delete removed every selected id even when some deletes failed | Remove only fulfilled, keep failures selected, toast |
| B-53 | Rust | `generate_xsid.rs`: `timestamp - 1682924400` underflowed (panic in debug) and a needless `unwrap` | `checked_sub` to `BadSignatureInputs`; `to_le_bytes` |
| B-54 | Rust | `signature_xa.rs` / `signature_simulate_style.rs`: `&s[9..]` and `&values[7..]` panic on short or multibyte scraped data | `.get(..)` returning an error |
| B-55 | Rust | `grok_download_video.rs`: `flush().unwrap()` panics on disk write failure | `CannotWriteLocalFile` error |
| B-56 | Rust | `get_index_page.rs`: `to_str().unwrap()` panics on non-ASCII header bytes; `println!` logged the cookie value | Lossy decode; `debug!` of the cookie name only |
| B-57 | Rust | `println!` outside tests (AGENTS.md) in four Grok files and `wait_for_image_gen_status.rs` | `log` macros |
| B-58 | Rust | `fal_request.rs`: `.expect()` on a missing API key panicked in four send paths; `queue.rs`: `client.unwrap()` panicked for a deserialized `Queue` | `FalError` return; default client fallback |
| B-59 | Rust | `handle_api_providers.rs`: router builder error replaced by `NotYetImplemented("Error Message: TODO")` | Real error propagated |
| B-60 | Rust | `handle_fal_complete.rs`: a completed FAL job with no downloadable URLs stayed pending and was polled forever; HTTP error bodies were uploaded as media | `handle_fal_failure`; `error_for_status` |
| B-61 | Rust | Sora `download_generation_item` saved and uploaded HTTP error bodies as media (was N-21, first half) | `error_for_status` |
| B-62 | Rust | `download_url_to_temp_dir`, `simple_http_download`, `simple_http_download_to_tempfile`, and WorldLabs `download_spz` wrote error bodies to disk as the file | `error_for_status` |
| B-63 | Rust | `download_url_to_temp_dir` took the whole path as the extension for URLs with no dot (e.g. `/media/abc`) | New `extension_from_url_path` helper (2 tests); defaults to `png` |
| B-64 | Rust | `flip_image.rs`: `println!` (AGENTS.md) and `split_at(10)` that panics on short strings | `log::debug!`, length only |
| B-65 | `libs/common` | `Queue.publish` dropped every message when nobody had subscribed yet (the subscriber map always exists), defeating the buffer-then-replay that `subscribe()` does. No live caller today (only its spec uses it) | Drain only when `size > 0`; `queue.spec.ts` (2 tests) |
| B-66 | `libs/tauri-api` Sora | `useSoraLoginListener` leaked its listener if cleanup ran before `listen()` resolved; `waitForSoraLogin` leaked it if the event fired before `listen()` resolved (`unlisten` still undefined) | `cancelled`/`done` flag unlistens on arrival; `soraLogin.spec.ts` (3 tests) |
| B-67 | `libs/tauri-api` | `useCanvasBgRemovedEvent` had `[]` deps, so it kept the first render's callback forever (stale closure) and its early-unsubscribe branch was dead | Callback through a ref updated each render; dead branch removed; `CanvasBgRemovedEvent.spec.ts` (1 test) |
| B-68 | `libs/tauri-utils` | `useWindowControls` registered its three Tauri listeners after unmount when setup was still awaiting, and kept calling `setIsMaximized` on the unmounted component | `cancelled` flag skips `setState` and unlistens late listeners; `useWindowControls.spec.ts` (2 tests) |
| B-69 | `libs/tauri-api` | `CheckSoraSession` logged the whole result, including the account email, to the console | Log removed |
| B-70 | `libs/tauri-api` | `downloadFileFromUrl` logged every (possibly signed) download URL | Log removed |
| B-71 | `libs/common` | `referral.ts` `readCookie`: `decodeURIComponent` threw a `URIError` on a malformed cookie, escaping the public getters instead of falling back to localStorage | try/catch returns `undefined`; `referral.spec.ts` (7 tests) |
| B-72 | Rust | The four Flux text-to-image converters (`flux_1_dev`, `flux_1_schnell`, `flux_pro_1p1`, `flux_pro_1p1_ultra`) mapped a tall 4:5 request to landscape 4:3 and a wide 5:4 request to portrait 3:4, so the generated image came back in the wrong orientation | The two arms are swapped back (4:5 to `PortraitThreeByFour`, 5:4 to `LandscapeFourByThree`); 41 aspect-ratio tests incl. the new orientation property tests (16 failed before the fix) |
| B-73 | Frontend | `help-menu.tsx` YouTube effect: after Back and a new tutorial pick while the YouTube API was still loading, the earlier run resumed and built a second player (wrong video, leaked progress timer) | `cancelled` flag checked after `await loadYouTubeIframeAPI()`; `help-menu-youtube.spec.tsx` (2 tests; the first fails with "Player called 2 times" when the check is removed) |

## Noted, not changed

| ID | Where | Why left |
|---|---|---|
| N-02 | `prompts-cache.ts` | Retry comment is looser than the code |
| N-03 | `JobStatus.CANCCELLED_BY_SYSTEM` | Misspelled key; rename touches every consumer |
| N-04 | `backgroundLoadedMedia` mapper | `length = seconds * 60`: unit undocumented |
| N-05 | `unimplemented_sora_job_status.rs:44` | Deprecated stub, name says unimplemented |
| N-10 | `libs/api/MediaUploadApi.ts` `UploadStudioShot` | Uses undefined `ApiTargets.uploadApi` (URL becomes `undefined/v1/...`) and the global `fetch`. Nothing calls it. The session-token `console.log` lines were removed |
| N-11 | `libs/api/ApiManager.ts` query/body parsers | Drop falsy values (`false`, `0`, `""`), so `sort_ascending=false` or an empty description cannot be sent. Server defaults unknown |
| N-12 | `libs/api` `MediaFilesApi`/`WeightsApi` list+search methods | Hardcode `success: true` and ignore `response.success` |
| N-13 | `libs/api/CharactersApi.ListAllCharacters` | Returns success with partial data after a mid-pagination failure; would loop forever on a repeated cursor |
| N-14 | `libs/api` `UserApiKeysApi`/`UserReferralCodesApi` | `jsonFetch` throws on an empty 2xx body (e.g. 204 on DELETE) |
| N-15 | `libs/api` `UsersApi`, `MediaFilesApi`, `UserBookmarksApi` | Username not URL-encoded in paths; `Login`/`GetUserProfile` console.log; `DeleteUserBookmark` always sends `as_mod: true` |
| N-16 | `libs/api` `EngineApi.ConvertTbxToGltf`, `JobsApi.GetPreviewStatusByJobToken` | Endpoint name / response shape unconfirmed |
| N-17 | `libs/tauri-api/.../EnqueueEditImage.ts` | `image_resolution` is never forwarded (text-to-image does); unclear whether the Rust command accepts it |
| N-18 | `useBackgroundLoadingMedia.tsx` | Completed-job markers are set before the poll runs, so a failed poll is not retried until the next completion. `PollUserAudioItems` has no in-flight guard |
| N-19 | `lightbox-modal.tsx`, `viewer-3d.tsx` | Failed delete still closes the modal and rejects unhandled; keydown ignores contenteditable; embla listeners never removed; 3D model-load effect can bail before the scene exists and may reload-loop |
| N-21 | Rust: Sora `handle_successful_generations.rs` | One bad URL, download or upload aborts the whole function with `?` (the surrounding code has no per-task isolation pattern, so left as is) |
| N-24 | Rust: `println!` still in startup/state code | `lib.rs`, `set_app_log_level.rs`, `resize_main_window.rs:54,57`, `app_env_configs.rs`, `app_data_root.rs`, `trait_data_subdir.rs`, `app_preferences.rs:74`; most run before the logger exists, so swapping to `log::` would lose the output. Needs a product call. `load_without_cors_command.rs:35` does not check status (a CORS proxy, possibly intentional) |
| N-22 | Rust: `batch_size as u16` in `handle_api_providers.rs` / `handle_artcraft_via_omni_endpoint.rs` | Truncates values of 65536 or more; needs a validation decision |
| N-23 | Rust: `wait_for_image_gen_status.rs:46` | Retry exhaustion returns "Task not found" instead of a timeout; `login_challenge_client.rs:66` `expect` on a static URL; `handle_grok.rs` is dead code; `handle_fal_complete.rs` may re-upload duplicates after a mid-batch failure |
| N-20 | `gallery-modal.tsx` `handleBulkDelete` | Only a rejected promise counts as failure; a resolved `{success:false}` is treated as deleted |
| N-25 | `libs/tauri-api/.../UpdateAppPreference.ts` | `PreferenceName.GenerationEnqueueSound` has no variant in the Rust `PreferenceName` enum (`update_app_preference_command.rs:31-41`), so updating it fails deserialization while reading works. The fix is on the Rust side |
| N-26 | `libs/tauri-api` dead wrappers | No `#[tauri::command]` exists for `enqueue_image_to_3d_world`, `enqueue_image_to_video`, `fal_background_removal`, `fal_hunyuan_image_to_3d`, `fal_kling_image_to_video`, `get/set_fal_api_key`, `get/set_openai_api_key`, `sora_image_remix`; their wrappers (`EnqueueImageTo3dWorld.ts` etc.) would fail at runtime. Removal needs a decision; `OpenAIKeyBlock.tsx` in settings-modal imports the OpenAI key pair, so check that caller first |
| N-27 | `libs/tauri-api/.../Provider.ts` | TS `Provider` has `grok` and `midjourney`, Rust `Provider` (`provider_priority.rs:11-15`) only artcraft/fal/sora; `SetProviderOrder` with those fails deserialization (wrapper is deprecated) |
| N-28 | `libs/tauri-api` `Estimate*Cost.ts` and other `invoke` casts | Rust returns `Err(CommandErrorResponseWrapper)`, so `invoke` rejects; the typed "error result" shapes are never returned and callers must `.catch`. The pricing-modal hooks do, so no live bug |
| N-29 | `EnqueueImageInpaint.ts`, `GenerateImage` `*_raw_bytes` | A `Uint8Array` nested in the payload may serialize as `{"0":..}` while Rust expects `Vec<u8>`. Unconfirmed (Tauri serialization not checked; PageDraw seems to work). `EnqueueImageInpaint` has no callers |
| N-30 | `libs/tauri-api/.../modelsStore.ts` | `loaded: true` is set even when both backend list calls fail |
| N-31 | `libs/tauri-utils` `IsDesktopApp.ts`, `FetchProxy.ts` | Assign to `window` at module scope; would throw under SSR if imported there |

## Needs the owner

| ID | Item |
|---|---|
| O-01 | Repro for issue #963 |
| O-02 | Live World Labs run to confirm #1126 |
| O-03 | Comment on or close #960 (likely fixed upstream by #1964) |
| O-04 | Real Grok auth cookie names for `grok_login_window_thread.rs` |
| O-05 | Product decision on three `service: Artcraft // FIXME` labels |
| O-06 | Unify duplicated API classes, models and enums (needs a running app) |

## Review queue (worked top to bottom)

| ID | Area | State |
|---|---|---|
| Q-01 | `libs/tauri-events`: event hooks | DONE (B-37) |
| Q-02 | Leftover `console.log` in `useGenerationCompleteEvent` and siblings | DONE (B-38) |
| Q-03 | App Zustand stores and signals | reviewed in the parallel pass (B-39, B-40); specs for the rest still queued |
| Q-04 | `apps/artcraft/app/src` hooks | reviewed in the parallel pass (B-39, B-40) |
| Q-05 | `libs/components` hooks: gallery-modal, upload-modal, audio-player | gallery-modal DONE (B-51, B-52); not reviewed: upload-modal `UploadModal3D`/`UploadModalSplat`/`convertFbxToGlb`/`readGlbAnimationDuration`, audio-player controller, gallery folder chips/drag components, other a-g packages |
| Q-06 | `libs/api` request classes: error handling on non-2xx and JSON parse | DONE (B-45..B-47). `libs/tauri-api` (every file except `EnqueueEditImage.ts`) and `libs/tauri-utils` reviewed in the second pass (B-65..B-71, N-25..N-31); `libs/common` `enums/*` and the other `interfaces/*` not reviewed |
| Q-09 | `libs/components` h-z: popover, model-selector stores, pricing-modal estimate hooks and stores, settings-modal stores and panes, help-menu, login-modal store | queued (worker ran out of budget) |
| Q-07 | Rust: unit tests for `crates/desktop/artcraft` handlers | queued (only `cargo check -p artcraft` was run this pass, not `cargo test -p artcraft`) |
| Q-08 | Rust: other crates swept for `unimplemented!`/`todo!` and `.unwrap()` on input | grok, sora, fal and artcraft_client reviewed (B-53..B-60). Sweep two (B-61..B-64, N-21..N-24) scanned every crate for panics and stdout prints, but only shallowly in `midjourney_client`, `worldlabs_api_client`, `worldlabs_consumer_client`, `kinovi_web_client`, `gmicloud_client` and `artcraft_router`; a deep read of those six is in progress |
