# WaveSpeed release checks

Automated tests use temporary storage and loopback HTTP fixtures, not paid
generation. Before release, manually verify signed-out image/video generation,
restart during a download, Save As collisions, local deletion, account switching,
cloud import, and Seedance modes on supported desktop platforms.

The completion integration tests use Tauri's mock runtime, real temporary SQLite
storage, and local HTTP servers for both signed-out local results and signed-in
uploads. They exercise media validation, automatic downloads, verified-account
binding, task completion, notification, and checkpoint cleanup. Polling tests
assert persisted task states for completed, outputless, failed, missing, pending,
transient-error, and rate-limited predictions. These fixtures do not prove live
service behavior or replace desktop visual/contrast checks.

Real ArtCraft server deduplication has not been verified by local fixtures. The
ignored `live_artcraft_image_upload_idempotency_contract` test uploads a tiny PNG
twice with one key and checks that both responses return the same media token.
Run only with explicit approval and a dedicated test account using
`ARTCRAFT_LIVE_UPLOAD_TEST=1` and `ARTCRAFT_TEST_SESSION` in the environment. It
creates cloud media and does not prove video/legacy endpoint deduplication.

OS keychain migration tests use a mock credential store. Manually verify Keychain
on macOS, Credential Manager on Windows, and an unlocked Secret Service on Linux,
including missing/locked-store errors. No plaintext fallback is permitted.

Review regressions cover cached executable-filename rejection, pending-login
signed-out controls, image-reference limits after model/mode switches, and Draw
coordinate preservation. Gallery tests delay old user and session-scoped media
responses across account switches and logout, including stale success and error
responses, without blocking the new user's initial request.
