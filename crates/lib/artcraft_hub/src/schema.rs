//! The document knowledge the hub validates against (spec §3.6 phase A: `DocSchema`): which
//! kinds exist, which parents accept children, which kinds belong to which project type, and
//! the three per-entry document lists — the references, the shared job log and the team-output
//! feed — with their orders.
//!
//! The kind-vs-type table is the one piece of knowledge unique to Artcraft: an `artcraft.project`
//! is exactly one of the five real project kinds, and the tree's shape follows from it — layers
//! only in an `editor_2d`, tracks and clips only in a `video_timeline`, and so on. The server
//! reads the project type from the document's own `projectType` property (a `SetDoc` earlier in
//! the same batch satisfies it — batches apply in order, §2.3).

use craft_collab::adapter::ValidationCtx;
use craft_collab::change::{Change, EntryId};
use craft_collab::limits::Limits;
use craft_collab::value::Value;

use crate::{JobLogEntry, Project, ProjectType, Reference, TeamOutput};

use crate::props;

/// The artcraft project schema.
#[derive(Debug, Default)]
pub struct ArtcraftSchema {
  limits: Limits,
}

impl craft_collab::adapter::DocSchema for ArtcraftSchema {
  fn validate(&self, change: &Change, ctx: &ValidationCtx<'_>) -> Result<(), String> {
    match change {
      Change::Create { kind, parent, props, .. } => {
        if !crate::KINDS.contains(&kind.as_ref()) {
          return Err(format!("unknown kind '{kind}'"));
        }
        if *parent == crate::ROOT {
          let allowed = self.root_kinds_of(ctx);
          match allowed {
            Some(kinds) if !kinds.contains(&kind.as_ref()) => {
              return Err(format!("'{kind}' does not sit at the top level of this project type"));
            },
            None => return Err("the project type is not one of the five real ones".to_owned()),
            _ => {},
          }
        } else {
          let p = ctx.replica.node(*parent).ok_or_else(|| format!("unknown parent {parent:?}"))?;
          if !crate::CONTAINERS.contains(&p.kind.as_ref()) {
            return Err(format!("a '{}' accepts no children", p.kind));
          }
          let accepts = match p.kind.as_ref() {
            "group" => &["object", "character", "camera", "skybox", "group"][..],
            "track" => &["clip"][..],
            _ => &[][..],
          };
          if !accepts.contains(&kind.as_ref()) {
            return Err(format!("a '{}' accepts no '{}' children", p.kind, kind));
          }
          let allowed = self.root_kinds_of(ctx);
          if let Some(kinds) = allowed {
            if !kinds.contains(&kind.as_ref()) {
              return Err(format!("'{kind}' does not belong to this project type"));
            }
          }
        }
        for (p, _) in props {
          if p.as_ref() != "parent" && p.as_ref() != "position" && !props::NODE_PROPS.contains(&p.as_ref()) {
            return Err(format!("unknown property '{p}'"));
          }
        }
        Ok(())
      },
      Change::Set { prop, .. } => {
        if prop.as_ref() == "parent" || prop.as_ref() == "position" {
          return Ok(());
        }
        if !props::NODE_PROPS.contains(&prop.as_ref()) {
          return Err(format!("unknown property '{prop}'"));
        }
        Ok(())
      },
      Change::Delete { .. } => Ok(()),
      Change::SetDoc { prop, value } => {
        if props::DOC_PROPS.contains(&prop.as_ref()) || is_order_prop(prop) {
          if prop.as_ref() == "projectType" {
            let known = value.to_json().as_str().map(ProjectType::from_wire).unwrap_or(None);
            if known.is_none() {
              return Err(format!("unknown project type in '{value:?}'"));
            }
          }
          return Ok(());
        }
        Err(format!("unknown document property '{prop}' (value {value:?})"))
      },
      Change::Put { entry, .. } | Change::Remove { entry } => {
        if entry_kind(&entry.0).is_some() {
          Ok(())
        } else {
          Err(format!("unknown entry kind in '{entry:?}'"))
        }
      },
    }
  }

  fn recompute(&self, _touched: &[craft_collab::ids::NodeId]) -> Vec<Change> {
    // Artcraft derives nothing automatically today: the render outputs of a generation land as
    // job-log entries when the backend reports them complete, and the editors' own derived data
    // (thumbnails, captures) is local cache, not synchronized state — so there is no author-only
    // recompute to compose (spec §5.7's map decides: "commands, not derived state"). When a
    // derived property lands, its recompute belongs here and nowhere else.
    Vec::new()
  }

  fn limits(&self) -> &Limits {
    &self.limits
  }
}

impl ArtcraftSchema {
  /// The kinds allowed at the top level, read from the replica's own `projectType` property.
  ///
  /// `None` means the property is absent (a document that has not yet carried its type — the
  /// first `SetDoc` in the same batch satisfies it, since batches apply in order). An unknown
  /// type string is treated as absent: the core's own type checks still apply, and a strict
  /// refusal here would reject the very batch that fixes the property.
  fn root_kinds_of(&self, ctx: &ValidationCtx<'_>) -> Option<&'static [&'static str]> {
    let value = ctx.replica.doc_prop("projectType")?;
    let json = value.to_json();
    let text = json.as_str()?;
    ProjectType::from_wire(text).map(ProjectType::root_kinds)
  }
}

/// Which list an entry id belongs to (`reference:<token>`, `job:<task id>`, `output:<token>`).
fn entry_kind(entry: &str) -> Option<&'static str> {
  if entry.starts_with("reference:") {
    Some("reference")
  } else if entry.starts_with("job:") {
    Some("job")
  } else if entry.starts_with("output:") {
    Some("output")
  } else {
    None
  }
}

/// Whether `prop` is one of the per-list order properties.
fn is_order_prop(prop: &str) -> bool {
  matches!(prop, "referenceOrder" | "jobLogOrder" | "teamOutputOrder")
}

/// Upsert one document-level entry; wrong shapes are errors, never panics.
pub fn put_entry(doc: &mut Project, entry: &EntryId, value: &Value) -> Result<(), String> {
  let json = value.to_json();
  let key = entry.0.as_ref();
  let id = key.split_once(':').map_or("", |(_, rest)| rest).to_owned();
  match entry_kind(key) {
    Some("reference") => {
      let reference: Reference = serde_json::from_value(json).map_err(|e| e.to_string())?;
      if reference.token != id {
        return Err(format!("reference token '{id}' does not match its payload '{}'", reference.token));
      }
      upsert(&mut doc.references, |r| r.token.clone(), reference, &id)
    },
    Some("job") => {
      let job: JobLogEntry = serde_json::from_value(json).map_err(|e| e.to_string())?;
      if job.id != id {
        return Err(format!("job id '{id}' does not match its payload '{}'", job.id));
      }
      upsert(&mut doc.job_log, |j| j.id.clone(), job, &id)
    },
    Some("output") => {
      let output: TeamOutput = serde_json::from_value(json).map_err(|e| e.to_string())?;
      if output.media_token != id {
        return Err(format!("output token '{id}' does not match its payload '{}'", output.media_token));
      }
      upsert(&mut doc.team_outputs, |o| o.media_token.clone(), output, &id)
    },
    _ => Err(format!("unknown entry kind in '{key}'")),
  }
}

/// Remove one document-level entry (absent entries are fine — the tolerant rule, kept).
pub fn remove_entry(doc: &mut Project, entry: &EntryId) -> Result<(), String> {
  let key = entry.0.as_ref();
  let id = key.split_once(':').map_or("", |(_, rest)| rest).to_owned();
  match entry_kind(key) {
    Some("reference") => {
      doc.references.retain(|r| r.token != id);
      Ok(())
    },
    Some("job") => {
      doc.job_log.retain(|j| j.id != id);
      Ok(())
    },
    Some("output") => {
      doc.team_outputs.retain(|o| o.media_token != id);
      Ok(())
    },
    _ => Err(format!("unknown entry kind in '{key}'")),
  }
}

/// Reorder one document-level list from an order property's value (entries the array misses keep
/// their relative order at the end — lenient, like the client replay). The order array carries
/// the full entry ids (`job:<id>` and its siblings), so the key functions match them.
pub fn set_doc_order(doc: &mut Project, prop: &str, value: &Value) -> Option<Result<(), String>> {
  let json = value.to_json();
  let order: Vec<String> = match serde_json::from_value(json) {
    Ok(v) => v,
    Err(e) => return Some(Err(e.to_string())),
  };
  match prop {
    "referenceOrder" => Some(reorder(&mut doc.references, |r| format!("reference:{}", r.token), &order)),
    "jobLogOrder" => Some(reorder(&mut doc.job_log, |j| format!("job:{}", j.id), &order)),
    "teamOutputOrder" => Some(reorder(&mut doc.team_outputs, |o| format!("output:{}", o.media_token), &order)),
    _ => None,
  }
}

/// Reorder `list` so the entries whose keys appear in `order` come first in that order.
fn reorder<T, K: PartialEq + Clone>(list: &mut Vec<T>, key: fn(&T) -> K, order: &[K]) -> Result<(), String> {
  let mut decorated: Vec<(usize, T)> = std::mem::take(list).into_iter().map(|item| (order.len() + 1, item)).collect();
  for (slot, item) in decorated.iter_mut() {
    let k = key(item);
    if let Some(i) = order.iter().position(|o| *o == k) {
      *slot = i;
    }
  }
  decorated.sort_by_key(|(slot, _)| *slot);
  *list = decorated.into_iter().map(|(_, item)| item).collect();
  Ok(())
}

/// Insert-or-replace by key: replace the entry with the same key, or append.
fn upsert<T>(list: &mut Vec<T>, key: fn(&T) -> String, item: T, want: &str) -> Result<(), String> {
  for slot in list.iter_mut() {
    if key(slot) == want {
      *slot = item;
      return Ok(());
    }
  }
  list.push(item);
  Ok(())
}

/// The document-level entries of `doc` in order, as `(entry id, value)` pairs for the view.
pub fn entry_values(doc: &Project) -> Vec<(String, Value)> {
  let mut out = Vec::new();
  for r in &doc.references {
    if let Some(v) = serde_json::to_value(r).ok().map(Value::Json) {
      out.push((format!("reference:{}", r.token), v));
    }
  }
  for j in &doc.job_log {
    if let Some(v) = serde_json::to_value(j).ok().map(Value::Json) {
      out.push((format!("job:{}", j.id), v));
    }
  }
  for o in &doc.team_outputs {
    if let Some(v) = serde_json::to_value(o).ok().map(Value::Json) {
      out.push((format!("output:{}", o.media_token), v));
    }
  }
  out
}

/// Diff the document-level lists between two documents: per-entry `Put`/`Remove` plus one order
/// property per list whose order changed (the pilot's discipline: entries plus their order).
pub fn diff_entries(before: &Project, after: &Project) -> Vec<Change> {
  let mut out = Vec::new();
  diff_list(before, after, |d| &d.references, |r| format!("reference:{}", r.token), "referenceOrder", &mut out);
  diff_list(before, after, |d| &d.job_log, |j| format!("job:{}", j.id), "jobLogOrder", &mut out);
  diff_list(before, after, |d| &d.team_outputs, |o| format!("output:{}", o.media_token), "teamOutputOrder", &mut out);
  out
}

/// Diff one keyed list: value `Put`s for new or changed entries, `Remove`s for gone ones, and
/// one `SetDoc` when the order changed — emitted after the puts and removes so the order
/// property sorts the final entry set, not the stale one.
fn diff_list<T, F>(before: &Project, after: &Project, list: F, key: fn(&T) -> String, order_prop: &str, out: &mut Vec<Change>)
where
  T: PartialEq + serde::Serialize,
  F: Fn(&Project) -> &Vec<T>,
{
  let (b, a) = (list(before), list(after));
  let b_keys: Vec<String> = b.iter().map(&key).collect();
  let a_keys: Vec<String> = a.iter().map(&key).collect();
  for item in a {
    let k = key(item);
    let same = b_keys.contains(&k) && b.iter().any(|bi| key(bi) == k && bi == item);
    if !same {
      if let Some(v) = serde_json::to_value(item).ok().map(Value::Json) {
        out.push(Change::Put { entry: EntryId(k.into()), value: v });
      }
    }
  }
  for item in b {
    let k = key(item);
    if !a_keys.contains(&k) {
      out.push(Change::Remove { entry: EntryId(k.into()) });
    }
  }
  if b_keys != a_keys {
    out.push(Change::SetDoc { prop: order_prop.into(), value: Value::Json(serde_json::json!(a_keys)) });
  }
}
