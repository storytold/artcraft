use enums_shared::error::enums_error::EnumsError;
use strum::EnumCount;
use strum::EnumIter;

/// Defines the names of the Tauri-sent events that the frontend subscribes to.
/// These event names are also stored in the database, so keep them short-ish.
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, EnumIter, EnumCount)]
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

impl_enum_display_and_debug_using_to_str!(TauriCommandCaller);
impl_mysql_enum_coders!(TauriCommandCaller);
impl_mysql_from_row!(TauriCommandCaller);

// NB: We can derive `sqlx::Type` instead of using `impl_mysql_enum_coders`

impl TauriCommandCaller {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Canvas => "canvas",
      Self::ImageEditor => "image_editor",
      Self::TextToImage => "text_to_image",
      Self::ImageToVideo => "image_to_video",
      Self::MiniApp => "mini_app",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, EnumsError> {
    match value {
      "canvas" => Ok(Self::Canvas),
      "image_editor" => Ok(Self::ImageEditor),
      "text_to_image" => Ok(Self::TextToImage),
      "image_to_video" => Ok(Self::ImageToVideo),
      "mini_app" => Ok(Self::MiniApp),
      _ => Err(EnumsError::CouldNotConvertFromString(value.to_string())),
    }
  }

}

#[cfg(test)]
mod tests {
  use enums_shared::error::enums_error::EnumsError;
  use super::TauriCommandCaller;
  use enums_shared::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(TauriCommandCaller::Canvas, "canvas");
      assert_serialization(TauriCommandCaller::ImageEditor, "image_editor");
      assert_serialization(TauriCommandCaller::TextToImage, "text_to_image");
      assert_serialization(TauriCommandCaller::ImageToVideo, "image_to_video");
      assert_serialization(TauriCommandCaller::MiniApp, "mini_app");
    }

    #[test]
    fn to_str() {
      assert_eq!(TauriCommandCaller::Canvas.to_str(), "canvas");
      assert_eq!(TauriCommandCaller::ImageEditor.to_str(), "image_editor");
      assert_eq!(TauriCommandCaller::TextToImage.to_str(), "text_to_image");
      assert_eq!(TauriCommandCaller::ImageToVideo.to_str(), "image_to_video");
      assert_eq!(TauriCommandCaller::MiniApp.to_str(), "mini_app");
    }

    #[test]
    fn from_str() {
      assert_eq!(TauriCommandCaller::from_str("canvas").unwrap(), TauriCommandCaller::Canvas);
      assert_eq!(TauriCommandCaller::from_str("image_editor").unwrap(), TauriCommandCaller::ImageEditor);
      assert_eq!(TauriCommandCaller::from_str("text_to_image").unwrap(), TauriCommandCaller::TextToImage);
      assert_eq!(TauriCommandCaller::from_str("image_to_video").unwrap(), TauriCommandCaller::ImageToVideo);
      assert_eq!(TauriCommandCaller::from_str("mini_app").unwrap(), TauriCommandCaller::MiniApp);
    }

    #[test]
    fn from_str_err() {
      let result = TauriCommandCaller::from_str("asdf");
      assert!(result.is_err());
      if let Err(EnumsError::CouldNotConvertFromString(value)) = result {
        assert_eq!(value, "asdf");
      } else {
        panic!("Expected EnumsError::CouldNotConvertFromString");
      }
    }

  }

  mod mechanical_checks {
    use super::*;
    use strum::IntoEnumIterator;

    #[test]
    fn round_trip() {
      for variant in TauriCommandCaller::iter() {
        // Test to_str(), from_str(), Display, and Debug.
        assert_eq!(variant, TauriCommandCaller::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, TauriCommandCaller::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, TauriCommandCaller::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  }
}
