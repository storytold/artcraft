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
- [ ] Check secrets hygiene — credential/cookie/token files must stay untracked (`~/Artcraft/credentials/`, `.env`, `secrets/`). Scan staged text for tokens before committing (e.g. `git diff --cached | grep -inE 'session=|visitor=|api[_-]?key|bearer'`).
- [ ] Check path portability — no machine-specific paths (`C:\Users\<name>`, `/home/<name>`, `F:\`) in committed docs or code; resolve paths dynamically (`Path.home()`, `dirs::`, env vars).
- [ ] Run the repo verifiers for whatever you touched: `sh .devin/scripts/verify-crate.sh <crate>` (Rust), `sh .devin/scripts/verify-frontend.sh` (frontend), `PYTHONUTF8=1 python -m py_compile tools/*.py && PYTHONUTF8=1 python tools/test_artcraft_mcp_client.py` (`mcp-server-package/`).
- [ ] Sync branch with `upstream/main` (`sh .devin/scripts/check-upstream.sh`, then `git merge upstream/main`).
- [ ] Submit PR using `gh pr create` with full description template.
