# Contributing to ArtCraft

This repository contains the Tauri desktop app, the experimental Rust native app,
and their shared libraries. Backend services and website/documentation deployments
live in [artcraft-services](https://github.com/storytold/artcraft-services).
See [_docs/dev_setup.md](_docs/dev_setup.md) and
[frontend/README.md](frontend/README.md) for development prerequisites and launchers.

## Choose and reproduce a change

Check open issues and pull requests before starting. Large audit issues often contain
several independent findings; name the part you are fixing and link existing related
PRs. Use `Fixes #123` only when the entire issue is resolved; use `Addresses #123`
for a partial fix. Keep unrelated fixes in separate commits or PRs.

Record the app version/commit, platform, reproducible steps, and expected behavior.
For a feature, explain the workflow it improves and how a reviewer can verify it.
Prefer local fixtures and regression tests over paid generation requests.

## Run the relevant checks

The PR workflow runs a deliberately limited foundation of tests on clean Linux
runners. It requires no application credentials, production services, signing keys,
or MySQL database. From the repository root:

```sh
SQLX_OFFLINE=true cargo test --locked -p sqlite_tasks -p cookie_store_wrapper -p artcraft_client
```

Then from `frontend/` (Node.js 24 is used in CI):

```sh
npm ci --ignore-scripts
npx vitest run --config apps/artcraft/vitest.config.ts
npx vitest run --config libs/components/viewer-3d/vite.config.ts
```

These commands use source exports and do not require building every library's
`dist/` directory. For other frontend changes, run the affected library's Vitest
configuration and its lint/type checks where available. The foundation workflow
is not a whole-workspace type check or a desktop release build.

Run the relevant desktop checks for Rust changes beyond the foundation:

```sh
SQLX_OFFLINE=true cargo test -p artcraft --lib <test_filter>
cargo test -p artcraft_native <test_filter>
cargo check --offline -p artcraft_client
```

`--offline` assumes dependencies have already been fetched. Tests marked ignored
may contact live providers or need special tools; inspect them before opting in.
For login bridge changes, run `SQLX_OFFLINE=true cargo test --offline -p artcraft
--lib login_bridge_tests`. For playback changes with FFmpeg installed, the native
`probes_and_decodes_a_generated_clip` test can be run explicitly with `-- --ignored`.
Report platform limitations and commands that could not run.

## Submit and verify the actual pull request

1. Fetch upstream `main`, create a focused branch, and check your remotes with
   `git remote -v`. Preserve unrelated work and local caches.
2. Review `git diff --check` and the final diff. Include the problem, resulting
   behavior, linked issue, validation, and remaining limitations in the PR body.
3. Push the branch to your fork. Open the PR against `storytold/artcraft:main`;
   a branch pushed to a fork alone is not a submitted upstream PR.
4. Verify the upstream PR URL, head branch/commit, base branch, changed files,
   mergeability, and checks. After pushing a fix, inspect checks for the **new head**.
5. A fork's first Actions run may require maintainer approval. State that accurately;
   do not describe a pending/skipped check as passing application tests. The workflow
   also runs on pushes so contributors can verify it in their own fork.

### The obsolete Netlify documentation check

[PR #2248](https://github.com/storytold/artcraft/pull/2248) explains why the
`storyteller-docs` site was trying to run a build script that moved to the services
repository. The root `netlify.toml` guard intentionally skips that stale build.
Keep that guard unchanged while the site remains attached; do not add a dummy docs
build script or remove failing test commands to make a PR look green. A successful
Netlify deploy-preview status with neutral subsidiary checks means the obsolete
deploy was skipped, **not** that the application passed tests. Maintainers can
remove the guard after repointing or disconnecting that site.
