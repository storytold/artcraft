# Desktop session regression — September 27, 2026

The combined development launcher (`92e6f438c3`, following the performance
change `df707bf8e1`) moved Vite from `localhost:5173` to an available port on
`127.0.0.1`. The vendored HTTP plugin forwarded that webview Origin to the
production API. The API rejected it with **400: Origin is not allowed to make
this request**.

The native login bridge and credits commands use a different HTTP transport and
continued working. Consequently the login modal correctly recognized the native
session, but Accounts, Library, and page media requests failed. Accounts treated
the error as logged out; its Log In button rechecked the valid native session
and immediately closed the login modal again.

The fix extends the existing packaged-desktop Origin normalization to loopback
development origins, at any port, for HTTPS requests to `api.storyteller.ai` and
`api.fakeyou.com`. Other development request destinations and non-loopback
website origins retain their headers. Cookie handling and API authorization are
unchanged. A frontend reload alone cannot update this fix: Rust must rebuild.

## Observed native results

Checked in the real macOS Tauri dev app at `http://127.0.0.1:5193`, using its
existing session. Temporary probes were removed after verification. No cookies,
tokens, passwords, account identifiers, or media contents are recorded here.

| Check                          | Before                                | After                      |
|--------------------------------|---------------------------------------|----------------------------|
| Frontend HTTP `/v1/session`    | 400, Origin rejected                  | 200                        |
| Shared `UsersApi.GetSession()` | `success: false`                      | Success, logged in         |
| Native vs. frontend identity   | Frontend could not resolve an account | Same account               |
| Shared media API, page size 1  | Not measured separately               | Success, one item returned |

## Automated checks

From the repository root:

```sh
cargo test --offline -p tauri-plugin-http artcraft_origin --lib
./script/artcraft/unix_dev.sh
```

In a second terminal, substitute the URL printed by the launcher:

```sh
cd frontend
npm run test:desktop-session -- http://127.0.0.1:5193
```

The Rust tests cover the default port, alternate/collision ports, IPv4, IPv6,
localhost, packaged origins, duplicate headers, session-header preservation,
and destinations/origins that must remain unchanged.

The browser check uses the real frontend with an isolated Chrome profile and
mocked IPC. It verifies matching credits and Accounts state, a visible Library
image, media after opening the deferred image page, video/audio page rendering,
and logout followed by sign-in. It blocks remote browser traffic and never uses
your real account or native credentials. It requires installed Google Chrome.
It can also run against a locally served production frontend build.

These browser mocks cannot validate native transport or server CORS. The
performance fixture deliberately rejects HTTP requests and is **not** an
authentication acceptance test. Run the native check below when changing the
launcher, HTTP bridge, or authentication plumbing.

Validation on September 27: all 12 HTTP-plugin tests, 20 login-modal tests, and
10 app tests passed. The browser check passed against both the Vite dev server
and a fresh production build. To repeat the production check, serve a build in
one terminal, then pass its printed URL to `test:desktop-session` in another:

```sh
cd frontend/apps/artcraft
npm run build -- --outDir /tmp/artcraft-session-build
npm run preview -- --outDir /tmp/artcraft-session-build --host 127.0.0.1 --port 6215
```

## Repeat the real native check

1. Start the combined launcher, with an existing signed-in test session. Verify
   Accounts displays that account, My Library loads its media, and Create Image,
   Create Video, and Create Audio load their content.
2. Right-click inside the desktop webview, choose **Inspect Element**, and open
   **Console**. Run this read-only probe. It prints statuses/counts, not credentials
   or account/media contents:

```js
void (async () => {
  const invoke = window.__TAURI_INTERNALS__.invoke;
  const host = (await invoke("get_app_info_command")).payload.storyteller_host;
  const options = { method: "GET", credentials: "include" };
  const started = performance.now();
  const [native, response] = await Promise.all([
    invoke("storyteller_get_login_session_command"),
    window.FetchProxy(`${host}/v1/session`, { ...options }),
  ]);
  if (!response.ok) {
    console.log({ origin: location.origin, sessionStatus: response.status });
    return;
  }
  const session = await response.json();
  const result = {
    origin: location.origin,
    sessionStatus: response.status,
    nativeLoggedIn: !!native,
    frontendLoggedIn: session.logged_in,
    sameAccount: native?.user_token === session.user?.user_token,
    sessionElapsedMs: performance.now() - started,
  };
  if (session.logged_in && session.user) {
    const username = encodeURIComponent(session.user.username);
    const media = await window.FetchProxy(
      `${host}/v1/media_files/list/user/${username}?page_size=1`, { ...options },
    );
    result.mediaStatus = media.status;
    if (media.ok) result.mediaCount = (await media.json()).results?.length;
  }
  console.log(result);
})().catch((error) => console.error("Desktop session probe failed", String(error)));
```

3. Repeat with a changed port (`ARTCRAFT_DEV_PORT=6200`) and with the starting
   port occupied. For example, keep this listener running in another terminal
   before starting the launcher; stop it with Ctrl-C afterward:

```sh
node -e 'require("node:net").createServer().listen(5193, "127.0.0.1")'
```

The launcher should select a later port, and both session transports should
still agree. An empty account may legitimately return zero media; it should
still return HTTP 200. Verify a genuinely signed-out session shows the login
screen using the isolated browser check, or a disposable account/profile.
