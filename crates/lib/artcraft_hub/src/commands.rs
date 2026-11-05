//! The unified `hub.*` command catalog (CraftHub spec §3.6 phase C, §18.3): **the same command
//! names in every Craft app** — the explicit lexical-unification requirement. Artcraft speaks
//! `hub.*` from the start (it has no v2 `collab.*` lexicon of its own); the family-wide
//! `collab.*` twins keep working everywhere they exist (§18.10: "no forced upgrade ever").
//!
//! This module is the catalog as data — the names, argument shapes, results and undoability —
//! so the Tauri command registry, the web UI's `tauri-api` wrappers and the action palette can
//! all consume one table (the v3 rule: a command defined once is inherited everywhere, §18.3).

/// The shape of one command argument.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ArgKind {
  /// A free-form string.
  Text,
  /// A server or join-code string.
  Code,
  /// A URL (`wss://` server or `https://` web).
  Url,
  /// A document, project or object id.
  Id,
  /// A role or capability name.
  Role,
  /// A boolean flag.
  Flag,
  /// A comment body (bounded text).
  Body,
}

/// One command of the unified catalog.
#[derive(Clone, Debug)]
pub struct CommandSpec {
  /// The command identifier, always `hub.*` (the family-wide lexicon).
  pub name: &'static str,
  /// The arguments, in order.
  pub args: &'static [(&'static str, ArgKind)],
  /// One line describing what it does (the catalog's help text).
  pub help: &'static str,
  /// Whether the command participates in per-user undo (§5.6: one batch = one undo step).
  pub undoable: bool,
}

/// The unified `hub.*` catalog — identical in every Craft app (§3.6: "no inventing names per
/// app"). v3 additions beyond the v2 surface are marked in their help text.
pub const HUB_COMMANDS: &[CommandSpec] = &[
  CommandSpec { name: "hub.connect", args: &[], help: "Connect to the configured CraftHub server (empty server in preferences = cloud sharing off).", undoable: false },
  CommandSpec { name: "hub.share", args: &[], help: "Share the active document: host or publish it, with links and join codes.", undoable: false },
  CommandSpec { name: "hub.join", args: &[("codeOrLink", ArgKind::Code)], help: "Join a shared session by code or link (one argument that recognizes itself).", undoable: false },
  CommandSpec { name: "hub.leave", args: &[], help: "Leave the active document's session (closing a file leaves its session alone).", undoable: false },
  CommandSpec { name: "hub.peers", args: &[], help: "Who is here now, with their roles and live capabilities (the 'why can't I?' answer).", undoable: false },
  CommandSpec { name: "hub.follow", args: &[("peer", ArgKind::Id)], help: "Follow a peer's view and page; any view movement of your own stops the follow.", undoable: false },
  CommandSpec { name: "hub.comment", args: &[("body", ArgKind::Body)], help: "Add a comment anchored to the current selection.", undoable: false },
  CommandSpec { name: "hub.review.submit", args: &[], help: "Submit the working state as a contribution for review (v3).", undoable: false },
  CommandSpec { name: "hub.review.decide", args: &[("contribution", ArgKind::Id), ("approve", ArgKind::Flag)], help: "Approve or reject a queued contribution (v3).", undoable: false },
  CommandSpec { name: "hub.version.save", args: &[("label", ArgKind::Text)], help: "Save a named version of the document (v3).", undoable: false },
  CommandSpec { name: "hub.files", args: &[], help: "My files on the network, from my account (projects and archive included).", undoable: false },
  CommandSpec { name: "hub.project.list", args: &[], help: "My projects and teams (v3).", undoable: false },
];

/// The v2 `collab.*` identifiers and their `hub.*` twins (§18.3's table, §18.10's "old clients
/// keep every capability" rule). Same identifier works everywhere, forever.
pub const COLLAB_COMPAT: &[(&str, &str)] = &[("collab.share", "hub.share"), ("collab.join", "hub.join"), ("collab.leave", "hub.leave"), ("collab.peers", "hub.peers"), ("collab.spotlight", "hub.follow"), ("collab.cursorChat", "hub.comment"), ("collab.files", "hub.files"), ("collab.openFile", "hub.files"), ("collab.forgetFile", "hub.files"), ("collab.manageFile", "hub.share"), ("collab.report", "hub.comment")];

/// The v3-only `collab.*` additions (§18.3's new rows, kept under the legacy prefix too so the
/// old lexicon stays complete).
pub const COLLAB_V3: &[&str] = &["collab.invite", "collab.contributions", "collab.locks", "collab.versions", "collab.storage", "collab.team"];

/// Look up a command by its `hub.*` name or its `collab.*` twin.
#[must_use]
pub fn resolve(name: &str) -> Option<&'static CommandSpec> {
  let canonical = COLLAB_COMPAT.iter().find(|(old, _)| *old == name).map_or(name, |(_, new)| new);
  HUB_COMMANDS.iter().find(|c| c.name == canonical)
}
