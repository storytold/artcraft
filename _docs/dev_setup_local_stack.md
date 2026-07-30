# Local Dev Stack — Requirements & Bootstrap

How to run the full ArtCraft dev stack **entirely locally** — the
`storyteller-web` backend plus the `artcraft-webapp` frontend — with no traffic
to production servers. Scope: webapp-first; the Tauri desktop app is a later
phase.

The automated path on **Windows** (primary platform, native — no WSL, no
Docker, no admin rights for the stack itself):

```powershell
.\script\bootstrap\windows\bootstrap_dev_stack.ps1   # one-time setup, idempotent, re-run anytime
.\script\bootstrap\windows\run_backend_dev.ps1       # terminal 1: API on http://localhost:12345
.\script\bootstrap\windows\seed_demo_user.ps1        # terminal 2: create demo login (localdev1 / localdev1pass)
cd frontend; npx nx dev artcraft-webapp              # terminal 2: webapp on http://localhost:4201
.\script\bootstrap\windows\dev_stack_doctor.ps1      # health check, any time
.\script\bootstrap\windows\stop_dev_services.ps1     # stop MySQL/Redis when done
```

The equivalent on **Linux** (Ubuntu 22.04+ — native, WSL2, or CI):

```bash
./script/bootstrap/bootstrap_dev_stack.sh    # one-time setup, idempotent, re-run anytime
./script/bootstrap/run_backend_dev.sh        # terminal 1: API on http://localhost:12345
./script/bootstrap/seed_demo_user.sh         # terminal 2: create demo login (localdev1 / localdev1pass)
cd frontend && npx nx dev artcraft-webapp    # terminal 2: webapp on http://localhost:4201
./script/bootstrap/dev_stack_doctor.sh       # health check, any time
```

This document records the underlying requirements so the scripts aren't a
black box, and corrects some stale claims in older docs.

## Supported platforms

| Platform            | Status                                                                    |
|---------------------|---------------------------------------------------------------------------|
| Windows 10/11       | Primary. `script/bootstrap/windows/*.ps1` run a **portable stack**: MySQL 8.4 (official zip) and Redis live under the gitignored `.devstack/` and run as plain user processes — no admin, no services, no WSL, no Docker. Build tools (cmake, perl, nasm, llvm) are offered via winget |
| Ubuntu 22.04+       | Supported by `script/bootstrap/*.sh` (native, WSL2, or CI runner/container); services via apt |
| macOS               | Not covered by the scripts; follow `_docs/dev_setup_server.md` manually   |

### Windows specifics

- Everything stateful lives in `.devstack/` (gitignored): `mysql/` (extracted
  zip), `mysql-data/`, `redis/`, `logs/`, `pids/`, `downloads/` (cached zips),
  `my.ini`. Delete the directory to fully reset; re-run bootstrap to rebuild.
- Pinned services: MySQL **8.4.11** from `cdn.mysql.com` (the 8.x series is
  required; only some patch versions exist on the CDN) and Redis **5.0.14.1**
  (tporadowski build — old but sufficient for the backend's keepalive/TTL/
  rate-limit usage; override `REDIS_ZIP_URL` to use Memurai/Garnet instead).
- The portable MySQL root user has **no password** (`--initialize-insecure`) —
  local dev only, bound to 127.0.0.1.
- diesel-cli is compiled against the portable MySQL's own client library
  (`MYSQLCLIENT_LIB_DIR`/`MYSQLCLIENT_VERSION`); `libmysql.dll` must be on
  `PATH` to *run* it — the scripts handle both.
- Compiling the backend needs cmake, Strawberry Perl, NASM, and LLVM/libclang
  (the `wreq` HTTP client builds BoringSSL, and `aws-lc-sys`/`ring` need
  NASM/clang on MSVC). The bootstrap checks and offers winget installs.
- The generated secrets file additionally sets `TEMP_DIR` (the upload temp-dir
  helper defaults to `/tmp`, which doesn't exist on Windows).

## Requirements matrix

| Requirement       | Version / detail                                | Needed for                                        |
|-------------------|--------------------------------------------------|---------------------------------------------------|
| MySQL server      | 8.x series (9.x unsupported by tooling)          | Backend boot (eager connect) + migrations         |
| Redis server      | any recent                                       | Backend boot (r2d2 pool connects eagerly)         |
| Rust (stable)     | no pinned MSRV; Docker builds use 1.93.0         | Building `storyteller-web`, diesel_cli            |
| diesel_cli        | `cargo install diesel_cli --no-default-features --features mysql,sqlite` | Running the 281 migrations  |
| Node.js           | 20+ (enforced by `script/common/frontend_preflight.sh`) | Frontend (Nx 21 / Vite 6)                  |
| npm               | ships with Node; **pnpm must not be used**       | Frontend install (`frontend/package-lock.json`)   |
| System libs (apt) | build-essential, cmake, libssl-dev, libclang-dev, libfontconfig1-dev, fontconfig, perl, pkg-config, ffmpeg, libmysqlclient-dev, libsqlite3-dev, curl, jq | Compiling the workspace + diesel_cli; seeding scripts |
| Elasticsearch     | optional (7.x)                                   | Only 4 search endpoints; server boots without it  |
| Docker            | **not required** — no docker-compose exists      | —                                                 |

Database identity (used consistently by docs, `.env`, and defaults):
database `storyteller`, user `storyteller`, password `password`, host
`localhost`.

## Backend: what `storyteller-web` needs to boot

Binary: `storyteller-web` in `crates/service/web/storyteller_web`
(binaries: `storyteller-web`, `docs` — Swagger UI on :8989, `docs-cli` — emits
`api.json`). Binds `0.0.0.0:12345` (`BIND_ADDRESS`), plain HTTP.
**Run it from the repo root** — the config search path and `includes/` paths
are cwd-relative.

### Config loading (corrected facts)

- Mode is selected by the `SERVER_ENVIRONMENT` **process env var only**
  (default: Development). Setting it inside an env file does nothing — it is
  read before any file loads.
- In Development mode, files load from
  `crates/service/web/storyteller_web/config/` in this order:
  `storyteller-web.common.env` → `storyteller-web.development.env` →
  `storyteller-web.development-secrets.env` (gitignored; the bootstrap
  generates it).
- **Precedence is first-value-wins** (dotenv never overrides an existing key):
  real process env > common.env > development.env > development-secrets.env.
  The secrets file therefore cannot override anything already set in
  `development.env`.
- The repo-root `.env` is **NOT loaded by the server** (it passes
  `ignore_legacy_dot_env_file: true`). Root `.env`'s `DATABASE_URL` feeds
  diesel-cli/sqlx-cli only; the server reads **`MYSQL_URL`** (default
  `mysql://storyteller:password@localhost/storyteller`).

### Hard requirements at boot

| Requirement                      | Behavior if missing                                    |
|----------------------------------|--------------------------------------------------------|
| MySQL reachable via `MYSQL_URL`  | Boot fails (sqlx pool connects eagerly; the DB must exist and be migrated — health-check and ban-poller threads query immediately) |
| Redis reachable via `REDIS_0_URL` (default `redis://localhost/0`) | Boot fails (r2d2 pool connects eagerly) |
| ~30 `get_env_string_required` vars present | Boot fails on the first absent var          |

Of the required-present vars, 19 are supplied by **no** checked-in file and
live in the generated secrets file: `ACCESS_KEY`, `SECRET_KEY`, `REGION_NAME`,
`W2L_PRIVATE_DOWNLOAD_BUCKET_NAME`, `W2L_PUBLIC_DOWNLOAD_BUCKET_NAME`,
`RESEND_API_KEY`, `FAL_API_KEY`, `GMICLOUD_API_KEY`, `GROK_API_KEY`,
`BEEBLE_API_KEY`, `OPENAI_API_KEY`, `WORLDLABS_API_KEY`,
`SEEDANCE2PRO_COOKIES`, `SEEDANCE2PRO_WHITELIST_COOKIES`,
`SEEDANCE2PRO_BYTEPLUS_ULTRA_COOKIES`, `STRIPE_FAKEYOU_ACCOUNT_ID`,
`STRIPE_ARTCRAFT_ACCOUNT_ID`, `STRIPE_ARTCRAFT_SECRET_KEY`,
`STRIPE_ARTCRAFT_SECRET_WEBHOOK_KEY`.

**Placeholder values are safe at boot**: none of these services is contacted
at boot (clients are constructed offline; Elasticsearch, S3/R2, Stripe,
Resend, and Google-cert fetches are all lazy). But two earlier claims here
were wrong and are corrected:

- **The omni_gen endpoints call providers synchronously in the HTTP handler**
  (`/v1/omni_gen/generate/{image,video}` — the path the webapp uses). With
  dummy keys the provider call fails and the submit returns HTTP 500 *after*
  billing the wallet (the image pipeline has no refund; video refunds only
  Kinovi). Only the legacy polling providers (GmiCloud, Grok, Kinovi orders,
  WorldLabs) are worker-driven. `DEV_FAKE_GENERATION` (below) exists so local
  submits never reach a real provider.
- **Uploads fail hard with dummy S3 creds**: every media upload endpoint
  uploads to the bucket *before* inserting the DB row, and `rust-s3` is built
  with `fail-on-err` — so the first upload returns HTTP 500. (Known seam;
  uploads are not yet part of the local stack.)

### Fully-local generation and media (`DEV_FAKE_GENERATION`)

The generated secrets file enables three development-only settings (appended
automatically on bootstrap re-runs for older stacks):

| Env var               | Effect                                                                    |
|-----------------------|----------------------------------------------------------------------------|
| `DEV_FAKE_GENERATION` | omni_gen image/video submits skip the external provider and insert a normal **pending** job with a `fake_…` external id. A resolver thread inside `storyteller-web` completes each one after `DEV_FAKE_GENERATION_RESOLVE_SECS` (default 6s, poll every `DEV_FAKE_GENERATION_POLL_SECS`, default 2s) with a placeholder result copied from `test_data/`. Prompts containing `simulate_artcraft_failure` (or `test_artcraft_failure`) fail instead, optionally with a `FrontendFailureCategory` word in the prompt (e.g. `simulate_artcraft_failure face_not_detected`). Hard-disabled outside `SERVER_ENVIRONMENT=Development` |
| `CDN_BASE_URL`        | Overrides the compiled-in CDN hosts in `cdn_link.rs` for all media URLs in API responses. Must be scheme+host only (no path) — set to `http://localhost:12345` so media resolves against the backend itself |
| `LOCAL_MEDIA_ROOT`    | Directory the backend serves at `/media` (dev-only actix-files mount), mirroring the public bucket layout: object path `/media/{…}` lives at `{LOCAL_MEDIA_ROOT}/media/{…}`. The bootstrap points it at `.devstack/media/` |

With all three set, the full loop works offline: submit → pending job →
polling (`/v1/jobs/session`) → success with a `media_files` row whose URL the
backend itself serves — or a failed job with a real failure category. Credits
are genuinely deducted from the seeded wallet (no refund on fake results —
the demo wallet is large enough not to care).

### Auth on localhost

- `POST /v1/login` takes `{"username_or_email": "...", "password": "..."}`;
  success returns `{"success": true, "signed_session": "<jwt>"}` **and** a
  `session` cookie.
- With the checked-in dev config (`COOKIE_DOMAIN=.jungle.horse`), the session
  cookie is issued non-Secure and host-only (the Domain attribute is never
  set), so plain-HTTP localhost login works as-is. The frontend additionally
  stores `signed_session` in localStorage and sends it as a `session` header.
- Dev-mode CORS allows any `localhost`/`127.0.0.1` origin on any port, with
  credentials.
- Health endpoint for scripts/CI: `GET /_status`.

### Build

- Compile with `SQLX_OFFLINE=true` (uses the checked-in `.sqlx/` cache; 483
  queries). Without it, the sqlx macros open a **live DB connection at compile
  time** using `DATABASE_URL` from the root `.env`. `SQLX_OFFLINE` has no
  runtime effect — ignore older notes saying not to set it when running.
- First build takes several minutes; the crate has ~370 pre-existing warnings.

## Database: migrations and seed data

- 281 Diesel migrations in `_database/sql/migrations/` (`diesel.toml` at repo
  root points there). Run from the repo root: `diesel migration run`.
  `"Encountered unknown type for Mysql: enum"` warnings are harmless.
  `migrations_squashed/` is documentation only — not executable.
- Seed data: `_database/sql/seed/sql/system_roles.sql` (roles `user`, `mod`,
  `admin`) and `user_badges.sql`. **The `user` role is mandatory** — account
  creation hardcodes `user_role_slug='user'`. The legacy wrapper
  `bootstrap_inserts_roles_etc.sh` must run with cwd `_database/sql/` and is
  not idempotent; the bootstrap script applies the same SQL files with
  idempotency guards instead.
- Demo user: created through **`POST /v1/create_account`** (no captcha, no
  invite code, no email-verification gate; password just needs 6+ chars). This
  exercises the real signup path instead of hand-rolled SQL. Gotcha: usernames
  like `demo`, `admin`, `test`, `dev`, `artcraft` are reserved
  (`includes/binary_includes/usernames/reserved_usernames.txt`) — the default
  demo user is `localdev1`. The Rust seeder
  (`cargo run --bin dev-database-seed`) exists but hard-requires a
  `.env-secrets` file and also seeds model weights, so the HTTP path is
  preferred.
- Demo credits: signup creates **no wallet**, and the webapp gates the
  generate button on wallet balance — so `seed_demo_user` also seeds an
  `artcraft`-namespace wallet with `DEMO_CREDITS` (default 100,000) banked
  credits, plus matching ledger rows. Idempotent: re-runs top the balance
  back up to `DEMO_CREDITS` but never lower it. (Raw SQL, because the only
  real credit-granting paths are Stripe webhooks and moderator tooling.)
- Demo gallery: `seed_demo_user` also seeds a handful of `media_files` image
  rows (from `test_data/image/`) with their objects copied under
  `.devstack/media/`, so the library isn't empty on a fresh stack. Rows mirror
  what a real image upload writes (`media_class='image'` matters — the
  library filters on it, and the column default `'unknown'` is invisible in
  every tab).

## Frontend: `artcraft-webapp`

- Nx workspace at repo-root `frontend/` (npm workspaces; `npm install` from
  `frontend/`). The FontAwesome Pro registry token is committed in
  `frontend/.npmrc` — no manual auth step.
- Serve: `npx nx dev artcraft-webapp` → `http://localhost:4201`. No lib
  pre-build is needed in dev (libs resolve to TS source via the
  `"development"` export condition); production `nx build` does need lib
  builds.
- **In dev the webapp already targets the local backend**: `src/main.tsx`
  calls `StorytellerApiHostStore.setDevelopment()` under
  `import.meta.env.DEV`, pointing all API traffic at
  `http://localhost:12345`. (The adjacent comment claiming this is disabled is
  stale — the call is live, and it bypasses the Vite `/v1` →
  `api.storyteller.ai` proxy.) So: local backend running → fully local stack;
  local backend **not** running → dev webapp is broken, not silently on prod.
- Optional: `VITE_GOOGLE_CLIENT_ID` in `frontend/apps/artcraft-webapp/.env`
  enables the Google SSO button; email/password login needs nothing.
- Other dev ports if you run more apps: website 4200, dashboard 4202 (separate
  pnpm app, excluded from Nx), video-info-website 4250, genhub 4300, Tauri
  frontend 5173.

## What still touches production (known, deliberate seams)

Cleaning these up is the next phase of the infra work; the bootstrap does not
change runtime behavior:

| Seam                                          | Today                                                        |
|-----------------------------------------------|--------------------------------------------------------------|
| Media/CDN URLs in API responses               | **Closed** when `CDN_BASE_URL` + `LOCAL_MEDIA_ROOT` are set (the bootstrap default): media URLs point at the backend's own `/media` mount. Unset, the compiled-in `cdn_link.rs` constants still point at the public `pub-….r2.dev` bucket |
| Media uploads                                 | Upload endpoints push to R2/S3 *before* the DB insert and `rust-s3` is `fail-on-err` — with dummy creds every upload endpoint returns HTTP 500. A local S3 (`S3_COMPATIBLE_ENDPOINT_URL` → MinIO) or a filesystem storage mode is the missing piece |
| Vite `/v1` proxy in webapp/website            | Hardcoded `https://api.storyteller.ai` (bypassed in dev by `setDevelopment()`, but still the fallback path) |
| `SegmentationApi`, `GetCdnOrigin`, `API_TARGETS` | Hardcoded off-store production hosts (`GetCdnOrigin`/`Api.ts` still hardcode `cdn-2.fakeyou.com` for pagescene/moodboard surfaces, independent of the backend's `CDN_BASE_URL`) |
| Elasticsearch-backed search                   | `search_featured` / `search_session` media files, `weights/search`, legacy `tts/search` fail without a local ES + `elasticsearch-cli` reindex (optional) |

## CI usage

The same bootstrap works on a fresh Ubuntu runner/container:

```bash
export MYSQL_ROOT_PASSWORD=root   # GitHub Actions' preinstalled MySQL uses password auth
./script/bootstrap/bootstrap_dev_stack.sh --yes
./script/bootstrap/run_backend_dev.sh &
./script/bootstrap/seed_demo_user.sh          # waits for /_status
./script/bootstrap/dev_stack_doctor.sh
```

`--yes` answers all prompts; `--skip-frontend` / `--skip-rust-build` /
`--skip-packages` slice the work for focused jobs.

## Verification checklist

- `./script/bootstrap/dev_stack_doctor.sh` exits 0 with no FAILs.
- `POST /v1/login` with the demo user returns `success: true` plus a
  `signed_session` (done automatically by `seed_demo_user.sh`).
- Webapp at `http://localhost:4201` can log in as `localdev1`, has credits in
  the top bar, and sees the seeded images in the library.
- A generation submit returns `{"success": true, "inference_job_token": …}`,
  shows as pending for a few seconds, then completes with a placeholder
  result (`DEV_FAKE_GENERATION`) — no external provider is contacted. A
  prompt containing `simulate_artcraft_failure` fails with a real error
  toast/category instead.
- Nothing hits `api.storyteller.ai` or the r2.dev CDN during the above
  (verify in the browser network tab — media URLs should point at
  `http://localhost:12345/media/…`).

## Corrections to older docs

- `crates/service/web/storyteller_web/CLAUDE.md`: the repo-root `.env` is
  *not* auto-loaded by the server, and `SQLX_OFFLINE=true` is fine (and
  recommended) when running — it only affects compile-time query checking.
- `_docs/dev_setup_server.md`: `./script/dev_mysql_connect.sh` doesn't exist —
  it's `./script/dev_database_connect.sh`.
- `diesel.toml`'s comment about needing an unreleased diesel CLI is stale —
  any current `diesel_cli` works.
- `TESTING_INFRA_HANDOFF.md` (untracked): the server env var is `MYSQL_URL`,
  not `DATABASE_URL`; migration count is 281; crate path is
  `crates/service/web/storyteller_web`.
