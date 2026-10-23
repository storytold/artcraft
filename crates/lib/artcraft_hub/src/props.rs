//! The synchronized property table (spec §2.3: "every field the file saves is a property").
//!
//! The table enumerates [`crate::SceneNode`]'s fields with a compile-time guard: a `SceneNode`
//! gaining a field that doesn't sync is a build error, so every new saved field must decide how
//! it syncs. The tree position (`parent`, `position`) is not a field: the adapter owns the
//! position keys and the tree lives in the document (spec §2.3). Big or free-form values (the
//! editors' own per-node JSON — poses, animations, effects, graph edges) ride as one
//! last-writer-wins `payload` value: the same decision the FigCraft pilot made for its big
//! fields, kept verbatim.

use craft_collab::Value;

use crate::SceneNode;

/// One row of the property table: a `SceneNode` field and the property name it syncs under.
macro_rules! node_props {
  ($(($field:ident, $name:literal)),+ $(,)?) => {
    /// Every node field that syncs, by property name.
    pub const NODE_PROPS: &[&str] = &[$($name),+];

    /// The value of field property `prop` of `node`; `None` when `prop` is not a field.
    pub fn field_value(node: &SceneNode, prop: &str) -> Option<Value> {
      match prop {
        $($name => Some(Value::Json(serde_json::to_value(&node.$field).ok()?)),)+
        _ => None,
      }
    }

    /// Write field property `prop` of `node`; `None` when `prop` is not a field.
    ///
    /// A value of the wrong shape is an error, not a panic — shipped code never crashes.
    pub fn set_field(node: &mut SceneNode, prop: &str, value: &Value) -> Option<Result<(), String>> {
      match prop {
        $($name => Some(
          serde_json::from_value(value.to_json())
            .map(|v| node.$field = v)
            .map_err(|e| e.to_string()),
        ),)+
        _ => None,
      }
    }

    /// Whether field property `prop` differs between `a` and `b`; `None` if not a field.
    pub fn field_differs(a: &SceneNode, b: &SceneNode, prop: &str) -> Option<bool> {
      match prop {
        $($name => Some(a.$field != b.$field),)+
        _ => None,
      }
    }

    /// Fails to compile when `SceneNode` gains a field that isn't listed as a property above —
    /// the pilot's guard, ported verbatim: a new saved field must decide how it syncs.
    #[allow(dead_code)]
    fn every_node_field_is_a_property(n: &SceneNode) {
      let SceneNode { id: _, parent: _, children: _, $($field: _),+ } = n;
    }
  };
}

node_props! {
  (name, "name"),
  (kind, "kind"),
  (visible, "visible"),
  (locked, "locked"),
  (transform, "transform"),
  (media, "media"),
  (payload, "payload"),
}

/// The document-level properties (the project's own scalars; the three keyed lists — references,
/// job log, team outputs — sync per entry, see [`crate::schema`]).
///
/// `schema_version` (the local serialization format of the editors' JSON payload) deliberately
/// does not sync: it is a file-format marker, not shared state, and each client renders the
/// payload it understands.
pub const DOC_PROPS: &[&str] = &["title", "projectType"];

/// Write a document-level property; `None` when `prop` is not one of the synced scalars.
pub fn set_doc_prop(doc: &mut crate::Project, prop: &str, value: &Value) -> Option<Result<(), String>> {
  let json = value.to_json();
  match prop {
    "title" => Some(serde_json::from_value::<String>(json).map(|v| doc.title = v).map_err(|e| e.to_string())),
    "projectType" => {
      let parsed = serde_json::from_value::<String>(json).map_err(|e| e.to_string()).and_then(|s| crate::ProjectType::from_wire(&s).ok_or_else(|| format!("unknown project type '{s}'")));
      match parsed {
        Ok(t) => {
          doc.project_type = t;
          Some(Ok(()))
        },
        Err(e) => Some(Err(e)),
      }
    },
    _ => None,
  }
}

/// The value of a document-level property; `None` when `prop` is not a synced scalar.
pub fn doc_prop_value(doc: &crate::Project, prop: &str) -> Option<Value> {
  match prop {
    "title" => Some(Value::Json(serde_json::to_value(&doc.title).ok()?)),
    "projectType" => Some(Value::Json(serde_json::to_value(doc.project_type.to_str()).ok()?)),
    _ => None,
  }
}
