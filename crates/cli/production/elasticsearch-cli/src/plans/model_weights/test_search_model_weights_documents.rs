use enums_db::by_table::model_weights::weights_types::WeightsType;
use elasticsearch::Elasticsearch;
use elasticsearch_schema::documents::model_weight_document::ModelWeightDocument;
use elasticsearch_schema::searches::search_model_weights::search_model_weights::{search_model_weights, ModelWeightsSortDirection, ModelWeightsSortField, SearchArgs};
use errors::AnyhowResult;
use std::collections::HashSet;
use std::iter::FromIterator;

pub async fn test_search_model_weights_documents(client: &Elasticsearch) -> AnyhowResult<Vec<ModelWeightDocument>> {

  let results = search_model_weights(SearchArgs {
    //search_term: "zel",
    search_term: "mariano",
    maybe_creator_user_token: None,
    maybe_ietf_primary_language_subtag: None,
    maybe_weights_categories: None,
    maybe_weights_types: Some(HashSet::from_iter(vec![WeightsType::Tacotron2])),
    sort_field: Some(ModelWeightsSortField::UsageCount),
    sort_direction: Some(ModelWeightsSortDirection::Ascending),
    minimum_score: None,
    client: &client,
  }).await?;

  Ok(results)
}
