# Contributing to ArtCraft MCP Server & Tools

Thank you for your interest in contributing to the ArtCraft Model Context Protocol (MCP) server, CLI tools, and agent skills! We welcome contributions from developers, artists, and open-source enthusiasts.

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Rust Toolchain**: `cargo` 1.75+ (for building the MCP server).
- **Python**: 3.9+ (for running the CLI tools suite).
- **Git**: 2.30+.

### 2. Setting Up Your Development Environment
1. Fork the repository on GitHub and clone your fork:
   ```bash
   git clone https://github.com/your-username/artcraft.git
   cd artcraft
   ```
2. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/storytold/artcraft.git
   ```
3. Checkout the release branch:
   ```bash
   git checkout mcp-server-release
   ```

---

## 🏗️ Building & Testing

### Building the MCP Server
To build the Rust MCP server executable locally:
```bash
cargo build --release --bin artcraft-mcp-server
```

### Running CLI Tools
Test the Python CLI tools suite inside `mcp-server-package/tools/`:
```bash
python mcp-server-package/tools/artcraft_cost_estimator.py
```

---

## 🔒 Security & Secret Hygiene

- **NEVER commit credentials**: Ensure `artcraft_session.txt`, `artcraft_avt.txt`, and API keys are strictly kept out of Git.
- **No hardcoded local paths**: Always use dynamic path discovery (`find_mcp_executable()` or `Path.home()`).

---

## 📋 Submitting a Pull Request

1. Create a descriptive feature branch:
   ```bash
   git checkout -b feature/my-cool-improvement
   ```
2. Commit your changes using [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat(mcp): add new video resolution parameter`
   - `fix(mcp): resolve socket timeout on slow networks`
   - `docs(mcp): update CLI tool usage examples`
3. Push your branch to your fork and submit a PR against `storytold/artcraft:main`.
