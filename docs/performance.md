# Desktop frontend performance experiments

Measured September 26, 2026 on an Apple M4 Pro, macOS arm64, Chrome
153.0.8010.53, Node 24.13.0. These are production frontend measurements in
headless Chrome with mocked Tauri services. They do **not** measure native
process launch, WKWebView/WebView2, Rust, disk startup, real account loading,
or generation latency.

These timings are not authentication acceptance tests: the benchmark mocks the
native session and rejects frontend HTTP requests. Before accepting a desktop
change, also run the [session and Library checks](desktop-session-regression.md),
including real Tauri HTTP requests when changing the launcher or bridge.

## Changes and results

Seven samples per version; table values are medians. Each sample uses a fresh
browser context at 1440 × 1000 with device scale 1 and browser HTTP cache
disabled. The browser process stays alive between samples. A reload in the
same context is measured separately. There is no CPU/network throttling.
External requests, including analytics, fonts, and media, are blocked in both
versions. The login fixture is signed in; the bundled model overlay is used.

| Measurement                 | Before    | After     | Reduction |
|-----------------------------|-----------|-----------|-----------|
| Startup to frame            | 566.40 ms | 350.60 ms | 38.1%     |
| Refresh to frame            | 248.60 ms | 198.10 ms | 20.3%     |
| Startup JavaScript          | 9.05 MB   | 6.47 MB   | 28.6%     |
| Startup long tasks (sum)    | 336.00 ms | 184.00 ms | 45.2%     |
| First drawing page to frame | 120.90 ms | 118.20 ms | 2.2%      |
| Drawing to home: dispatch   | 23.40 ms  | 9.00 ms   | 61.5%     |
| Drawing to home: frame      | 29.50 ms  | 23.00 ms  | 22.0%     |
| Home to drawing: dispatch   | 42.10 ms  | 18.80 ms  | 55.3%     |
| Home to drawing: frame      | 105.70 ms | 86.50 ms  | 18.2%     |

The 2.2% first-open difference is small enough to treat as unchanged. These
local measurements are evidence of reduced frontend work, not predictions
of identical percentage gains on every user's machine. Raw samples, ranges,
environment, fixture sizes, browser errors, and build provenance are in
[before.json](performance/2026-09-26-before.json) and
[after.json](performance/2026-09-26-after.json).

Three changes produced these results:

1. `MainApp.tsx` imported every editor at launch. Fifteen pages now use
   `React.lazy` behind a Suspense boundary below the persistent shell. Their
   code loads when selected; the top bar stays available during loading.
   The default Apps page remains eager. Drawing also remains eager: its
   shared code is already part of the shell, and experimentally deferring
   its small host adapter made first-open latency worse for little saving.
   First-open latency for the other deferred editors is a remaining tradeoff
   to measure, especially on slower disks/CPUs. All 15 deferred modules were
   imported successfully in the browser, but this is not an end-to-end test
   of every editor's features.
2. `TabState.ts` exported the drawing scene to JSON when leaving and imported
   it when returning. The Zustand scene store already survives page unmount.
   With four imported images, the old path performed four FileReader reads
   on exit and four more on return, allocated base64 copies, rebuilt image
   nodes, cleared the selection, and appended an undo-history entry. Tab
   changes now keep the live store. The measured round trip performs **zero
   image-file reads**, preserves the selected node, and keeps history length
   at one instead of growing to two. Explicit file export/import remains
   available. Tests cover image identity, model metadata, selection, redo,
   gallery reset, rapid navigation, and portable file export.
3. The shell ran `getGPUTier()` at startup and stored its result in an unread
   React state value. Removing it eliminates **one startup WebGL context
   request** and its associated detection work. The real 3D renderer still
   creates its context when used. This experiment reports combined timing
   gains, not an isolated timing attribution for each individual change.

## Repeat the experiment

From the repository root:

```sh
cd frontend
npm ci
npm run perf:desktop -- --output /tmp/artcraft-perf-current --smoke-imports
```

The default browser is an installed Google Chrome (`--channel chrome`). The
runner requires permission to launch a browser and bind a loopback server.
It never uses your regular browser profile, account, or native app data.
`@playwright/test` is pinned as a development dependency. Artifacts are written
outside the repository by default. Use a dedicated output directory: its
`dist` subdirectory is rebuilt by Vite.

For this particular two-module change, reproduce the original implementation
without replacing local source files:

```sh
npm run perf:desktop -- --output /tmp/artcraft-perf-before \
  --baseline-ref 780e4494e995163fed1d677b88c3cf03b3fca63c
npm run perf:desktop -- --output /tmp/artcraft-perf-after --smoke-imports
node tools/performance/compare.mjs \
  /tmp/artcraft-perf-before/results.json \
  /tmp/artcraft-perf-after/results.json
```

`--baseline-ref` overlays **only** `MainApp.tsx` and `pages/Stores/TabState.ts`
from that Git revision in the benchmark build. All other source files and
dependencies remain current. It reproduces the two production files changed
in this experiment; it is not a general historical-checkout benchmark. For
future changes, capture a normal baseline **before** editing, use a new output
directory for the changed version, and keep the runner, fixture, dependencies,
browser, and machine identical. Run sequentially while the machine is idle;
do not build or run other CPU-heavy tasks during samples. Repeat in reverse
order if results are close or noisy.

Useful options:

```sh
# Build in a restricted shell, then run where browser/server use is allowed.
npm run perf:desktop -- --output /tmp/artcraft-perf-current --build-only
npm run perf:desktop -- --output /tmp/artcraft-perf-current --skip-build

# More samples; seven is the default.
npm run perf:desktop -- --output /tmp/artcraft-perf-current --runs 15

# Correctness checks for the navigation change.
npx vitest run --config apps/artcraft/vitest.config.ts
```

Do not use `--skip-build` after changing app code; it intentionally measures
the existing artifact. `build-info.json` records the revision, changed-file
names, baseline overlay, and build time. The benchmark plugin alone exposes
the stores needed to seed the scene. It is not part of the normal Vite/Tauri
build, and no mock IPC or benchmark global is added to the shipped app.

The runner builds from the app's working directory, matching its normal
build command. This matters because Tailwind resolves its config and content
relative to that directory. It rejects a run without working Tailwind styles
or with uncaught browser errors. `drawing.png` provides a visual check after
the measured operations. The initial unstyled exploratory runs were discarded.

## What the measurements mean

The fixture creates four deterministic 1024 × 1024 PNG image nodes and 80
strokes of 200 coordinates each, with one selected image. On the recorded
browser each PNG is 2,356,706 bytes. Fixture construction, image decoding,
and a one-second settling period are outside the tab-transition timings.
Each sample follows the same sequence:

1. Navigate to the production app, wait for the Apps heading and for the
   signed-in login overlay to disappear, then wait two animation frames.
2. Reload that page and repeat the same readiness checks.
3. Seed the scene while on Apps, open drawing, and wait for its canvas and
   two animation frames. Allow a second for its background bake to settle.
4. Switch to Apps and then back to drawing, measuring each separately.
5. After a settling period, inspect node count, selection, history, and IPC
   counters. Save a screenshot on the first run. Optionally evaluate all
   deferred page modules after the final timed operation.

`readyMs` is `performance.now()` after readiness checks and two animation
frames; its origin is navigation start. It includes browser loading and
automation readiness-observation overhead. `jsBytes` sums decoded resource
sizes of loaded JavaScript; it is uncompressed bytes, not all packaged files.
`longTaskMs` sums observed startup tasks longer than 50 ms, not total CPU time
or total blocking time. Long Tasks support is browser-dependent.

`stateReadyMs` measures the awaited `setActiveTab()` action, including React
work synchronously flushed by its store subscribers. `paintMs` continues
until the destination heading/canvas exists and two animation frames have
passed. This is a **rendering-opportunity proxy**, not proof of GPU presentation
or of every asynchronous image decode completing. In particular, the old
return path could still be decoding images after the canvas first appeared.
Tab measurements also create `artcraft:tab:APPS` and `artcraft:tab:2D` User
Timing entries in the benchmark page.

The runner calls the same store action used by navigation UI. It excludes
pointer-event dispatch, menu animations, and physical click-to-screen latency.
It does not automate paid generations, sign in to a real account, or measure
remote services. Save the raw JSON as well as the summary; a single minimum
time is not a reliable comparison.

`dist/performance-bundle.json` ranks the largest retained modules per chunk
and records chunk imports. Module `renderedBytes` is Rollup's intermediate
module size; it is useful for attribution but should not be summed as final
minified/gzipped size. Use actual resource bytes for the startup total.

## Remaining investigation

- The shell still loads about 6.47 MB of JavaScript. Shared imports through
  drawing, scene, gallery, and settings entry points need a deeper dependency
  audit. Separate lightweight store/type imports from editor code, then use
  the bundle report and the same startup experiment to verify what actually
  leaves the initial graph. The report identifies Spark, Three.js core and
  renderer, the inline FBX-to-GLB conversion worker, PostHog, and Mediabunny
  among the largest retained modules. Their presence is measured; the runtime
  benefit of deferring each individually has not yet been measured.
- Returning to the populated canvas still takes about 86 ms. The editor
  remount, Konva drawing, image/transformer setup, and composite bake need a
  timeline profile before choosing the next change. Keep scene restoration,
  undo, selection, and background generation behavior in correctness checks.
- `TaskQueue.tsx` polls every five seconds and rebuilds task arrays even when
  the popover is closed. The benchmark uses an empty queue, so it does not
  establish the cost for a large real queue. A fixed, representative task
  fixture plus idle CPU/render counts is the next useful experiment there.
- `useStageSnapshot` looks expensive in isolation, but its only call is
  commented out in `PaintSurface.tsx`. It was excluded as a current bottleneck.

Validation completed: normal production Vite build, all 10 app tests and 20
login tests, all 15 deferred page-module imports, visual canvas inspection,
and a check that the normal build contains no benchmark globals or fixtures.
The broad TypeScript check remains blocked by existing workspace declaration/
project-reference errors and Remix/Deno types. Comparing diagnostics with the
two original modules showed the same diagnostic messages (some import traces
and reporting locations changed); this is not a clean typecheck claim.

## Validate in the native app

Before claiming native launch or interaction gains, run matching release
Tauri builds on the same machine and WebView version. Keep account, window
size, network conditions, and canvas artwork fixed. Record the Web Inspector
timeline for launch/reload, opening a tool for the first time, drawing → Apps,
and Apps → drawing. Repeat at least seven times and retain the traces with
build IDs and medians. Separate native process launch from page reload; do
not mix dev/HMR traces with production measurements.

For canvas tests, create a blank 1024-square canvas, import the same four
images, add the same strokes, select an image, and wait for background work
before switching. Check image content, selection, undo/redo, and opening a new
gallery image afterward. Record actual click-to-visible-frame latency in
the inspector as well as JavaScript tasks. The browser results above justify
the code changes but do not replace that native validation.
