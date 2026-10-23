# Agent and development documentation

The root `AGENTS.md` holds operative rules and style; nested `AGENTS.md` files hold the
rules of the code they sit next to; `agent-engineering-methodology.md` explains them and
describes optional workflows. Keep concise rules an agent must follow in `AGENTS.md` files
and explanation in the methodology.

When editing agent guidance, map each rule to the failure it prevents and its actual
test or manual check. Do not imply that documentation enforces permissions or isolation.
Check moved links and retain existing conventions unless a deliberate change replaces them.

Name instruction files `AGENTS.md` only. Do not add `CLAUDE.md` copies or symlinks:
Claude Code (v2.1.277+) reads `AGENTS.md` only when no `CLAUDE.md` is on the path, and
Git for Windows checks symlinks out as one-line text files by default, so a mirrored
`CLAUDE.md` replaces the real instructions on those clones. See the
[Claude Code AGENTS.md guide](https://code.claude.com/docs/en/memory#agents-md).
