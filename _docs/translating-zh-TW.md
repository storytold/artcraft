# Taiwan Traditional Chinese interface draft

In the React/Tauri app, open Settings > Appearance > Interface language and choose 繁體中文（台灣）. The preference is stored locally as `artcraft.interfaceLanguage = zh-TW`; switching immediately updates subscribed chrome without remounting the editors. Taiwan/Hant browser locales select Traditional Chinese on first use. Explicit English remains English.

The editable pack is `frontend/libs/i18n/src/zh-TW.json`. It contains AI-assisted original translations of settings panes, navigation, tooltips and task-queue chrome. This is a partial draft pending native review: editor internals, dynamic server messages and other unported views still use English. User prompts, scene titles, API identifiers, saved settings values and document content are never translated.

`@storyteller/i18n` supplies `useTranslation()` for reactive labels and `translate(language, source)` for explicit lookups. Missing keys return the English source. Add new English keys and translations together, preserving interpolation tokens. The optional external maintenance tool can report missing keys while retaining existing Taiwan wording; it is not a build dependency.

Traditional Chinese CSS prefers installed Taiwan system fonts, normal heading spacing and readable HUD labels. It does not download fonts. The main Rust-native experiment under `artcraft-native` is separate and is not claimed as localized by this frontend patch.

Tests in `frontend/libs/i18n/src/locale.spec.tsx` cover locale tags, persistence, safe fallback and preservation of an unsaved input while switching language. Native package builds and installed-app verification are separate from these unit tests.
