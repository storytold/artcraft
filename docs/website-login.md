# Website login from the desktop app

The React login/signup dialog calls Tauri commands only, including its startup
session check and password forms. Website and QR actions appear only in login
mode. Tauri never connects to MySQL; the desktop uses Rust HTTP API bindings. Creating/polling login challenges and
verifying `/v1/session` use `artcraft_client::endpoints::users::login_challenges`.
The Rust command uses `AppEnvConfigs.storyteller_host` for every request, keeps the
private device token in native memory, and returns only a local challenge handle,
approval URL/code/deadline, status, and the verified user to JavaScript. The signed
session cookie never crosses IPC or gets written to JavaScript local storage.

After redemption, Rust verifies the signed session against the same API host,
installs the server's cookie into the native HTTP jar and credential manager, and
persists the jar. Closing the dialog removes the local handle; a cancellation
while HTTP is in flight prevents installing the late response. Retries retrieve
the same server session. Neither creation nor website approval pre-creates one.

## Session response compatibility

A server feature flag added after a desktop release must not prevent login. The
session decoder keeps known feature flags and ignores unknown flag names, such
as `use_qt` on older clients. Malformed flag values and required authentication
fields still fail validation. Tests cover a real Rust HTTP session response with
both known and future flags, followed by native cookie installation/persistence.
A late startup session check cannot reset an active or completed website login.

## Diagnosing 401 responses

`storyteller_activity_thread` reports errors from `/v1/analytics/active_user_v2`.
This is the background activity ping, not the login-challenge endpoint. It requires
a user session. An anonymous `visitor` cookie alone is now skipped. Expired or
revoked sessions can still produce a 401 and require signing in again.

Activity failures log the configured API origin (including port), endpoint, and
error. Native website-login requests/failures log origin, endpoint, and HTTP
status. Request bodies, device tokens, approval URLs, and signed cookies are not
logged by the new client, including at debug level.

## API environment

`~/Artcraft/settings/env_configs.json` controls the native API host:

```json
{"storyteller_host":"localhost","storyteller_port":12345}
```

Local mode uses `http://localhost:12345` and a local approval website at
`http://localhost:4201/login/desktop`. Run storyteller-web with its migrations
applied, and the services webapp with `USE_LOCAL_API=1`. The local website must
also use the local API. A challenge in a local database cannot be approved on the
production website, even when that browser already has a production session.

For the production API and production website, use `"storyteller_host":"production"`
(or omit the override), then restart ArtCraft. API host configuration is not
silently changed by login. Local and production approval URLs cannot be mixed.
Localhost development URLs are for the same computer; mobile QR testing needs
a shared/deployed environment.

## Tests

From the desktop repository:

```sh
SQLX_OFFLINE=true cargo test --offline -p artcraft --lib login_bridge_tests
cd frontend
npm exec vitest -- run --config libs/components/login-modal/vite.config.ts src/lib/DesktopLoginBridge.spec.tsx src/lib/login-modal.spec.tsx
```

Native tests use only ephemeral loopback HTTP servers and temporary cookie stores.
They exercise the real API bindings and the command implementation, including
cookie verification/persistence, rejection, expiry, retries, in-flight cancellation,
origin separation, no redirects, redacted errors, visitor-only telemetry, future
feature flags, malformed session data, and password login/signup/session checks.
UI tests prohibit JavaScript HTTP and runtime API imports. They verify the IPC
contract, native browser opening, QR/code display, status, backoff, cleanup,
login-only button placement, native password forms, and stale session responses.

The services repository also has real MySQL integration tests for approval,
redemption, rejection, concurrency, and downstream authentication, using isolated
local databases. No test contacts a production API or database.
