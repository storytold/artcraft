//! # artcraft-hub — Artcraft's CraftHub client path
//!
//! The [`HubAdapter`] that maps Artcraft's project document onto `craft-collab`'s generalized
//! object/property model (the CraftHub specification §3.6 phase B, §18.4 row 12 — the
//! deliberately-last Tauri integration). Artcraft is the family's Tauri 2 app: a web UI over a
//! Rust core, so this crate is the Rust-side shape of what syncs, and the web UI reaches it
//! through Tauri IPC (the `tauri-api` pattern — `invoke` wrappers in `frontend/libs/tauri-api`),
//! documented below.
//!
//! ## The document this crate maps
//!
//! Artcraft's projects — 3D scenes, 2D editors, mood boards, video timelines, graph workflows —
//! are JSON media files of class `project` whose kind rides `maybe_project_type`
//! (`MediaFileProjectType` in `crates/schema/public/enums`: `scene_3d`, `mood_board`, `workflow`,
//! `video_timeline`, `editor_2d`). In CraftHub's terms that is one custom GOPM document type,
//! `artcraft.project`, carrying:
//!
//! * **scene** — the object tree: the placed subjects of a 3D scene (image planes, meshes,
//!   gaussian splats, posed characters), the layer stack of a 2D editor, the pinned images of a
//!   mood board, the tracks and clips of a video timeline, the steps of a graph workflow.
//! * **layers** — the ordered children of that tree (every sibling order rides fractional keys,
//!   exactly like the FigCraft pilot).
//! * **references** — the media files the project points at, as a per-entry document list keyed
//!   by the media-file token.
//! * the two shared inputs: the **job log** (generation jobs — the shape of the `tasks` table in
//!   `crates/schema/database/sqlite_tasks`) and the **team outputs** (completed generations
//!   shared to the feed), both per-entry document lists.
//!
//! This crate is where the Rust-side model of that document lives: the editors themselves are
//! TypeScript (the scene editor arrives as `@storyteller/ui-pagescene`), and their richer JSON
//! rides the `payload` property of each node, last-writer-wins. The tree, the names, the
//! transforms, the media references and both shared lists are first-class synchronized state.
//!
//! ## The wiring path (behind the flag, not in this PR)
//!
//! The Hub client lives in this Rust backend: a session owns one [`ArtcraftHub`] per open
//! project, the desktop app gains `hub.*` Tauri commands behind its `crafthub` feature flag, and
//! the web UI calls them through the same `invoke` surface every other command uses
//! (`frontend/libs/tauri-api/src/lib/<domain>/`). Nothing user-visible changes until that wiring
//! lands; this crate is the contract it will speak.
//!
//! ## What belongs here, per the family rule (§3.6: "adapters for an app ship with the app")
//!
//! * [`props`] — the synchronized property table over the model's real fields, with the
//!   compile-time guard (a `SceneNode` gaining a field that doesn't sync is a build error).
//! * [`ArtcraftHub`] — the adapter: `view`/`apply`/`diff` over the real [`Project`], the sibling
//!   position keys, and the presence projection (which carries the in-flight generation job).
//! * [`commands`] — the unified `hub.*` command catalog (same names in every Craft app, §18.3).
//! * [`deeplink`] — `artcraft://join?...` links (§18.5).
//! * [`schema`] — the document knowledge the hub server validates against: the kind table, which
//!   parents accept children, which kinds belong to which project type, and the three per-entry
//!   document lists with their orders.
//!
//! What deliberately does **not** live here: networking, sessions, Tauri commands, the UI. No
//! sockets, no files, no clock — the crate is pure, like the core it speaks.

#![forbid(private_bounds)]
#![forbid(private_interfaces)]

pub mod commands;
pub mod deeplink;
pub mod presence;
pub mod props;
pub mod schema;

use std::collections::BTreeMap;
use std::sync::{Arc, Mutex};

use craft_collab::adapter::{ApplyReport, DocumentView, HubAdapter, ViewNode};
use craft_collab::change::Change;
use craft_collab::frac;
use craft_collab::ids::NodeId as HubId;
use craft_collab::value::Value;
use serde::{Deserialize, Serialize};

/// The live UI state an adapter projects into presence (re-exported for the wiring crate).
pub use craft_collab::adapter::UiState;

/// The root every top-level project node hangs under (space 0, counter 0 — never a real id:
/// ids allocate with a space prefix, and `0` is the core's root marker).
pub const ROOT: HubId = HubId(0);

/// The object kinds, by project type (the discriminants of [`NodeKind`]).
pub const KINDS: &[&str] = &["object", "character", "camera", "skybox", "group", "layer", "track", "clip", "step", "boardImage"];

/// The kinds that accept children ([`NodeKind::accepts`], mirrored for the schema table).
pub const CONTAINERS: &[&str] = &["group", "track"];

// — The document model ——————————————————————————————————————————————————————
//
// The Rust-side model of the `artcraft.project` document. Every type here mirrors something
// real in the repository, and the doc comments say what; where the editors' own JSON is richer,
// it rides `payload` rather than being invented field by field.

/// An object id inside the project tree (the same 64-bit packing the hub uses: client space in
/// the high half, counter in the low — file ids live in space 0).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
pub struct NodeId(pub u64);

/// Which kind of Artcraft project this document is — the real `maybe_project_type` values of
/// `MediaFileProjectType` (`crates/schema/public/enums/src/by_table/media_files/
/// media_file_project_type.rs`), verbatim.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
pub enum ProjectType {
  /// A 3D editor scene: "objects with locations, skyboxes, animations, etc. — a full editable
  /// 3D scene" (the enum's own words).
  #[serde(rename = "scene_3d")]
  Scene3d,
  /// A mood board: "a collection of images on a lightweight graph".
  MoodBoard,
  /// A graph workflow: "a node-graph pipeline of image and video generation steps".
  Workflow,
  /// A video editor project: "a nonlinear video editing timeline".
  VideoTimeline,
  /// A 2D editor project: "a 2D image editing document".
  #[serde(rename = "editor_2d")]
  Editor2d,
}

impl ProjectType {
  /// The wire string (the database value, `to_str()` verbatim).
  #[must_use]
  pub fn to_str(self) -> &'static str {
    match self {
      Self::Scene3d => "scene_3d",
      Self::MoodBoard => "mood_board",
      Self::Workflow => "workflow",
      Self::VideoTimeline => "video_timeline",
      Self::Editor2d => "editor_2d",
    }
  }

  /// Parse a wire string; `None` when it is not one of the five real project types.
  #[must_use]
  pub fn from_wire(value: &str) -> Option<Self> {
    match value {
      "scene_3d" => Some(Self::Scene3d),
      "mood_board" => Some(Self::MoodBoard),
      "workflow" => Some(Self::Workflow),
      "video_timeline" => Some(Self::VideoTimeline),
      "editor_2d" => Some(Self::Editor2d),
      _ => None,
    }
  }

  /// The kinds that may sit at the top level of this project type.
  #[must_use]
  pub fn root_kinds(self) -> &'static [&'static str] {
    match self {
      Self::Scene3d => &["object", "character", "camera", "skybox", "group"],
      Self::Editor2d => &["layer"],
      Self::VideoTimeline => &["track"],
      Self::Workflow => &["step"],
      Self::MoodBoard => &["boardImage"],
    }
  }
}

/// The kind of one scene node — the real subjects the editors place, as documented on
/// `MediaFileProjectType` and the 3D editor's own workflow ("add objects and characters, pose
/// characters, and orbit the camera"; "set the camera height and focal length").
///
/// The discriminant rides the change stream's kind field; the payload (a camera's framing, a
/// clip's range) rides the `kind` property, exactly like the FigCraft pilot's node kinds.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum NodeKind {
  /// A placed 3D subject: an image plane, a mesh (glb/gltf/fbx/obj), or a gaussian splat
  /// (ply/spz). The media it shows rides the node's `media` property.
  Object,
  /// A posable character subject (the 3D editor's posing workflow). The pose itself rides
  /// `payload` — the editor's own JSON, last-writer-wins.
  Character,
  /// The framing camera: height and focal length are the two parameters the editor exposes.
  Camera {
    /// The focal length, in millimeters.
    focal_length: f64,
    /// The camera height, in meters.
    height: f64,
  },
  /// The scene's skybox.
  Skybox,
  /// A grouping of subjects — the only `scene_3d` container.
  Group,
  /// A layer of the `editor_2d` stack. Opacity and blend ride `payload` until the 2D editor
  /// grows first-class fields for them.
  Layer,
  /// A track of the `video_timeline` — the timeline's container kind.
  Track,
  /// A clip on a track.
  Clip {
    /// Where the clip starts on the timeline, in milliseconds.
    start_ms: u64,
    /// How long it runs, in milliseconds.
    duration_ms: u64,
  },
  /// One step of the `workflow` node graph. A graph is not a tree, so the step's edges ride
  /// `payload` (last-writer-wins) while the step itself is an ordered root child.
  Step,
  /// An image pinned to the `mood_board`.
  BoardImage,
}

impl NodeKind {
  /// The discriminant string (what the change stream's kind field carries).
  #[must_use]
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Object => "object",
      Self::Character => "character",
      Self::Camera { .. } => "camera",
      Self::Skybox => "skybox",
      Self::Group => "group",
      Self::Layer => "layer",
      Self::Track => "track",
      Self::Clip { .. } => "clip",
      Self::Step => "step",
      Self::BoardImage => "boardImage",
    }
  }

  /// A default kind for a kind string (used when a `Create` arrives without a `kind` property —
  /// the diff always sends one, so this only feeds schema round-trips and tests).
  #[must_use]
  pub fn from_wire(value: &str) -> Option<Self> {
    let kind = match value {
      "object" => Self::Object,
      "character" => Self::Character,
      "camera" => Self::Camera { focal_length: 50.0, height: 1.6 },
      "skybox" => Self::Skybox,
      "group" => Self::Group,
      "layer" => Self::Layer,
      "track" => Self::Track,
      "clip" => Self::Clip { start_ms: 0, duration_ms: 0 },
      "step" => Self::Step,
      "boardImage" => Self::BoardImage,
      _ => return None,
    };
    Some(kind)
  }

  /// Which child kinds this kind accepts (`None` = no children).
  #[must_use]
  pub fn accepts(&self) -> Option<&'static [&'static str]> {
    match self {
      Self::Group => Some(&["object", "character", "camera", "skybox", "group"]),
      Self::Track => Some(&["clip"]),
      _ => None,
    }
  }
}

/// An object transform — "objects with locations" plus the rotation and scale every 3D editor
/// carries. Units are the scene's own (meters and radians in the 3D editor).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Transform {
  /// The location, as (x, y, z).
  pub location: [f64; 3],
  /// The rotation, as (x, y, z) radians.
  pub rotation: [f64; 3],
  /// The scale, as (x, y, z).
  pub scale: [f64; 3],
}

impl Default for Transform {
  fn default() -> Self {
    Self { location: [0.0; 3], rotation: [0.0; 3], scale: [1.0, 1.0, 1.0] }
  }
}

/// A reference to an Artcraft media file — the token the API hands out, the real
/// `media_files.media_class` value ("image", "mesh", "splat", "video", ...), and the optional
/// content address for the asset channel (bytes never travel inside batches — spec §3.5).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MediaRef {
  /// The media-file token (the API's handle for the file).
  pub token: String,
  /// The media class (the real `MediaFileClass` wire strings).
  pub class: String,
  /// The SHA-256 of the file's bytes, when known — the asset channel's id.
  pub sha256: Option<String>,
}

/// One node of the project's object tree.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SceneNode {
  /// The node's id.
  pub id: NodeId,
  /// The parent (`None` = top level). The adapter owns this and the sibling order.
  pub parent: Option<NodeId>,
  /// The children, in order.
  pub children: Vec<NodeId>,
  /// The node's name (what the layers panel shows).
  pub name: String,
  /// The node's kind (the discriminant plus its payload).
  pub kind: NodeKind,
  /// Whether the node renders.
  pub visible: bool,
  /// Whether the node is locked against selection.
  pub locked: bool,
  /// The node's transform in the scene.
  pub transform: Transform,
  /// The media file the node shows, when it shows one.
  pub media: Option<MediaRef>,
  /// The editor's own JSON for this node (poses, animations, effects, graph edges) — the honest
  /// carrier for everything richer than the shared fields, last-writer-wins.
  pub payload: serde_json::Value,
}

impl SceneNode {
  /// A fresh node of `kind` with default geometry and an empty payload.
  fn fresh(id: NodeId, kind: NodeKind, name: &str) -> Self {
    Self { id, parent: None, children: Vec::new(), name: name.to_owned(), kind, visible: true, locked: false, transform: Transform::default(), media: None, payload: serde_json::Value::Null }
  }
}

/// One entry of the shared job log — the shape of a row in the `tasks` table
/// (`crates/schema/database/sqlite_tasks`, migration `20250708000000_create_tasks_table.sql`),
/// with the typed enums carried as their wire strings. The per-provider queue URLs, the
/// frontend-subscriber plumbing and the derived CDN/thumbnail columns stay local to the client
/// that owns them: they are plumbing or derivable from the media token, not shared state.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct JobLogEntry {
  /// The task id (the table's primary key; the entry's identity).
  pub id: String,
  /// The `TaskStatus` wire string (pending, started, complete_success, ...).
  pub status: String,
  /// The `TaskType` wire string (image_generation, video_generation, ...).
  pub task_type: String,
  /// The `TaskModelType` wire string (flux_1_dev, veo_2, ...), when the task carries one.
  pub model_type: Option<String>,
  /// The `GenerationProvider` wire string (artcraft, fal, sora, ...).
  pub provider: String,
  /// The job's id in the provider's system.
  pub provider_job_id: Option<String>,
  /// The prompt record the task was enqueued with, when it has one.
  pub prompt_token: Option<String>,
  /// The media token of the primary result, when the task completed.
  pub on_complete_primary_media_file_token: Option<String>,
  /// The batch token of the result collection, when there is one.
  pub on_complete_batch_token: Option<String>,
  /// The `TaskFailureType` wire string, when the task failed.
  pub on_failure_type: Option<String>,
  /// The human-readable failure message, when there is one.
  pub on_failure_message: Option<String>,
  /// When the task was created (unix seconds — the table's `unixepoch`).
  pub created_at: i64,
  /// When the task last changed (unix seconds).
  pub updated_at: i64,
  /// When the task completed (unix seconds).
  pub completed_at: Option<i64>,
}

/// One entry of the team-output feed — a completed generation shared with the team: what the
/// generation feed renders (the media token it plays, the model and provider that made it, the
/// prompt that asked for it, who made it, and when).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct TeamOutput {
  /// The generated media file's token (the entry's identity).
  pub media_token: String,
  /// The media class of the result (image, video, mesh, splat, ...).
  pub class: String,
  /// The model that made it (the `TaskModelType` wire string).
  pub model: String,
  /// The provider that ran it (the `GenerationProvider` wire string).
  pub provider: String,
  /// The raw inference text that asked for it.
  pub prompt: String,
  /// The creating user's token.
  pub author: String,
  /// When it was created (unix seconds).
  pub created_at: i64,
}

/// One referenced media file — the project's asset table, keyed by the media-file token.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct Reference {
  /// The media-file token (the entry's identity).
  pub token: String,
  /// The media class (the real `MediaFileClass` wire strings).
  pub class: String,
  /// The SHA-256 of the file's bytes, when known — the asset channel's id.
  pub sha256: Option<String>,
  /// The file's title, when it has one.
  pub title: Option<String>,
}

/// An `artcraft.project` document — the Rust-side model of what the web UI saves as a JSON
/// media file and what a collaboration session shares.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct Project {
  /// The document's title (the media file's `maybe_title`).
  pub title: String,
  /// Which of the five real project kinds this document is.
  pub project_type: ProjectType,
  /// The nodes, by id.
  pub nodes: BTreeMap<NodeId, SceneNode>,
  /// The top-level nodes, in order.
  pub root: Vec<NodeId>,
  /// The referenced media files (the `references` property of the GOPM document).
  pub references: Vec<Reference>,
  /// The shared job log (the `tasks` table's shape).
  pub job_log: Vec<JobLogEntry>,
  /// The shared team-output feed.
  pub team_outputs: Vec<TeamOutput>,
  /// The next local id (ids never repeat: allocation continues above the highest ever used).
  pub next_id: u64,
}

impl Project {
  /// A fresh, empty project of `project_type`.
  #[must_use]
  pub fn new(title: &str, project_type: ProjectType) -> Self {
    Self { title: title.to_owned(), project_type, nodes: BTreeMap::new(), root: Vec::new(), references: Vec::new(), job_log: Vec::new(), team_outputs: Vec::new(), next_id: 1 }
  }

  /// The node with id `id`, if it exists.
  #[must_use]
  pub fn node(&self, id: NodeId) -> Option<&SceneNode> {
    self.nodes.get(&id)
  }

  /// The node with id `id`, mutably, if it exists.
  pub fn node_mut(&mut self, id: NodeId) -> Option<&mut SceneNode> {
    self.nodes.get_mut(&id)
  }

  /// Whether the project contains `id`.
  #[must_use]
  pub fn contains(&self, id: NodeId) -> bool {
    self.nodes.contains_key(&id)
  }

  /// Every node, in id order.
  pub fn nodes(&self) -> impl Iterator<Item = &SceneNode> {
    self.nodes.values()
  }

  /// The whole subtree of `id` (excluding `id` itself).
  #[must_use]
  pub fn subtree(&self, id: NodeId) -> Vec<NodeId> {
    let mut out = Vec::new();
    let mut stack: Vec<NodeId> = self.node(id).map_or_else(Vec::new, |n| n.children.clone());
    while let Some(next) = stack.pop() {
      out.push(next);
      if let Some(node) = self.node(next) {
        stack.extend(node.children.iter().copied());
      }
    }
    out
  }

  /// Allocate the next local id (space 0: file ids, exactly as the core's P2 rule wants).
  fn allocate(&mut self) -> NodeId {
    let id = NodeId(self.next_id);
    self.next_id += 1;
    id
  }

  /// Create a node of `kind` under `parent` (the root when `None`), inserted at `at`, and
  /// return its id.
  pub fn create_at(&mut self, parent: Option<NodeId>, kind: NodeKind, name: &str, at: usize) -> Result<NodeId, String> {
    if let Some(p) = parent {
      if !self.nodes.contains_key(&p) {
        return Err(format!("no parent {p:?}"));
      }
    }
    let id = self.allocate();
    let mut node = SceneNode::fresh(id, kind, name);
    node.parent = parent;
    let siblings: &mut Vec<NodeId> = match parent {
      Some(p) => match self.node_mut(p) {
        Some(n) => &mut n.children,
        None => return Err(format!("no parent {p:?}")),
      },
      None => &mut self.root,
    };
    let at = at.min(siblings.len());
    siblings.insert(at, id);
    self.nodes.insert(id, node);
    Ok(id)
  }

  /// Create a node of `kind` under `parent`, appended at the end.
  pub fn create(&mut self, parent: Option<NodeId>, kind: NodeKind, name: &str) -> Result<NodeId, String> {
    let at = match parent {
      Some(p) => self.node(p).map_or(0, |n| n.children.len()),
      None => self.root.len(),
    };
    self.create_at(parent, kind, name, at)
  }

  /// Remove the subtree rooted at `id` (children go with their parent).
  pub fn remove(&mut self, id: NodeId) -> Result<(), String> {
    let Some(node) = self.nodes.get(&id) else {
      return Ok(()); // removing a removed node does nothing
    };
    let parent = node.parent;
    let doomed = self.subtree(id);
    match parent {
      Some(p) => {
        if let Some(p) = self.node_mut(p) {
          p.children.retain(|c| *c != id);
        }
      },
      None => self.root.retain(|c| *c != id),
    }
    self.nodes.remove(&id);
    for d in doomed {
      self.nodes.remove(&d);
    }
    Ok(())
  }

  /// Move the subtree rooted at `id` under `parent` (the root when `None`), at index `at`.
  pub fn place(&mut self, id: NodeId, parent: Option<NodeId>, at: usize) -> Result<(), String> {
    if parent == Some(id) {
      return Err("a node cannot become its own parent".to_owned());
    }
    if let Some(p) = parent {
      if self.subtree(id).contains(&p) {
        return Err("a node cannot move under its own subtree".to_owned());
      }
    }
    let Some(node) = self.nodes.get(&id) else {
      return Err(format!("no node {id:?}"));
    };
    let old_parent = node.parent;
    if old_parent == parent {
      // Same parent: this is a reorder.
      return self.reorder(id, at);
    }
    if let Some(p) = parent {
      if !self.nodes.contains_key(&p) {
        return Err(format!("no parent {p:?}"));
      }
    }
    match old_parent {
      Some(p) => {
        if let Some(p) = self.node_mut(p) {
          p.children.retain(|c| *c != id);
        }
      },
      None => self.root.retain(|c| *c != id),
    }
    let siblings: &mut Vec<NodeId> = match parent {
      Some(p) => match self.node_mut(p) {
        Some(n) => &mut n.children,
        None => return Err(format!("no parent {p:?}")),
      },
      None => &mut self.root,
    };
    let at = at.min(siblings.len());
    siblings.insert(at, id);
    if let Some(node) = self.node_mut(id) {
      node.parent = parent;
    }
    Ok(())
  }

  /// Move `id` to index `at` among its current siblings.
  pub fn reorder(&mut self, id: NodeId, at: usize) -> Result<(), String> {
    let Some(node) = self.nodes.get(&id) else {
      return Err(format!("no node {id:?}"));
    };
    let parent = node.parent;
    let siblings: &mut Vec<NodeId> = match parent {
      Some(p) => match self.node_mut(p) {
        Some(n) => &mut n.children,
        None => return Err(format!("no parent {p:?}")),
      },
      None => &mut self.root,
    };
    let current = siblings.iter().position(|c| *c == id);
    let Some(current) = current else {
      return Err(format!("node {id:?} is not among its parent's children"));
    };
    siblings.remove(current);
    let at = at.min(siblings.len());
    siblings.insert(at, id);
    Ok(())
  }
}

// — The adapter ——————————————————————————————————————————————————————————————

/// The adapter: document binding, sibling keys and presence projection in one value.
///
/// The sibling position keys are adapter state, exactly as they were the FigCraft v2 `Replica`'s
/// state (spec §2.3: "existing documents take keys by their current order at first sync"). They
/// sit behind a mutex so the adapter stays shareable; a session owns one adapter per open
/// project, and the family's document discipline is single-threaded per session, so contention
/// is not a concern — correctness is.
pub struct ArtcraftHub {
  schema: schema::ArtcraftSchema,
  positions: Mutex<BTreeMap<NodeId, String>>,
}

impl ArtcraftHub {
  /// A fresh adapter with the default limits and an empty key map.
  #[must_use]
  pub fn new() -> Self {
    Self { schema: schema::ArtcraftSchema::default(), positions: Mutex::new(BTreeMap::new()) }
  }

  /// The sibling key of `id`, if one has been assigned.
  #[must_use]
  pub fn position_key(&self, id: NodeId) -> Option<String> {
    self.positions.lock().unwrap_or_else(|e| e.into_inner()).get(&id).cloned()
  }

  /// The generic id of a document id (same 64-bit packing: client space in the high half).
  #[must_use]
  pub fn hub_id(id: NodeId) -> HubId {
    HubId(id.0)
  }

  /// The document id of a generic id.
  #[must_use]
  pub fn doc_id(id: HubId) -> NodeId {
    NodeId(id.0)
  }

  /// Assign sibling keys to every node that has none, by current order (the first-sync rule).
  fn first_sync_keys(&self, doc: &Project) {
    let mut positions = self.positions.lock().unwrap_or_else(|e| e.into_inner());
    let missing_root: Vec<NodeId> = doc.root.iter().copied().filter(|n| !positions.contains_key(n)).collect();
    if !missing_root.is_empty() {
      if let Ok(keys) = frac::n_between(None, None, missing_root.len()) {
        for (id, key) in missing_root.into_iter().zip(keys) {
          positions.insert(id, key);
        }
      }
    }
    for node in doc.nodes() {
      let Some(parent) = node.parent else {
        continue;
      };
      let siblings = doc.node(parent).map_or(&[][..], |p| &p.children);
      let missing: Vec<NodeId> = siblings.iter().copied().filter(|c| !positions.contains_key(c)).collect();
      if !missing.is_empty() {
        if let Ok(keys) = frac::n_between(None, None, missing.len()) {
          for (id, key) in missing.into_iter().zip(keys) {
            positions.insert(id, key);
          }
        }
      }
    }
  }

  /// The children of `parent` in document order (`doc.root` for the root).
  fn children_of(doc: &Project, parent: HubId) -> Vec<NodeId> {
    if parent == ROOT {
      doc.root.clone()
    } else {
      doc.node(Self::doc_id(parent)).map_or_else(Vec::new, |n| n.children.clone())
    }
  }

  /// Sort one parent's children by `(key, id)` after a key change, in the document itself.
  fn reorder_children(doc: &mut Project, parent: HubId, keys: &BTreeMap<NodeId, String>) {
    let rank = |id: &NodeId| (keys.get(id).cloned().unwrap_or_default(), *id);
    if parent == ROOT {
      doc.root.sort_by_key(rank);
    } else if let Some(p) = doc.node_mut(Self::doc_id(parent)) {
      p.children.sort_by_key(rank);
    }
  }

  /// The insertion index for `(key, id)` among `siblings` ordered by `(key, id)`.
  fn insertion_index(keys: &BTreeMap<NodeId, String>, siblings: &[NodeId], id: NodeId, key: &str) -> usize {
    siblings.iter().filter(|s| (keys.get(*s).cloned().unwrap_or_default(), **s) < (key.to_owned(), id)).count()
  }

  /// Record `key` for `id`.
  fn set_key(&self, id: NodeId, key: String) {
    self.positions.lock().unwrap_or_else(|e| e.into_inner()).insert(id, key);
  }

  /// Drop the keys of a subtree (before the document forgets it).
  fn drop_keys(&self, doc: &Project, id: NodeId) {
    let mut doomed = vec![id];
    doomed.extend(doc.subtree(id));
    let mut positions = self.positions.lock().unwrap_or_else(|e| e.into_inner());
    for d in doomed {
      positions.remove(&d);
    }
  }

  /// Diff one parent's child order between two documents, assigning fresh keys to the moved and
  /// inserted children while the longest rising run of old keys keeps its keys (the pilot's
  /// discipline: only the children that must move get new keys, so an insertion in the middle
  /// costs one key, not a renumbering). Emits `Set(position)` and `Set(parent)` changes into
  /// `out`.
  fn diff_order(&self, before: &Project, after: &Project, parent: HubId, out: &mut Vec<Change>) {
    let old = Self::children_of(before, parent);
    let new = Self::children_of(after, parent);
    if old == new {
      return;
    }
    let mut positions = self.positions.lock().unwrap_or_else(|e| e.into_inner());
    // First-sync rule: children of the before-order without keys take them by order.
    let unkeyed: Vec<NodeId> = old.iter().copied().filter(|c| !positions.contains_key(c)).collect();
    if !unkeyed.is_empty() {
      if let Ok(fresh) = frac::n_between(None, None, unkeyed.len()) {
        for (id, key) in unkeyed.into_iter().zip(fresh) {
          positions.insert(id, key);
        }
      }
    }
    // The longest strictly-rising run of keys over the new order, counting only children that
    // already have keys AND already belonged to this parent (a child new to this parent —
    // created or moved in — always takes a fresh key).
    let has_key = |c: &NodeId| positions.contains_key(c);
    let old_member = |c: &NodeId| old.contains(c);
    let n = new.len();
    let mut len = vec![0usize; n];
    let mut prev = vec![usize::MAX; n];
    let mut best_end = None;
    let mut best_len = 0usize;
    for i in 0..n {
      if has_key(&new[i]) && old_member(&new[i]) {
        len[i] = 1;
        for j in 0..i {
          if has_key(&new[j]) && old_member(&new[j]) && positions.get(&new[j]).is_some_and(|a| positions.get(&new[i]).is_some_and(|b| a < b)) && len[j] + 1 > len[i] {
            len[i] = len[j] + 1;
            prev[i] = j;
          }
        }
        if len[i] > best_len {
          best_len = len[i];
          best_end = Some(i);
        }
      }
    }
    let mut kept = vec![false; n];
    let mut walk = best_end;
    while let Some(i) = walk {
      kept[i] = true;
      walk = if prev[i] == usize::MAX { None } else { Some(prev[i]) };
    }
    // Walk the new order; assign fresh keys to runs of not-kept children between the kept
    // neighbours (the key of the kept child before the run and the one after it).
    fn flush(pending: &mut Vec<NodeId>, prev_key: Option<&str>, next_key: Option<&str>, positions: &mut BTreeMap<NodeId, String>, out: &mut Vec<Change>) {
      if pending.is_empty() {
        return;
      }
      let count = pending.len();
      if let Ok(fresh) = frac::n_between(prev_key, next_key, count) {
        for (id, key) in pending.drain(..).zip(fresh) {
          positions.insert(id, key.clone());
          out.push(Change::Set { id: ArtcraftHub::hub_id(id), prop: Arc::from("position"), value: Value::Json(serde_json::Value::String(key)) });
        }
      }
    }
    let mut last_kept_key: Option<String> = None;
    let mut pending: Vec<NodeId> = Vec::new();
    for (i, c) in new.iter().enumerate() {
      if kept[i] {
        let next_key = positions.get(c).cloned();
        flush(&mut pending, last_kept_key.as_deref(), next_key.as_deref(), &mut positions, out);
        last_kept_key = positions.get(c).cloned();
      } else {
        pending.push(*c);
      }
    }
    flush(&mut pending, last_kept_key.as_deref(), None, &mut positions, out);
    // Children that changed parent get the parent write after their key.
    for c in &new {
      if let (Some(b), Some(a)) = (before.node(*c), after.node(*c)) {
        if b.parent != a.parent {
          let p = a.parent.map_or(ROOT, Self::hub_id);
          out.push(Change::Set { id: Self::hub_id(*c), prop: Arc::from("parent"), value: Value::Json(serde_json::Value::Number(p.0.into())) });
        }
      }
    }
  }
}

impl Default for ArtcraftHub {
  fn default() -> Self {
    Self::new()
  }
}

impl HubAdapter for ArtcraftHub {
  type Doc = Project;

  fn view(&self, doc: &Project) -> DocumentView {
    self.first_sync_keys(doc);
    let positions = self.positions.lock().unwrap_or_else(|e| e.into_inner());
    let key = |id: &NodeId| positions.get(id).cloned().unwrap_or_default();
    let mut nodes = Vec::new();
    let mut stack: Vec<NodeId> = doc.root.iter().rev().copied().collect();
    while let Some(id) = stack.pop() {
      let Some(node) = doc.node(id) else {
        continue;
      };
      let props = props::NODE_PROPS.iter().filter_map(|p| props::field_value(node, p).map(|v| (Arc::from(*p), v))).collect();
      nodes.push(ViewNode { id: Self::hub_id(id), kind: Arc::from(node.kind.to_str()), parent: node.parent.map_or(ROOT, Self::hub_id), position: key(&id), props });
      stack.extend(node.children.iter().rev().copied());
    }
    let entries = schema::entry_values(doc);
    let doc_props = props::DOC_PROPS.iter().filter_map(|p| props::doc_prop_value(doc, p).map(|v| ((*p).to_owned(), v))).collect();
    DocumentView { nodes, entries, doc: doc_props }
  }

  fn apply(&self, doc: &mut Project, changes: &[Change]) -> ApplyReport {
    let mut report = ApplyReport::default();
    for change in changes {
      match change {
        Change::Create { id, kind, parent, position, props } => {
          let doc_id = Self::doc_id(*id);
          // The full node kind rides the `kind` property; the discriminant string is for
          // validation and display.
          let node_kind = props.iter().find(|(p, _)| p.as_ref() == "kind").and_then(|(_, v)| serde_json::from_value::<NodeKind>(v.to_json()).ok()).or_else(|| NodeKind::from_wire(kind));
          let Some(node_kind) = node_kind else {
            report.skipped += 1;
            continue;
          };
          let mut node = SceneNode::fresh(doc_id, node_kind, "");
          for (p, v) in props {
            if p.as_ref() == "parent" || p.as_ref() == "position" {
              continue;
            }
            match props::set_field(&mut node, p, v) {
              Some(Ok(())) => report.applied += 1,
              Some(Err(_)) | None => report.skipped += 1,
            }
          }
          self.set_key(doc_id, position.clone());
          let keys = self.positions.lock().unwrap_or_else(|e| e.into_inner()).clone();
          let parent_id = (*parent != ROOT).then(|| Self::doc_id(*parent));
          let siblings = Self::children_of(doc, *parent);
          let at = Self::insertion_index(&keys, &siblings, doc_id, position);
          node.parent = parent_id;
          let inserted = match parent_id {
            None => {
              let at = at.min(doc.root.len());
              doc.root.insert(at, doc_id);
              doc.nodes.insert(doc_id, node);
              doc.next_id = doc.next_id.max(doc_id.0 + 1);
              true
            },
            Some(p) => {
              if doc.contains(p) {
                let at = at.min(doc.node(p).map_or(0, |n| n.children.len()));
                if let Some(p) = doc.node_mut(p) {
                  p.children.insert(at, doc_id);
                }
                doc.nodes.insert(doc_id, node);
                doc.next_id = doc.next_id.max(doc_id.0 + 1);
                true
              } else {
                false
              }
            },
          };
          if inserted {
            report.applied += 1;
            Self::reorder_children(doc, *parent, &keys);
          } else {
            report.skipped += 1;
          }
        },
        Change::Set { id, prop, value } => {
          let doc_id = Self::doc_id(*id);
          if prop.as_ref() == "position" {
            if let Value::Json(serde_json::Value::String(key)) = value {
              let parent = doc.node(doc_id).and_then(|n| n.parent).map_or(ROOT, Self::hub_id);
              self.set_key(doc_id, key.clone());
              let keys = self.positions.lock().unwrap_or_else(|e| e.into_inner()).clone();
              Self::reorder_children(doc, parent, &keys);
              report.applied += 1;
            } else {
              report.skipped += 1;
            }
          } else if prop.as_ref() == "parent" {
            match value.to_json().as_u64().map(HubId) {
              Some(p) => {
                let target = (p != ROOT).then(|| Self::doc_id(p));
                if target.is_some() && !doc.contains(target.unwrap_or(NodeId(0))) {
                  report.skipped += 1; // no such parent: skip, never panic
                  continue;
                }
                let keys = self.positions.lock().unwrap_or_else(|e| e.into_inner()).clone();
                let key = keys.get(&doc_id).cloned().unwrap_or_default();
                let siblings = Self::children_of(doc, p);
                let at = Self::insertion_index(&keys, &siblings, doc_id, &key);
                match doc.place(doc_id, target, at) {
                  Ok(()) => report.applied += 1,
                  Err(_) => report.skipped += 1,
                }
              },
              None => report.skipped += 1,
            }
          } else if let Some(node) = doc.node_mut(doc_id) {
            match props::set_field(node, prop, value) {
              Some(Ok(())) => report.applied += 1,
              Some(Err(_)) | None => report.skipped += 1,
            }
          } else {
            report.skipped += 1;
          }
        },
        Change::Delete { id } => {
          let doc_id = Self::doc_id(*id);
          if doc.contains(doc_id) {
            self.drop_keys(doc, doc_id);
            if doc.remove(doc_id).is_ok() {
              report.applied += 1;
            } else {
              report.skipped += 1;
            }
          }
          // Deleting a deleted node does nothing (the pilot's tolerance rule, kept).
        },
        Change::SetDoc { prop, value } => {
          let routed = props::set_doc_prop(doc, prop, value).or_else(|| schema::set_doc_order(doc, prop, value));
          match routed {
            Some(Ok(())) => report.applied += 1,
            Some(Err(_)) | None => report.skipped += 1,
          }
        },
        Change::Put { entry, value } => match schema::put_entry(doc, entry, value) {
          Ok(()) => report.applied += 1,
          Err(_) => report.skipped += 1,
        },
        Change::Remove { entry } => match schema::remove_entry(doc, entry) {
          Ok(()) => report.applied += 1,
          Err(_) => report.skipped += 1,
        },
      }
    }
    report
  }

  fn diff(&self, before: &Project, after: &Project) -> Vec<Change> {
    let mut sets = Vec::new();
    let mut creates = Vec::new();

    // Field sets and creations, walking the after-tree parents-first (the DFS order the batch
    // must carry: a `Create` never precedes its parent's). Only true property differences emit
    // changes, so the batch stays edit-sized.
    let mut stack: Vec<NodeId> = after.root.iter().rev().copied().collect();
    while let Some(id) = stack.pop() {
      let Some(node) = after.node(id) else {
        continue;
      };
      stack.extend(node.children.iter().rev().copied());
      match before.node(id) {
        Some(b) => {
          for prop in props::NODE_PROPS {
            if props::field_differs(b, node, prop).unwrap_or(false) {
              if let Some(v) = props::field_value(node, prop) {
                sets.push(Change::Set { id: Self::hub_id(id), prop: Arc::from(*prop), value: v });
              }
            }
          }
        },
        None => {
          // A creation: the whole node (the order pass below assigns its key).
          let props_vec = props::NODE_PROPS.iter().filter_map(|p| props::field_value(node, p).map(|v| (Arc::from(*p), v))).collect();
          creates.push(Change::Create { id: Self::hub_id(id), kind: Arc::from(node.kind.to_str()), parent: node.parent.map_or(ROOT, Self::hub_id), position: String::new(), props: props_vec });
        },
      }
    }

    // Deletions: one Delete per subtree root (children of a deleted node need none).
    let gone: Vec<NodeId> = before.nodes().map(|n| n.id).filter(|id| !after.contains(*id)).collect();
    let deletes: Vec<Change> = gone
      .iter()
      .filter(|id| {
        let parent_also_gone = before.node(**id).and_then(|n| n.parent).is_some_and(|p| gone.contains(&p));
        !parent_also_gone
      })
      .map(|id| Change::Delete { id: Self::hub_id(*id) })
      .collect();

    // Order and moves per parent (root first, then every parent that still exists).
    let mut order_changes = Vec::new();
    let mut parents: Vec<HubId> = vec![ROOT];
    parents.extend(before.nodes().map(|n| Self::hub_id(n.id)).filter(|i| *i != ROOT));
    for node in after.nodes() {
      let id = Self::hub_id(node.id);
      if id != ROOT && !parents.contains(&id) {
        parents.push(id);
      }
    }
    for parent in parents {
      if parent == ROOT || after.contains(Self::doc_id(parent)) {
        self.diff_order(before, after, parent, &mut order_changes);
      }
    }

    // The creations' keys, now that the order pass has assigned them.
    let positions = self.positions.lock().unwrap_or_else(|e| e.into_inner());
    for create in &mut creates {
      if let Change::Create { id, position, .. } = create {
        *position = positions.get(&Self::doc_id(*id)).cloned().unwrap_or_default();
      }
    }

    // Document-level scalars and entries.
    let mut doc_level = Vec::new();
    for prop in props::DOC_PROPS {
      if props::doc_prop_value(before, prop) != props::doc_prop_value(after, prop) {
        if let Some(v) = props::doc_prop_value(after, prop) {
          doc_level.push(Change::SetDoc { prop: Arc::from(*prop), value: v });
        }
      }
    }
    doc_level.extend(schema::diff_entries(before, after));

    // Batch order (§2.3): field writes, creations (parents first), moves, deletes, doc level.
    let mut batch = sets;
    batch.append(&mut creates);
    batch.append(&mut order_changes);
    batch.extend(deletes);
    batch.append(&mut doc_level);
    batch
  }

  fn presence(&self, _doc: &Project, ui: &UiState) -> Option<craft_collab::presence::PresenceMsg> {
    Some(craft_collab::presence::PresenceMsg {
      cursor: ui.cursor,
      page: None, // one canvas per project: Artcraft has no pages to be on
      selection: ui.selection.clone(),
      viewport: ui.viewport,
      editing_text: None,                // the editors carry no text-caret state today
      playhead: ui.playhead,             // the video timeline's playhead, when one is open
      track_range: None,                 // region locks (§6.7) arrive with the wiring PR
      generating: ui.generating.clone(), // Artcraft's row: the in-flight generation job (id, model)
    })
  }

  fn schema(&self) -> &dyn craft_collab::adapter::DocSchema {
    &self.schema
  }
}
