# Changelog

All notable changes to ArtCraft. Newest first.

The "Upstream history" section is summarized from the public commit log of
`storytold/artcraft` (commit hashes and PR numbers in parentheses) so a newcomer can see how the
project got here. The "Unreleased" section is the bug-fix work on the `rene751/artcraft` fork; see
`TRACKER.md` for the per-file detail of each item.

## Build 2: second bug-fix batch (2026-10-17, unreleased)

Work done after Build 1 was committed (branch `fix/bug-sweep-build-1`). Entries are added here as each fix is
verified by a spec or a check. Bug IDs refer to `BUGS.md`.

### Itemized (code already in the Build 1 commit)
- B-74..B-90 and B-93..B-97 are fixes made by parallel reviewers late in Build 1 that had no changelog entry.
  They are now logged with their specs: `button-icon-select` keeps the clicked option on a parent re-render;
  `gravatar` follows a new email hash; gallery-modal move/copy failures toast instead of rejecting, a replaced
  folder cover recovers from a broken one, a cancelled press no longer starts a phantom drag, and
  `pointercancel` ends a gallery drag; `WaveformAudioPlayer` resets for a new track and retries a failed
  waveform; `camera-settings-modal` ends its drag on `pointercancel`; the 3D preview loader drops errors that
  arrive after the preview was replaced; pricing-modal no longer sticks on its spinner and shows an error when
  checkout cannot open; the Grok and Midjourney account blocks let only the newest session fetch write state
  and keep the account shown when clearing credentials fails; the Downloads pane shows an alert instead of an
  unhandled rejection; the provider priority pane saves once under StrictMode, ignores drops outside the list
  and survives a failed load; a failed credential purge on log-out no longer rejects unhandled; the media
  poller no longer sends duplicate requests or retries a failure forever.

### Fixed (frontend)
- Settings: a failed sign-out no longer leaves the account block spinning, and the session object is no longer
  logged to the console (B-91, B-92).
- Dropping files on the app window no longer handles each drop twice under React StrictMode; a drag-drop
  subscription that arrives after cleanup is released immediately (B-98).
- Video editor timeline: unmounting in the middle of a playhead scrub, a clip resize, a graph-editor curve drag
  or a volume-line drag now resets the scrub flag and discards the preview instead of leaving it in the shared
  editor (B-99..B-102).
- Scene editor (pagescene): a failed MMD load removes its "Loading" placeholder; a cancelled pointer ends an
  asset drag without dropping it; the "saving" loader is always dismissed even when the save fails; the free
  camera stops panning after `pointercancel` and a key release always clears the movement key (B-103..B-107).
- Video editor core: a failed audio decode no longer evicts a newer cached entry; a failed autosave stays dirty
  and is retried (and no longer surfaces as an unhandled rejection); a slow older `openProject` can no longer
  overwrite a newer project; a stale `startPlayback` can no longer start a second schedule interval; duplicate
  or failed audio `Input`s are disposed instead of leaking (B-108..B-112).
- Mood board: a cancelled touch gesture ends the marquee selection instead of leaving it armed for the next
  click, and the marquee no longer fires its selection callbacks from inside a state updater (applied twice
  under StrictMode); a lost focus (Cmd+Tab, Spotlight) no longer leaves Space "held" or a pan following the
  mouse (B-113, B-114, B-118).
- Prompt box: an audio reference the webview refuses to play returns to the play icon instead of sticking on
  stop with an unhandled rejection, in both the image prompt row and the reference deck; the uploading-video
  placeholder makes one preview URL per file and releases it; removing or unmounting a playing audio reference
  silences it; the reference deck no longer comes back stuck open after "Clear all" (B-115..B-117, B-119,
  B-120).
- 3D scene viewport: a touch or pen gesture the browser cancels no longer leaves the mouse "held", so the
  camera stops rotating on every later mouse move (B-121).
- Video editor core: leaving the editor while an autosave is still writing no longer drops the edits made
  during that write; the exit save now waits for the running save and then saves the newest state (B-122).
  Undoing a pasted or deleted media asset no longer wipes assets that were added to the media bin in between
  (assets panel, timeline drag-drop), and undoing a multi-select delete brings every asset back with a working
  preview instead of a revoked blob URL (B-123, B-124). Dragging a number field's scrub icon with a touch or pen
  gesture the browser cancels no longer leaves the field changing on every later mouse move (B-125).
- Storyboard: a cancelled touch or pen drag on the timeline no longer leaves a shot resizing on every later mouse
  move or reorders the shots on the next click (B-126).
- Video editor fonts: a Google Font that failed to load (offline, CDN unreachable) is no longer remembered as
  loaded, so picking it again after the connection is back requests it again instead of doing nothing until the
  app restarts (B-127). A new `handle-primitives.spec.tsx` (4 tests) pins that the preview transform handles end
  a drag when the pointer leaves, which is what recovers a cancelled gesture; it is a regression guard, not a fix.
- Video editor timeline: selecting two or more clips that sit on the same track and dragging them sideways on
  that track no longer breaks them apart. Before, the second clip was sent looking for a track of its own: it
  jumped onto the main track when that was free, or the whole drag fell back to creating a new track for every
  clip and left the original track empty. Clips that start on one track now stay together on one track (B-128).
  New `group-move/resolve-move.spec.ts` (16 tests).
- Video editor timeline: resizing several selected clips that sit on the same track by dragging an outer edge
  no longer lets them overlap. Before, a selected neighbour was ignored as a limit, so the earlier clip grew
  straight over the next one (right edge) or the later clip started inside the earlier one (left edge). The
  facing edge of a selected neighbour now stops the whole group, the same way an unselected neighbour does
  (B-129). New `controllers/resize-members.spec.ts` (7 tests). Also new, test coverage only and no behaviour
  change: `group-resize/compute-resize.spec.ts` (13 tests) pins the group-resize solver.
- Video editor backgrounds: a project background that is a default-sized radial ellipse (the "Cosmic Aurora"
  preset in the Pattern craft list, and any `radial-gradient(ellipse at …)` or `closest-corner` one) is now
  painted at the size CSS gives it. The editor draws project backgrounds on a canvas while the picker swatch uses
  real CSS, and the canvas stopped the ellipse at the corner offsets instead of growing it until it touches the
  corner, so every such background came out about 29% too small (a visibly tighter glow than the swatch the user
  clicked) (B-130). New `gradients/canvas.spec.ts` (12 tests).
- Video editor keyframes: splitting an element, or shortening it below its first keyframe, no longer makes an
  animated property jump. Before, if the cut fell after the last keyframe (or before the first), the half of
  the element with no keyframes on its side lost the animation and showed the property's plain static value
  (for example opacity 1 instead of the 0.8 it had just been holding). That half now gets one keyframe at the
  cut that holds the value the property had there (B-131). New `animation/keyframes.spec.ts` (10 tests).
- Moodboard: deleting the board you are on no longer leaves the grid's selection bar showing "N selected" for
  cards that belonged to the deleted board. Before, the first remaining board took over with the old selection
  still counted, its buttons did nothing (or, for "Group into a new section", made an empty section), and only
  Clear got rid of it. The selection is now cleared when the active board is deleted (B-132). Four new tests in
  `BoardLibraryStore.spec.ts`.
- Moodboard sync (library only, not counted, the desktop app does not turn sync on): signing out and back in as
  the same account no longer leaves the sync controller idle until a reload. Before, Save and the backlog of
  edits made while signed out pushed nothing after the sign-in (N-69). New `persistence/moodboardSync.spec.tsx`
  (5 tests).
- Video Frame Extractor: pressing Extract Frames on a video that has not loaded now says so ("The video has not
  loaded yet...") instead of going quiet after 5 seconds (B-133). Before, the page gave no message and the run
  carried on into a seek loop that could never finish. Videos whose frame size is already known (WebKit often
  never announces `loadeddata`) still extract as before. Pressing Switch Video during a run no longer leaves the
  next video's button stuck on "Extracting...", and the old video's frames no longer appear under the new video
  (B-134). New `VideoFrameExtractor.spec.tsx` (5 tests).
- Angles: when an angle job fails after it was accepted (flagged prompt, server error), the loading placeholder
  now goes away and Download is enabled again; before, both stayed until the history was cleared (B-135). The
  page remembers which model each pending job used and matches the backend's failure event to the one job on
  that model. If two pending jobs use the same model the failure cannot be told apart and both stay; the exact
  fix (a job id on the Rust failure event) is noted in `BUGS.md`. New `AnglesStore.spec.ts` (10 tests).
- 3D tab (object and world): when a 3D job fails after it was accepted, its "Generating…" row in the session list
  now goes away; before, it kept spinning until "Clear Session" (B-136). The failure is matched by the job kind
  (`image_to_3d` or `generate_gaussian`) and only when one row is pending; with two pending rows both stay. New
  `ImageTo3DStore.spec.ts` (7 tests) and `ImageTo3DWorldStore.spec.ts` (6 tests).
- Remove Background: when a background-removal job fails after it was accepted, the "Removing Background..."
  overlay now ends and Download and Compare work again; before, the overlay stayed until another image was sent
  (B-137). The failure is matched by the job kind (`remove_background`); the page keeps its job id, so a result
  that still arrives is shown. New `RemoveBackgroundStore.spec.ts` (6 tests).
- Task Queue button: the number badge no longer counts old finished tasks as unread when the app starts; before, a
  user with a long history of un-cleared finished tasks saw a badge with that whole count on every launch (B-138).
  The first check of the task list now only records what is already finished; tasks that finish after it still
  light the badge, and opening the queue still clears it. New `TaskQueue.spec.tsx` (6 tests).
- Video prompt box: when a model lets you ask for several videos at once (Seedance 2.0, 2 to 4), every video's task
  card in the Task Queue and the video feed now shows its prompt and reference thumbnails; before, only one of them
  did, because the box saved a single record for all the tasks it started (B-139). The box now saves one record per
  task. New `PromptBoxVideo.spec.tsx` (4 tests).
- Settings → Keybinds: the camera movement and look keys (held keys) no longer accept Ctrl, Shift or Alt chords; before,
  rebinding "Camera forward" to Ctrl+J was saved and shown, but the camera never moved on it and the old W key stopped
  working too (B-140). A refused chord now shows a short notice with a Dismiss button and changes nothing; actions that
  fire once per press (Move, Rotate, and so on) still take chords. A chord saved before this fix is not cleaned up
  automatically: use the row's revert button. New `KeybindsSettings.spec.tsx` (7 tests, shared with B-141).
- Settings → Keybinds: the "Press a key…" box now stops listening when you click away or the window loses focus; before,
  it stayed armed, so the next letter typed anywhere (for example in the search field) was swallowed and silently
  rebound that action, and arming a second row without finishing the first made one key press rebind both (B-141).
- Generate Image, Generate Video and Create Audio pages (history lists): when the request that looks up each item's
  prompt failed (offline, a server error), the list recorded "this item has no prompt" for every item in it and never
  asked again, so prompt text and model stayed missing until the app was restarted, even after the network came back.
  A failed lookup is now remembered separately: the list still stops showing the loading placeholder, and the next time
  the list is shown or its items change, it asks again. One failed batch no longer throws away the prompts another batch
  brought back (B-142). `media-prompt-token-cache.spec.ts` gained 4 tests.
- Settings → Audio: clicking the label "Enqueue Success Sound", "Enqueue Failure Sound" or "Generation Success Sound"
  opened the "Delete File Sound" dropdown instead, because four of the pickers shared one element id. Each picker now has
  its own id, so its label opens it (B-143). New `AudioSettingsPane.spec.tsx` (6 tests).
- Lightbox (details panel, "Tags"): when the request for a file's tags failed (offline, a server error), the panel acted
  as if the file had no tags and showed the owner an empty box; adding one tag then replaced all the tags the file really
  had with just that one. A failed lookup now leaves the Tags block hidden until a lookup succeeds (moving to another file
  or reopening the lightbox asks again); a file that truly has no tags still lets the owner add the first one (B-144).
  New `TagsSection.spec.tsx` (6 tests).
- 3D editor, opening a saved scene (from a scene link, the gallery, or the "Load a Saved Scene" dialog): the editor was
  told the scene's name and token before its file had been downloaded. If the download then failed (offline, a CDN error,
  a corrupt file), the header showed the new scene's name while the editor still held the previous scene (or an empty
  one), and pressing Save uploaded that content over the scene the user had tried to open. The name and token are now
  announced only after the file has been downloaded and read, so a failed open leaves the header and the Save target
  where they were (B-145). `useTauriPageSceneAdapter.spec.tsx` gained 5 tests.
- 3D object panel (Location, Rotation and Scale boxes): pressing and dragging a box that was empty or held only "-" or "."
  (for example after clearing it to type a new number), or dragging the "Scale" label while a Scale box was in that state,
  wrote the text "NaN" into the box. The 3D object did not follow (it stayed as it was) and the box then refused Backspace
  and typing, so only select-all-and-type could repair it. A box that is not a complete number is now counted as 0 when
  the drag adds its step (B-146). New `InputVector.spec.tsx` (12 tests) and `ControlPanelSceneObject.spec.tsx` (6 tests,
  the panel's first spec).
- Prompt boxes (Video, Image, Audio, 2D and VFX tabs): typing Japanese, Chinese or Korean, the Enter that accepts a word
  from the IME candidate list was handled as a real Enter. With Enter-to-generate on, every accepted word started a paid
  generation from a half-typed prompt; in the VFX box (no setting) it did so by default once a source video and a
  reference image were attached; in the Video box with the setting off, each accepted word also inserted a stray line
  break, and the @-mention list took the IME's arrow and Enter keys. Each box now ignores keys that belong to the IME
  (new `isImeKeyDown` in `promptbox/src/lib/common/imeKey.ts`: `isComposing` true or `keyCode` 229, which covers both
  Chromium and Safari's engine); a real Enter and Shift+Enter work as before (B-147). 27 new tests in six spec files, the
  vfx package's first spec among them; the key shapes are replayed in jsdom, not captured from a real IME.
- Video tab (Seedance 2.0, "@Characters"): making a character with a name the account already uses (the app allows
  duplicate names) made the "Creating..." card vanish at once, because the card was matched to the server's list by name
  alone and the older same-named character was already there. With the card gone, the 5-second poll never ran, so the
  "@Name" mention list never learned the new character and "@Name" kept resolving to the older one until the
  Characters list was opened again. Each card now remembers the character tokens that existed when it was made and
  only finishes for a server character with that name whose token is new (B-148). New `CharactersModal.spec.tsx`, 3
  tests (2 failed on the old code, 1 control passed before and after); jsdom only, not run in the desktop app.
- Help menu, News & Updates (on any screen with a Help button): links inside an article (the GitHub repository, the
  Discord invite, "/download", "/press-kit#top" in the shipped post) were plain web links that nothing handled, so a
  click was left to the webview, which loads the address inside the app window itself (the opener plugin acts only on
  `target="_blank"` links or Ctrl/Shift-clicks). A click is now cancelled and the address is opened in the system
  browser with `OpenUrl`, like the menu's own Discord and GitHub items; a link starting with "/" opens on
  `https://getartcraft.com` (my assumption, one constant); `#jump`, `mailto:` and `//host` links are left alone (B-149).
  No new plugin, capability or Rust command. New `help-menu-news-links.spec.tsx`, 6 tests (4 failed on the old code,
  2 controls passed before and after); jsdom only, the webview behaviour is inferred and was not observed in the
  desktop app.
- Sign-up dialog, "Join our community." step: the "Join Discord" button used `window.open`, which the desktop app's
  main window ignores (no new-window handler; wry drops the request on macOS and Windows), so the button opened nothing
  and the dialog still moved on to "Thank you for signing in!". It now opens the invite in the system browser through the
  opener plugin, the route the dialog's "Open website" button already uses (B-150). No new plugin, capability or Rust
  command. Two tests added to `login-modal.spec.tsx` (1 failed on the old code, 1 control passed before and after);
  jsdom only, the dropped `window.open` is read from the wry source and was not observed in the desktop app.
- Moodboard tab, board picker: the trash button on a board asked "Are you sure?" with `window.confirm`, but the desktop
  app's dialog plugin replaces `window.confirm` with an async function whose Promise is always truthy, so the check
  could never stop the delete and one press removed the board (and its online copy) with no question. The picker now
  asks inside the dropdown: the trash icon shows `Delete "<name>"?` with Cancel (focused first) and Delete buttons, and
  closing the dropdown drops a pending question (B-151). No new plugin, capability or Rust command. New
  `BoardPicker.spec.tsx`, 5 tests (all 5 failed on the old code; only 2 of those failures show the bug itself, the
  other 3 failed because the new Cancel / Delete row did not exist); jsdom only, the dialog plugin's behaviour is read
  from its source and was not observed in the desktop app.
- Video Editor tab, preview: the full-screen button under the preview and the "Full screen" item in its right-click
  menu called `requestFullscreen()` with no check. The macOS webview keeps element full screen switched off unless the
  app enables Tauri's `macos-private-api`, which this app does not, so by the build configuration both controls were dead
  on macOS. `useFullscreen` now reports `isSupported` (`document.fullscreenEnabled`), and the button and menu item are
  drawn only where full screen works (B-152). This hides the dead control, it does not add full screen to macOS (that
  is N-85, an owner decision). No new plugin, capability or Rust command. New `use-fullscreen.spec.tsx` (5 tests) and
  `fullscreen-controls.spec.tsx` (4 tests): 5 failed on the old code, 4 controls passed before and after; jsdom only,
  the macOS behaviour is inferred from the wry, Tauri and repo sources and was not observed in the desktop app.
- Upload image and Upload splat dialogs: with several files, a running batch reports each file's result by row number,
  but the file picker stayed live and `handleFilesChange` replaced the rows mid-upload. When the old uploads finished
  their reports landed on the new, never-uploaded rows (green "uploaded" ticks), the Upload button came back so a second
  batch could start, and a single-row Retry lost its row. Both dialogs now ignore a new choice while an upload is
  running (B-153). The picker's own `disabled` flag was not used: `react-drag-drop-files` 2.4.0's drop handler ignores
  it. A second choice during an upload is silently ignored (no message). New `UploadFilesImage.spec.tsx` and
  `UploadFilesSplat.spec.tsx`, 7 tests each (3 failed on the old code in each, 4 controls passed before and after); jsdom
  with the uploaders mocked.
- Video tab prompt box, reference videos and audio tracks: files dropped or pasted onto the box are handed to the hook
  without waiting, and nothing stopped a second drop while the first was uploading. Each call worked from the deck as
  it was when the call began and the deck has one spinner slot per kind, so overlapping drops lost an earlier upload
  (video), brought back a card the person had removed (video), cleared the spinner while another file was still
  uploading, and let three files into a two-item deck. A library pick had the same snapshot and overwrote an upload that
  landed while the pick was being measured. Batches now take turns (`videoQueueRef`, `audioQueueRef`) and read the deck
  at their own turn from a ref that every commit updates at once; the library branches do the same after their probes
  (B-154). A second drop now waits for the first to finish and shows nothing until its turn; if one upload never
  settles, later drops of that kind wait behind it with no message. Not claimed: an upload
  already running does not re-check the limits when it commits, and audio on a full deck still gives no message. No new
  plugin, capability or Rust command. New `useDeckMedia.overlap.spec.tsx` (20 tests): 5 of the 10 video tests and 3 of
  the 10 audio tests failed on the old code and the other 12 passed before and after; jsdom with a stand-in uploader and
  stand-in `<video>` / `<audio>`, the real network timing and Tauri drop event were not reproduced.
- Audio tab prompt box, reference audio tracks: the row's own copy of the same pattern. Files dropped or pasted onto the
  box reach `AudioReferenceRow` with `void` and a second drop while the first was uploading was not stopped. Each call
  counted its free slots and its duration total from the row as rendered, which leaves out a track still uploading, so
  two quick drops into a one-track row (the default, and the remix/sample models) both uploaded and the row showed
  "(2/1)", with a red "Audio track required" label and a disabled Generate button until one was removed; two long
  tracks could also pass the 600-second cap together. One on/off "Uploading…" flag, switched off by the first finished
  upload, put "Add audio" back while the second was still on its way. Audio batches now take turns (`audioQueueRef`),
  read slots and totals at their own turn from a ref that every commit updates at once, and the "Uploading…" state is
  derived from a count of queued or running batches (`pendingAudioBatches`) (B-154, part 2; counted with B-154, not as
  a separate bug). A second drop now waits for the first, and if one upload never settles, later drops wait behind it
  with no message; a drop that no longer fits at its turn is ignored without a message. Not claimed: the single reference-image
  upload in the same row and the audio library picker behind its modal. No new plugin, capability or Rust command. New
  `AudioReferenceRow.overlap.spec.tsx` (9 tests): 3 failed on the old code and 6 passed before and after; jsdom with a
  stand-in uploader and stand-in `<audio>`, the real network timing and drop event were not reproduced.
- Login / sign-up modal: an error message outlived the screen it was about (B-155). On the sign-up screen, two different
  passwords showed "Passwords do not match."; pressing the "Log in" link left that text on the log-in screen, which has no
  confirmation box. A refusal from the server (taken username, "Invalid credentials") also stayed after switching screens,
  because the modal kept its copy of the message. (The modal's copy also has to be cleared, not only the form's: "Login
  with Website" then "Back" rebuilds the form, which reads the modal's message again; that is reasoned from the code and
  was not run against a form-only fix.) After a mismatch, correcting the box and pressing Sign up left the old complaint up
  while the request ran. The form no longer copies the modal's message into its own state with an effect: the banner shows
  the form's own mismatch message or else the modal's message straight from the prop; the form clears its own message when
  the mode link is pressed and when a valid form is sent, and the modal clears its message when the screen flips. Low
  severity (the next submit replaces the text). A newer mismatch message wins over an older server message while both
  exist. No new plugin, capability or Rust command. New `login-modal-stale-error.spec.tsx` (10 tests): 5 failed on the old
  code and 5 passed before and after; jsdom with stand-in Rust commands, the real IPC timing was not reproduced.
- Moodboard: an image the person uploaded, dropped or pasted was gone after an app restart (B-156). A new image is shown
  from a `blob:` address that only lives while the page is open; the grid's saved library drops every blob-backed tile,
  and the canvas saves such an image with an empty address expecting a server sync to restore it, which the desktop app
  does not have. So the grid tile vanished and the canvas image came back as an empty frame. The adapter now has an
  optional `resolveMediaUrl(token)`; after the upload returns its token, both the grid and the canvas swap the tile's
  address for the lasting one (the desktop adapter looks it up with `MediaFilesApi.GetMediaFileByToken`, CDN address
  first). A lookup that finds nothing or fails leaves the tile as before. The blob address is deliberately not released
  (a tile sent to generation in that moment would lose its thumbnail; the canvas undo history points at it). Only
  images added after this change are protected; images already lost are gone. No new plugin, capability or Rust command.
  New `useBoardItemEntry.durable.spec.tsx` (8 tests) and `addCanvasImageFile.spec.ts` (8 tests): 2 tests in each failed
  on the old code and 5 controls in each passed before and after, plus `desktopMoodboardAdapter.spec.tsx` (5 tests, new
  code only). jsdom with the real stores and the real saved-copy code; a real restart of the desktop app and the real
  network lookup were not reproduced. Counted as one bug for both views; the row states the case for the other reading
  (a missing feature rather than a bug).
- Image, Video and Audio tabs: a failed load of the person's history left the "more is loading" spinner at the bottom of
  the feed for good (B-157). The history request reports a network failure as `success: false`; the hook ignored that
  answer (and swallowed a thrown error), so nothing changed and the spinner stayed. Nothing asked again either: the
  scroll watcher is only rebuilt when the next page loads successfully, and after a failed FIRST load it was never built
  at all, so scrolling could not help. (A failure on a later page was milder, since scrolling away and back retried it.)
  The hook now keeps a `loadFailed` flag; the grid and list views show "Couldn't load your generations." with a
  "Try again" button, which asks for the same page again, in place of the spinner. There is deliberately no automatic
  retry (a loop against a failing server is worse than a notice). The new props are optional, so the web app that
  shares this library is unchanged. Leaving the tab and returning also recovers, so this is the borderline kind of count
  (the BUGS.md row says why it is counted and what the stricter reading would do). The notice wording is new copy for the
  owner to approve. No new plugin, capability or Rust command. New `GenerationFeed.loadFailure.spec.tsx` (14 tests): 8
  failed on the old code and 6 controls passed before and after, plus 4 new `useGalleryData.spec.ts` tests (new code
  only); jsdom with a stand-in scroll watcher and network call, the real timing and the look of the notice were not
  reproduced. Counted once for the three tabs and both layouts.
- Top bar, Task Queue: clicking a finished generation in the "Show all" window opened the full-screen viewer with the
  wrong kind of id (B-158). The queue knows two ids for a finished task: a local job number (`id`) and the token of the
  generated file. The small list under the top-bar button handed the viewer the file's token; the "Show all" window
  handed it the job number. The viewer looks the prompt, the creator and the tags up by the id it is given, so, going by
  the code (the real server's answer to a job number was not observed), the same image opened from "Show all" would have
  no prompt, no creator and no tags and no error to explain why. Both click handlers were separate copies that had drifted
  apart; they now call one helper in `TaskQueue.tsx` that builds the viewer record once (the task id stays only as the
  fallback for a task that finished with no file). Closing the viewer and opening the item from the small list also gave
  the right result, so this is the borderline kind of count (the BUGS.md row says why it is counted and gives the
  stricter reading). No new plugin, capability or Rust command. New `TaskQueue.lightbox.spec.tsx` (5 tests): 2 failed on
  the old code and 3 controls passed before and after; jsdom with the real `TaskQueue` and stand-ins for the popover,
  the window, the three signals and the Rust task list, so the look of the viewer was not reproduced. Also found, not
  counted: N-92 (`recordVideo` has no `catch`) and N-93 (the "Clear ..." confirmations act on a stale list).
- Downloads, "Ask location before download": a failed download said nothing (B-159). There are two ways a download
  runs. By default the Rust download command saves the file and, if that fails, flashes its own "Failed to download
  file" toast. With the setting on, the person picks a save path and the Tauri upload plugin fetches the file instead;
  that route never touches the Rust command, and `downloadMediaFileToDisk` (the gallery cards' Download button and the
  top bar's viewer) only logged the error, so a dropped network, an expired link or an HTTP error ended with no
  "Downloaded" toast and no error toast. The function now remembers whether the Rust command is the one running and
  shows "Failed to download file" for every other failure (the chosen-path download and the save-location step), without
  adding a second toast on top of Rust's. Borderline against the manual-way-out rule (the person can retry; the BUGS.md
  row gives the stricter reading). No new plugin, capability or Rust command. New `desktopMediaActions.download.spec.ts`
  (6 tests): 2 failed on the old code and 4 controls passed before and after; jsdom with stand-ins for the Tauri helpers
  and the toast, so a real failing download in the running app was not reproduced. Also found, not counted: N-94
  (`downloadFileFromUrl`, used by the viewers on ten pages, has the same gap) and N-95 (`dismissFailed` in the Audio
  tab's hook ignores a failed delete, so the card hides and comes back at the next poll).
- Full-screen viewer, Delete: a delete that failed looked exactly like one that worked (B-160). Confirming "Delete this
  media?" calls the Rust delete command, which rejects when the delete does not go through (no credentials, offline,
  server error) and only sends the "File deleted." event on success. The confirm action in `lightbox-modal.tsx` was a
  `try`/`finally` with no `catch`, so the dialog and the viewer both closed as though the media were gone, nothing was
  shown, the rejection was unhandled and the item was still in the library. The other three delete confirmations (the
  gallery card, the gallery's bulk delete and Characters) already show a "Failed to delete ..." toast; this one had
  drifted. It now logs the failure, shows "Failed to delete media", still closes the confirmation, and closes the
  viewer only when the delete really worked, so after a failure the item stays on screen and Delete can be pressed
  again. Borderline against the manual-way-out rule (the person can retry; the BUGS.md row gives the stricter
  reading). No new plugin, capability or Rust command. New `lightbox-modal.delete.spec.tsx` (6 tests): 3 failed on the
  old code and 3 controls passed before and after; jsdom with the real viewer and stand-ins for the Rust bridge, the
  toast and the confirmation dialog, so a real failing delete in the running app was not reproduced.
- Draw page, Generate: a Generate that failed to start was never shown to the person (B-161). `handleGenerate` in
  `PageDraw.tsx` was a `try`/`finally` with no `catch`: when the Rust enqueue rejected (signed out, no provider, bad
  input, server error, offline) the rejection escaped into the prompt box's own `try`/`finally` as an unhandled promise
  rejection and the button simply came back; and the two canvas steps before the enqueue (baking the canvas to a PNG,
  uploading it as the scene snapshot) ended in a bare `console.error` and `return`. There is now a `catch` that logs
  and shows `enqueueFailureMessage(error, "Failed to generate image")` (new `utilities/enqueueFailureMessage.ts`: a
  string as is, `error_message`, `error_details.error_message`, an Error's `message`, else the fallback), and the two
  silent exits toast "Couldn't capture your canvas. Please try again." and "Couldn't upload your canvas. Please try
  again."; the `finally` that unlocks the button is unchanged. The right-click Remove background action on the same page
  is deliberately left alone, because the Rust side already sends an enqueue-failure event that the app shows as a toast
  (N-96). Borderline against the manual-way-out rule (the person can press Generate again; the BUGS.md row gives the
  stricter reading). The new toast copy is for the owner to approve. No new plugin, capability or Rust command. New
  `PageDraw.enqueueFailure.spec.tsx` (11 tests): 9 failed on the old code and 2 controls passed before and after; jsdom
  with the real page and stand-ins for the paint surface, toolbars, prompt editor, stores and model list, so a real
  failing enqueue in the running app was not reproduced.
- Cost Breakdown modal, Image to 3D object tab: the modal said "Credit Costs not yet available for this model" for
  both Hunyuan models while the Generate button and the Costs badge on the same tab showed the fetched credit quote
  (B-162). The modal gates its breakdown on a hand-kept list of model ids (`MODELS_WITH_COST_DATA` in
  `cost-breakdown-modal.tsx`) and `hunyuan_3d_3` and `hunyuan_3d_2_0` were never added, although the file already
  routes the tab and the World tab's Marble ids are on the list. Both ids are now on it. With only the ids added the
  breakdown showed a made-up "Resolution 1K" row, an "Items" label and no page name, because the page-data and
  page-name switches had no object case; they now give no resolution, one item labelled "Objects" and the page name
  "Image to 3D Object". Borderline: the price comes from the server route `/v1/omni_gen/cost/mesh`, which is not in this
  repo, so whether the server prices the Hunyuan models was not checked; if it returns nothing the modal now shows "—".
  The new "Objects" and "Image to 3D Object" text is for the owner to approve. No new plugin, capability or Rust
  command. New `cost-breakdown-modal.objectCost.spec.tsx` (7 tests): 4 failed on the old code and 3 controls passed
  before and after; jsdom with the real modal, store and model lists and stand-ins for the model selector, prompt-box
  stores, modal chrome, currency rates and estimate hooks, so the modal in the running app was not opened. The same
  list leaves out many Image and Video models: that is N-100, a product call, not changed.
- 3D and Splat upload dialogs: a file with an upper-case extension ("ROBOT.GLB", "Scene.SPZ") was accepted by the
  picker and the global drop handler (both compare extensions case-insensitively) but handled wrongly (B-163). The
  preview chose its loader with case-sensitive `endsWith` checks, so the dialog said "Preview Error: Unknown file type
  for loader" for a good file and took no cover snapshot; the upload then did `switch (getFileExtension(file))` over
  ".spz" and ".zip", so "Scene.SPZ" went to the generic engine-asset endpoint instead of the splat endpoint, under an
  upper-case name although `Types.ts` documents that the backend rejects upper-case. `getFileExtension` now lowercases,
  a new `getUploadFileName` sends the base name as typed with a lowercase extension, and the preview compares a
  lowercased copy of the name; a name with no supported extension still reports the unknown-type error. No new plugin,
  capability or Rust command. New `uploadAsset.extensionCase.spec.ts` (6) and `loadPreviewOnCanvas.extensionCase.spec.ts`
  (5): 6 failed on the old code and 5 controls passed before and after (the .ZIP test is a coverage pin, no dialog
  offers .zip). Not checked: how the backend treats an upper-case name or a splat sent to the engine-asset endpoint (not
  in this repo), and the picker's acceptance of an upper-case name was read in the library source, not observed in the
  running app.
- Image, 3D and Splat upload dialogs: **Retry Failed** said "All uploads failed." when some of the files had already
  been saved (B-164). After a multi-file upload where some files succeed and some fail, the picker stays open with a
  tick or a mark on every row and a Retry Failed button. If the retry failed too, `retryAllFailed` read its
  `anySucceeded` flag (which describes only the retried files) as "nothing was saved" and told the dialog every upload
  failed; the dialog swapped the picker for its error screen, so the message was false, the row marks and the Retry
  Failed button were gone, and "Try again" reopens an empty picker. Each picker's `retryAllFailed` now notes whether any
  row was already saved and reports the error screen only when none was; a retry that succeeds still reports success and
  a first batch that fails completely still shows "All uploads failed.". One defect copied into three pickers, counted
  once; borderline because the dialog has a manual way out (Cancel / Try again). No new plugin, capability or Rust
  command. New `UploadFilesImage.retryFailed.spec.tsx`, `UploadFilesSplat.retryFailed.spec.tsx` and
  `UploadFiles3D.retryFailed.spec.tsx` (3 tests each): the failing case failed in all three on the old code and the 6
  controls passed before and after; the real pickers with stand-in batch uploaders (the 3D preview mocked, no WebGL),
  so the dialogs in the running app were not opened. N-101 (the host is never told about a partial result) is a
  neighbouring mechanism and is unchanged.
- Splat upload dialog: an uploaded `.spz` file never got a cover image (B-165). The picker photographs its preview
  canvas for the cover, but only after the preview reports "OK"; the GLB, PMD and image previews do, and the `.spz`
  preview never did, so every splat was saved with no cover and no message (in the gallery such an item shows "Image not
  available", read in the code and not observed). Reporting "OK" as soon as the file was decoded would not have worked:
  against the real Spark 0.1.10 library in Chromium the first ~8-10 frames after the decode are fully transparent, so
  the cover would have been a blank picture. The preview now reports "OK" once, on the first frame where the library
  has drawn its first sorted splat frame (`SparkRenderer.defaultView.display` is set); a preview replaced before that
  stays silent. In a real-browser run with a real `.spz` written by Spark's own writer, the snapshot taken after "OK"
  held 58,933-59,962 lit pixels of 65,536, while the frames before it were empty. No new plugin, capability or Rust
  command. New `loadPreviewOnCanvas.splatReady.spec.ts` (4 tests) and `UploadFilesSplat.cover.spec.tsx` (2 tests): on
  the old code 2 failed and 4 controls passed; one of the loader tests also fails if "OK" is reported at decode time.
  Not checked: whether the server makes its own cover for a splat (not in this repo), the running Tauri app, and GPU
  timing (the probe used software WebGL). A multi-file upload still gives a cover only to previewed files (N-106).
- 3D animation upload dialog: pressing "Retry Failed" twice uploaded the failed files twice (B-166). In animation mode
  `retryAllFailed` parses every failed GLB for its clip length before it starts a batch, and nothing on screen changes
  until it does, so the button stayed clickable and a second press started a second batch for the same files (two
  library assets per failed animation). `handleSubmit` and the per-row Retry in the same file already guard this
  window; Retry Failed now takes the same guard (`isSubmittingRef`) before the parse, releases it when no file has a
  readable clip and when the retry batch ends, and the button is greyed while the retry is being set up. The same
  picker's `handleFilesChange` also lacked B-153's "an upload is running" check (N-87 part 1): a new pick during a
  batch, a single-row Retry or the clip-length read replaced the list, left the new list's Upload button disabled and
  let the old batch's finish replace the second choice with a success or error screen; it now returns at once in
  those cases (a copy of B-153's defect, so no extra count). No new plugin, capability, Rust command or copy. New
  `UploadFiles3D.reentry.spec.tsx` (9 tests): on the old code 4 failed (3 batches instead of 2; three re-picks that
  replaced the list) and 5 controls passed. Upload-modal package 56/56 in 12 files. Not checked: how long a real GLB
  parse takes (so how wide the window is), the running app, and the real batch uploader (a stand-in was used).
- Login dialog: opened again after an in-app sign-up, it could show "Thank you for signing in!" instead of the
  sign-in form (B-167, counted as borderline). The sign-up ends on that screen and "Get Started" only closes the
  dialog, leaving the screen switched on. Only the session re-check cleared it, and the moodboard library picker's
  "Log in" button (shown when the picker cannot read the current username) opens the dialog directly without a
  re-check, so the person was shown a thank-you screen with no sign-in form. The dialog now starts both onboarding
  screens over every time it goes from closed to open; staying open during a sign-up changes nothing. `isSignUp`,
  the error text and the loading flag are not reset on a reopen (no user-visible symptom found). No new plugin,
  capability, Rust command or copy. New `login-modal-reopen.spec.tsx` (5 tests): on the old code 2 failed (the two
  reopen cases, after "Skip for now" and after "Join Discord") and 3 controls passed. Login-modal package 37/37 in
  4 files. Not checked: the picker flow in the running app, why the username lookup would fail right after a
  sign-up in a real run (read from code), and the real headlessui animation (a simple show/hide stand-in is used).
- "Buy credits" dialog: opened again after a failed checkout launch, it still showed "Could not open checkout. Please
  try again." before anything was tried (B-168, counted as borderline). The app draws the dialog once and only flips
  `isOpen`, and the error lived in the component's own state, which a close does not clear (it was cleared only by the
  next purchase attempt). A launch that failed after the dialog had already been closed left the error in place too.
  The dialog now clears the error every time it opens. The pricing dialog and the cost-breakdown dialog have no state
  of their own and were not affected. No new plugin, capability, Rust command or copy. New
  `credits-modal.reopen.spec.tsx` (5 tests): on the old code 2 failed and 3 controls passed. Pricing-modal package
  22/22 in 6 files. Not checked: what makes the Rust command fail in a real run (read from the `catch`) and the real
  `Modal` component (the same show/hide stand-in as the existing spec is used; the state lives above it).
- Help window: a failed download of YouTube's player script left every tutorial blank until the app was restarted,
  and each later tutorial pick started a 50 ms polling loop that never ended (B-169, counted as borderline). The
  script tag had no `error` handler, so a download that failed (offline, or blocked) left a dead tag in the page;
  every later pick found the tag by its id and waited on it for a callback that could never come, checking every
  50 ms for the rest of the session. The loader now removes the dead tag when the download fails and fails the wait,
  the 50 ms check gives up when the tag is gone, and the video effect catches the failure, logs a console warning
  and leaves the video area empty, so the next pick asks for the script again. No new plugin, capability, Rust
  command or copy. New `help-menu-youtube-loadfail.spec.tsx` (4 tests): on the old code 2 failed (no fresh script
  after the failure; the poll kept ticking) and 2 controls passed. Help-menu package 13/13 in 4 files. Not checked:
  a real failed download in the running app (jsdom does not load script tags, so the spec fires the `error` event
  by hand), and whether the Tauri CSP already blocks `youtube.com` (N-86), in which case every download still fails
  but no longer polls forever.
- Lightbox: the tag box's autocomplete list could silently never load for the rest of a lightbox visit (B-170,
  counted as borderline). `TagsSection` fetches the user's own tags once per visit when the host gives it no
  suggestions, which is how the lightbox mounts it. It marked that fetch "done" before the request even left. The
  lightbox clears the creator on every Next / Previous, so the owner check flips off and on, the effect's cleanup
  throws away an answer that is still on its way, and the flag stayed set: the next own file never asked again and the
  suggestion dropdown stayed empty until the lightbox was closed. A request that failed (offline, server error) ended
  the run the same way. The flag is now set only after a run that was neither cut off nor failed, so an interrupted
  or failed run is tried again the next time an own file is shown, and a finished run is still not repeated. A
  convenience feature (nothing is lost or saved wrongly). No new plugin, capability, Rust command or copy. New
  `TagsSection.ownTags.spec.tsx` (4 tests): on the old code 2 failed (the list was not asked for again after a cut-off
  load; the list was not asked for again after a failed load) and 2 controls passed. Lightbox-modal package 20/20 in
  5 files. Not checked: the pattern in the running app (the spec drives the real component with stand-ins for the API
  classes and a held promise), and the real duration and size of the tag list (read from code: up to 50 sequential
  pages).
- Lightbox: one failed "who is logged in" request made the tag box read-only for the rest of the app run (B-171,
  counted as borderline). When the host gives `TagsSection` no username, which is how the lightbox mounts it, the
  section asks the session endpoint who is signed in and remembers the answer in a module-level variable so that
  reopening the lightbox does not ask again. The API client never throws: a failed request (offline, server error, a
  reply that is not JSON) comes back as `success: false`. The section stored that failed answer as "nobody is logged
  in", so the owner was never recognised again: their own files showed read-only tags (or no Tags box at all when a
  file had no tags yet) until the app was restarted, and nothing on screen said why. A failed lookup is now not
  remembered, so the next lightbox visit asks again; only a real answer ("logged in as X" or "nobody is logged in")
  is kept. The visit during which the lookup failed stays read-only (the lookup runs once per mount). Needs a failed
  first request, hence borderline. No new plugin, capability, Rust command or copy. New
  `TagsSection.sessionLookup.spec.tsx` (4 tests, a fresh copy of the section's module for each): on the old code 1
  failed (the second visit found no Tags input) and 3 controls passed. Lightbox-modal package 24/24 in 6 files. Not
  checked: a real failed request in the running app (the spec stands in for the API classes and answers
  `success: false` the way the real client does), and how often the first lookup fails in practice.
- Tests only (not counted as a bug): `shipped-gradients.spec.ts` in video-editor runs the 33 background swatches the
  colour picker ships (pattern-craft and syntax-ui lists) through the export's CSS parser and canvas painter with a
  strict recording canvas; 100 new tests, all green on the current code.

### Documentation (comments only, no behavior change)
- Annotation stage 2, first slice (2026-10-19): line-by-line comments on the upload-modal files this build touched
  or that sit on the same path: `Types.ts`, `UploadModal3D/utilities/uploadAsset.ts`, `upload3DObjects.ts` and
  `upload3DObjectsBatch.ts`. Besides explaining each line, the comments record three facts found while reading:
  `UploaderStates` exists in three identical copies whose numeric values depend on member order (here,
  `libs/common` and `apps/artcraft/app/src/enums`), so all three must change together; `uploadAsset` is reached
  only through `upload3DObjects` (3D and Splat dialogs); and the asset is already saved when a cover step
  fails (N-105). Re-verified after the edit: `tsc -b tsconfig.lib.json` 0, spec typecheck 0, upload-modal
  vitest 6 files / 32 tests passed.
- Annotation stage 2, second slice (2026-10-19): comments on the five small upload-modal files that had none:
  `UploadModalImage/utilities/uploadImage.ts` and `uploadImagesBatch.ts`, `UploadSuccess.tsx`,
  `UploadAssetError.tsx` and `UploadModal3D/utilities/thumbnailHelpers.ts`. Each claim was checked against its
  callers first, which corrected two first drafts: `uploadImage` is also called directly by `UploadFilesImage.tsx`
  (a lone file and the per-row Retry), not only by `uploadImagesBatch`; and `UploadSuccess` / `UploadAssetError`
  are shown by five dialogs (Image, 3D and Splat in this library, plus the app's `UploadModalMedia` and
  `UploadImageMediaModal`), not three. The comments also record that `snapshotCanvasAsThumbnail` resolves before
  the blob exists (the blob arrives through its callback) and that every dialog's "Try again" resets back to the
  file picker. Re-verified after the edit: lib `tsc -b` 0, spec typecheck 0, upload-modal vitest 6 files / 32
  tests passed.
- Annotation stage 2, third slice (2026-10-19): line-by-line comments on the three dialogs `UploadModalImage.tsx`,
  `UploadModalSplat.tsx` and `UploadModal3D.tsx`. Checked while reading, all comment-only outcomes: the three
  dialogs are identical apart from the category, the 3D dialog's two toggles and the Splat/3D `options`
  pass-through (no drift); `fileSubtypes` in the 3D dialog's `options` is always overwritten by the rig-type
  list, but no caller passes `options` at all, so nothing is lost today; `initialCategory` is a constant at both
  scene-page call sites, so the reopen effect cannot fire mid-upload; and `galleryModalVisibleDuringDrag` is
  written by the three dialogs, `TopBar`, `Controls3D` and `desktopMediaActions` but read by no non-test code, so
  the writes have no effect (recorded in the comments; no user-visible symptom, so not a bug row). Re-verified
  after the edit: lib `tsc -b` 0, spec typecheck 0, upload-modal vitest 6 files / 32 tests passed.
- Annotation stage 2, fourth slice (2026-10-19): line-by-line comments on the three large pickers
  `UploadModalImage/UploadFilesImage.tsx` (326 code lines), `UploadModalSplat/UploadFilesSplat.tsx` (460) and
  `UploadModal3D/UploadFiles3D.tsx` (730). Comments only: with whole-line comments and blank lines stripped, each
  file is identical to its copy from before the edit (checked with a script that diffs what is left). The comments
  say which rows are keyed by row index (Image, Splat) and which by file identity (3D), what the drop guard in
  the Image and Splat pickers does while a batch runs, what the `hadEarlierSuccess` check (B-164) protects, how
  the 3D picker's submit guard is taken and released, why the Splat cover snapshot waits for `previewStatus`
  "OK" (which the loader now reports for a splat only after its first drawn frame, B-165), and where N-101
  (partial success never reaches `onSuccess`) shows up in each file. Re-verified after the
  edit: lib `tsc -b` 0, spec typecheck 0, upload-modal vitest 11 files / 47 tests passed.
- Annotation stage 2, fifth slice (2026-10-19): line-by-line comments on the four 3D-upload utilities
  (`UploadModal3D/utilities/convertFbxToGlb.worker.ts`, `readGlbAnimationDuration.ts`, `index.ts` and
  `loadPreviewOnCanvas.ts`, 383 code lines) and on the whole login-modal library (`login-modal.tsx` 332 code lines,
  `artcraft-signup.tsx`, `DesktopLoginBridge.tsx`, `NativeLoginBridge.ts`, `useLoginModalStore.ts`,
  `LoginSuccess.tsx` and `src/index.ts`). Comments only: with whole-line comments and blank lines stripped, each
  file is identical to its copy from before the edit (checked with a script that diffs what is left). The comments
  say which preview branches are dormant (N-107), what the generation counter in `login-modal.tsx` protects, how
  the three screens (welcome card, onboarding, form) are chosen, and that `cancel_challenge` in Rust only removes
  the request from an in-memory list (the website log-in page is not told). Reading `login-modal.tsx` to annotate it
  is how B-167 was found. Re-verified after the edit: `tsc -b` 0, lint 0, all 15 spec typechecks 0, vite build 0,
  login-modal vitest 4 files / 37 tests passed.
- Annotation stage 2, sixth slice (2026-10-19): line-by-line comments on the whole help-menu library
  (`help-menu.tsx` 396 code lines, `help-menu-store.ts`, `tutorials.ts` and `src/index.ts`) and on
  `pricing-modal/src/lib/credits-modal.tsx` (159 code lines). Comments only: with whole-line comments and blank
  lines stripped, each file is identical to its copy from before the edit (checked with a script that diffs what is
  left). The comments say that `isOpen` / `setOpen` in the help-menu store are never read (the button keeps its
  own `open` flag), that the watch positions are kept in memory only (they reset when the app restarts), why the
  YouTube player is built and torn down by an effect keyed on the open flag, the view and the picked tutorial, and
  that `CreditsModal` is drawn once for the whole session (so its state outlives a close, B-168). Reading
  `help-menu.tsx` to annotate it is how B-169 was found. Re-verified after the edit: help-menu vitest 3 files / 9
  tests and pricing-modal vitest 6 files / 22 tests passed before the B-169 change.
- Annotation stage 2, seventh slice (2026-10-19): line-by-line comments on `pricing-modal/src/lib/pricing-modal.tsx`
  (191 code lines). Comments only: with whole-line comments and blank lines stripped, the file is identical to its
  copy from before the edit (checked with a script that diffs what is left). The comments say where `hasPaidPlan`,
  `productSlug`, `PROMO_PCT` and `OpenUrl` come from, that `PricingContent` is drawn both inside `PricingModal` and
  inline by the provider-billing dialog, that the three billing-launch handlers show the user nothing when they
  fail (N-108), that `PricingModal` keeps no state of its own (so nothing from an earlier visit can leak into it),
  and that the exported `SubscriptionData` interface is not imported anywhere. Re-verified after the edit:
  pricing-modal vitest 6 files / 22 tests and `tsc -b tsconfig.lib.json` in that package passed.
- Annotation stage 2, eighth slice (2026-10-19): line-by-line comments on `pricing-modal/src/lib/cost-breakdown-modal.tsx`
  (397 code lines). Comments only: with whole-line comments and blank lines stripped, the file is identical to its
  copy from before the edit (checked with a script that diffs what is left). The comments say that `TopBar` draws the
  popup whether or not it is open, so its four quote hooks (video, image, splat, mesh) run all the time and each acts
  only for its own page(s); that the eight pages match `LIVE_ESTIMATE_PAGES` and the whole `ModelPage` enum, so the
  `default` branches are safety nets today; how `DragHandle` is found by `Modal` (display name `ModalDragHandle`); why
  the Resolution row is missing for worlds, objects and angles; and that `MODELS_WITH_COST_DATA` is a hand-kept list
  (N-100). Re-verified after the edit: pricing-modal vitest 6 files / 22 tests and `tsc -b tsconfig.lib.json` in that
  package passed.
- Annotation stage 2, ninth slice (2026-10-19): line-by-line comments on the four cost-quote hooks in
  `pricing-modal/src/lib`: `useVideoCostEstimate.ts` (119 code lines), `useImageCostEstimate.ts` (157),
  `useSplatCostEstimate.ts` (65) and `useMeshCostEstimate.ts` (45). Comments only: with whole-line comments and blank
  lines stripped, each file is identical to its copy from before the edit (checked with a script that diffs what is
  left). The comments explain the pattern all four share (each acts only for its own page(s); a `cancelled` flag set by
  the effect's cleanup drops an answer that arrives after the inputs changed; the old quote is blanked before each
  request; a thrown or error-shaped answer leaves the quote empty, shown as a dash), that the splat and mesh requests
  use a fixed placeholder token (`mf_estimate_reference`) and the image request placeholder tokens (`mf_estimate_0`...)
  because only the number of reference images matters, why the image hook watches the reference lists by length, the
  "listed references plus one" arithmetic on the Canvas 2D, Stage 3D and Image Editor pages (read from the code, not
  checked against the real generate call), and why the mesh hook has no success check (`EstimateMeshCost` is typed as
  always-success and a failure arrives as a rejected `invoke`, which its `.catch` handles). Three leads checked while
  reading, none a bug, so no count changed: the mesh hook's missing success check (above), the image hook's `.length`
  dependency against its non-empty-token filter (`ImagePromptRow` commits a reference with its token set, or `""` only
  when no uploader is supplied), and the video hook's `sizeOptions[0]` (the model class defaults it to `[]`).
  Re-verified after the edit: pricing-modal vitest 6 files / 22 tests and `tsc -b tsconfig.lib.json` in that package
  passed.
- Annotation stage 2, tenth slice (2026-10-19): line-by-line comments on the rest of the non-`convert` files in
  `pricing-modal/src`: `lib/use-currency.ts` (173 code lines), `lib/cost-calculator-button.tsx` (34),
  `lib/pricing-modal-store.ts` (47), `lib/credits-modal-store.ts` (13), `lib/cost-breakdown-modal-store.ts` (39) and
  `src/index.ts` (8). Comments only: with whole-line comments and blank lines stripped, each file is identical to its
  copy from before the edit (checked with a script that diffs what is left). The comments explain, for
  `use-currency.ts`: that the fallback rates are typed into the source, are used until a fetch finishes and when it
  fails, and a failed fetch is not cached (so the next mount retries); that `ratesLoaded` also becomes true on the
  fallback and no live component reads it; that `formatPrice` writes the decimals out (JPY 0, otherwise 2) instead of
  reading `currencyOption.decimals`; that every caller gets its own currency state while the rate fetch is shared;
  that the only live caller is `CostBreakdownModal` (`reusable/CostModal.tsx` also calls it but is imported nowhere);
  and that the rate host `api.frankfurter.dev` is not in the Tauri CSP (N-86, not checked in a running app). For the
  stores: who calls `openModal` / `toggleModal` / `closeModal`, that the pricing store's `subscription`,
  `setSubscription` and `updateCurrentPlan` have no callers outside the store, that nothing calls the pricing store's
  `openModal`, so its `title` and `subtitle` are never set in the app, which also settles the one open question from
  the ninth slice (`toggleModal` not clearing them cannot show a stale heading today), and which pages and buttons
  read or write `estimatedCreditsByPage`. For `cost-calculator-button.tsx`: its seven callers and the page each one
  passes, and that the chip is hidden while the quote is null. For `index.ts`: that the quote hooks and the
  `./convert` helpers are not exported. Two further leads checked, none a bug (no count changed): the two-copy
  `useCurrency` drift (only one live copy) and the cached-rates missing-key case (too narrow to count). Re-verified
  after the edit: pricing-modal vitest 6 files / 22 tests and `tsc -b tsconfig.lib.json` in that package passed.
- Annotation stage 2, eleventh slice (2026-10-19): line-by-line comments on the nine files in
  `pricing-modal/src/lib/convert/`: `imageAspectRatioToCommonAspectRatio.ts` (27 code lines),
  `imageModelToCommonImageModel.ts` (19), `imageStoreToGenerationMode.ts` (10), `index.ts` (8),
  `stringToCommonQuality.ts` (26), `stringToCommonVideoResolution.ts` (41), `videoAspectRatioToCommonAspectRatio.ts`
  (10), `videoModelToCommonVideoModel.ts` (25) and `videoStoreToGenerationMode.ts` (24). Comments only: with
  whole-line comments and blank lines stripped, each file is identical to its copy from before the edit (checked with a
  script that diffs what is left); existing `TODO(bt)`, `MIGRATION` and inline comments were kept word for word. The
  comments explain which converters are live and which are not: `imageAspectRatioToCommonAspectRatio`,
  `stringToCommonQuality` and `stringToCommonVideoResolution` (despite its name, the image price request is its only
  caller) are called only by `useImageCostEstimate`, and `videoAspectRatioToCommonAspectRatio` and
  `videoStoreToGenerationMode` only by `useVideoCostEstimate`; `videoModelToCommonVideoModel`,
  `imageModelToCommonImageModel` and `imageStoreToGenerationMode` have no caller anywhere (they are only re-exported by
  `convert/index.ts`, which `pricing-modal/src/index.ts` does not re-export). They also explain that unknown quality and
  resolution text is passed through unchanged (undefined becomes null), that the video aspect-ratio lookup matches on the
  option's label text (first match wins), and that the video model converter's switch only translates old spellings.
  Two leads checked, none a bug (no count changed): the resolution converter accepts upper-case "2K"/"4K" but has no
  "1K" case, which cannot matter because the prompt stores hold lowercase "1k" | "2k" | "4k" only (`promptStore.ts:35`);
  and the quote's generation-mode derivation could not be compared with the real Generate call because the frontend
  builds no generation mode there (no second copy to drift from). Re-verified after the edit: pricing-modal vitest
  6 files / 22 tests and `tsc -b tsconfig.lib.json` in that package passed.
- Annotation stage 2, twelfth slice (2026-10-19): line-by-line comments on the three `lightbox-modal` tags files:
  `src/lib/tags/TagChipInput.tsx` (203 code lines), `src/lib/tags/TagsSection.tsx` (241) and `src/index.ts` (3).
  Comments only: with whole-line comments and blank lines stripped, each file is identical to its copy from before the
  edit. The comments point at the behaviour recorded elsewhere: the Escape key in the tag box (N-109), the remembered
  "who is logged in" answer and the failed-lookup handling (B-171, N-110). No bug found while annotating, so counts are
  unchanged (Fixed 171, strict 157, Noted 101). Batch gate on the final tree (2026-10-19): `tsc -b`, eslint, the 15 library
  spec typechecks and `vite build` all exit 0; 61-package run 0 failed, 1497 tests passed across 241 test files.

### Noted, not changed
- N-110 in `BUGS.md` (not counted, no code changed, read only): the lightbox's remembered "who is logged in" answer (the module-level variable behind B-171) is never cleared. Logging out clears the gallery cache, credits and subscription state but cannot reach it, and an in-app sign-up (unlike signing in, which reloads the page) does not reset it either. So after a logout followed by creating a second account in the same app run, or after opening the lightbox signed out and then signing up, the new account's own files could show read-only tags until a restart. Whether a signed-out user reaches the lightbox, and whether anyone signs up after a logout in the same run, were not checked, so it stays a note. Options in the row: (a) stop remembering the answer and ask once per lightbox open (like the gallery dialog does); (b) export a clear function and call it from the logout and sign-up code; (c) leave as is.
- N-109 in `BUGS.md` (not counted, no code changed, read only): pressing Escape in the lightbox's Tags box does two things at once. In `TagChipInput` the Escape key blurs the box, and blur saves whatever is half-typed as a tag; the `Modal`'s own window-level Escape listener (it does not look at the event target) then closes the lightbox, so the text is saved as a tag and the lightbox goes away, where the user may have meant "forget what I typed". A product call; options in the row (Escape clears the draft first; the same plus stop the event so the lightbox stays open; leave as is).
- N-108 in `BUGS.md` (not counted, no code changed, read only): the Pricing dialog's launches (choose a plan, manage plan, "Update payment method") show nothing when they fail, the defect B-87 fixed in the Buy-credits dialog. `PricingTable` catches the plan and portal rejections but only logs them, and the "Update payment method" button has no catch at all (an unhandled rejection), so a failed launch looks like a button that did nothing. Counted once with B-87, and the fix needs wording and a place to show it (the dialog has no error line), so it is a copy decision; options in the row (reuse the B-87 wording, a toast, or leave as is).
- N-107 in `BUGS.md` (not counted, no code changed, read only, dormant code): `loadPreviewOnCanvas.ts` still has loader branches for `.pmd`, `.vmd` and `.png/.jpg/.jpeg/.gif`, but its only two callers are the 3D picker (accepts `glb`/`fbx` only) and the Splat picker (`spz` only), so those branches cannot be reached from the shipped app. If they were switched back on: the image-plane loader reports "OK" before its texture has loaded (the shape B-165 fixed for splats), and the PMD loader fetches a font from `threejs.org` at preview time (the Tauri CSP was not checked for that host). Also live but cosmetic: a splat whose name before the first "." ends in "ceramic" is shown upside down in the preview. Options in the row (delete the dormant branches, keep and fix them later, or leave as is; keep or remove the "ceramic" rotation).
- N-106 in `BUGS.md` (not counted, no code changed, read only): in a multi-file Splat or 3D upload only a file that was previewed has a cover snapshot (the preview canvas shows one file, and the snapshot map is filled only for a file whose preview reached "OK"), so with five files chosen and no clicking through the list, the first file gets a cover and the other four upload with no cover and no notice (`upload3DObjects` treats "no snapshot" as a complete upload). What the library shows for an asset without a cover, and whether the server makes one, were not checked. A product call with three options in the row; the same read compared the Splat snapshot effect (keyed on `previewStatus` and `previewIndex`) with the 3D one (keyed on `previewStatus` only) and found no wrong cover in practice.
- N-105 in `BUGS.md` (not counted, no code changed, read only): in the 3D and Splat upload dialogs a failure of the cover (thumbnail) step happens after the asset is already saved, but every caller treats it as a failed upload, and each retry path (per-row Retry, Retry Failed, "Try again" then pick the file again) runs `upload3DObjects` from the top with a fresh `uuidv4()`, so the same file is uploaded as a second library asset. Needs a rare network failure and nothing is lost, and the right behaviour (what the dialog should say) is a product call, so it is a note; three options in the row.
- N-104 in `BUGS.md` (not counted, no code changed, read only, dormant feature): on the Background Change page a successful `submitVFXJob` leaves the `status: "pending"` result card forever, because `handleSubmit` never uses the returned `inference_job_token` and nothing in `frontend/` calls the store's `completeResult`. Not reachable in the shipped app: `useVisibleApps` hides the tab ("hidden in the desktop app for now"), both app-list consumers use that hook, the active tab is not persisted, and the backend route 404/501s as "coming soon" (whether it is live was not checked). Left unwired; options in the row.
- N-103 in `BUGS.md` (not counted, no code changed, read only, Rust/config): the main window is built in `setup_main_window.rs` without `disable_drag_drop_handler()`, so Tauri's native drag-drop handler is on. By the locked `tauri-runtime-wry` and `wry` sources (the handler always returns `true`, which blocks the OS default drop) and Tauri's own `drag_drop_enabled` doc, an HTML5 `drop` of an OS file should never reach the page on a shipped Windows or macOS build. Only `GlobalFileDropHandler` and the prompt box use the native event; the upload dialogs' drop area, the video-editor and moodboard drop zones, the Characters modal and two app pages read `dataTransfer.files` and would ignore a dragged file (click-to-browse still works). Not verified in a built app, so it may be wrong; the first step is to drag one file onto each zone in a build. A Tauri/Rust window decision with three options in the row.
- N-102 in `BUGS.md` (not counted, no code changed, read only, Rust): comparing the provider completion handlers found
  three differences. (1) Grok video's `upload_grok_video` and WorldLabs' `upload_spz_splat` have no checkpoint, so if the
  auto-download or the task-status update fails after the upload, the next pass makes a new prompt and uploads a second
  copy (Midjourney's `MidjourneyUploadCheckpoint` avoids this). (2) Grok image's per-image upload loop only logs a
  non-429 error and carries on, so with auto-download off (the default) a task can be marked successful with fewer
  images, or none; with it on, the task is left pending instead. (3) The Grok download client returns `Ok` on a non-2xx
  status, so an error body can be saved as the `.mp4`. Not counted: no check fails on the old code (the functions can't
  be called from a test) and a fix is Rust. Only (1) is a copied pattern (Grok video and WorldLabs); (2) and (3) have
  different causes, so each could be specced and promoted on its own if Rust changes are approved.
- N-101 in `BUGS.md` (not counted, no code changed, read only): in the Image, 3D and Splat upload dialogs the host's
  `onSuccess` runs only when every file of one batch succeeds. After a batch where some files uploaded and some failed,
  or after pressing a row's own Retry on the last failed row (every row then turns green and the only button left is
  "Cancel"), the Scene page's asset and animation pickers are never told, so the new assets stay missing from "My
  assets" until the user switches library tab or reloads. The files are uploaded and the dialog can be closed, so it
  is a note; the three tabs share one cause. Options for the owner are in the row.
- N-100 in `BUGS.md` (not counted, no code changed, a product call): the Cost Breakdown modal's hand-kept model list
  still leaves out 8 of the 22 Image model ids and 18 of the 22 Video model ids (named in the row), so those tabs may
  show a quote on the Generate button while the modal says "not yet available"; whether the server prices them and
  whether the list is meant to be a gate is the owner's call (add the ids, drop the list in favour of "a quote exists",
  or leave it).
- N-99 in `BUGS.md` (not counted, no code changed, read from the source only, in a component nothing mounts): the
  unmounted `PromptBox3D`'s `handleTauriEnqueue` does not check the snapshot upload, has no `catch` around
  `GenerateImage`, and shows "Image added to queue" after a null snapshot, while its `handleWebEnqueue` has all of
  those checks. Nothing in `apps/` or `libs/` imports it, so no person can reach it; the note also records that
  `pagescene/AGENTS.md` contradicts itself about whether it is mounted.
- N-98 in `BUGS.md` (not counted, no code changed, read from the source only, may be unreachable in the desktop app):
  the 3D editor's first load of a saved scene (`editor.ts` `initialize`, when the page starts on a `/$sceneToken` URL)
  has `.then(...)` and no `.catch`, while the in-app Load scene button catches and toasts the same failure. A failed
  fetch leaves the default empty scene with no message. The editor needs WebGL, so no spec could fail on the old code.
- N-97 in `BUGS.md` (decision for the owner, not counted, no Rust changed, read from the source only): the Rust
  `generate_image_command` returns `error_message` as the Debug text of its error enum (for example
  `NoProviderAvailable`), so every toast that shows it (Text to Image, Image to Video, Image to 3D and, since B-161, the
  Draw page) shows a raw name instead of a sentence. A commented-out block in the same file already has plain wording.
- N-96 in `BUGS.md` (not counted, no code changed): the Draw page's Remove background action awaits the enqueue with no
  `catch`, leaving an unhandled rejection on failure; the person already hears about it through the Rust enqueue-failure
  event, so only console noise remains.
- N-91 in `BUGS.md` (not counted, cosmetic, no code changed, read from the source only): saved easing presets in the
  timeline's graph-editor popover are named `Custom ${count + 1}`, so deleting a preset from the middle of the list and
  saving again gives two entries with the same name (for example two "Custom 3"). Ids stay unique, so nothing is lost or
  stuck; the person just cannot tell the two apart by name. A cure would number from the highest label in use.
- N-90 in `BUGS.md` (not counted, no code changed, read from the source only): the canvas undo history is whole-canvas
  snapshots and the upload write-back (token, and now the lasting address) deliberately skips history, so undoing back to
  a snapshot taken while an upload was still in flight puts the image back without its token, and the saved canvas drops
  it on the next start. Narrow (needs an undo of an unrelated action in that window); it is the one case B-156 does not
  cover.
- N-89 in `BUGS.md` (not counted, no code changed, read from the source only, dormant in the shipped app): two races in
  `moodboardSync.ts`, which only runs when a host supplies `persistence` (the desktop adapter does not): a board deleted
  while its first push is in flight leaves an orphaned server row that the next hydration brings back, and an account
  switch in the middle of a flush keeps pushing with the old user id.
- N-88 in `BUGS.md` (decision for the owner, not counted, no code changed, read from the source only): the PageDraw
  "Edit Image" card (`BaseImageSelector.tsx`) lets the user pick several files, but the editor takes one base image
  and every finished upload replaces it, so a later upload can swap the base image after the editor has opened. The
  row gives three ways to resolve it (first file only, single-file picker, or keep the rest in the history strip) and
  says why none was chosen without the owner. Strokes drawn on the first image are kept (the store saves them per
  base image), and every picked file already goes into the history strip, so a "call it once" guard would remove files
  from the strip; for that reason no guard and no spec were written.
- N-87 in `BUGS.md` (not counted, no code changed, read from the source only): the 3D upload dialog
  (`UploadFiles3D.tsx`) has a related but smaller exposure to B-153 (its rows are keyed by file and it has a submit
  guard, so the effect is a dead Upload button and a dropped second choice), and its `retryAllFailed` has no
  re-entrancy guard (a double click in animation mode could start two batches). No spec was written for either.
  Update (2026-10-19): both are now fixed and shown by specs, see B-166 above; N-87 is no longer open.
- N-86 in `BUGS.md` (decision for the owner, not counted, no code changed): the Tauri content security policy in
  `crates/desktop/artcraft/tauri.conf.json` does not list four hosts the frontend uses: `api.frankfurter.dev` (live
  currency rates in the Cost Breakdown modal), `getartcraft.com` (`news.json`), `www.youtube.com` (the Tutorials player
  script and iframe, and the News video embeds) and PostHog. By the policy's rules those requests are blocked in the
  shipped app, so prices use fixed fallback rates, News shows only bundled posts, tutorial and News videos do not play,
  and analytics events are dropped. Read from the config only, not observed in a running app; the row gives the console
  check and the two choices (add the hosts, or keep the fallbacks).
- N-85 in `BUGS.md` (decision for the owner, not counted): how to give macOS users full screen in the video editor after
  B-152 hid the dead control: Tauri's `macos-private-api` (blocks Mac App Store distribution) or window-level full screen
  through the Tauri window API (needs the `core:window:allow-set-fullscreen` capability).
- N-84 in `BUGS.md` (not fixed, not counted: needs real image files or a hosting address): the News article
  `world-models-for-film.md` references 14 `./images/blog/*.png` images and none of them exists in the project, so Help,
  News & Updates shows 14 broken images.
- N-83 in `BUGS.md` (not fixed, not counted: dormant): `uploadPlane.ts` `takeVideoSnapshot` awaits `video.play()` with no
  catch, which would leave the plane-upload modal on "Uploading..."; `UploadModalMedia` is not mounted by any screen.
- N-82 in `BUGS.md` (not fixed, not counted: reopening the gallery retries): a failed tag or folder load in the gallery
  is shown as "No tags yet", "This folder is empty" or "No files carry this tag"; `CharactersApi.ListAllCharacters`
  returns a short list as a success when a later page fails. Not run, found from a read of the code.
- N-81 in `BUGS.md` (a tooling gap, not an app defect, not counted): no lint runs on any library package. The root ESLint
  config ignores every file and the libraries have no config of their own, so only `apps/artcraft` is linted; upstream CI
  runs only the production build. Build 2's gate now runs `vite build` as well. Decision for the owner.
- N-80 in `BUGS.md` (not fixed, not counted: neither box is mounted by the shipped app): `PromptBoxEdit` and
  `PromptBox3D` have the same missing IME check as the five boxes fixed in B-147. Decide together with N-54 and N-74.
- N-79 in `BUGS.md` (not fixed, not counted: leaving the tab and coming back recovers, and the right behaviour is a
  product decision): "Exit project" in the video-editor header closes the project and leaves a header-only blank editor,
  because the app has no `/projects` route to go to. Not run, found from a read of the code.
- N-78 in `BUGS.md` (not fixed, not counted: nothing in the shipped app calls `openProject`, so it cannot happen today):
  reopening a saved video-editor project skips media that fails to download, and the next autosave would then store a
  media list without those assets, losing them for good. The video-editor tab always starts a fresh project today. Not
  run, found from a read of the code; promote to a bug when a project picker is added.
- N-77 in `BUGS.md` (not fixed, not counted: the editor cannot be built in jsdom, so there was no failing spec): when the
  3D tab opens on a saved scene and the scene fails to load, nothing tells the user (an unhandled rejection, an empty
  editor). The Load Scene button path already shows an error toast. Not run, found from a read of the code.
- N-76 in `BUGS.md` (not fixed, not counted: closing and reopening the dialog retries): the "Load a Saved Scene" dialog
  keeps showing "Loading scenes..." with a spinner after the scene list fails to load (only a toast says why, and there is
  no Retry button). Reopening the dialog asks again. Not run, found from a read of the code.
- N-75 in `BUGS.md` (not fixed, not counted, not reachable today): the video editor's sticker search has no guard
  against a slow answer arriving after a newer one (the browse view has one). Both sticker sources answer from memory
  today, so it cannot go wrong; it will if a network sticker source is added.
- N-74 in `BUGS.md` (not fixed, not counted, not reachable today): the Angles page's text-to-image completion listener
  gives an event with no job id to its oldest pending job. Only `PromptBox3D` starts such a request and nothing in the
  app mounts it. Fix is one line (ignore id-less events), best done with the N-54 decision.
- N-73 in `BUGS.md` (not fixed, not counted, a product call): "Recreate" on a generation only writes the fields the
  saved record has, so reference images, an end frame or reference video/audio already in the prompt box stay and are
  sent with the next Generate. Whether Recreate should be an exact copy is your decision.
- N-72 in `BUGS.md` (not fixed, not counted, nothing calls it): the weights API client drops `false`, `0` and `""`
  from requests, and `UploadStudioShot` is dead code. Delete or fix is your decision.
- N-71 in `BUGS.md` (not fixed, not counted): the Draw page's loading tile for a generation stays after a
  server-side failure until the user removes it with "Remove pending generation". That dialog is built in, so it is
  a note, not a stuck state; clearing it automatically would use the same one-pending-job rule as Angles.
- N-70 in `BUGS.md` (not fixed, not counted, a product call): the Video and Image Watermark Remover pages are
  placeholders. Their "Remove Watermark" button waits two seconds and then toasts "Watermark removal completed!"
  without doing anything. Nothing in the app opens them today (the menu has no entry for either tab), so no user
  can reach it; decide whether to wire a real backend, or remove the pages, before a menu entry is added.
- N-69 in `BUGS.md` is listed above as a library fix, not a counted bug: it is only reachable from the external
  web app that shares the moodboard library. Promote it if the desktop app starts passing a persistence adapter.
- N-68 in `BUGS.md` (not fixed, not counted, a product call): dragging a keyframe onto another keyframe's time
  leaves two keyframes at the same time on one property (the diamonds stack and the hidden one can't be dragged
  out again; undo works). Whether the dropped key should replace the one underneath or the drop should be
  refused is your decision.
- N-67 in `BUGS.md` (not fixed, not counted, needs your decision): the desktop app's video-editor export to disk
  probably fails every time. The adapter passes a `blob:` URL to the upload plugin's `download`, which runs in
  Rust, and the HTTP client there refuses any scheme but http and https (read from the plugin and `reqwest`
  sources; not run). Nothing in the app can write bytes to a path today (no fs plugin, no fs permission, no
  Rust command), so a fix needs new native code. Three smaller export-path defects (`.bin` suggested name,
  ignored preferred download folder, unsanitized project name) are recorded in the same row.
- N-65 in `BUGS.md` (library changed, not counted as a fix): the video editor's "Ripple editing" toggle is not
  connected to anything in this app (the button has no handler and the editor never reads `isRippleEnabled`), so
  nothing here can switch rippling on. `ripple/diff.ts` shifted a clip by its own start time when its
  predecessor was deleted instead of by the gap; that is a one-line fix there, with a new `ripple/ripple.spec.ts`
  (12 tests). Whether to wire the toggle or hide the button is a product call.
- N-66 in `BUGS.md` (fixed, not counted): the same canvas painter measured a pixel colour stop (`… 100px`) on
  the longer radius of a tall ellipse, but CSS measures it along the horizontal ray. No shipped preset uses a
  pixel stop on an ellipse, so nobody can hit it today; it now matches CSS and has a test.
- N-64 in `BUGS.md`: dragging several clips from one track to a "new track" drop zone still gives each clip its
  own new track (documented behaviour, a product call), plus two group-move checks that came out fine.
- N-57..N-62 in `BUGS.md`: the missing-`pointercancel` check of the pagescene timeline and the video-editor
  preview handles (all recovered by `onPointerLeave`), and read-throughs of `markdown.ts` (linked images,
  empty frontmatter: unreachable with the shipped content), `processing.ts` progress, `interpolation.ts`,
  `bezier.ts`, `placement/resolve.ts` and `pending-video-thumbnails.ts` (no bug found).
- N-63 in `BUGS.md` (library changed, not counted as a fix): the video editor's sounds panel previews had three
  defects (a clip kept playing after switching tabs or leaving the panel; a second preview's button could show
  "play" while it played; a sound with no preview left the old button on "pause"). This app wires no sounds
  adapter, so both lists are always empty and none of it can happen here. The two copies of the preview code
  are now one tested hook, `use-sound-preview.ts`, for hosts that do wire an adapter.
- N-51..N-56 in `BUGS.md`: reviewed and left alone. Most cannot fail visibly today (promptbox upload handlers,
  vfx preview URLs, dead pagedraw code, generation-list polling under extreme latency, mood board unmount
  mid-pan). N-54 is the exception: `PromptBox3D`'s desktop enqueue has no error handling, but nothing in this
  repo renders that component, so it is left for the owner to confirm the external consumer.
- N-37..N-50 in `BUGS.md`: pagescene (splat load never settles, `<script>` per MMD load, listener and
  disposal leaks, a scene token in a debug log) and video-editor core (undo of media-asset commands, `flush()`
  while a save is in flight, `loadProject` stale overwrite, command-history edge cases). N-43, N-45 and N-46 were
  later specced and fixed as B-121, B-123/B-124 and B-122. N-39 (`ControlsTopButtons` save) was checked and stays a note:
  the only adapter in this repo never makes `saveScene` reject.

## Build 1: fork bug-fix pass (2026-10-17, committed on `fix/bug-sweep-build-1`)

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
