# Changelog

## \[2.4.3]

- [`37c0477a`](https://github.com/tauri-apps/plugins-workspace/commit/37c0477afe926d326573f1827045875ce8bf8187) ([#2561](https://github.com/tauri-apps/plugins-workspace/pull/2561)) Add `zstd` cargo feature flag to enable `reqwest/zstd` flag.
- [`9ebbfb2e`](https://github.com/tauri-apps/plugins-workspace/commit/9ebbfb2e3ccef8e0f277a0c02fe6b399b41feeb6) ([#1978](https://github.com/tauri-apps/plugins-workspace/pull/1978)) Persist cookies to disk and load it on next app start.

### Dependencies

- Upgraded to `fs-js@2.2.1`

## \[2.4.2]

- [`a15eedf3`](https://github.com/tauri-apps/plugins-workspace/commit/a15eedf37854344f7ffbcb0d373d848563817011) ([#2535](https://github.com/tauri-apps/plugins-workspace/pull/2535) by [@amrbashir](https://github.com/tauri-apps/plugins-workspace/../../amrbashir)) Fix `fetch` occasionally throwing an error due to trying to close the underline stream twice.

## \[2.4.1]

- [`d3183aa9`](https://github.com/tauri-apps/plugins-workspace/commit/d3183aa99da7ca67e627394132ddeb3b85ccef06) ([#2522](https://github.com/tauri-apps/plugins-workspace/pull/2522) by [@adrieljss](https://github.com/tauri-apps/plugins-workspace/../../adrieljss)) Fix `fetch` blocking until the whole response is read even if it was a streaming response.

## \[2.4.0]

- [`cb38f54f`](https://github.com/tauri-apps/plugins-workspace/commit/cb38f54f4a4ef30995283cd82166c62da17bac44) ([#2479](https://github.com/tauri-apps/plugins-workspace/pull/2479) by [@adrieljss](https://github.com/tauri-apps/plugins-workspace/../../adrieljss)) Add stream support for HTTP stream responses.

## \[2.3.0]

- [`10513649`](https://github.com/tauri-apps/plugins-workspace/commit/105136494c5a5bf4b1f1cc06cc71815412d17ec8) ([#2204](https://github.com/tauri-apps/plugins-workspace/pull/2204) by [@RickeyWard](https://github.com/tauri-apps/plugins-workspace/../../RickeyWard)) Add `dangerous-settings` feature flag and new JS `danger` option to disable tls hostname/certificate validation.

## \[2.2.0]

- [`3a79266b`](https://github.com/tauri-apps/plugins-workspace/commit/3a79266b8cf96a55b1ae6339d725567d45a44b1d) ([#2173](https://github.com/tauri-apps/plugins-workspace/pull/2173) by [@FabianLars](https://github.com/tauri-apps/plugins-workspace/../../FabianLars)) Bumped all plugins to `v2.2.0`. From now, the versions for the Rust and JavaScript packages of each plugin will be in sync with each other.

### Dependencies

- Upgraded to `fs@2.2.0`

## \[2.0.2]

### Dependencies

- Upgraded to `fs-js@2.0.4`

## \[2.0.4]

- [`a3b553dd`](https://github.com/tauri-apps/plugins-workspace/commit/a3b553ddb403771aa699362c4e69a064b7731da5) ([#2079](https://github.com/tauri-apps/plugins-workspace/pull/2079) by [@amrbashir](https://github.com/tauri-apps/plugins-workspace/../../amrbashir)) Add tracing logs for requestes and responses behind `tracing` feature flag.

### Dependencies

- Upgraded to `fs@2.1.0`

## \[2.0.3]

### Dependencies

- Upgraded to `fs@2.0.3`

## \[2.0.1]

- [`cfd48b3b`](https://github.com/tauri-apps/plugins-workspace/commit/cfd48b3b2ec0fccfc162197518694ed59ceda22c) ([#1941](https://github.com/tauri-apps/plugins-workspace/pull/1941) by [@Nipsuli](https://github.com/tauri-apps/plugins-workspace/../../Nipsuli)) Allow skipping sending `Origin` header in HTTP requests by setting `Origin` header to an empty string when calling `fetch`.
- [`9b2840db`](https://github.com/tauri-apps/plugins-workspace/commit/9b2840db9464cf08db75806270e4441f0af81e5d) ([#1884](https://github.com/tauri-apps/plugins-workspace/pull/1884) by [@amrbashir](https://github.com/tauri-apps/plugins-workspace/../../amrbashir)) Retain headers order.

## \[2.0.1]

- [`a1a82208`](https://github.com/tauri-apps/plugins-workspace/commit/a1a82208ed4ab87f83310be0dc95428aec9ab241) ([#1873](https://github.com/tauri-apps/plugins-workspace/pull/1873) by [@lucasfernog](https://github.com/tauri-apps/plugins-workspace/../../lucasfernog)) Downgrade MSRV to 1.77.2 to support Windows 7.

### Dependencies

- Upgraded to `fs@2.0.1`

## \[2.0.0]

- [`e2c4dfb6`](https://github.com/tauri-apps/plugins-workspace/commit/e2c4dfb6af43e5dd8d9ceba232c315f5febd55c1) Update to tauri v2 stable release.

### Dependencies

- Upgraded to `fs@2.0.0`

## \[2.0.0-rc.6]

### Dependencies

- Upgraded to `fs@2.0.0-rc.6`

## \[2.0.0-rc.5]

### Dependencies

- Upgraded to `fs@2.0.0-rc.5`

## \[2.0.0-rc.4]

### Dependencies

- Upgraded to `fs@2.0.0-rc.4`

## \[2.0.0-rc.3]

### Dependencies

- Upgraded to `fs@2.0.0-rc.3`

## \[2.0.0-rc.2]

### Dependencies

- Upgraded to `fs@2.0.0-rc.2`

## \[2.0.0-rc.2]

- [`e2e97db5`](https://github.com/tauri-apps/plugins-workspace/commit/e2e97db51983267f5be84d4f6f0278d58834d1f5) ([#1701](https://github.com/tauri-apps/plugins-workspace/pull/1701) by [@lucasfernog](https://github.com/tauri-apps/plugins-workspace/../../lucasfernog)) Update to tauri 2.0.0-rc.8

## \[2.0.0-rc.1]

- [`84f8bd5e`](https://github.com/tauri-apps/plugins-workspace/commit/84f8bd5e1ef22e664267380b5bbf756ebc5389c3) ([#1662](https://github.com/tauri-apps/plugins-workspace/pull/1662) by [@twlite](https://github.com/tauri-apps/plugins-workspace/../../twlite)) Fixed an issue with abort signal not aborting the fetch request.

## \[2.0.0-rc.0]

- [`9887d1`](https://github.com/tauri-apps/plugins-workspace/commit/9887d14bd0e971c4c0f5c1188fc4005d3fc2e29e) Update to tauri RC.

### Dependencies

- Upgraded to `fs@2.0.0-rc.0`

## \[2.0.0-beta.9]

- [`99d6ac0f`](https://github.com/tauri-apps/plugins-workspace/commit/99d6ac0f9506a6a4a1aa59c728157190a7441af6) ([#1606](https://github.com/tauri-apps/plugins-workspace/pull/1606) by [@FabianLars](https://github.com/tauri-apps/plugins-workspace/../../FabianLars)) The JS packages now specify the *minimum* `@tauri-apps/api` version instead of a single exact version.
- [`6de87966`](https://github.com/tauri-apps/plugins-workspace/commit/6de87966ecc00ad9d91c25be452f1f46bd2b7e1f) ([#1597](https://github.com/tauri-apps/plugins-workspace/pull/1597) by [@Legend-Master](https://github.com/tauri-apps/plugins-workspace/../../Legend-Master)) Update to tauri beta.25.

## \[2.0.0-beta.8]

- [`ac9a25cc`](https://github.com/tauri-apps/plugins-workspace/commit/ac9a25cc12ee2b325f00212ba74316da3369bde5) ([#1395](https://github.com/tauri-apps/plugins-workspace/pull/1395) by [@amrbashir](https://github.com/tauri-apps/plugins-workspace/../../amrbashir)) Fix cancelling requests using `AbortSignal`.
- [`a6654932`](https://github.com/tauri-apps/plugins-workspace/commit/a66549329c60dea35e3a06a38c357e368c9053a1) ([#1526](https://github.com/tauri-apps/plugins-workspace/pull/1526) by [@amrbashir](https://github.com/tauri-apps/plugins-workspace/../../amrbashir)) Fix missing `Set-Cookie` headers in the response which meant `request.headers.getSetCookie()` always returned empty array.
- [`22a17980`](https://github.com/tauri-apps/plugins-workspace/commit/22a17980ff4f6f8c40adb1b8f4ffc6dae2fe7e30) ([#1537](https://github.com/tauri-apps/plugins-workspace/pull/1537) by [@lucasfernog](https://github.com/tauri-apps/plugins-workspace/../../lucasfernog)) Update to tauri beta.24.

## \[2.0.0-beta.7]

- [`76daee7a`](https://github.com/tauri-apps/plugins-workspace/commit/76daee7aafece34de3092c86e531cf9eb1138989) ([#1512](https://github.com/tauri-apps/plugins-workspace/pull/1512) by [@renovate](https://github.com/tauri-apps/plugins-workspace/../../renovate)) Update to tauri beta.23.

## \[2.0.0-beta.6]

- [`0f739dbc`](https://github.com/tauri-apps/plugins-workspace/commit/0f739dbc483a1f091977cbe575c3862fd39f8cf1) ([#1392](https://github.com/tauri-apps/plugins-workspace/pull/1392) by [@amrbashir](https://github.com/tauri-apps/plugins-workspace/../../amrbashir)) Allow setting `Origin` header when `unsafe-headers` feature flag is active.

## \[2.0.0-beta.5]

- [`9013854f`](https://github.com/tauri-apps/plugins-workspace/commit/9013854f42a49a230b9dbb9d02774765528a923f)([#1382](https://github.com/tauri-apps/plugins-workspace/pull/1382)) Update to tauri beta.22.

## \[2.0.0-beta.4]

- [`9d7ae45b`](https://github.com/tauri-apps/plugins-workspace/commit/9d7ae45b0edf9b22c73e7d7c413a784bb35c3d77)([#1354](https://github.com/tauri-apps/plugins-workspace/pull/1354)) Include headers created by browser if not declared by user, which fixes missing headers like `Content-Type` when using `FormData`.
- [`430bd6f4`](https://github.com/tauri-apps/plugins-workspace/commit/430bd6f4f379bee5d232ae6b098ae131db7f178a)([#1363](https://github.com/tauri-apps/plugins-workspace/pull/1363)) Update to tauri beta.20.

## \[2.0.0-beta.3]

- [`bd1ed590`](https://github.com/tauri-apps/plugins-workspace/commit/bd1ed5903ffcce5500310dac1e59e8c67674ef1e)([#1237](https://github.com/tauri-apps/plugins-workspace/pull/1237)) Update to tauri beta.17.

## \[2.0.0-beta.6]

### Dependencies

- Upgraded to `fs@2.0.0-beta.6`

## \[2.0.0-beta.5]

- [`500ff10`](https://github.com/tauri-apps/plugins-workspace/commit/500ff10fbd89fdfc73caf9d153029dad567b4ff1)([#1166](https://github.com/tauri-apps/plugins-workspace/pull/1166)) **Breaking change:** Removed the `default-tls` feature flag. The `rustls-tls`, `http2`, `macos-system-configuration`, and `charset` feature flags are now enabled by default.
- [`e3d41f4`](https://github.com/tauri-apps/plugins-workspace/commit/e3d41f4011bd3ea3ce281bb38bbe31d3709f8e0f)([#1191](https://github.com/tauri-apps/plugins-workspace/pull/1191)) Internally use the webview scoped resources table instead of the app one, so other webviews can't access other webviews resources.
- [`7e2fcc5`](https://github.com/tauri-apps/plugins-workspace/commit/7e2fcc5e74df7c3c718e40f75bfb0eafc7d69d8d)([#1146](https://github.com/tauri-apps/plugins-workspace/pull/1146)) Update dependencies to align with tauri 2.0.0-beta.14.
- [`e3d41f4`](https://github.com/tauri-apps/plugins-workspace/commit/e3d41f4011bd3ea3ce281bb38bbe31d3709f8e0f)([#1191](https://github.com/tauri-apps/plugins-workspace/pull/1191)) Update for tauri 2.0.0-beta.15.

### Dependencies

- Upgraded to `fs@2.0.0-beta.5`

## \[2.0.0-beta.4]

### Dependencies

- Upgraded to `fs@2.0.0-beta.4`

## \[2.0.0-beta.3]

- [`c873e4d`](https://github.com/tauri-apps/plugins-workspace/commit/c873e4d6c74e759742f7c9a88e35cff10a75122a)([#1059](https://github.com/tauri-apps/plugins-workspace/pull/1059)) Fixes scope not allowing subpaths, query parameters and hash when those values are empty.
- [`a04ea2f`](https://github.com/tauri-apps/plugins-workspace/commit/a04ea2f38294d5a3987578283badc8eec87a7752)([#1071](https://github.com/tauri-apps/plugins-workspace/pull/1071)) The global API script is now only added to the binary when the `withGlobalTauri` config is true.
- [`753c7be`](https://github.com/tauri-apps/plugins-workspace/commit/753c7be0a6a78121d2e88ea0efc3040580c885b4)([#1050](https://github.com/tauri-apps/plugins-workspace/pull/1050)) Add `unsafe-headers` cargo feature flag to allow using [forbidden headers](https://fetch.spec.whatwg.org/#terminology-headers).

### Dependencies

- Upgraded to `fs@2.0.0-beta.3`

## \[2.0.0-beta.2]

- [`ae56b13`](https://github.com/tauri-apps/plugins-workspace/commit/ae56b13a4d49dbf922b8a0fbb0d557bb63c1d72b)([#983](https://github.com/tauri-apps/plugins-workspace/pull/983)) Allow `User-Agent` header to be set.
- [`99bea25`](https://github.com/tauri-apps/plugins-workspace/commit/99bea2559c2c0648c2519c50a18cd124dacef57b)([#1005](https://github.com/tauri-apps/plugins-workspace/pull/1005)) Update to tauri beta.8.

## \[2.0.0-beta.1]

- [`569defb`](https://github.com/tauri-apps/plugins-workspace/commit/569defbe9492e38938554bb7bdc1be9151456d21) Update to tauri beta.4.

## \[2.0.0-beta.0]

- [`d198c01`](https://github.com/tauri-apps/plugins-workspace/commit/d198c014863ee260cb0de88a14b7fc4356ef7474)([#862](https://github.com/tauri-apps/plugins-workspace/pull/862)) Update to tauri beta.
- [`1a34720`](https://github.com/tauri-apps/plugins-workspace/commit/1a347203a54eccc954749d11c4ee81fdd9a0cde7)([#858](https://github.com/tauri-apps/plugins-workspace/pull/858)) Fix http fetch client option init with parameter `connectTimeout`

## \[2.0.0-alpha.9]

### Dependencies

- Upgraded to `fs@2.0.0-alpha.7`

## \[2.0.0-alpha.6]

- [`bfa87da`](https://github.com/tauri-apps/plugins-workspace/commit/bfa87da848f9f1da2abae3354eed632881eddf11)([#824](https://github.com/tauri-apps/plugins-workspace/pull/824)) Add `proxy` field to `fetch` options to configure proxy.

## \[2.0.0-alpha.5]

- [`387c2f9`](https://github.com/tauri-apps/plugins-workspace/commit/387c2f9e0ce4c75c07ffa3fd76391a25b58f5daf)([#802](https://github.com/tauri-apps/plugins-workspace/pull/802)) Update to @tauri-apps/api v2.0.0-alpha.13.

## \[2.0.0-alpha.4]

- [`387c2f9`](https://github.com/tauri-apps/plugins-workspace/commit/387c2f9e0ce4c75c07ffa3fd76391a25b58f5daf)([#802](https://github.com/tauri-apps/plugins-workspace/pull/802)) Update to @tauri-apps/api v2.0.0-alpha.12.

## \[2.0.0-alpha.3]

- [`e438e0a`](https://github.com/tauri-apps/plugins-workspace/commit/e438e0a62d4b430a5159f05f13ecd397dd891a0d)([#676](https://github.com/tauri-apps/plugins-workspace/pull/676)) Update to @tauri-apps/api v2.0.0-alpha.11.

## \[2.0.0-alpha.2]

- [`5c13736`](https://github.com/tauri-apps/plugins-workspace/commit/5c137365c60790e8d4037d449e8237aa3fffdab0)([#673](https://github.com/tauri-apps/plugins-workspace/pull/673)) Update to @tauri-apps/api v2.0.0-alpha.9.

## \[2.0.0-alpha.3]

- [`2cb0fa7`](https://github.com/tauri-apps/plugins-workspace/commit/2cb0fa719b8b1f5ac07dada93520dbbcf637d64c)([#587](https://github.com/tauri-apps/plugins-workspace/pull/587)) Remove `cmd` property which breaks invoke call.
- [`4e2cef9`](https://github.com/tauri-apps/plugins-workspace/commit/4e2cef9b702bbbb9cf4ee17de50791cb21f1b2a4)([#593](https://github.com/tauri-apps/plugins-workspace/pull/593)) Update to alpha.12.

### Dependencies

- Upgraded to `fs@2.0.0-alpha.2`

## \[2.0.0-alpha.2]

- [`aec17a9`](https://github.com/tauri-apps/plugins-workspace/commit/aec17a90fc365774c70c4876b94a899416120e26)([#558](https://github.com/tauri-apps/plugins-workspace/pull/558)) Improve response performance by using the new IPC streaming data.

## \[2.0.0-alpha.1]

- [`7d9df72`](https://github.com/tauri-apps/plugins-workspace/commit/7d9df7297a221a64d9de945ffc2cd8313d3104dc)([#428](https://github.com/tauri-apps/plugins-workspace/pull/428)) Multipart requests are now handled in JavaScript by the `Request` JavaScript class so you just need to use a `FormData` body and not set the content-type header to `multipart/form-data`. `application/x-www-form-urlencoded` requests must be done manually.
- [`7d9df72`](https://github.com/tauri-apps/plugins-workspace/commit/7d9df7297a221a64d9de945ffc2cd8313d3104dc)([#428](https://github.com/tauri-apps/plugins-workspace/pull/428)) The http plugin has been rewritten from scratch and now only exposes a `fetch` function in Javascript and Re-exports `reqwest` crate in Rust. The new `fetch` method tries to be as close and compliant to the `fetch` Web API as possible.
- [`d74fc0a`](https://github.com/tauri-apps/plugins-workspace/commit/d74fc0a097996e90a37be8f57d50b7d1f6ca616f)([#555](https://github.com/tauri-apps/plugins-workspace/pull/555)) Update to alpha.11.

## \[2.0.0-alpha.0]

- [`717ae67`](https://github.com/tauri-apps/plugins-workspace/commit/717ae670978feb4492fac1f295998b93f2b9347f)([#371](https://github.com/tauri-apps/plugins-workspace/pull/371)) First v2 alpha release!
