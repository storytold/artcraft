# Interface localization

Artcraft includes English (`en`, the default) and an initial Simplified Chinese
(`zh-CN`) interface. Select **Settings > General > Language > 简体中文**.
The choice applies immediately and is saved locally. Translation resources are
bundled with the app; switching languages does not need a network connection.
AI generation and account/provider services retain their existing network requirements.

## Current contribution scope

The language pack contains 1,576 resource entries covering the home page and app
cards, top navigation, primary image/video/audio creation controls, generation
feed actions, common settings panes, and the complete shared keyboard-shortcut
settings panel. Shortcut names and groups can be searched in Chinese or English;
physical key names and stored binding identifiers remain unchanged.

The login, signup, login-success, and desktop QR/website-login screens are
localized, including local validation and challenge status messages. Switching
languages does not restart or cancel a login challenge or clear entered fields.
Shared creation controls cover quality, aspect ratio, resolution, generation
count, audio attachments, audio tuning, musical key, tempo, and style prompts.
Their model parameter values remain unchanged when labels are translated.

The library now includes translated filters, folder/tag navigation, folder-naming
and color controls, selection counts, move/copy choices, deletion confirmations,
empty states and local operation errors. User-provided titles, folder names,
tags and error details stay unchanged. Dates follow the selected locale.

The task queue includes translated media kinds, progress estimates, completion
and failure states, known failure reasons, and queue-clearing confirmations.
Changing language updates the rendered queue without rebuilding the polling
subscription. The model selector translates its headings, provider prompt and
capability badges while retaining model/provider identifiers and brand names.

Subscription and credit-pack dialogs include translated billing periods, plan
features, discounts, account management actions, and credit cost breakdowns.
Provider setup and billing explanations are localized. Plan/provider IDs,
checkout commands, currency codes, dollar prices, and credit quantities remain
unchanged. Language switching retains the selected billing cadence.

Media previews now translate prompt controls, reference previews, action buttons,
sharing and deletion messages, information labels, audio status, and dates.
Tag entry and removal labels are localized without translating user tag values.
Switching languages preserves draft tags and does not refetch prompt details.

The video frame extractor covers local/library import, playback controls,
extraction settings and counts, result actions, and local save/error messages.
Language switching preserves the loaded video, extraction parameters and results.
Upload filenames, media tokens and intermediate-file flags remain unchanged.

The expanded pack also covers video-editor panels, effects, timeline controls,
3D scene menus, drawing tools, moodboards, character management, uploads and
specialized image/video tools. Static descriptor labels are translated at their
render sites, preserving action IDs and media names. Error boundaries use reactive
text leaves so existing error screens update with the selected language.

The separate `artcraft-native` egui app now has an English/简体中文 selector in
Settings, saved independently from the Tauri app. Its common dialogs, navigation,
creation and media controls use a separate Rust dictionary. It loads a system CJK
font (Windows Microsoft YaHei, macOS PingFang, or Linux Noto Sans CJK); these fonts
are not redistributed. Native compilation is checked, but native GUI behavior
and non-Windows font availability have not been validated in this change.

This is incremental localization. Some indirect editor labels,
provider/model-specific descriptions, and server-generated messages are not
fully translated yet.

## Adding or improving translations

- Edit `frontend/libs/i18n/src/locales/zh-CN.json` and keep its keys aligned with
  `en.json`. English source strings serve as keys, including punctuation.
- Preserve `{{variable}}` interpolation names, `<craft>` rich-text tags, and
  literal filename tokens such as `{model}`. Never concatenate translated
  sentence fragments; interpolate the complete sentence instead.
- Plural messages use i18next suffixes, for example `creditCost_one` and
  `creditCost_other`, called with `t("creditCost", { count })`.
- Import `useTranslation` from `@storyteller/i18n` in each rendering component.
  Translate static descriptors at render time so already-mounted controls update.
  Include `t` in memo dependencies when a memo produces translated text.
- Use `Trans` with the bound `t` for rich text, rather than rendering HTML from
  translation strings. Keep user input and protocol values out of translation.
- For another locale, add resources and update `SUPPORTED_LOCALES`, `isLocale`,
  initialization resources, and the language selector in `MiscSettingsPane.tsx`.
  Missing translations fall back to English.

简体中文约定：使用“设置、生成、提示词、积分”等一致术语；保留品牌和模型名称。
优先使用简洁、自然的中文，并在真实页面检查按钮宽度与换行。

## Validation

Run from `frontend` after `npm ci`:

```sh
npx tsc -p libs/i18n/tsconfig.json --noEmit
npx vitest run --project '@storyteller/i18n' --project artcraft --project '@storyteller/ui-settings-modal' --project '@storyteller/keybinds' --project '@storyteller/ui-login-modal' --project '@storyteller/ui-promptbox' --project '@storyteller/ui-model-selector' --project '@storyteller/ui-gallery-modal' --project '@storyteller/ui-pricing-modal' --project '@storyteller/ui-lightbox-modal'
npm run build --workspace artcraft
```

For browser checks, start a local app in another terminal:

```sh
npm run dev --workspace artcraft -- --host 127.0.0.1 --port 5193 --strictPort
```

Then run (Google Chrome must be installed):

```sh
npm run test:i18n -- http://127.0.0.1:5193
npm run test:desktop-session -- http://127.0.0.1:5193
npm run test:i18n-library -- http://127.0.0.1:5193
npm run test:i18n-billing -- http://127.0.0.1:5193
npm run test:i18n-lightbox -- http://127.0.0.1:5193
npm run test:i18n-frames -- http://127.0.0.1:5193
```

The localization browser test blocks external requests and uses deterministic
IPC fixtures. It checks default English, immediate switching, persistence after
reload, Chinese creation pages, bilingual shortcut search, shortcut conflict
cancellation, Chinese login, and preservation of prompt input. It saves a
Chinese home screenshot in `output/playwright/i18n-home-zh-CN.png` and a settings
screenshot in `output/playwright/i18n-keybinds-zh-CN.png`. The login screenshot
is saved in `output/playwright/i18n-login-zh-CN.png`.
The library/queue browser test uses additional isolated tasks and folders. It
checks translated task status, queue-clear cancellation, unchanged folder/media
names, folder-delete cancellation, and English restoration. Its screenshots are
`output/playwright/i18n-library-zh-CN.png` and
`output/playwright/i18n-tasks-zh-CN.png`.
The billing browser test checks Chinese pricing, monthly cadence, credit packs,
and cost breakdowns. It saves `i18n-pricing-zh-CN.png`, `i18n-credits-zh-CN.png`,
and `i18n-costs-zh-CN.png` in `output/playwright/`. It blocks external requests
and asserts no checkout commands are sent. Component tests separately mock
checkout and provider login commands to verify their unchanged identifiers.
The media preview browser test checks Chinese action labels, localized dates,
and deletion cancellation, saving `output/playwright/i18n-lightbox-zh-CN.png`.
Component tests verify unchanged prompts, tag drafts, media IDs, and download/edit
arguments during language switching; deletion is mocked.
The frame-extractor browser test imports the bundled canvas demo video, extracts
two frames, and checks that settings/results survive a switch back to English.
It saves `output/playwright/i18n-frames-zh-CN.png` and never uploads the frames.
Component tests mock uploads and verify filenames, intermediate-file flags,
and video-page routing.
These checks do not make purchases or billable generations or prove native provider connectivity.

For manual desktop verification, rebuild the app with the updated frontend,
open Settings > General, switch languages, visit home and image/video/audio
creation pages, then restart to check persistence. Confirm prompts and model
selections stay unchanged while switching languages.

### Windows release packaging

Keep `build.frontendDist` relative to the Tauri project directory, for example
`../../../frontend/apps/artcraft/dist`. Do not replace it with a Windows drive
path such as `D:/.../dist`: Tauri can deserialize that value as a URL instead
of an asset directory, so the executable opens a directory listing and does
not embed the frontend.

After packaging, launch the actual release executable and verify that the home
page renders, Settings can switch to Simplified Chinese, and the language
persists after restart. A responsive process or a successful installer build
alone does not establish that the desktop UI works.
The fork's Windows packaging override is `script/artcraft/tauri.zh-cn.conf.json`.
It uses `.local-build/frontend-release-fixed` as an isolated frontend output
instead of embedding accumulated assets from earlier development builds.
From the repository root, with the documented frontend/Rust prerequisites and
Tauri CLI installed, build with PowerShell:

```powershell
$env:VITE_ENVIRONMENT_TYPE = 'production'
$env:SQLX_OFFLINE = 'true'
$env:CARGO_BUILD_JOBS = '1'
$releaseFrontend = Join-Path (Get-Location).Path '.local-build/frontend-release-fixed'
npm run build --workspace artcraft --prefix frontend -- --outDir $releaseFrontend --emptyOutDir
# Continue only if the frontend build succeeded.
tauri build --ci --bundles nsis --config script/artcraft/tauri.zh-cn.conf.json -- --locked
```

Wait for bundling to finish before launching the release executable; Windows
can otherwise keep the executable locked while the bundler is working.
