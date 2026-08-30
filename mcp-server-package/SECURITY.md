# Security Policy & Credential Safety

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

---

## 🔒 Credential & Privacy Protection

The ArtCraft MCP Server interfaces with user authentication sessions and tokens. The following strict security rules are enforced across all server code and scripts:

1. **Zero Hardcoded Secrets**: No API keys, passwords, session tokens, or private cookies are stored in source code.
2. **Local Session Isolation**: Session credentials (`artcraft_session.txt`, `artcraft_avt.txt`) are stored locally in the user's home directory (`~/ArtCraft/credentials`) and are explicitly excluded from Git tracking via `.gitignore`.
3. **Automated Auditing**: All pull requests must pass secret scanning before merge.

---

## 🐛 Reporting a Vulnerability

If you discover a potential security vulnerability within ArtCraft MCP:

1. **DO NOT** open a public GitHub issue.
2. Please report the issue privately to the maintainers at `security@storyteller.ai` or via GitHub Private Vulnerability Reporting.
3. Include detailed steps to reproduce the vulnerability.
4. You will receive an acknowledgment within 48 hours and regular updates on resolution progress.
