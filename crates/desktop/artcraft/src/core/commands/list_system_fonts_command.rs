use crate::core::commands::response::shorthand::InfallibleResponse;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use fontdb::Database;
use log::{info, warn};
use serde_derive::Serialize;
use std::sync::OnceLock;

/// Scanning every font file is slow, so it runs once per app launch.
/// Fonts installed later show up after a restart.
static SYSTEM_FONT_FAMILIES: OnceLock<Vec<String>> = OnceLock::new();

#[derive(Debug, Serialize)]
pub struct ListSystemFontsResponse {
  /// Installed font family names, sorted case-insensitively and de-duplicated.
  pub families: Vec<String>,
}

impl SerializeMarker for ListSystemFontsResponse {}

/// Lists the font families installed on the system, for the UI font setting.
///
/// Uses fontconfig on Linux, so fonts the host exposes to a Flatpak sandbox
/// (under /run/host/fonts) are included.
#[tauri::command]
pub async fn list_system_fonts_command() -> InfallibleResponse<ListSystemFontsResponse> {
  info!("list_system_fonts_command called...");

  // NB: Scanning font files is blocking disk work; keep it off the async runtime threads.
  let families = tauri::async_runtime::spawn_blocking(|| {
    SYSTEM_FONT_FAMILIES.get_or_init(load_system_font_families).clone()
  })
      .await
      .unwrap_or_else(|err| {
        warn!("Failed to list system fonts: {:?}", err);
        Vec::new()
      });

  ListSystemFontsResponse { families }.into()
}

fn load_system_font_families() -> Vec<String> {
  let mut database = Database::new();
  database.load_system_fonts();

  // The first family name of each face is the English (US) name when the font has one.
  let names = database.faces()
      .filter_map(|face| face.families.first())
      .map(|(name, _language)| name.clone());

  sorted_unique_families(names)
}

/// Sorts case-insensitively, removes duplicates and drops names the UI can't use:
/// blank names, and macOS private system faces (".SF NS" etc.), which start with a dot.
fn sorted_unique_families(names: impl Iterator<Item = String>) -> Vec<String> {
  let mut families: Vec<String> = names
      .map(|name| name.trim().to_string())
      .filter(|name| !name.is_empty() && !name.starts_with('.'))
      .collect();

  families.sort_by(|a, b| a.to_lowercase().cmp(&b.to_lowercase()).then_with(|| a.cmp(b)));
  families.dedup();
  families
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn sorts_case_insensitively() {
    assert_eq!(families(&["noto Sans", "Arial", "DejaVu Sans"]), vec!["Arial", "DejaVu Sans", "noto Sans"]);
  }

  #[test]
  fn removes_duplicates_from_multiple_faces() {
    // Regular, Bold and Italic faces of one family each report the same name.
    assert_eq!(families(&["Inter", "Arial", "Inter", "Inter"]), vec!["Arial", "Inter"]);
  }

  #[test]
  fn drops_blank_and_hidden_names() {
    assert_eq!(families(&["", "  ", ".SF NS", " Fira Sans "]), vec!["Fira Sans"]);
  }

  fn families(names: &[&str]) -> Vec<String> {
    sorted_unique_families(names.iter().map(|name| name.to_string()))
  }
}
