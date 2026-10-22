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
- Lightbox: a reference-audio clip kept playing with no way to stop it after moving to another file (B-172). The
  lightbox shows a clip's pause button only inside the current file's prompt data, and it stopped audio only when it
  closed or unmounted. Pressing an arrow key, Previous/Next, or "View as media" keeps it open, so the prompt data was
  cleared (rows and pause button gone) while the clip went on to its end. The reference-image preview and the
  expanded-prompt state also survived the move. A new effect keyed on the media id now stops the clip and resets
  both. New test in `lightbox-modal.audio.spec.tsx`: 1 failed on the unfixed code, lightbox-modal now 25/25 in 6
  files, `tsc -b tsconfig.lib.json` 0. Counts: Fixed 172, strict 158, Noted 101; next free IDs B-173 / N-111.
- Lightbox: the prompt Copy button said "Prompt copied" even when the clipboard refused the write (B-173, counted as
  borderline). The handler started the write without waiting for it and ignored any failure, so the success toast and
  the "Copied!" label always appeared; the Share button already waited and showed "Unable to copy link". Copy now
  waits and shows the new error toast "Unable to copy prompt" on failure (copy approval due with the other copy
  items). New `lightbox-modal.copyPrompt.spec.tsx` (2 tests): 1 failed on the unfixed code, 1 control passed;
  lightbox-modal now 27/27 in 7 files, `tsc -b` and the spec typecheck 0. Counts: Fixed 173, strict 158, Noted 102;
  next free IDs B-174 / N-112.
- Image prompt box: a resolution picked on one model stayed selected, and was sent, after switching to a model that
  does not offer it (B-174). The chosen resolution lives in one shared store; the aspect-ratio picker already resets
  a ratio the new model lacks, but the resolution picker did not. 3K picked on GPT Image 2.5 and then a switch to
  Nano Banana 2 or Pro (1K, 2K, 4K only) left 3K in place: the menu showed no selected row and the generate request
  carried a resolution the model does not list. `ResolutionPicker` now resets to the model's default, the same way
  `AspectRatioPicker` does. New `common/ResolutionPicker.spec.tsx` (3 tests): 1 failed on the unfixed code, 2
  controls passed; promptbox now 81/81 in 14 files, `tsc -b` and the spec typecheck 0. Not checked: how the backend
  answers a resolution the model lacks. Counts: Fixed 174, strict 159, Noted 102; next free IDs B-175 / N-112.
- Video editor colour picker: a 5 or 7 digit hex code typed in the hex box was accepted as a colour (B-175).
  `parseColorInput` allowed any 3 to 8 hex digits, but only 3, 4, 6 and 8 are colours, so `12345` was committed to the
  element as its colour and the field never fell back to the paste/extract path. The pattern now allows only those
  four lengths. New `utils/color.spec.ts` (3 tests): 1 failed on the unfixed code, 2 controls passed; `tsc -p
  tsconfig.lib.json --noEmit` 0. Counts: Fixed 175, strict 160, Noted 102; next free IDs B-176 / N-112.
- Video editor shortcuts: defaults added in a later release never reached users who had not customized (B-176).
  The persisted shortcut map is saved on every store update with `isCustomized: false`, and `merge` loaded it back over
  the current defaults. It now keeps the saved map only when the user customized it. New `keybindings-store.spec.ts`
  (1 failed on the old code, 1 control passed). Counts: Fixed 176, strict 160, Noted 108; next free IDs B-177 / N-118.
- Video editor sounds panel: each sound added opened an `AudioContext` that was never closed (B-177).
  `addSoundToTimeline` used a fresh context only to decode, so repeated adds hit the browser's open-context cap. The
  decode now closes it in a `finally`. New `sounds-store.spec.ts` (2 failed on the old code). Counts: Fixed 177,
  strict 160, Noted 108; next free IDs B-178 / N-118.
- Video editor box masks (rectangle, ellipse, diamond, heart, star, cinematic bars), `masks/builtin/box-like.ts`
  `computeBoxMaskParamUpdate` (B-178, B-179, B-180): the rotation handle turned the mask by the drag direction instead
  of the pointer's sweep around the centre; edge and corner drags ignored the mask's rotation; and the corner handle
  lagged the pointer by half because the "half" sizes were full sizes. New `builtin/box-like.spec.ts` (4 tests, 3
  failed on the old code, 1 control passed). Notes N-119 and N-120 added (nothing counted). Counts: Fixed 180, strict
  163, Noted 111; next free IDs B-181 / N-121.
- Video editor timeline keyframe drag, `timeline/controllers/keyframe-drag-controller.ts` (B-181): dragging a group of
  selected keyframes past either end of the clip clamped each one separately, so they ended up stacked on one time. The
  drag distance is now limited for the whole group. New `keyframe-drag-controller.spec.ts` (4 tests, 2 failed on the old
  code, 2 controls passed). N-119 corrected (its scale field is a percentage). Counts: Fixed 181, strict 164, Noted 111;
  next free IDs B-182 / N-121.
- Scene object panel number input, `ControlPanelSceneObject/utils/sanitize.ts` (B-182, borderline): `.5` and `-.5` were read
  as NaN, so retyping an unchanged value looked like an edit and opened an empty transform session. An empty integer part
  now counts as 0. New `sanitize.spec.ts` (4 tests, 3 failed on the old code, 1 control passed). N-121 added (unreachable
  file-drop upload count). Counts: Fixed 182, strict 164, Noted 112; next free IDs B-183 / N-122.
- Failed-job database write, `sqlite_tasks/src/queries/update_task_status_with_rich_failure.rs` (B-183): a failure message
  over 255 bytes whose byte 255 landed inside a multi-byte character made the byte slice panic, before the task was
  marked failed. The cut now steps back to a character boundary (`trim_failure_message`). 3 new in-file tests, the
  multi-byte one panicked on the old code. N-122 added (test-only `truncate` calls). Counts: Fixed 183, strict 165,
  Noted 113; next free IDs B-184 / N-123.
- Timeline track delete, `video-editor/src/lib/commands/timeline/track/remove-track.ts` (B-184, borderline): deleting a
  track left its clips and keyframes selected, so the selection pointed at elements that no longer existed. The command
  now returns a selection patch keeping only items on other tracks; undo restores the old selection. New
  `remove-track.spec.ts` (3 tests; also clears a mask-point selection and the keyframe anchor on the deleted track). N-123 added (one unknown enum value fails the whole task-list query). Counts: Fixed 184,
  strict 165, Noted 114; next free IDs B-185 / N-124.
- Timeline first insert, `video-editor/src/lib/commands/timeline/element/insert-element.ts` (B-185): undoing the first
  clip added to an empty project left the canvas resized (and fps raised) because undo restored only the tracks. The
  command now remembers the earlier settings and restores them. New `insert-element.spec.ts`. Counts: Fixed 185,
  strict 166, Noted 114; next free IDs B-186 / N-124.
- Scene switching, `video-editor/src/lib/core/managers/scenes-manager.ts` (B-186): switching scenes or deleting the open
  scene left the old scene's clips selected. Both paths now clear the selection when the active scene changes. New
  `switch-scene.spec.ts`; full video-editor suite 41 files / 356 tests pass. Counts: Fixed 186, strict 167, Noted 114;
  next free IDs B-187 / N-124.
- Scene switching undo, `video-editor/src/lib/core/managers/scenes-manager.ts` (B-187): undoing after a scene switch wrote
  the earlier scene's tracks into the newly opened scene. Both switch paths now clear the undo/redo history when the
  active scene changes. Second test in `switch-scene.spec.ts`. Counts: Fixed 187, strict 168, Noted 114; next free IDs
  B-188 / N-124.
- Bezier split, `video-editor/src/lib/animation/keyframes.ts` (B-188, borderline): splitting inside a bezier segment left a
  duplicate copy of the segment's left key (same id and time) on the left half. The kept keys are now strictly before it.
  New bezier block in `keyframes.spec.ts`. Counts: Fixed 188, strict 168, Noted 114; next free IDs B-189 / N-124.
- Notes only (BUGS.md N-112..N-115, nothing fixed, nothing counted): the gradient parser rejects several valid CSS forms
  (not reachable from shipped swatches), the desktop drop handler reads files before checking the box accepts them, one
  hook inside a render-prop in `popover.tsx`, and a few weak bounds notes in the transform handles. Counts: Fixed 175,
  strict 160, Noted 106; next free IDs B-176 / N-116.
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
- Annotation stage 2, thirteenth slice (2026-10-19): comments on the first part of
  `libs/components/lightbox-modal/src/lib/lightbox-modal.tsx` (imports, props, state, the audio helpers and the reset
  and cleanup effects, lines 1-246 of the commented file; the rest of the 1425 lines follows in later slices). Comments
  only: with whole-line comments and blank lines stripped the file is identical to its copy from before the edit
  (checked with a script that diffs what is left; the real file was first confirmed byte-identical to that copy).
  No bug found while annotating, so counts are unchanged (Fixed 173, strict 158, Noted 102). Re-verified after the
  edit: `tsc -b tsconfig.lib.json` 0, lightbox-modal vitest 7 files / 27 tests passed.
- Annotation stage 2, fourteenth slice (2026-10-19): comments on the next part of `lightbox-modal.tsx` (the prompt
  fetch, the batch-image fetch, the carousel and delete handlers, the shown-image state and the preload effect, down to
  the keyboard handler). Comments only: code identical to the pre-edit copy once whole-line comments and blank lines
  are stripped. A read of this stretch found no new bug (the delete failure handling is B-160, the carousel listener
  cannot pile up). Counts unchanged (Fixed 173, strict 158, Noted 102). `tsc -b tsconfig.lib.json` 0, lightbox-modal
  vitest 7 files / 27 tests passed.
- Annotation stage 2, fifteenth slice (2026-10-19): JSX comments on the first part of the `lightbox-modal.tsx` render
  (the dialog shell, the two columns, the media viewers, the loading overlay, the previous / next buttons, the author
  header, the Prompt section and its Copy button). Comments only: code identical to the pre-edit copy once whole-line
  comments and blank lines are stripped. Counts unchanged (Fixed 173, strict 158, Noted 102). `tsc -b
  tsconfig.lib.json` 0, lightbox-modal vitest 7 files / 27 tests passed.
- Annotation stage 2, sixteenth slice (2026-10-19): comments on the Reference Media tiles (hover menu, click behaviour,
  audio and video tiles), the info block for files without a prompt, the `TagsSection` mount and `additionalInfo` in
  `lightbox-modal.tsx`. Comments only: code identical to the pre-edit copy once whole-line comments and blank lines
  are stripped. Counts unchanged (Fixed 173, strict 158, Noted 102). `tsc -b tsconfig.lib.json` 0, lightbox-modal
  vitest 7 files / 27 tests passed.
- Annotation stage 2, seventeenth slice (2026-10-19): comments on the action buttons (Recreate, Edit, Make Video,
  Remove BG, Make 3D, Make 3D World, Download, Add to Scene, Share, Delete), the reference-preview window, `InfoSection`
  and `InfoRow` in `lightbox-modal.tsx`. Comments only: code identical to the pre-edit copy once whole-line comments and
  blank lines are stripped. A read of this stretch found no new bug (the Share timer is cleared on close and unmount).
  Counts unchanged (Fixed 173, strict 158, Noted 102). `tsc -b tsconfig.lib.json` 0, lightbox-modal vitest 7 files / 27
  tests passed.
- Annotation stage 2, eighteenth slice (2026-10-19): comments inside the keyboard-navigation handler of
  `lightbox-modal.tsx` (arrow keys, the typing guard, the listener setup). This finishes `lightbox-modal.tsx`. Comments
  only: code identical to the pre-edit copy once whole-line comments and blank lines are stripped. A read found no
  new bug. Counts unchanged (Fixed 173, strict 158, Noted 102). `tsc -b tsconfig.lib.json` 0, lightbox-modal vitest
  7 files / 27 tests passed.
- Annotation stage 2, nineteenth slice (2026-10-19): first file of the promptbox library, `promptStore.ts` (the 2D, 3D,
  image, video, audio and edit prompt stores, the Enter-to-generate preference and the characters store). Comments only:
  code identical to the pre-edit copy once whole-line comments and blank lines are stripped. A read found no bug (plain
  setters; the history helper de-duplicates and caps correctly). Counts unchanged (Fixed 173, strict 158, Noted 102).
  `tsc -b tsconfig.lib.json` 0, promptbox vitest 13 files / 78 tests passed.
- Annotation stage 2, twentieth slice (2026-10-19): five small promptbox `common/` components, `AspectRatioPicker.tsx`,
  `GenerationCountPicker.tsx`, `QualityPicker.tsx`, `VideoGenerationCountPicker.tsx` and `StylePromptRow.tsx`. Comments
  only: each file is code-identical to its pre-edit copy once whole-line comments and blank lines are stripped. A read
  found no countable bug (the generation-count clamp could in theory cut a predefined count above the model's maximum,
  but no shipped model lists one). Counts unchanged (Fixed 173, strict 158, Noted 102). `tsc -b tsconfig.lib.json` 0,
  promptbox vitest 13 files / 78 tests passed.
- Annotation stage 2, twenty-first slice (2026-10-19): four promptbox `common/` components, `AspectRatioIcon.tsx`,
  `ResolutionPicker.tsx` (the B-174 effect and the two debug `console.log` lines kept as they are), `AudioTuningPopover.tsx`
  and `SoundsSettingsPopover.tsx`. Comments only: each file is code-identical to its pre-edit copy once whole-line
  comments and blank lines are stripped. A read found no countable bug. Counts unchanged (Fixed 174, strict 159, Noted
  102). `tsc -b tsconfig.lib.json` 0, promptbox vitest 14 files / 81 tests passed.
- Annotation stage 2, twenty-second slice (2026-10-21): promptbox `common/AudioReferenceRow.tsx` and three `deck/`
  files, `deckTypes.ts`, `KeyframeCards.tsx` and `DeckCard.tsx`. Comments only: each file is code-identical to its
  pre-edit copy once whole-line comments and blank lines are stripped. A read found no countable bug (the image
  upload's "Uploading" state is only reset by the progress callback, but the shipped upload helpers catch their own
  errors and report them through that callback, so it cannot stick in the app). Counts unchanged (Fixed 174, strict 159,
  Noted 102). `tsc -b tsconfig.lib.json` 0, `tsc -p tsconfig.spec.json --noEmit` 0, promptbox vitest 14 files / 81 tests passed on rerun; one earlier run showed 1 failure that did not repeat, and this slice changes comments only.

### Noted, not changed
- N-111 in `BUGS.md` (not counted, no code changed): in a multi-image batch the lightbox Tags box follows the primary file (`mediaId`) while Share, Delete and Edit act on the image shown (`selectedMediaToken`). May be intended (prompt, creator and info are per-bundle too). Options in the row: (a) pass `selectedMediaToken` to the Tags box; (b) label it as the batch's tags; (c) leave as is.
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
- Add-effect redo, `video-editor/src/lib/commands/timeline/element/effects/add-effect.ts` (B-189): redoing "add effect" created
  a new effect id, so later toggles and parameter edits (recorded against the old id) were lost after undo/redo. The command
  now builds the effect once and reuses it. New `effect-redo.spec.ts`; full suite 42 files / 361 tests pass. Counts:
  Fixed 189, strict 169, Noted 114; next free IDs B-190 / N-124.
- Split redo, `video-editor/src/lib/commands/timeline/element/split-elements.ts` (B-190): redoing a split gave the right half a new
  id, so later edits of it were lost. The id is now kept per split element. New `split-redo.spec.ts`; suite 43 files / 362 tests
  pass. Same pattern in duplicate/paste recorded as N-124 (needs a pinned track id in placement). Counts: Fixed 190, strict 170,
  Noted 115; next free IDs B-191 / N-125.
- Mask point redo, `video-editor/src/lib/commands/timeline/element/masks/insert-custom-mask-point.ts` (B-191): redoing an inserted
  mask point gave it a new id, so a later delete of it was lost. The id is now fixed at construction. New
  `masks/insert-point-redo.spec.ts`; suite 44 files / 363 tests pass. Counts: Fixed 191, strict 171, Noted 115; next free IDs
  B-192 / N-125.
- Paste keyframes redo, `video-editor/src/lib/commands/timeline/clipboard/paste-keyframes.ts` (B-192): redoing a keyframe paste gave the
  keyframes new ids, so a later retime of them was lost. Ids are now fixed at construction. New
  `clipboard/paste-keyframes-redo.spec.ts`; suite 45 files / 364 tests pass. Counts: Fixed 192, strict 172, Noted 115; next free IDs
  B-193 / N-125.
- Create scene redo, `video-editor/src/lib/commands/scene/create-scene.ts` (B-193): redoing a scene creation made a new scene id, so a
  later rename was lost. The scene is now built once. New `scene/create-scene-redo.spec.ts`; full suite passes. Counts: Fixed 193,
  strict 173, Noted 115; next free IDs B-194 / N-125.
- Preview commit with no change, `video-editor/src/lib/core/managers/timeline-manager.ts` (B-194): a drag or field edit that ended on its
  committed value still pushed an undo step that did nothing. `commitPreview` now discards an unchanged preview without recording
  history. New `core/managers/preview-noop-commit.spec.ts`; suite 47 files / 367 tests pass. Counts: Fixed 194, strict 174, Noted 115;
  next free IDs B-195 / N-125.
- Playback start cancelled by stop, `video-editor/src/lib/core/managers/audio-manager.ts` (B-195): a pause, scrub or dispose did not cancel a
  playback start still awaiting the audio context or clip lookup, so it later built a schedule interval (and after dispose re-created the
  closed AudioContext). `stopPlayback` now bumps the session id. New `core/managers/audio-manager-dispose.spec.ts`. Counts: Fixed 195,
  strict 175, Noted 115; next free IDs B-196 / N-125.
- Export audio context, `video-editor/src/lib/media/audio.ts` (B-196): `createTimelineAudioBuffer` opened its own `AudioContext` for every
  export with audio and never closed it. It now closes a context it created, and leaves a caller's alone. New
  `media/audio-export-context.spec.ts`. The unreachable twin in `decodeAudioToFloat32` is noted as N-125. Counts: Fixed 196, strict 176,
  Noted 116; next free IDs B-197 / N-126.
- Library audio clip units, `video-editor/src/lib/media/audio.ts` (N-126, not counted): `fetchLibraryAudioClip` returned times in ticks where the
  playback scheduler expects seconds. Fixed, but only a host sounds adapter can create library audio and the shipped app has none, so it is
  a Noted row. New `media/library-audio-clip-units.spec.ts`. Counts: Fixed 196, strict 176, Noted 117; next free IDs B-197 / N-127.
- Snapshot download URL, `video-editor/src/lib/utils/browser.ts` (B-197, borderline): `downloadBlob` (and `downloadBuffer`) revoked the blob URL in the
  same tick as the click, which can cancel the download in WebKit. They now revoke after 60 s like the default export sink. New
  `utils/browser-download.spec.ts`; suite 51 files / 372 tests pass. Counts: Fixed 197, strict 176, Noted 117; next free IDs B-198 / N-127.
- Easing solver, `pagescene/src/lib/engine/timeline/interpolation.ts` (B-198, borderline): `cubicBezierYForX` pinned t to 0 or 1 when both handles
  were dragged to the same x edge. It now falls back to bisection when Newton does not converge. New `engine/timeline/interpolation.spec.ts`;
  pagescene suite 16 files / 81 tests pass. Counts: Fixed 198, strict 176, Noted 117; next free IDs B-199 / N-127.
- Keyframe delete, `pagescene/src/lib/engine/editor/TimelineController.ts` (B-199, borderline): `deleteKeyframe` did not re-evaluate at the playhead, so the
  object kept the deleted key's pose until the next scrub. It now calls `evaluate()`. New `engine/editor/TimelineController.spec.ts`; pagescene suite
  17 files / 82 tests pass. Counts: Fixed 199, strict 176, Noted 117; next free IDs B-200 / N-127.
- Cancel, `pagescene/src/lib/engine/editor/TimelineController.ts` (B-200, borderline): `cancel` restored the saved timeline without clamping the playhead, so it could
  stay past the end after a lengthen-then-cancel. It now clamps like `restoreSnapshot`. New case in `TimelineController.spec.ts`; pagescene suite 17 files / 83 tests pass.
  Counts: Fixed 200, strict 176, Noted 117; next free IDs B-201 / N-127.
- Close project, `video-editor/src/lib/core/managers/project-manager.ts` (B-201, borderline): `closeProject` did not clear the selection, so the previous project's track and clip ids
  leaked into the next project opened. Now cleared. New `close-project-selection.spec.ts` failed before, passes after; `project-manager.spec.ts` stub gained `selection`. Counts: Fixed 201, strict 176, Noted 117; next free IDs B-202 / N-127.
- Open project, `video-editor/src/lib/core/managers/project-manager.ts` (B-202, borderline): `openProject` went straight to `closeProject`, whose `save.stop()` dropped the pending autosave, so recent edits to the previous project were lost on a host-driven switch. It now flushes a dirty active project first (with a request ticket against resurrection). Two new cases in `project-manager.spec.ts`; the stub gained `save.flush`/`getIsDirty`. Counts: Fixed 202, strict 176, Noted 117; next free IDs B-203 / N-127.
- Free camera, `pagescene/src/lib/engine/cameraMath.ts` and `engine/editor/CameraController.ts` (B-203): keyboard look (arrow keys / roll) was applied once per frame instead of per unit time, so it turned 2.4x faster at 144 Hz than at 60 Hz. `freeCamFrameTick` now takes a `rotationScale` and `tickPerFrame` passes the clamped elapsed time in 60 Hz-frame units. New `CameraController.spec.ts` failed before (15 vs 36 degrees), passes after. Counts: Fixed 203, strict 177, Noted 117; next free IDs B-204 / N-127.
- Free camera, `pagescene/src/lib/engine/editor/CameraController.ts` (B-204, borderline): movement used the raw frame delta, so the first frame after a paused render loop (backgrounded tab) with a key held moved the camera pause length x speed (11.5 units for a 10 s stall). Delta now clamped to 0.1 s. New case in `CameraController.spec.ts` failed before, passes after. Counts: Fixed 204, strict 177, Noted 117; next free IDs B-205 / N-127.
- Scene load, `pagescene/src/lib/engine/save_manager.ts` (B-205): `loadFromJson` restored the prompt only when it was truthy, so a saved empty prompt was skipped and the default (or previous) prompt returned on reload or Reset. Now restored whenever the field is a string. Two new cases in `save_manager.spec.ts`; the empty-prompt one failed before. Counts: Fixed 205, strict 178, Noted 117; next free IDs B-206 / N-127.

- Legacy World Labs poller (N-127, not counted): `poll_world_status` ignores the `status` field, so failed worlds are polled forever, and one task's HTTP
  error aborts the whole `poll_grok_tasks` pass and starves the rest. Deprecated path, noted only. Counts now: Fixed 205, strict 178, Noted 118; next free IDs B-206 / N-128.

- Media import, `video-editor/src/lib/media/processing.ts` (B-206): `getMediaDuration` returned `Infinity`/`NaN` for browser-recorded audio, and `mediaTimeFromSeconds` then threw when the clip was added to the timeline. It now seeks to the end to recover the real length (3 s cap) and otherwise resolves `undefined`. New `processing-duration.spec.ts`; 3 of 4 cases failed before. Counts: Fixed 206, strict 179, Noted 118; next free IDs B-207 / N-128.

- Media import, `video-editor/src/lib/media/processing.ts` (B-207): the detected video frame rate was rounded to a whole number, so 29.97 / 23.976 / 59.94 fps imports became 30 / 24 / 60 and the NTSC snapping in `floatToFrameRate` never ran. It now rounds to 3 decimals. New `processing-fps.spec.ts`; 2 of 4 cases failed before. Counts: Fixed 207, strict 180, Noted 118; next free IDs B-208 / N-128.

- Cleanup and decisions, 2026-10-22: deleted dead code (N-05 the Sora status stub, N-10 `UploadStudioShot`, N-26 ten unused tauri-api wrappers and `OpenAIKeyBlock`, N-70 both watermark-remover pages and their routing, N-83 the unused `UploadModalMedia` components and two helpers in `uploadPlane.ts`); N-80 Enter-while-composing guard added to `PromptBoxEdit` and `PromptBox3D`; N-127 World Labs poller now skips a failing world instead of aborting the pass; N-86 CSP gained the frankfurter, getartcraft and youtube hosts plus `frame-src`; N-11/N-72 query/body helpers drop only `undefined`/`null` (new `ApiManager.parse.test.ts`). N-85, N-69 and N-89 stay noted with the reason written in BUGS.md.
- Keyframe retime, `video-editor/src/lib/animation/keyframes.ts` (B-208, was N-68): a drag onto another key's time now replaces it. New `keyframes-retime.spec.ts`; the replace case failed before. Counts: Fixed 208, strict 181.
- Recreate, `generation-feed/desktopMediaActions.ts` (B-209, was N-73): always sets the prompt and all reference fields. New `desktopMediaActions.recreate.spec.ts`; 2 of 3 failed before. Counts: Fixed 209, strict 182.
- Video editor Save to disk (B-210, was N-67): new `saveBlobToDisk` in `libs/tauri-api` writes the render's bytes through `@tauri-apps/plugin-fs` 2.5.1 (plugin registered in the Rust app, `fs:allow-write-file` for `$DOWNLOAD/**`). New `export-sink-adapter.spec.ts` (3 of 3 failed before) and `SaveBlobToDisk.spec.ts` (5). Compiles; not run in the desktop app. Counts: Fixed 210, strict 183, Noted 115; next free IDs B-211 / N-128.
- Video editor drop target (B-211): `getTrackAtY` snaps a pointer in the gap between tracks to the nearer track when no drag direction is known (assets-panel and external file drops), instead of creating a new bottom track. New `drop-target.spec.ts` (2 of 2 failed before). Counts: Fixed 211, strict 183, Noted 115; next free IDs B-212 / N-128.
- Prompt box uploads (B-212): the reference-image commit in `ImagePromptRow` and `useDeckMedia` updates its ref synchronously, so two uploads finishing in the same tick no longer drop one image. New `ImagePromptRow.concurrentUploads.spec.tsx` (failed before). Counts: Fixed 212, strict 183, Noted 115; next free IDs B-213 / N-128.
- Gradient painter cleanup (N-129, unreachable, not counted): `angleFromDirectional` in `gradients/canvas.ts` strips only the leading "to" word, so `to top`, `to bottom right` and `to top left` get the right angle. 2 new `canvas.spec.ts` tests (failed before). Counts: Fixed 212, strict 183, Noted 117; next free IDs B-213 / N-130.
- Fal task polling (B-213, borderline): `poll_fal_tasks` marks a task failed when the result fetch returns a permanent 400/404/410/422, instead of skipping it forever; network errors, 5xx, key/billing errors and "still in progress" still retry.
- Mask outlines on flipped elements (B-214, borderline): `getBoxMaskRectOverlay` and `getBoxMaskShapeOverlay` return positive sizes, so a box mask's outline stays visible and draggable when its element is flipped.
- Preview snapping (B-215, borderline): `snapPosition` takes the absolute element width and height, so a flipped and rotated element snaps to the canvas edges by its real footprint while dragging.
- Grok image generation (B-216, borderline): the Grok websocket thread fails the task (and tells the UI) when the websocket errors or no images come back, instead of dropping the prompt or reporting success with no media.
- Grok video polling cleanup (N-130, not counted): a failed upload for one task is logged and skipped, so the other finished videos in the same cycle still upload.
- Tests (no behaviour change): new specs for the freeform mask path maths (`masks/freeform/path.spec.ts`, 18 tests) and the timeline placement resolver (`timeline/placement/resolve.spec.ts`, 16 tests). Both pass on the existing code.
- Tests (no behaviour change): new spec for preview hit testing and viewport coordinates (`preview/hit-test.spec.ts`, 8 tests: rotated and flipped hits, topmost order, preferred selection, canvas/overlay round trip). Passes on the existing code.
- Tests (no behaviour change): new spec for text layout geometry (`text/text-layout.spec.ts`, 10 tests: block measurement, alignment anchors, background padding and offset, font scaling and quoting, per-line measuring). Passes on the existing code.
- Tests (no behaviour change): first spec for the credits store (`libs/state/credits/src/lib/state/credits-state.spec.ts`, 6 tests: normal fetch, slow then recovered icon, failed fetch keeps old credits, recovery, stale response ignored, response after reset dropped). Passes on the existing code.
- Task timestamps (B-217): a new SQLite migration adds triggers so `tasks.updated_at` is refreshed on every update and `tasks.completed_at` is stamped when a task finishes or fails. Before, both stayed at their creation values, so the task queue sorted and labelled finished and failed tasks by when they started. `sqlite_tasks/build.rs` now reruns when migrations change.
- Failure reasons (N-132, not counted): Fal and Grok image failures are stored on the task (`on_failure_type`, `on_failure_message`) as well as sent as an event, so the task queue still shows why after the event is gone.
- Failure labels (B-218, borderline): the task queue and the generation feed share one failure-reason table, and it now covers the no-foreground-subject and unsupported-format failures, so those failed cards show a readable reason.
- Enum sync (N-133, not counted): the frontend `TaskModelType` now lists every model the Rust enum has, and `api-enums/.../rust-enum-sync.spec.ts` fails when the frontend copies of `TaskModelType`, `TaskStatus`, `TaskType` or `TaskMediaFileClass` drift from the Rust source.
- Fal failure message (B-213 follow-up): the reason shown in the failure toast and stored on the task is now a plain sentence instead of Fal's raw JSON response body, which stays in the log.
- Generation error messages (B-219, borderline): image and video generation failures show a readable sentence (for example "You need to log in to Grok.") instead of the Rust Debug text or the generic server-error line; the Debug text stays in the log.
- Omni generation errors (B-220): server, timeout and network failures when generating through ArtCraft show a plain sentence, and a non-JSON error body is never shown; the detail goes to the log.
- Download toast (N-134, not counted): "File already downloaded" shows the plain path instead of a quoted Debug string.
- Sora failures (N-135, not counted): the failed event carries the task's real action (video for Sora 2 drafts, not always image) and the failure reason is stored on the task, so the task queue can show it.
- Grok video polling (B-221): a finished video that repeatedly fails to download or upload is marked failed after 5 attempts and the user is told, instead of staying pending forever.
- Grok video polling (B-222): a task whose video never shows up on Grok is marked failed after 30 minutes instead of staying pending forever.
- Sora success loop (N-131, not counted): one generation that fails to download or upload is logged and the rest of the batch continues.
- Gradient parser tests (test flood, N-136 not counted): 28 tests cover linear/radial gradients, every colour form, calc(), and the malformed-input errors.
- Keybinds tests (test flood): registry and preset tables agree, availability gates for record mode and encoding, shared-key exclusivity, and matcher helpers.
- Markdown renderer (N-137, not counted): image sizes written in px (`300px`, `40%x20px`) now render correctly; 37 tests added for the renderer and front-matter helpers.
- Model picker tests (test flood): family grouping, curated order with Other last, numeric newest-first sorting, selected-family highlight.
- OmniGen model hooks tests (test flood): all five hooks checked for caching, disabled-model filtering, shared requests, error notification and retry.
- Keybinds (B-223): a saved preset that no longer exists, or a damaged saved override, falls back to the defaults instead of breaking every shortcut.
- Task database (B-224): a task row with a value this build cannot parse is logged and skipped instead of making the whole task list fail for the pollers and the task queue.
- Task database (B-225): the third-party and Storyteller polling threads no longer stall on one unreadable task row; all list queries share one row conversion.
- Sora session renewal (B-226): the JWT is now renewed when it is within 12 hours of expiring, as intended, instead of only after it has expired.
