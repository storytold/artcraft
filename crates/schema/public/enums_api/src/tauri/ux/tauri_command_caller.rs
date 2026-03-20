
use strum::EnumIter;
use utoipa::ToSchema;

/// Defines the names of the Tauri-sent events that the frontend subscribes to.
/// These event names are also stored in the database, so keep them short-ish.
#[derive(Clone, Debug, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, EnumIter, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]

pub enum TauriCommandCaller {
  /// The 2D canvas
  Canvas,
  /// The inpainting editor
  ImageEditor,
  /// The text-to-image page
  TextToImage,
  /// The image-to-video page
  ImageToVideo,
  /// A mini-app (doesn't specify which one)
  MiniApp,
}

#[cfg(test)]
mod tests {
  use super::TauriCommandCaller;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(TauriCommandCaller::iter().count(), 5);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in TauriCommandCaller::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: TauriCommandCaller = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
