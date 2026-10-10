# Native IndexedDB storage checks

`indexeddb-project-storage.browser.html` exercises the actual storage adapter in a
browser using native IndexedDB requests, transactions, structured cloning and
version upgrades. It routes the adapter's database name to a dedicated test
namespace and deletes that test database between cases. The application database
is not touched.

From `frontend/`, compile only the adapter and serve the harness:

```sh
idb_check_dir=$(mktemp -d /tmp/artcraft-idb-check.XXXXXX)
node node_modules/esbuild/bin/esbuild \
  libs/components/video-editor/src/lib/adapters/default/indexeddb-project-storage.ts \
  --format=esm --target=es2022 --outfile="$idb_check_dir/indexeddb-storage.js"
cp libs/components/video-editor/tests/indexeddb-project-storage.browser.html \
  "$idb_check_dir/index.html"
python3 -m http.server 0 --bind 127.0.0.1 --directory "$idb_check_dir"
```

Open the local address and port printed by the server. All six cases should report
`PASS`. The final JSON is also available as `globalThis.runResult` for a browser
runner to collect. Stop the server and remove the generated directory afterward.

The two round-trip controls verify public storage behavior. The remaining checks
verify connection cleanup after successful operations, a blocked native version
upgrade, a synchronous `DataCloneError`, and an aborted native transaction. This
harness uses browser APIs because the library's default jsdom test environment
does not provide IndexedDB. It does not replace the ordinary library test suite.
