# ArtCraft Native

ArtCraft's desktop app in pure Rust: an [egui](https://github.com/emilk/egui) UI over the same
ArtCraft API client crates the Tauri app uses. There is no Tauri, no webview and no JavaScript.

The look follows the brutalist webapp (`artcraft-services/frontend/apps/artcraft-webapp`). That
means near-black surfaces with white/15 hairlines and 3 px corners on controls. Type is Archivo for
display, Inter for body text and Geist Mono for labels. The brand blue marks the primary actions.

Create Image and Create Video are fully built. The other tools show a "coming soon" page that
links to the same tool in the web app.

## Running

```bash
cargo run -p artcraft_native --release
```

The workspace's default member is the Tauri app, so pass `-p artcraft_native`.

- **Sign-in.** On first launch the app reuses an existing ArtCraft login. It reads the session
  cookie from the Tauri app's jar (`<cache dir>/ai.artcraft.app/.cookies`) and keeps its own copy in
  `~/Artcraft/credentials/native_session.json`. Otherwise use "Sign in with browser" (device code)
  or a username and password.
- **API host.** `~/Artcraft/settings/env_configs.json` selects it, exactly as for the Tauri app.

## Architecture

| Module             | What it does                                                                   |
|--------------------|--------------------------------------------------------------------------------|
| `backend`          | Tokio runtime and every API call; results come back to the UI as `Event`s      |
| `backend::wire`    | Lenient response shapes; new server enum values can't break decoding           |
| `backend::session` | Credentials: own file, Tauri cookie import, env config                         |
| `backend::media_cache` | Thumbnails and previews: downloaded and decoded off-thread, evicted when unused |
| `models`           | Model catalog from OmniGen listings, plus names, families and limits           |
| `prompt_box`       | The shared prompt box: editor, reference deck, keyframes, pickers, model selector |
| `pages`            | Create Image, Create Video, Home, Library, and the shared page shell            |
| `feed`             | Generation feed: running, failed and finished jobs, library paging, grid and list |
| `overlays`         | Lightbox, library picker, sign-in and settings dialogs                         |
| `shell`            | Custom title bar, sidebar flush to the window edge, content panel header       |
| `theme`, `ui`      | Tokens, Lucide-style icons, widgets, toasts, window chrome (drag, resize, caption buttons) |

How the backend works:

- **Generation.** It goes through OmniGen: `/v1/omni_gen/{models,cost,generate}/{image,video}`.
  Model capabilities come from the server, so new models and options appear without an app update.
- **Typed client functions.** Model lists, uploads, credits, login and deletes use
  `artcraft_client`.
- **Lenient decoding.** Generate and cost requests are JSON maps, as in the Tauri app. Job polling
  (`/v1/jobs/session`), the library list, batches and prompts are decoded with lenient structs.
- **Identity headers.** Every request sends the desktop identity headers: `Origin` and
  `User-Agent`.

## Prompt box parity

| Feature                                                         | Status                                  |
|-----------------------------------------------------------------|-----------------------------------------|
| Auto-growing prompt (~4 lines), expand/collapse, resize grip    | Done                                    |
| Focus mode (fullscreen editor with deck and toolbar)            | Done                                    |
| Length counter, red over the model's limit                      | Done                                    |
| Enter to generate (setting; Shift+Enter for a new line)         | Done                                    |
| `@Image1` / `@Video1` / `@Audio1` highlight and autocomplete    | Done                                    |
| Reference deck: fan, +N badge, hover-expand, reorder, clear all | Done                                    |
| Keyframe slots: first/last frame, tilt, swap                    | Done                                    |
| Upload, pick from library, drag & drop, paste image             | Done (video uploads must be MP4)        |
| Model selector with families, logos, capability badges          | Done                                    |
| Aspect ratio, resolution, quality, count                        | Done                                    |
| Bitrate, output format, duration slider, sound, input mode      | Done                                    |
| Live credit cost on the generate button                         | Done                                    |
| Validation: starting frame, text-only banner, limits, uploads   | Done                                    |
| Clear all (confirms when references are attached)               | Done                                    |
| `@Character` mentions and the Characters modal (Seedance 2.0)   | Not yet                                 |
| Provider choice (Midjourney direct, fal)                        | Not yet; everything runs via ArtCraft   |
| In-app video and audio playback                                 | Opens in the system player instead      |
| Animated video previews in the feed                             | Still frames only                       |

Feed and lightbox:

- **Feed.** Pending cards show progress, time left and a batch banner. Failed cards show the reason
  and can be dismissed. The grid is masonry, with a list view alongside. Hover actions are Recreate,
  Make Video, Share and Download. Select mode does batch downloads. The last viewed item is marked.
- **Lightbox.** Prev/next with the arrow keys, prompt copy and details. Actions are Recreate, Make
  Video, Download, Share and Delete.

## Diagnostics

Set `ARTCRAFT_SCREENSHOT=<file.png>` to save a screenshot once the window has settled.
`ARTCRAFT_PAGE` (`home`, `create-image`, `create-video` or `library`) picks the page, and
`ARTCRAFT_SCREENSHOT_EXIT=1` closes the app afterwards.

## Tests

```bash
cargo test -p artcraft_native
```

There are unit tests for the catalog, feed store, wire decoding and backend helpers. Headless UI
tests (`egui_kittest`) drive the prompt box: generate gating, Enter to generate, the pickers,
`@` mentions and clear-all.

## Fonts and brand assets

`assets/fonts` holds Inter, Archivo and Geist Mono, all under the SIL Open Font License; the
licences sit next to the files. The wordmark, app icon and creator logos are the Tauri app's own
(`frontend/apps/artcraft/app/public/resources`, `crates/desktop/artcraft/icons`); see `NOTICE`
for their terms.
