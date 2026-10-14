//! The presence projection (CraftHub spec §6.1, §18.4 row 12): what Artcraft's live UI state
//! looks like on the wire, and what a peer's state renders as here. Presence is ephemeral — it
//! is never stored, never journalled, never saved (§2.7's rule, kept verbatim in v3).
//!
//! Artcraft's row in the per-app projection table: the cursor over the viewport, the selection,
//! the viewport rectangle (for follow mode), the video timeline's playhead (when a
//! `video_timeline` project is open), and **the in-flight generation job** — `generating:
//! (job id, model)`, the field this app adds to the family's projection (§18.4). A generation
//! job is long-running and progress-like, so it rides presence, not batches: peers see "Miles
//! is generating with flux_1_dev" as a live badge and nothing about it enters the document
//! until the backend reports the job into the shared job log.
//!
//! Artcraft has no pages (one canvas per project — the `page` field stays `None`, belonging to
//! the canvas and deck siblings) and no text-caret state today. Region locks (§6.7) arrive with
//! the wiring PR; the `track_range` field stays `None` here.

use craft_collab::adapter::UiState;
use craft_collab::ids::NodeId;

/// Everything the Artcraft UI needs to render one peer: the projection is a two-way street —
/// the same fields go out and come back.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct PeerView {
  /// The peer's cursor over the viewport.
  pub cursor: Option<(f64, f64)>,
  /// The peer's selection (outline highlights, never edit locks — §6.7 does locks).
  pub selection: Vec<NodeId>,
  /// The peer's viewport, offered to the follow mode.
  pub viewport: Option<(f64, f64, f64, f64)>,
  /// The video timeline's playhead (timeline ticks), when a timeline project is open.
  pub playhead: Option<u64>,
  /// The generation job the peer has in flight: (job id, model).
  pub generating: Option<(String, String)>,
}

impl PeerView {
  /// Project Artcraft's UI state into the fields the hub's `UiState` carries.
  ///
  /// The selection is bounded (§2.12: at most 10,000 ids) by the core's sanitizer, not here —
  /// the app reports what it truly has and the hub enforces the budget.
  #[must_use]
  pub fn from_ui(ui: &UiState) -> Self {
    Self { cursor: ui.cursor, selection: ui.selection.clone(), viewport: ui.viewport, playhead: ui.playhead, generating: ui.generating.clone() }
  }

  /// The badge text for the peer's in-flight generation, when there is one.
  #[must_use]
  pub fn generating_badge(&self) -> Option<String> {
    self.generating.as_ref().map(|(job, model)| format!("{job} \u{00b7} {model}"))
  }
}
