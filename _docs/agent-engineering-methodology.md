# Evidence-oriented agent engineering for ArtCraft

Status: proposed methodology and adoption choices. Operative instructions are in
the root and contextual `AGENTS.md` files. This document explains their reasoning
and supplies optional workflows; it does not activate agents, hooks, CI or merge rights.

## Why this proposal fits this repository

ArtCraft already places Rust, endpoint, Tauri-command, schema and 3D-editor rules
near the code they govern. This proposal keeps that structure and its Claude symlink
mirrors. It adds explicit ways to challenge an agent's diagnosis, confidence and
scope before a plausible implementation becomes an accidental product contract.

The architecture has several different evidence boundaries: shared Rust API clients,
the provider router, Tauri IPC and cookie handling, SQLite task persistence, React
state, the Three.js editor and the separate egui app. A result in one does not establish
the same result in another. Backend services are outside this repository.

The proposal deliberately does not import a .NET architecture, a universal result type,
numbered stage bureaucracy, protocol-ratification machinery or another project's
delivery authorization. Existing Rust `anyhow` conventions, schema types, module layout,
two-space style, API endpoint/command files and pagescene invariants remain in force.

## Define the claim before its implementation

For a consequential capability, write a small observable contract: input/state/sequence,
success, refusal, side effects and required evidence. Number items when traceability
helps; do not create a document for every trivial edit. Include cancellation and failure
behavior rather than specifying only a happy-path screenshot.

For example, a router draft cost estimate should not trigger media upload or generation.
The existing video instructions already distinguish draft, finalize and send phases.
Tests should observe which operation actually occurred, not merely assert a helper's name.
For pagescene, a mode switch that hides chrome must preserve the mounted engine canvases
and the unsaved scene. The nested invariant is the contract; a new visual arrangement
must not silently redefine it.

Prefer typed identities where the code already distinguishes identity spaces, reuse
the schema tokens, and keep primitives at external seams. Preserve existing error
idioms within a boundary. Avoid mass API/type migrations in an unrelated repair.
Keep dependency direction and state authority explicit; a new convenience abstraction
must not become a second engine, store or provider-routing authority.

## Reproduce defects before fixes

A reported defect is a hypothesis. First write the smallest test that names its trigger,
run it against the unfixed code and read the failure. Only then fix. A passing pre-fix
test means the test did not reach the alleged fault or the diagnosis needs revision.
Do not invent a red result when the environment cannot execute it: label the test an
unrun draft and state the missing runtime, dependency or native surface.

Write assertions alongside new behavior. A load-bearing dependency assumption, a
comment promising behavior under a named scenario and a numbered contract item each
deserve a test that can distinguish the promised outcome from a plausible wrong one.
Choose expectations from the contract, not from the finished implementation's output.
Exercise acceptance and refusal. For recurring omissions, a convention/property guard
can cover the class better than an enumeration of today's examples.

Where a defect cannot be automated, record why and exercise the nearest observable
boundary plus a concrete manual reproduction. Compilation errors need compile evidence;
visual judgments need visual evidence. Never weaken, skip or delete a valid assertion
to make a repair appear successful. An obsolete assertion can change only with an
explicitly justified contract change.

## Make evidence reproducible and bounded

Record the revision, command, platform, fixture/input, result and limitation. Inspect
completed artifacts rather than infer final behavior from in-flight state. Pin rolling
measurements and remeasure after correcting the method. Verify paths, hashes and bytes
where multiple checkouts or encodings can make plausible output misleading.

Use local fixtures and temporary stores for ordinary tests. A loopback login test can
prove native request/cookie behavior under its fixture; it cannot prove a production
provider, another OS or an artist's live account. A frontend build proves compilation,
not native IPC or user acceptance. Source inspection and an unrun test are different
evidence again. Report absent credentials and skipped native surfaces explicitly.

Select checks by reach: changed crate/library first; affected consumers for shared types;
full relevant build boundaries for broad dependency/configuration changes. Read actual
manifests and scripts rather than invent one universal monorepo command. Existing examples:

- Rust crate: `cargo check -p <crate>` / `cargo test -p <crate>`; SQLx paths use
  `SQLX_OFFLINE=true` and retain `.sqlx/` plus SQLite migrations.
- Native login: the existing local `login_bridge_tests` command in the command/client
  instructions and the desktop-session regression guide.
- Pure Rust app: `cargo test -p artcraft_native`, with unit and `egui_kittest` coverage.
- Frontend: owning package/Nx targets, existing specs and relevant desktop-session checks.

These are routing examples, not claims that every command was run for this proposal.
Documentation changes check links, mirrors, preserved conventions and the final diff.
No new CI job is introduced here; maintainers can choose an enforcement follow-up.

## Review by trying to falsify a claim

Self-review is useful but shares the author's assumptions. For consequential changes,
seek a fresh context over a pinned diff and relevant contracts. Give it one concrete
claim to falsify, not an incentive to manufacture a list of findings. A clean answer
is legitimate when it states its scope and what it did not examine.

First ask cold whether the implementation's claim holds, without the author's
suspicions. Separately, supply the author's reasoning and alternatives and ask whether
that reasoning holds. Combining those briefs anchors both onto the same explanation.
Independent agreement is evidence; one reviewer's finding is a lead to reproduce.

A useful finding includes a trigger, affected boundary and an executed failing
reproducer where possible; otherwise it includes a labelled draft. Verify the mechanism
before fixing. Green does not refute a finding if the test did not reach it. Close
confirmed in-scope defects and review the changed lines again; report out-of-scope or
maintainer-owned decisions instead of silently expanding the change.

For a bounded optional review loop, name the claims and set a round ceiling before
dispatch. Stop on convergence, meaning no remaining substantiated defects in scope,
or report the limit and outstanding work. A capped loop is not convergence. Report
scope, omissions, rounds and cumulative agents when used. This workflow is optional;
it grants no permission to spawn agents or turn an agent report into maintainer approval.

## Concurrent agents and shared work

Pin the revision a reviewer reads. Do not let another agent edit underneath that read:
use separate worktrees/scratch for execution or serialize read and write phases.
Assign one owner when findings touch the same files. A discovery reproducer runs in
the reviewer's isolated tree; the landing author reruns it on the actual branch and
owns the red/green evidence. A reviewer without execution capability supplies a draft.

Preserve unrelated tracked, untracked and ignored files. Do not reset, clean, stage
everything or kill shared processes as a shortcut. Separate ports alone do not isolate
ArtCraft's account data, cookie stores, app paths or Cargo locks. Follow the launcher
documentation and use test-owned temporary resources rather than a developer's profile.
Pass through supplied model, effort and budget limits; do not silently increase fan-out.
Pause dependent work for a real owner decision while completing independent authorized work.

## Scope, dependencies and delivery

User authorization defines scope; repository visibility and a proposed workflow do not.
Paid provider calls, uploads, credential access, external messages, releases and
destructive operations need their own authorization. Ordinary local tests use synthetic
fixtures. Keep secrets and private customer material out of source, logs and PR evidence.

Read a dependency's actual contract/source before wrapping it or claiming it cannot do
something. If a workaround is needed, name the dependency behavior, cost and retirement
condition; add a probe when that behavior is load-bearing. Prefer removing the cause
within scope, and separate adjacent architectural changes into their own reviewable work.

Submit branches through PRs, describe the complete final change, evidence and limitations,
and leave adoption/merge/release to maintainers. A green suite does not grant wider scope.
Keep lasting rationale in the repository; a PR description alone may be lost at merge.
No automated PR review coverage is assumed merely because agents evaluate proposals.

## Instruction discovery and maintenance

The root is the universal entrypoint; nested instructions own context; the repository
guide owns detailed layout/style; this methodology owns explanations and optional
workflows. Read each affected path's ancestor instructions explicitly when working from
the root: automatic discovery need not preload all descendants. Cross-boundary work
loads both contexts. Maintain `CLAUDE.md` as symlinks to sibling `AGENTS.md` files,
including missing mirrors for the existing endpoint/command contexts.

Keep instructions concise and durable. State the failure prevented and the actual
guard or manual check. Do not claim prose enforces permissions or reader/writer isolation.
Report concrete friction with an example rather than praise or copy another project's
rule by default. Do not require a phrase or a paragraph to remain in an entrypoint just
to satisfy a test; guard the behavior or owned contract instead.

Codex discovery reference: [official AGENTS.md guide](https://developers.openai.com/codex/guides/agents-md).
Claude discovery/reference: [official memory and instruction guide](https://code.claude.com/docs/en/memory).
Tool versions and configuration affect discovery; verify loaded files in the actual
session. Symlink materialization on Windows must be checked rather than assumed.

## Review scope and adoption choices

This draft proposes the complete package so maintainers can assess its interactions.
Adoption is a maintainer decision; the groups below can be retained or revised together
with their dependent instruction references. Unmerged prose is not adopted policy.

| Group                         | Included behavior                                               | Adoption scope                                  |
|-------------------------------|-----------------------------------------------------------------|-------------------------------------------------|
| Universal operative baseline  | Defect reproduction, evidence limits, scope and concurrent safety | Root instructions; review their product fit      |
| Contextual operative guidance | Rust, frontend, egui and docs boundaries; missing Claude mirrors  | Existing conventions plus focused additions      |
| Explanatory methodology       | Rationale and worked ArtCraft examples                           | Documentation; no separate automation activated  |
| Optional deeper review        | Cold claim review, reasoning review and bounded recheck loop      | Opt-in workflow; no mandatory agent count/cadence |
| Future mechanical enforcement | Mirror/link guard, CI integration, stronger review orchestration | Not implemented; separate maintainer decision    |

Reviewers should challenge whether each instruction fits an actual ArtCraft boundary,
whether it duplicates/conflicts with a nested rule, and whether the root still routes
all prior style requirements. No application behavior, dependencies, release workflow,
provider calls or account configuration change. Existing pagescene feature notes are
left intact; reconciling their branch-era status with current code is separate work,
not an implicit permission to implement or delete those features.

Public fork PRs are present in the inspected repository, but no repository-level
CONTRIBUTING or PR template was found in the snapshot. That observation does not
promise acceptance. This is a draft invitation to evaluate methodology, not an
assertion that the maintainers or their agents have endorsed it.
