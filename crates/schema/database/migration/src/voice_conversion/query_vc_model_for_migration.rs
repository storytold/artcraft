use std::path::PathBuf;

use sqlx::MySqlPool;

use bucket_paths::legacy::typified_paths::public::weight_files::bucket_file_path::WeightFileBucketPath;
use bucket_paths::legacy::old_bespoke_paths::bucket_path_unifier::BucketPathUnifier;
use enums::by_table::model_weights::weights_types::WeightsType;
use enums::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
use jobs_common::semi_persistent_cache_dir::SemiPersistentCacheDir;
use mysql_queries::queries::model_weights::inference::get_model_weight_for_voice_conversion_inference::{get_model_weight_for_voice_conversion_inference, ModelWeightError, ModelWeightForVoiceConversionInference};
use mysql_queries::queries::voice_conversion::inference::get_voice_conversion_model_for_inference::{get_voice_conversion_model_for_inference, VoiceConversionModelForInference, VoiceConversionModelForInferenceError};
use tokens::tokens::model_weights::ModelWeightToken;

#[derive(Clone, Debug)]
pub enum VcModelError {
  ModelDeleted,
  DatabaseError { reason: String },
}

impl std::fmt::Display for VcModelError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      VcModelError::ModelDeleted => write!(f, "ModelDeleted"),
      VcModelError::DatabaseError { reason} =>
        write!(f, "Database error: {:?}", reason),
    }
  }
}

impl std::error::Error for VcModelError {}

/// Query model info
/// Depending on the token prefix, this does either a modern or legacy lookup.
pub async fn query_vc_model_for_migration(model_token: &str, mysql_pool: &MySqlPool) -> Result<Option<VcModel>, VcModelError> {
  // NB: This is temporary migration code as we switch from the `voice_conversion_models` table to the `model_weights` table.
  if model_token.starts_with(ModelWeightToken::token_prefix()) {
    let model_weights_token = ModelWeightToken::new_from_str(model_token);

    let maybe_model = get_model_weight_for_voice_conversion_inference(
      &mysql_pool, &model_weights_token).await.map_err(|err|
      match err {
        ModelWeightError::ModelDeleted =>  VcModelError::ModelDeleted,
        ModelWeightError::DatabaseError { reason } => VcModelError::DatabaseError { reason },
      }
    )?;

    Ok(maybe_model
        .map(|model| VcModel::ModelWeight(model)))

  } else {
    let maybe_vc_model = get_voice_conversion_model_for_inference(
      &mysql_pool, model_token).await.map_err(|err|
      match err {
        VoiceConversionModelForInferenceError::ModelDeleted =>  VcModelError::ModelDeleted,
        VoiceConversionModelForInferenceError::DatabaseError { reason } => VcModelError::DatabaseError { reason },
      })?;

    Ok(maybe_vc_model
        .map(|model| VcModel::LegacyVoiceConversion(model)))
  }
}

/// Union over the legacy table and the new table to support an easier migration.
/// This enum can hold a record of either type and present a unified accessor interface.
#[derive(Clone)]
pub enum VcModel {
  /// Old type from the `voice_conversion_models` table, on the way out
  LegacyVoiceConversion(VoiceConversionModelForInference),
  /// New type, replacing the `voice_conversion_models` table.
  ModelWeight(ModelWeightForVoiceConversionInference),
}

#[derive(Debug, PartialEq, Eq)]
pub enum VcModelType {
  RvcV2,
  SoVitsSvc,
  /// We never finished support for SoftVC
  SoftVc,
  /// Another type of model we don't support as voice conversion (eg. Stable Diffusion)
  Invalid,
}

impl VcModel {
  pub fn get_model_token(&self) -> &str {
    match self {
      VcModel::LegacyVoiceConversion(ref model) => model.token.as_str(),
      VcModel::ModelWeight(ref model) => model.token.as_str(),
    }
  }

  pub fn get_model_type(&self) -> VcModelType {
    match self {
      VcModel::LegacyVoiceConversion(ref model) => match model.model_type {
        VoiceConversionModelType::RvcV2 => VcModelType::RvcV2,
        VoiceConversionModelType::SoftVc => VcModelType::SoftVc,
        VoiceConversionModelType::SoVitsSvc => VcModelType::SoVitsSvc,
      }
      VcModel::ModelWeight(ref model) => match model.weights_type {
        // Valid types
        WeightsType::SoVitsSvc => VcModelType::SoVitsSvc,
        WeightsType::RvcV2 => VcModelType::RvcV2,
        // Invalid types
        WeightsType::StableDiffusion15 => VcModelType::Invalid,
        WeightsType::HifiganTacotron2 => VcModelType::Invalid,
        WeightsType::StableDiffusionXL => VcModelType::Invalid,
        WeightsType::Tacotron2 => VcModelType::Invalid,
        WeightsType::LoRA => VcModelType::Invalid,
        WeightsType::VallE => VcModelType::Invalid,
        WeightsType::ComfyUi => VcModelType::Invalid,
        WeightsType::GptSoVits => VcModelType::Invalid,
      }
    }
  }

  /// Whether the model has an associated speaker index file. Only applies to certain RVC models.
  pub fn has_index_file(&self) -> bool {
    match self {
      VcModel::LegacyVoiceConversion(ref model) => {
        match model.model_type {
          VoiceConversionModelType::RvcV2 => model.has_index_file,
          _ => false,
        }
      }
      VcModel::ModelWeight(ref model) => {
        match model.weights_type {
          WeightsType::RvcV2 => model.has_index_file,
          _ => false,
        }
      }
    }
  }

  /// Location where the SVC or RVC model weights are stored in the cloud bucket.
  pub fn get_model_cloud_bucket_path(&self, bucket_path_unifier: &BucketPathUnifier) -> PathBuf {
    match self {
      VcModel::LegacyVoiceConversion(ref model) => {
        match model.model_type {
          VoiceConversionModelType::RvcV2 => {
            bucket_path_unifier.rvc_v2_model_path(&model.private_bucket_hash)
          }
          VoiceConversionModelType::SoVitsSvc => {
            bucket_path_unifier.so_vits_svc_model_path(&model.private_bucket_hash)
          }
          VoiceConversionModelType::SoftVc => {
            // NB: Technically wrong, but there are none of these models and I want the
            // method to be infallible since it is in all other cases.
            PathBuf::from("SOFT_VC_UNUSED_AND_UNIMPLEMENTED")
          }
        }
      }
      VcModel::ModelWeight(ref model) => {
        let path = WeightFileBucketPath::from_object_hash(
          &model.public_bucket_hash,
          model.maybe_public_bucket_prefix.as_deref(),
          model.maybe_public_bucket_extension.as_deref());

        PathBuf::from(path.get_full_object_path_str())
      }
    }
  }

  /// Location where the optional index file is stored in the cloud bucket.
  /// Only RVC models have index files.
  pub fn get_index_file_cloud_bucket_path(&self, bucket_path_unifier: &BucketPathUnifier) -> Option<PathBuf> {
    match self {
      VcModel::LegacyVoiceConversion(ref model) => {
        if !model.has_index_file {
          return None;
        }
        match model.model_type {
          VoiceConversionModelType::SoVitsSvc => None,
          VoiceConversionModelType::SoftVc => None,
          VoiceConversionModelType::RvcV2 => {
            Some(bucket_path_unifier.rvc_v2_model_index_path(&model.private_bucket_hash))
          }
        }
      }
      VcModel::ModelWeight(ref model) => {
        if !model.has_index_file {
          return None;
        }
        // NB: Technically, we should read prefix/extension from DB. We keep index file extensions by convention, however.
        let path = WeightFileBucketPath::rvc_index_file_from_object_hash(&model.public_bucket_hash);
        Some(PathBuf::from(path.get_full_object_path_str()))
      }
    }
  }

  /// We store models on the filesystem long term to speed up future instances of the job
  /// that use the same model. This way we don't incur the same (time and monetary) costs
  /// of downloading the model again and again.
  pub fn get_model_persistent_filesystem_path(&self, cache_dir: &SemiPersistentCacheDir) -> PathBuf {
    let token = match self {
      VcModel::LegacyVoiceConversion(ref model) => model.token.as_str(),
      VcModel::ModelWeight(ref model) => model.token.as_str(),
    };
    let filename = format!("{token}.pt");
    cache_dir.voice_conversion_model_path(&filename)
  }

  /// Same as `get_model_persistent_filesystem_path`, but for RVC index files.
  /// This will return a valid path even if the model doesn't have an index file, so be sure
  /// to check if the model has an index model first.
  pub fn get_index_file_persistent_filesystem_path(&self, cache_dir: &SemiPersistentCacheDir) -> PathBuf {
    let token = match self {
      VcModel::LegacyVoiceConversion(ref model) => model.token.as_str(),
      VcModel::ModelWeight(ref model) => model.token.as_str(),
    };
    let filename = format!("{token}.index");
    cache_dir.voice_conversion_model_path(&filename)
  }
}


#[cfg(test)]
mod tests {

  mod legacy_voice_conversion_models {
    use std::path::PathBuf;

    use bucket_paths::legacy::old_bespoke_paths::bucket_path_unifier::BucketPathUnifier;
    use enums::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
    use jobs_common::semi_persistent_cache_dir::SemiPersistentCacheDir;
    use mysql_queries::queries::voice_conversion::inference::get_voice_conversion_model_for_inference::VoiceConversionModelForInference;
    use tokens::tokens::voice_conversion_models::VoiceConversionModelToken;

    use crate::voice_conversion::query_vc_model_for_migration::{VcModel, VcModelType};

    fn default_model() -> VoiceConversionModelForInference {
      // NB: We could implement/derive the default trait, but this works just as well for now.
      VoiceConversionModelForInference {
        token: VoiceConversionModelToken::new_from_str("vcm_entropy"),
        model_type: VoiceConversionModelType::RvcV2,
        private_bucket_hash: "hash".to_string(),
        has_index_file: false,
        title: "title".to_string(),
        created_at: Default::default(),
        updated_at: Default::default(),
        user_deleted_at: None,
        mod_deleted_at: None,
      }
    }

    #[test]
    fn get_model_token() {
      let model = default_model();
      assert_eq!(VcModel::LegacyVoiceConversion(model).get_model_token(), "vcm_entropy");
    }

    #[test]
    fn get_model_type() {
      let mut model = default_model();
      model.model_type = VoiceConversionModelType::RvcV2;
      assert_eq!(VcModel::LegacyVoiceConversion(model).get_model_type(), VcModelType::RvcV2);

      let mut model = default_model();
      model.model_type = VoiceConversionModelType::SoftVc;
      assert_eq!(VcModel::LegacyVoiceConversion(model).get_model_type(), VcModelType::SoftVc);

      let mut model = default_model();
      model.model_type = VoiceConversionModelType::SoVitsSvc;
      assert_eq!(VcModel::LegacyVoiceConversion(model).get_model_type(), VcModelType::SoVitsSvc);
    }

    #[test]
    fn has_index_file() {
      let mut model = default_model();
      model.has_index_file = false;
      model.model_type = VoiceConversionModelType::RvcV2;
      assert_eq!(VcModel::LegacyVoiceConversion(model).has_index_file(), false);

      let mut model = default_model();
      model.has_index_file = true;
      model.model_type = VoiceConversionModelType::RvcV2;
      assert_eq!(VcModel::LegacyVoiceConversion(model).has_index_file(), true);
    }

    #[test]
    fn get_model_persistent_file_path() {
      let model = default_model();
      let path = VcModel::LegacyVoiceConversion(model).get_model_persistent_filesystem_path(&SemiPersistentCacheDir::default_paths());
      assert_eq!(path, PathBuf::from("/file_cache/voice_conversion/models/vcm_entropy.pt"));
    }

    #[test]
    fn get_model_cloud_bucket_path() {
      let model = default_model();
      let path = VcModel::LegacyVoiceConversion(model).get_model_cloud_bucket_path(&BucketPathUnifier::default_paths());
      assert_eq!(path, PathBuf::from("/user_uploaded_rvc_v2_models/h/a/s/hash.pt"));
    }

    #[test]
    fn get_index_file_cloud_bucket_path() {
      let model = default_model();
      let path = VcModel::LegacyVoiceConversion(model).get_index_file_cloud_bucket_path(&BucketPathUnifier::default_paths());
      assert_eq!(path, None);

      let mut model = default_model();
      model.model_type = VoiceConversionModelType::RvcV2;
      model.has_index_file = true;
      let path = VcModel::LegacyVoiceConversion(model).get_index_file_cloud_bucket_path(&BucketPathUnifier::default_paths());
      assert_eq!(path, Some(PathBuf::from("/user_uploaded_rvc_v2_models/h/a/s/hash.index")));
    }
  }

  mod new_model_weights {
    use std::path::PathBuf;

    use bucket_paths::legacy::old_bespoke_paths::bucket_path_unifier::BucketPathUnifier;
    use enums::by_table::model_weights::weights_types::WeightsType;
    use jobs_common::semi_persistent_cache_dir::SemiPersistentCacheDir;
    use mysql_queries::queries::model_weights::inference::get_model_weight_for_voice_conversion_inference::ModelWeightForVoiceConversionInference;
    use tokens::tokens::model_weights::ModelWeightToken;

    use crate::voice_conversion::query_vc_model_for_migration::{VcModel, VcModelType};

    fn default_model() -> ModelWeightForVoiceConversionInference {
      // NB: We could implement/derive the default trait, but this works just as well for now.
      ModelWeightForVoiceConversionInference {
        token: ModelWeightToken::new_from_str("weight_entropy"),
        weights_type: WeightsType::RvcV2,
        has_index_file: false,
        public_bucket_hash: "hash".to_string(),
        maybe_public_bucket_prefix: None,
        maybe_public_bucket_extension: None,
        title: "title".to_string(),
        created_at: Default::default(),
        updated_at: Default::default(),
        user_deleted_at: None,
        mod_deleted_at: None,
      }
    }

    #[test]
    fn get_model_token() {
      let model = default_model();
      assert_eq!(VcModel::ModelWeight(model).get_model_token(), "weight_entropy");
    }

    #[test]
    fn get_model_type() {
      let mut model = default_model();
      model.weights_type = WeightsType::RvcV2;
      assert_eq!(VcModel::ModelWeight(model).get_model_type(), VcModelType::RvcV2);

      let mut model = default_model();
      model.weights_type = WeightsType::StableDiffusion15;
      assert_eq!(VcModel::ModelWeight(model).get_model_type(), VcModelType::Invalid);

      let mut model = default_model();
      model.weights_type = WeightsType::SoVitsSvc;
      assert_eq!(VcModel::ModelWeight(model).get_model_type(), VcModelType::SoVitsSvc);
    }

    #[test]
    fn has_index_file() {
      let mut model = default_model();
      model.has_index_file = false;
      model.weights_type = WeightsType::RvcV2;
      assert_eq!(VcModel::ModelWeight(model).has_index_file(), false);

      let mut model = default_model();
      model.has_index_file = true;
      model.weights_type = WeightsType::RvcV2;
      assert_eq!(VcModel::ModelWeight(model).has_index_file(), true);
    }

    #[test]
    fn get_model_persistent_file_path() {
      let model = default_model();
      let path = VcModel::ModelWeight(model).get_model_persistent_filesystem_path(&SemiPersistentCacheDir::default_paths());
      assert_eq!(path, PathBuf::from("/file_cache/voice_conversion/models/weight_entropy.pt"));
    }

    #[test]
    fn get_model_cloud_bucket_path() {
      let model = default_model();
      let path = VcModel::ModelWeight(model).get_model_cloud_bucket_path(&BucketPathUnifier::default_paths());
      assert_eq!(path, PathBuf::from("/weights/h/a/s/hash/file.bin"));
    }

    #[test]
    fn get_index_file_cloud_bucket_path() {
      let model = default_model();
      let path = VcModel::ModelWeight(model).get_index_file_cloud_bucket_path(&BucketPathUnifier::default_paths());
      assert_eq!(path, None);

      let mut model = default_model();
      model.weights_type = WeightsType::RvcV2;
      model.has_index_file = true;
      let path = VcModel::ModelWeight(model).get_index_file_cloud_bucket_path(&BucketPathUnifier::default_paths());
      assert_eq!(path, Some(PathBuf::from("/weights/h/a/s/hash/rvc_hash.index")));
    }
  }
}