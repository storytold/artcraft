# ArtCraft agent instructions

ArtCraft has a Rust/Tauri + TypeScript desktop app and a pure Rust/egui app under
`artcraft-native/`. Backend services and website builds live in `artcraft-services`.
Read the [repository guide](_docs/agent-repository-guide.md) for layout and existing
style rules; [development setup](_docs/dev_setup.md) owns environment commands.

- State the requested behavior, refusal cases and scope before designing a surface.
  Reproduce a found defect with a test before fixing it and confirm the failure's cause.
  If automation cannot reach it, record the limitation and nearest executable check.
  Write assertions with behavior; never weaken a valid test to make a suite pass.
- Use the owning boundary's existing types, error idiom and dependency direction.
  Inspect dependencies before adding wrappers; avoid unrelated cleanup or new frameworks.
- Run checks that reach the changed boundary, widen for shared contracts and report
  exact commands, revision, failures and skips. Compilation, fixture tests, live-provider
  behavior, native startup and visual acceptance are different evidence.
- Keep ordinary tests local and hermetic. Paid generation, uploads, real credentials,
  account changes, releases and destructive operations need explicit authorization.
  Keep `external/` and `secrets/` untouched; preserve untracked/ignored local files.
- Review a concrete claim against the final diff. For consequential changes seek a
  fresh-context review that tries to falsify it; label self-review and missing review.
  A clean reviewer report is bounded by its scope, not proof of every product claim.
- When concurrent work is authorized, isolate writers from readers with separate trees
  or serialized phases. Pin review revisions; do not reset, stage or commit others' work.
- Work on a branch and offer a reviewable PR. A PR or green check does not authorize
  merge, release or broader product scope; maintainers decide adoption and readiness.
- Read ancestor `AGENTS.md` files for every affected path before editing, including from
  a root session. Cross-boundary changes read every applicable context. Preserve the
  existing `CLAUDE.md` symlink mirrors when adding or moving instruction files.

Contexts: [Rust](crates/AGENTS.md), [frontend](frontend/AGENTS.md),
[native app](artcraft-native/AGENTS.md), [agent documentation](_docs/AGENTS.md).
The [engineering methodology](_docs/agent-engineering-methodology.md) explains these
rules and optional deeper workflows; its adoption matrix separates operative changes
from extensions that remain maintainer choices. It adds no automatic agent workflow.
