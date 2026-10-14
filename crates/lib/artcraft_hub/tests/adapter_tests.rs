//! The adapter's ported convergence suite (CraftHub spec §3.6 phase B: "with its entire
//! convergence tests ported as a literal suite — the family's most valuable testing asset").
//!
//! Every test works over the real project model, driven through its public API, and the
//! guarantee under test is the pilot's own: `apply(diff(a, b), a) == b`, with positions, for
//! real edits — plus the two-client convergence of the generic state when both sides edit.

// Tests may unwrap: a failing assertion is the point of a test (the family's clippy rule).
#![allow(clippy::unwrap_used, clippy::expect_used, clippy::panic)]

use craft_collab::adapter::HubAdapter;
use craft_collab::change::Change;

use artcraft_hub::{ArtcraftHub, JobLogEntry, MediaRef, NodeId, NodeKind, Project, ProjectType, Reference, TeamOutput, UiState};

fn sample() -> Project {
  let mut doc = Project::new("product shot", ProjectType::Scene3d);
  let camera = doc.create(None, NodeKind::Camera { focal_length: 85.0, height: 1.6 }, "Camera").unwrap();
  doc.create(None, NodeKind::Skybox, "Skybox").unwrap();
  let group = doc.create(None, NodeKind::Group, "Subjects").unwrap();
  let subject = doc.create(Some(group), NodeKind::Object, "Hero bottle").unwrap();
  doc.node_mut(subject).unwrap().media = Some(MediaRef { token: "media_file_1".into(), class: "image".into(), sha256: Some("aa11".into()) });
  let plate = doc.create(Some(group), NodeKind::Object, "Reference plane").unwrap();
  doc.node_mut(plate).unwrap().transform.location = [2.0, 0.0, -1.0];
  doc.create(Some(group), NodeKind::Character, "Pose stand-in").unwrap();
  let loose = doc.create(None, NodeKind::Object, "Loose prop").unwrap();
  doc.node_mut(loose).unwrap().visible = false;
  // The camera starts the shot framing: it stays top-level, so reference it once.
  doc.node_mut(camera).unwrap().transform.rotation = [0.0, 0.4, 0.0];
  // The two shared inputs.
  doc.references.push(Reference { token: "media_file_1".into(), class: "image".into(), sha256: Some("aa11".into()), title: Some("hero.png".into()) });
  doc.job_log.push(JobLogEntry { id: "task_1".into(), status: "complete_success".into(), task_type: "image_generation".into(), model_type: Some("flux_1_dev".into()), provider: "artcraft".into(), provider_job_id: Some("job_9".into()), prompt_token: Some("prompt_1".into()), on_complete_primary_media_file_token: Some("media_file_2".into()), on_complete_batch_token: None, on_failure_type: None, on_failure_message: None, created_at: 1_000, updated_at: 1_500, completed_at: Some(1_500) });
  doc.team_outputs.push(TeamOutput { media_token: "media_file_2".into(), class: "image".into(), model: "flux_1_dev".into(), provider: "artcraft".into(), prompt: "a hero bottle on marble, studio light".into(), author: "user_1".into(), created_at: 1_500 });
  doc
}

fn node_by_name(doc: &Project, name: &str) -> NodeId {
  doc.nodes().find(|n| n.name == name).map(|n| n.id).unwrap()
}

fn assert_same_state(hub: &ArtcraftHub, a: &Project, b: &Project, what: &str) {
  let (va, vb) = (hub.view(a), hub.view(b));
  assert_eq!(va.nodes.len(), vb.nodes.len(), "{what}: node count");
  for (na, nb) in va.nodes.iter().zip(vb.nodes.iter()) {
    assert_eq!(na.id, nb.id, "{what}: node id");
    assert_eq!(na.kind, nb.kind, "{what}: kind of {na:?}");
    assert_eq!(na.parent, nb.parent, "{what}: parent of {na:?}");
    assert_eq!(na.position, nb.position, "{what}: position of {na:?}");
    assert_eq!(na.props, nb.props, "{what}: props of {na:?}");
  }
  assert_eq!(va.entries, vb.entries, "{what}: entries");
  assert_eq!(va.doc, vb.doc, "{what}: doc props");
}

/// The pilot's core promise, kept: applying the diff of two projects to the first makes it the
/// second — edits, creations, deletions, moves, reorders, media swaps, payload edits, document
/// scalars, and all three entry lists.
#[test]
fn apply_diff_roundtrip() {
  let hub = ArtcraftHub::new();
  let a = sample();
  let mut b = a.clone();

  // Field edits.
  let hero = node_by_name(&b, "Hero bottle");
  let hero_node = b.node_mut(hero).unwrap();
  hero_node.name = "Renamed bottle".into();
  hero_node.transform.location = [1.0, 2.0, 3.0];
  hero_node.visible = false;
  hero_node.media = Some(MediaRef { token: "media_file_3".into(), class: "mesh".into(), sha256: Some("bb22".into()) });
  hero_node.payload = serde_json::json!({ "pose": "three-quarter" });

  // Creation, deletion, move, reorder.
  let group = node_by_name(&b, "Subjects");
  b.create_at(Some(group), NodeKind::Object, "New prop", 2).unwrap();
  b.remove(node_by_name(&b, "Loose prop")).unwrap();
  let plate = node_by_name(&b, "Reference plane");
  b.place(plate, None, 0).unwrap(); // out of the group, to the top level
  b.reorder(node_by_name(&b, "New prop"), 0).unwrap();

  // Document level.
  b.title = "renamed project".into();
  b.references[0].title = Some("hero-final.png".into());
  b.team_outputs.push(TeamOutput { media_token: "media_file_4".into(), class: "image".into(), model: "nano_banana".into(), provider: "fal".into(), prompt: "one more take".into(), author: "user_2".into(), created_at: 2_000 });
  b.job_log[0].status = "started".into();

  let changes = hub.diff(&a, &b);
  assert!(!changes.is_empty());

  let mut applied = a.clone();
  hub.apply(&mut applied, &changes);
  assert_same_state(&hub, &applied, &b, "roundtrip");
  // The roundtrip is stable: diffing again finds nothing.
  assert!(hub.diff(&applied, &b).is_empty(), "the applied state diffs clean against the target");
}

/// An insertion in the middle costs one position key — the siblings keep theirs.
#[test]
fn insertion_in_the_middle_costs_one_key() {
  let hub = ArtcraftHub::new();
  let a = sample();
  let mut b = a.clone();
  let group = node_by_name(&b, "Subjects");
  b.create_at(Some(group), NodeKind::Object, "Middle", 1).unwrap();

  let changes = hub.diff(&a, &b);
  let positions = changes.iter().filter(|c| matches!(c, Change::Set { prop, .. } if prop.as_ref() == "position")).count();
  let creates = changes.iter().filter(|c| matches!(c, Change::Create { .. })).count();
  assert_eq!(creates, 1, "one created node");
  assert_eq!(positions, 1, "exactly one position write: the inserted node");

  let mut applied = a.clone();
  hub.apply(&mut applied, &changes);
  assert_same_state(&hub, &applied, &b, "insert");
  // And the middle child really sits in the middle.
  let children = applied.node(node_by_name(&applied, "Subjects")).unwrap().children.clone();
  assert_eq!(applied.node(children[1]).unwrap().name, "Middle");
}

/// Two clients editing different fields of the same node converge (the server orders the
/// batches; last-writer-wins per property, and neither side loses the other's write).
#[test]
fn two_clients_converge() {
  let hub = ArtcraftHub::new();
  let base = sample();

  let mut local = base.clone();
  let mut remote = base.clone();
  let hero_l = node_by_name(&local, "Hero bottle");
  let hero_r = node_by_name(&remote, "Hero bottle");
  local.node_mut(hero_l).unwrap().name = "Local name".into();
  remote.node_mut(hero_r).unwrap().transform.scale = [2.0, 2.0, 2.0];

  let local_batch = hub.diff(&base, &local);
  let remote_batch = hub.diff(&base, &remote);
  assert_eq!(local_batch.len(), 1);
  assert_eq!(remote_batch.len(), 1);

  // Both sides receive both batches (the server echoes each to everyone).
  hub.apply(&mut local, &remote_batch);
  hub.apply(&mut remote, &local_batch);
  assert_same_state(&hub, &local, &remote, "convergence");
}

/// A subtree delete is one change, and deleting a deleted node does nothing.
#[test]
fn subtree_delete_is_one_change() {
  let hub = ArtcraftHub::new();
  let a = sample();
  let mut b = a.clone();
  b.remove(node_by_name(&b, "Subjects")).unwrap();

  let changes = hub.diff(&a, &b);
  let deletes = changes.iter().filter(|c| matches!(c, Change::Delete { .. })).count();
  assert_eq!(deletes, 1, "one Delete for the whole subtree");

  let mut applied = a.clone();
  hub.apply(&mut applied, &changes);
  assert_same_state(&hub, &applied, &b, "delete");
  // Tolerant re-apply: deleting a deleted node does nothing (skipped, not an error).
  let report = hub.apply(&mut applied, &changes);
  assert_eq!(report.applied, 0);
}

/// The shared job log syncs per entry with its order (the keyed-list discipline, applied to
/// the `tasks`-shaped entries).
#[test]
fn job_log_syncs_with_order() {
  let hub = ArtcraftHub::new();
  let a = sample();
  let mut b = a.clone();
  b.job_log.push(JobLogEntry { id: "task_2".into(), status: "pending".into(), task_type: "video_generation".into(), model_type: Some("grok_video".into()), provider: "grok".into(), provider_job_id: None, prompt_token: None, on_complete_primary_media_file_token: None, on_complete_batch_token: None, on_failure_type: None, on_failure_message: None, created_at: 2_000, updated_at: 2_000, completed_at: None });
  b.job_log.swap(0, 1);

  let changes = hub.diff(&a, &b);
  let puts = changes.iter().filter(|c| matches!(c, Change::Put { .. })).count();
  let orders = changes.iter().filter(|c| matches!(c, Change::SetDoc { prop, .. } if prop.as_ref() == "jobLogOrder")).count();
  assert_eq!(puts, 1, "one Put for the new job");
  assert_eq!(orders, 1, "one order property for the swap");

  let mut applied = a.clone();
  hub.apply(&mut applied, &changes);
  assert_same_state(&hub, &applied, &b, "job log");
  assert_eq!(applied.job_log[0].id, "task_2", "the order swap landed");
  assert_eq!(applied.job_log[1].id, "task_1", "the existing job kept its place after the new one");
  assert_eq!(applied.job_log[1].status, "complete_success", "the untouched job is untouched");
}

/// The kind table is per project type: layers belong to the 2D editor, tracks to the timeline,
/// and unknown kinds refuse with a reason.
#[test]
fn schema_validates_kinds_and_parents() {
  use craft_collab::adapter::DocSchema;
  use craft_collab::replica::Replica;
  use std::sync::Arc;

  let schema = artcraft_hub::schema::ArtcraftSchema::default();
  let mut replica = Replica::default();
  replica.set_doc("projectType", craft_collab::value::Value::Json(serde_json::json!("scene_3d")));

  let ctx = craft_collab::adapter::ValidationCtx { replica: &replica, author_space: 1, limits: &craft_collab::Limits::default() };

  // An object at the top level of a scene_3d: accepted.
  let object_at_root = Change::Create { id: craft_collab::ids::NodeId::compose(1, 1), kind: Arc::from("object"), parent: artcraft_hub::ROOT, position: "a0".into(), props: vec![] };
  assert!(schema.validate(&object_at_root, &ctx).is_ok());

  // A layer at the top level of a scene_3d: refused (layers belong to the 2D editor).
  let layer_at_root = Change::Create { id: craft_collab::ids::NodeId::compose(1, 2), kind: Arc::from("layer"), parent: artcraft_hub::ROOT, position: "a1".into(), props: vec![] };
  assert!(schema.validate(&layer_at_root, &ctx).is_err());

  // An unknown kind: refused with a reason.
  let unknown_kind = Change::Create { id: craft_collab::ids::NodeId::compose(1, 3), kind: Arc::from("hologram"), parent: artcraft_hub::ROOT, position: "a2".into(), props: vec![] };
  assert!(schema.validate(&unknown_kind, &ctx).is_err());

  // An unknown project type on the document property: refused.
  let bad_type = Change::SetDoc { prop: Arc::from("projectType"), value: craft_collab::value::Value::Json(serde_json::json!("holodeck")) };
  assert!(schema.validate(&bad_type, &ctx).is_err());
}

/// The command catalog resolves the family names onto their `hub.*` twins (§18.10
/// compatibility).
#[test]
fn command_catalog_resolves_legacy_names() {
  assert_eq!(artcraft_hub::commands::resolve("collab.share").map(|c| c.name), Some("hub.share"));
  assert_eq!(artcraft_hub::commands::resolve("hub.peers").map(|c| c.name), Some("hub.peers"));
  assert!(artcraft_hub::commands::resolve("hub.teleport").is_none());
}

/// Artcraft's presence row carries the in-flight generation job: (job id, model) — §18.4 row
/// 12's projection, the field this app adds to the family's table.
#[test]
fn presence_carries_the_generation_job() {
  let hub = ArtcraftHub::new();
  let doc = sample();
  let ui = UiState { cursor: Some((120.0, 80.0)), selection: vec![craft_collab::ids::NodeId(7)], generating: Some(("job_9".to_owned(), "flux_1_dev".to_owned())), ..UiState::default() };

  let msg = hub.presence(&doc, &ui).unwrap();
  assert_eq!(msg.cursor, Some((120.0, 80.0)));
  assert_eq!(msg.selection, vec![craft_collab::ids::NodeId(7)]);
  assert_eq!(msg.generating.as_ref().map(|(job, model)| (job.as_str(), model.as_str())), Some(("job_9", "flux_1_dev")));
  assert_eq!(msg.page, None, "one canvas per project: no page to be on");

  let peer = artcraft_hub::presence::PeerView::from_ui(&ui);
  assert_eq!(peer.generating_badge().as_deref(), Some("job_9 \u{00b7} flux_1_dev"));
}
