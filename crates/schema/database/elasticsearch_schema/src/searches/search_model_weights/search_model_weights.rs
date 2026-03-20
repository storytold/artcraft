use enums_db::by_table::model_weights::weights_types::WeightsType;
use std::collections::HashSet;

use elasticsearch::{Elasticsearch, SearchParts};
use log::debug;
use once_cell::sync::Lazy;
use serde_json::{json, Number, Value};

use enums::by_table::model_weights::weights_category::WeightsCategory;
use errors::AnyhowResult;
use tokens::tokens::users::UserToken;

use crate::documents::model_weight_document::{ModelWeightDocument, MODEL_WEIGHT_INDEX};
use crate::searches::search_model_weights::min_score::add_min_score;
use crate::searches::search_model_weights::predicates::{creator_user_token_predicate, language_subtag_predicate, must_be_not_deleted, weights_categories_predicates, weights_types_predicates};
use crate::searches::search_model_weights::sort::add_sort;

static JSON_QUERY : Lazy<Value> = Lazy::new(|| {
  const QUERY_TEMPLATE : &str = include_str!("../../../../../../../_database/elasticsearch/searches/model_weights/search.json");

  let json : Value = serde_json::from_str(QUERY_TEMPLATE)
      .expect("json should parse");

  json
});

#[derive(Default, Copy, Clone, Eq, PartialEq)]
pub enum ModelWeightsSortField {
  /// Sort based on the match score of the search term alone.
  #[default]
  MatchScore,
  /// Sort based on the creation date
  CreatedAt,
  /// Sort based on the model usage count
  UsageCount,
  /// Sort based on the model bookmark count
  BookmarkCount,
  /// Sort based on the model positive ratings count
  PositiveRatingCount,
}

#[derive(Default, Copy, Clone, Eq, PartialEq)]
pub enum ModelWeightsSortDirection {
  Ascending,
  #[default]
  Descending,
}

impl ModelWeightsSortDirection {
  pub fn to_str(&self) -> &str {
    match self {
      Self::Ascending => "asc",
      Self::Descending => "desc",
    }
  }
}

pub struct SearchArgs<'a> {
  pub search_term: &'a str,
  // pub is_featured: Option<bool>,
  pub maybe_creator_user_token: Option<&'a UserToken>,
  pub maybe_ietf_primary_language_subtag: Option<&'a str>,
  pub maybe_weights_categories: Option<HashSet<WeightsCategory>>,
  pub maybe_weights_types: Option<HashSet<WeightsType>>,

  pub sort_field: Option<ModelWeightsSortField>,
  pub sort_direction: Option<ModelWeightsSortDirection>,

  pub minimum_score: Option<u64>,

  pub client: &'a Elasticsearch,
}

pub async fn search_model_weights(args: SearchArgs<'_>) -> AnyhowResult<Vec<ModelWeightDocument>> {
  let query = build_query(&args)?;

  let json_query = serde_json::to_string(&query)?;

  debug!("ElasticSearch Query: {:#?}", json_query);

  let search_response = args.client
      .search(SearchParts::Index(&[MODEL_WEIGHT_INDEX]))
      .body(query)
      .size(30)
      .allow_no_indices(true)
      .send()
      .await?;

  let _status_code = search_response.status_code();

  let mut response_json = search_response.json::<Value>().await?;

  let hits = response_json.get_mut("hits")
      .map(|hits| hits.take());

  let hits = hits.map(|mut hits| {
    hits.get_mut("hits")
        .map(|hits| hits.take())
  }).flatten();

  let mut documents = Vec::new();

  match hits {
    Some(Value::Array(inner_hits)) => {
      for mut hit in inner_hits {
        let maybe_object = hit.get_mut("_source")
            .map(|source| source.take());
        if let Some(value) = maybe_object {
          let document = serde_json::from_value::<ModelWeightDocument>(value)?;
          documents.push(document);
        }
      }
    }
    _ => {},
  }

  Ok(documents)
}

fn build_query(args: &SearchArgs) -> AnyhowResult<Value> {
  let query = JSON_QUERY.clone();

  let query = jsonpath_lib::replace_with(query, "$.query.bool.must[0].bool.must", &mut |_| {
    let mut predicates = vec![
      must_be_not_deleted(),
    ];

//    if let Some(is_featured) = args.is_featured {
//      predicates.push(featured_predicate(is_featured));
//    }
//

    if let Some(language_subtag) = args.maybe_ietf_primary_language_subtag {
      predicates.push(language_subtag_predicate(language_subtag));
    }

    if let Some(creator_user_token) = args.maybe_creator_user_token {
      predicates.push(creator_user_token_predicate(creator_user_token));
    }

    if let Some(weights_categories) = &args.maybe_weights_categories {
      predicates.push(weights_categories_predicates(weights_categories));
    }

    if let Some(weights_types) = &args.maybe_weights_types {
      predicates.push(weights_types_predicates(weights_types));
    }

    Some(json!(predicates))
  })?;

  let query = jsonpath_lib::replace_with(query, "$.query.bool.must[0].bool.should[0].fuzzy.title.value", &mut |_| {
    Some(json!(args.search_term))
  })?;

  let query = jsonpath_lib::replace_with(query, "$.query.bool.must[0].bool.should[1].match.title.query", &mut |_| {
    Some(json!(args.search_term))
  })?;

  let query = jsonpath_lib::replace_with(query, "$.query.bool.must[0].bool.should[2].multi_match.query", &mut |_| {
    Some(json!(args.search_term))
  })?;

  let query = add_sort(query, args.sort_field, args.sort_direction);
  let query = add_min_score(query, args.search_term, args.minimum_score);

  Ok(query)
}


#[cfg(test)]
mod tests {
  use std::collections::HashSet;
  use std::iter::FromIterator;

  use serde_json::Value;

  use enums::by_table::model_weights::weights_category::WeightsCategory;
  use tokens::tokens::users::UserToken;

  use crate::searches::search_model_weights::search_model_weights::build_query;
  use crate::searches::search_model_weights::search_model_weights::SearchArgs;

  #[test]
  fn test_default_search() {
    let search = build_query(&SearchArgs {
      search_term: "foo",
      maybe_creator_user_token: None,
      maybe_ietf_primary_language_subtag: None,
      maybe_weights_categories: None,
      maybe_weights_types: None,
      sort_field: Default::default(),
      sort_direction: Default::default(),
      minimum_score: None,
      client: &elasticsearch::Elasticsearch::default(),
    }).unwrap();

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.must[0].term.is_deleted").unwrap();

    assert_eq!(value[0], &Value::Bool(false));

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.should[0].fuzzy.title.value").unwrap();

    assert_eq!(value[0], &Value::String("foo".to_string()));

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.should[1].match.title.query").unwrap();

    assert_eq!(value[0], &Value::String("foo".to_string()));

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.should[2].multi_match.query").unwrap();

    assert_eq!(value[0], &Value::String("foo".to_string()));
  }

  #[test]
  fn test_creator_user_token() {
    let search = build_query(&SearchArgs {
      search_term: "asdf",
      maybe_creator_user_token: Some(&UserToken::new_from_str("USER_TOKEN")),
      maybe_ietf_primary_language_subtag: None,
      maybe_weights_categories: None,
      maybe_weights_types: None,
      sort_field: Default::default(),
      sort_direction: Default::default(),
      minimum_score: None,
      client: &elasticsearch::Elasticsearch::default(),
    }).unwrap();

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.must[0].term.is_deleted").unwrap();

    assert_eq!(value[0], &Value::Bool(false));

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.must[1].term.maybe_creator_user_token").unwrap();

    assert_eq!(value[0], &Value::String("USER_TOKEN".to_string()));

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.should[0].fuzzy.title.value").unwrap();

    assert_eq!(value[0], &Value::String("asdf".to_string()));

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.should[1].match.title.query").unwrap();

    assert_eq!(value[0], &Value::String("asdf".to_string()));

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.should[2].multi_match.query").unwrap();

    assert_eq!(value[0], &Value::String("asdf".to_string()));
  }

  #[test]
  fn test_ietf_primary_language_subtag() {
    let search = build_query(&SearchArgs {
      search_term: "foo",
      maybe_creator_user_token: None,
      maybe_ietf_primary_language_subtag: Some("ja"),
      maybe_weights_categories: None,
      maybe_weights_types: None,
      client: &elasticsearch::Elasticsearch::default(),
      minimum_score: None,
      sort_field: Default::default(),
      sort_direction: Default::default(),
    }).unwrap();

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.must[0].term.is_deleted").unwrap();

    assert_eq!(value[0], &Value::Bool(false));

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.must[1].term.maybe_ietf_primary_language_subtag").unwrap();

    assert_eq!(value[0], &Value::String("ja".to_string()));

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.should[0].fuzzy.title.value").unwrap();

    assert_eq!(value[0], &Value::String("foo".to_string()));

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.should[1].match.title.query").unwrap();

    assert_eq!(value[0], &Value::String("foo".to_string()));

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.should[2].multi_match.query").unwrap();

    assert_eq!(value[0], &Value::String("foo".to_string()));
  }

  #[test]
  fn test_weight_types() {
    let search = build_query(&SearchArgs {
      search_term: "bar",
      maybe_creator_user_token: None,
      maybe_ietf_primary_language_subtag: None,
      maybe_weights_categories: None,
      maybe_weights_types: Some(HashSet::from_iter(vec![
        WeightsType::Tacotron2,
        WeightsType::GptSoVits,
      ])),
      sort_field: Default::default(),
      sort_direction: Default::default(),
      minimum_score: None,
      client: &elasticsearch::Elasticsearch::default(),
    }).unwrap();

    let value = select(&search, "$.query.bool.must[0].bool.must[0].term.is_deleted");

    assert_eq!(value[0], &Value::Bool(false));

    let values = select_str_values(
      &search, "$.query.bool.must[0].bool.must[1].bool.should[*].term.weights_type");

    assert_eq!(values.len(), 2);
    assert!(values.contains(&"tt2"));
    assert!(values.contains(&"gpt_so_vits"));
  }

  #[test]
  fn test_weight_categories() {
    let search = build_query(&SearchArgs {
      search_term: "bar",
      maybe_creator_user_token: None,
      maybe_ietf_primary_language_subtag: None,
      maybe_weights_types: None,
      maybe_weights_categories: Some(HashSet::from_iter(vec![
        WeightsCategory::TextToSpeech,
        WeightsCategory::VoiceConversion,
      ])),
      client: &elasticsearch::Elasticsearch::default(),
      minimum_score: None,
      sort_field: Default::default(),
      sort_direction: Default::default(),
    }).unwrap();

    let value = select(&search, "$.query.bool.must[0].bool.must[0].term.is_deleted");

    assert_eq!(value[0], &Value::Bool(false));

    let values = select_str_values(
      &search, "$.query.bool.must[0].bool.must[1].bool.should[*].term.weights_category");

    assert_eq!(values.len(), 2);
    assert!(values.contains(&"text_to_speech"));
    assert!(values.contains(&"voice_conversion"));
  }

  fn select<'a>(search: &'a Value, path: &str) -> Vec<&'a Value> {
    jsonpath_lib::select(search, path).unwrap()
  }

  fn select_str_values<'a>(search: &'a Value, path: &str) -> Vec<&'a str> {
    select(search, path).into_iter()
        .map(|value| {
          match value {
            Value::String(inner) => inner.as_str(),
            _ => panic!("Expected string"),
          }
        })
        .collect()
  }
}
