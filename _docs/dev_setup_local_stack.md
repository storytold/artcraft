# Local Dev Stack — Requirements & Bootstrap

How to run `storyteller-web` on your own machine against a local MySQL and
Redis — no shared dev database, no Docker, no admin rights. This is for **work
on the backend itself**.

> **Working on the frontend?** You probably want
> `frontend/apps/fake-storyteller-web` instead — an in-memory stand-in for this
> API that needs no database, no build, and no setup. Everything below is
> unnecessary for webapp work. Come back here when you need the real server.

These scripts install and supervise infrastructure. They change no application
behaviour, and nothing in them is compiled into any binary: the backend they
start is the same one that ships. Integrations they cannot provide locally
(object storage, generation providers, email) get placeholder credentials, so
the endpoints that use them fail when exercised. Swap in a real dev credential
for whichever one you're actually working on.

The automated path on **Windows** (primary platform, native — no WSL, no
Docker, no admin rights for the stack itself):

```powershell
.\script\bootstrap\windows\bootstrap_dev_stack.ps1   # one-time setup, idempotent, re-run anytime
.\script\bootstrap\windows\run_backend_dev.ps1       # terminal 1: API on http://localhost:12345
.\script\bootstrap\windows\seed_demo_user.ps1        # terminal 2: create demo login (localdev1 / localdev1pass)
$env:VITE_DEV_API_HOST = "http://localhost:12345"    # terminal 2: aim the webapp at your backend
cd frontend; npx nx dev artcraft-webapp              #             webapp on http://localhost:4201
.\script\bootstrap\windows\dev_stack_doctor.ps1      # health check, any time
.\script\bootstrap\windows\stop_dev_services.ps1     # stop MySQL/Redis when done
```

The equivalent on **Linux** (Ubuntu 22.04+ — native, WSL2, or CI):

```bash
./script/bootstrap/bootstrap_dev_stack.sh    # one-time setup, idempotent, re-run anytime
./script/bootstrap/run_backend_dev.sh        # terminal 1: API on http://localhost:12345
./script/bootstrap/seed_demo_user.sh         # terminal 2: create demo login (localdev1 / localdev1pass)
cd frontend && VITE_DEV_API_HOST=http://localhost:12345 npx nx dev artcraft-webapp   # terminal 2: webapp on :4201
./script/bootstrap/dev_stack_doctor.sh       # health check, any time
```

This document records the underlying requirements so the scripts aren't a
black box, and corrects some stale claims in older docs.

## Supported platforms

| Platform      | Status                                                                                                                                                                                                                                                                                 |
|---------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Windows 10/11 | Primary. `script/bootstrap/windows/*.ps1` run a **portable stack**: MySQL 8.4 (official zip) and Redis live under the gitignored `.devstack/` and run as plain user processes — no admin, no services, no WSL, no Docker. Build tools (cmake, perl, nasm, llvm) are offered via winget |
| Ubuntu 22.04+ | Supported by `script/bootstrap/*.sh` (native, WSL2, or CI runner/container); services via apt                                                                                                                                                                                          |
| macOS         | Not covered by the scripts; follow `_docs/dev_setup_server.md` manually                                                                                                                                                                                                                |

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

| Requirement       | Version / detail                                                                                                                                         | Needed for                                            |
|-------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| MySQL server      | 8.x series (9.x unsupported by tooling)                                                                                                                  | Backend boot (eager connect) + migrations             |
| Redis server      | any recent                                                                                                                                               | Backend boot (r2d2 pool connects eagerly)             |
| Rust (stable)     | no pinned MSRV; Docker builds use 1.93.0                                                                                                                 | Building `storyteller-web`, diesel_cli                |
| diesel_cli        | `cargo install diesel_cli --no-default-features --features mysql,sqlite`                                                                                 | Running the 281 migrations                            |
| Node.js           | 20+ (enforced by `script/common/frontend_preflight.sh`)                                                                                                  | Frontend (Nx 21 / Vite 6)                             |
| npm               | ships with Node; **pnpm must not be used**                                                                                                               | Frontend install (`frontend/package-lock.json`)       |
| System libs (apt) | build-essential, cmake, libssl-dev, libclang-dev, libfontconfig1-dev, fontconfig, perl, pkg-config, ffmpeg, libmysqlclient-dev, libsqlite3-dev, curl, jq | Compiling the workspace + diesel_cli; seeding scripts |
| Elasticsearch     | optional (7.x)                                                                                                                                           | Only 4 search endpoints; server boots without it      |
| Docker            | **not required** — no docker-compose exists                                                                                                              | —                                                     |

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

| Requirement                                                       | Behavior if missing                                                                                                                |
|-------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| MySQL reachable via `MYSQL_URL`                                   | Boot fails (sqlx pool connects eagerly; the DB must exist and be migrated — health-check and ban-poller threads query immediately) |
| Redis reachable via `REDIS_0_URL` (default `redis://localhost/0`) | Boot fails (r2d2 pool connects eagerly)                                                                                            |
| ~30 `get_env_string_required` vars present                        | Boot fails on the first absent var                                                                                                 |

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
  placeholder keys the provider call fails and the submit returns HTTP 500
  *after* billing the wallet (the image pipeline has no refund; video refunds
  only Kinovi). Only the legacy polling providers (GmiCloud, Grok, Kinovi
  orders, WorldLabs) are worker-driven.
- **Uploads fail hard with placeholder S3 creds** — every media upload endpoint
  uploads to the bucket *before* inserting the DB row, and `rust-s3` is built
  with `fail-on-err`.

### What does and doesn't work locally

| Area                                         | Works with placeholder credentials? |
|----------------------------------------------|-------------------------------------|
| Login, sessions, account, profile            | Yes                                 |
| Wallets, credits, billing reads              | Yes                                 |
| Folders, tags, prompts, characters, projects | Yes                                 |
| Media listing (rows)                         | Yes — but the images 404, see below |
| Media uploads                                | No — needs real R2/S3 credentials   |
| Image/video/mesh/splat generation            | No — needs a real provider key      |
| Transactional email                          | No — needs a real Resend key        |
| Elasticsearch-backed search                  | No — needs a local ES + reindex     |

The rows-but-no-images case is the one that surprises people: `media_files`
rows carry a bucket path, and the URL the API builds from it points at the
shared R2 bucket, which does not have your local objects. Put real dev R2
credentials in the secrets file if you need media to render, or use
`fake-storyteller-web`, which serves its own bytes.

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
- Demo gallery: **not seeded**. Media rows without reachable bytes render as
  broken tiles, so seeding them locally would be worse than an empty library.
  Use `fake-storyteller-web` for a populated one.

## Frontend: `artcraft-webapp`

- Nx workspace at repo-root `frontend/` (npm workspaces; `npm install` from
  `frontend/`). The FontAwesome Pro registry token is committed in
  `frontend/.npmrc` — no manual auth step.
- Serve: `npx nx dev artcraft-webapp` → `http://localhost:4201`. No lib
  pre-build is needed in dev (libs resolve to TS source via the
  `"development"` export condition); production `nx build` does need lib
  builds.
- **By default the dev webapp targets production.** `src/main.tsx` points the
  API host at the Vite dev origin, and Vite proxies `/v1` to
  `https://api.storyteller.ai`. The adjacent `setDevelopment()` call — which
  would point it at `localhost:12345` — is commented out. To aim the webapp at
  your local backend, set `VITE_DEV_API_HOST=http://localhost:12345` before
  `nx dev` (that override ships with the `fake-storyteller-web` change; until
  it lands, uncomment `setDevelopment()` locally instead).
- Optional: `VITE_GOOGLE_CLIENT_ID` in `frontend/apps/artcraft-webapp/.env`
  enables the Google SSO button; email/password login needs nothing.
- Other dev ports if you run more apps: website 4200, dashboard 4202 (separate
  pnpm app, excluded from Nx), video-info-website 4250, genhub 4300, Tauri
  frontend 5173.

## What still touches production (known, deliberate seams)

The bootstrap changes no runtime behaviour, so these remain open. Each is
closed by supplying a real credential, not by a code path:

| Seam                            | Today                                                                                                                                                          |
|---------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Media/CDN URLs in API responses | The compiled-in `cdn_link.rs` constants point at the public `pub-….r2.dev` bucket, so a locally-created row's media URL resolves to an object that isn't there |
| Media uploads                   | 500 with placeholder credentials; supply real dev R2/S3 keys to exercise them                                                                                  |
| Generation                      | 500 with placeholder keys, *after* the wallet is billed; supply a real key for the provider under test                                                         |
| Vite `/v1` proxy in webapp      | Targets `https://api.storyteller.ai`, so a dev webapp with no host override reads and writes production                                                        |
| Elasticsearch-backed search     | `search_featured` / `search_session` media files, `weights/search`, legacy `tts/search` fail without a local ES + `elasticsearch-cli` reindex (optional)       |

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
- `GET /_status` returns 200, and MySQL has the full migration set applied.
- With `VITE_DEV_API_HOST` pointed at `localhost:12345`, the webapp logs in as
  `localdev1` and shows its credits in the top bar. The library is empty and
  generation 500s — both expected, see the table above.

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
