use enums_db::by_table::model_weights::weights_types::WeightsType;
use tokens::tokens::model_weights::ModelWeightToken;

/// This is meant to be used for quick in-memory caches, particularly ones that
/// serve the inference enqueue APIs and check for model existence/validity.
/// The web service can quickly know which model types are valid for which inference types.
#[derive(Serialize, Clone, Debug)]
pub struct ModelWeightInfoLite {
  pub token: ModelWeightToken,
  pub weights_type: WeightsType,
}
