---
name: open-source-contributor
description: Best practices and checklists for contributing to open-source projects — secrets hygiene, path portability, verification, upstream sync, and PR etiquette. Use when preparing, verifying, or submitting contributions to upstream repositories.
---

# Open Source Contributor & Maintainer Skill

## Core Purpose
This skill encapsulates best practices, workflows, and standards defined by the [GitHub Open Source Guides](https://opensource.guide/). It provides systematic protocols for contributing to upstream repositories, maintaining open-source projects, ensuring secret hygiene, and fostering welcoming community governance.

---

## 🏛️ The 10 Pillars of Open Source Governance

### 1. How to Contribute to Open Source (`/how-to-contribute/`)
- **Fork & Sync**: Always maintain an `upstream` remote pointing to the main project (`storytold/artcraft.git`) and an `origin` remote pointing to your own fork (`<your-username>/<your-fork>.git`).
- **Clean Commits**: Keep commit messages concise, imperative, and structured following Conventional Commits (`feat(mcp):`, `docs(mcp):`, `fix(mcp):`).
- **PR Protocol**: Include a structured PR description using `PULL_REQUEST_TEMPLATE.md` with an executive summary, itemized changelog, and verification checklist.

### 2. Starting an Open Source Project (`/starting-a-project/`)
- Ensure every repository includes a `README.md`, `LICENSE.md` (e.g., MIT), `CONTRIBUTING.md`, and `CODE_OF_CONDUCT.md`.
- Provide one-click installers (`setup_mcp.py`) and standalone binaries to minimize onboarding friction for users.

### 3. Finding Users & Documentation (`/finding-users/`)
- Document all CLI parameters, environment variables, and usage examples in a clear reference manual (`TOOLS.md`).
- Provide sample visual/audio outputs and clear cost expectations (`artcraft_cost_estimator.py`).

### 4. Community & Code of Conduct (`/building-community/` & `/code-of-conduct/`)
- Enforce the Contributor Covenant v2.1 code of conduct.
- Provide clear communication channels and issue templates for bug reports and feature requests.

### 5. Maintainer Best Practices (`/best-practices/`)
- **Secret Hygiene**: Run automated secret scanners before pushing to any public remote. Keep session cookies, credentials, and API keys strictly ignored in `.gitignore`.
- **Path Portability**: Never hardcode local system paths (`C:\Users\...`, `F:\...`). Always use dynamic path resolution (`find_mcp_executable()`, `pathlib.Path.home()`).

### 6. Leadership & Governance (`/leadership-and-governance/`)
- Maintain clear separation between core project branches (`main`) and feature/release branches (`mcp-server-release`).

### 7. Sustainability & Cost Transparency (`/getting-paid/`)
- Provide transparent credit balance and API cost estimation tools so users can anticipate render costs before execution.

### 8. Legal & Licensing (`/legal/`)
- Verify all open-source dependencies and include permissive license disclaimers (MIT License).

### 9. Versioning & Metrics (`/metrics/`)
- Follow Semantic Versioning (`v1.0.0`) for releases and document all notable changes in `CHANGELOG.md`.

---

## 📋 Automated Verification Checklist

Before pushing code or submitting a PR:
- [ ] Check secrets hygiene — credential files must never reach the PR, whether staged or inside any commit being pushed (a range diff uses the merge-base endpoint, so a secret added in one commit and removed in a later commit is invisible there but still ships in history). Check filenames first (bare-token files like `artcraft_session.txt`/`artcraft_avt.txt` carry a live session but may not match a content regex): run `git diff --cached --name-only` and `git log -m upstream/main..HEAD --name-only --format=`, each piped through `grep -iE 'artcraft_(session|avt)|\.env($|[.-])|credentials/|secrets/'` — both must return nothing. Then scan content without printing values: `git diff --cached -i -G'session=|visitor=|api[_-]?key|bearer' --name-only` and `git log -m -i -G'session=|visitor=|api[_-]?key|bearer' upstream/main..HEAD --name-only --format=` (`-m` makes `git log` diff merge commits against each parent — plain `git log` skips them) (the `-i` matters — `-G` is case-sensitive by default, so `API_KEY=` would pass without it).
- [ ] Check path portability — no machine-specific paths (`C:\Users\<name>`, `/home/<name>`, `F:\`) in committed docs or code; resolve paths dynamically (`Path.home()`, `dirs::`, env vars).
- [ ] Run the repo verifiers for whatever you touched: `cargo fmt --check -p <crate> && cargo clippy -p <crate> --no-deps` (Rust), then tests — if `cargo-nextest` is installed (`command -v cargo-nextest`) run `cargo nextest run -p <crate>`, otherwise `cargo test -p <crate>` (do not silently retry `cargo test` after a nextest failure — a nextest failure is a failure), `cd frontend/apps/artcraft && npx eslint <files>` (frontend), `cd mcp-server-package && PYTHONUTF8=1 python -m py_compile tools/*.py && PYTHONUTF8=1 python tools/test_artcraft_mcp_client.py` (Python suite).
- [ ] Sync branch with `upstream/main` (`git fetch upstream && git merge upstream/main`; `git log --oneline HEAD..upstream/main` shows what's incoming).
- [ ] Submit PR using `gh pr create` with full description template.
