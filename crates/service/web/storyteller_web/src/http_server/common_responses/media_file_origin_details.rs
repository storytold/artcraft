use utoipa::ToSchema;

use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use tokens::tokens::model_weights::ModelWeightToken;

/// Fields useful for enriching media file listings
#[derive(Clone, Serialize, ToSchema)]
pub struct MediaFileOriginDetails {
  /// Where the file came from (broadly)
  pub origin_category: MediaFileOriginCategory,

  /// Where the file came from (specifically, a product area, eg. "face_animator")
  pub product_category: MediaFileOriginProductCategory,

  /// If the file was produced by a model, the details.
  pub maybe_model: Option<MediaFileModelDetails>,
}

/// Information about the model weights
/// https://serde.rs/enum-representations.html#untagged
#[derive(Clone, Serialize, ToSchema)]
#[serde(untagged)]
pub enum MediaFileModelDetails {
  /// A system model is one that we maintain and update,
  /// eg. SadTalker, Wav2Lip, MocapNet, etc.
  SystemModel {
    /// The type of model weight
    model_type: MediaFileOriginModelType,
  },
  /// A model weight is typically a user-submitted model.
  /// We store lots of these.
  ModelWeight {
    /// The type of model weight
    model_type: MediaFileOriginModelType,
    /// The model token
    token: ModelWeightToken,
    /// The model title (typically only populated for `model_weights` models, not legacy tables such as `tts_models`.)
    title: String,
  },
}

impl MediaFileOriginDetails {
  pub fn from_db_fields_owned(
    origin_category: MediaFileOriginCategory,
    product_category: MediaFileOriginProductCategory,
    maybe_model_type: Option<MediaFileOriginModelType>,
    maybe_model_token: Option<ModelWeightToken>,
    maybe_model_title: Option<String>,
  ) -> Self {
    let maybe_model = match (maybe_model_type, maybe_model_token, maybe_model_title) {
      (Some(model_type), Some(model_token), Some(model_title)) => {
        Some(MediaFileModelDetails::ModelWeight {
          model_type,
          token: model_token,
          title: model_title,
        })
      },
      (Some(model_type), None, None) => {
        Some(MediaFileModelDetails::SystemModel {
          model_type,
        })
      },
      _ => None,
    };

    Self {
      origin_category,
      product_category,
      maybe_model,
    }
  }

  pub fn from_db_fields(
    origin_category: MediaFileOriginCategory,
    product_category: MediaFileOriginProductCategory,
    maybe_model_type: Option<MediaFileOriginModelType>,
    maybe_model_token: Option<&ModelWeightToken>,
    maybe_model_title: Option<&str>,
  ) -> Self {
    Self::from_db_fields_owned(
      origin_category,
      product_category,
      maybe_model_type,
      maybe_model_token.cloned(),
      maybe_model_title.map(|s|s.to_string()))
  }

  pub fn from_db_fields_str(
    origin_category: MediaFileOriginCategory,
    product_category: MediaFileOriginProductCategory,
    maybe_model_type: Option<MediaFileOriginModelType>,
    maybe_model_token: Option<&str>,
    maybe_model_title: Option<&str>,
  ) -> Self {
    Self::from_db_fields_owned(
      origin_category,
      product_category,
      maybe_model_type,
      maybe_model_token.map(|s| ModelWeightToken::new_from_str(s)),
      maybe_model_title.map(|s| s.to_string()))
  }
}
