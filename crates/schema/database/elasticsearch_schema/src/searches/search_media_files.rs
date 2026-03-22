use std::collections::HashSet;

use elasticsearch::{Elasticsearch, SearchParts};
use once_cell::sync::Lazy;
use serde_json::{json, Value};

use enums_db::by_table::media_files::media_file_class::MediaFileClass;
use enums_db::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums_db::by_table::media_files::media_file_type::MediaFileType;
use errors::AnyhowResult;
use tokens::tokens::users::UserToken;

use crate::documents::media_file_document::{MEDIA_FILE_INDEX, MediaFileDocument};

static JSON_QUERY : Lazy<Value> = Lazy::new(|| {
  const QUERY_TEMPLATE : &str = include_str!("../../../../../../_database/elasticsearch/searches/media_files/search.json");

  let json : Value = serde_json::from_str(QUERY_TEMPLATE)
      .expect("json should parse");

  json
});

pub struct SearchArgs<'a> {
  pub search_term: &'a str,
  pub is_featured: Option<bool>,
  pub maybe_creator_user_token: Option<&'a UserToken>,
  pub maybe_media_classes: Option<HashSet<MediaFileClass>>,
  pub maybe_media_types: Option<HashSet<MediaFileType>>,
  pub maybe_engine_categories: Option<HashSet<MediaFileEngineCategory>>,

  pub client: &'a Elasticsearch,
}

pub async fn search_media_files(args: SearchArgs<'_>) -> AnyhowResult<Vec<MediaFileDocument>> {
  let query = build_query(&args)?;

  let search_response = args.client
      .search(SearchParts::Index(&[MEDIA_FILE_INDEX]))
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
          let document = serde_json::from_value::<MediaFileDocument>(value)?;
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

    if let Some(is_featured) = args.is_featured {
      predicates.push(featured_predicate(is_featured));
    }

    if let Some(creator_user_token) = args.maybe_creator_user_token {
      predicates.push(creator_user_token_predicate(creator_user_token));
    }

    if let Some(media_classes) = &args.maybe_media_classes {
      predicates.push(media_classes_predicate(media_classes));
    }

    if let Some(media_types) = &args.maybe_media_types {
      predicates.push(media_types_predicate(media_types));
    }

    if let Some(engine_categories) = &args.maybe_engine_categories {
      predicates.push(engine_categories_predicate(engine_categories));
    }

    Some(json!(predicates))
  })?;

  let query = jsonpath_lib::replace_with(query, "$.query.bool.must[0].bool.should[0].fuzzy.maybe_title.value", &mut |_| {
    Some(json!(args.search_term))
  })?;

  let query = jsonpath_lib::replace_with(query, "$.query.bool.must[0].bool.should[1].match.maybe_title.query", &mut |_| {
    Some(json!(args.search_term))
  })?;

  let query = jsonpath_lib::replace_with(query, "$.query.bool.must[0].bool.should[2].multi_match.query", &mut |_| {
    Some(json!(args.search_term))
  })?;

  Ok(query)
}

fn must_be_not_deleted() -> Value {
  json!({
    "term": {
      "is_deleted": false,
    }
  })
}

fn featured_predicate(is_featured: bool) -> Value {
  json!({
    "term": {
      "is_featured": is_featured,
    }
  })
}

fn creator_user_token_predicate(creator_user_token: &UserToken) -> Value {
  json!({
    "term": {
      "maybe_creator_user_token": creator_user_token.as_str(),
    }
  })
}

fn media_classes_predicate(media_classes: &HashSet<MediaFileClass>) -> Value {
  should_predicates(media_classes.iter()
      .map(|media_type| {
        json!({
          "term": {
            "media_class": media_type.to_str(),
          }
        })
      })
      .collect())
}

fn media_types_predicate(media_types: &HashSet<MediaFileType>) -> Value {
  should_predicates(media_types.iter()
      .map(|media_type| {
        json!({
          "term": {
            "media_type": media_type.to_str(),
          }
        })
      })
      .collect())
}

fn engine_categories_predicate(engine_categories: &HashSet<MediaFileEngineCategory>) -> Value {
  should_predicates(engine_categories.iter()
      .map(|engine_category| {
        json!({
          "term": {
            "maybe_engine_category": engine_category.to_str(),
          }
        })
      })
      .collect())
}

// NB: "Should" is a logical OR.
fn should_predicates(predicates: Vec<Value>) -> Value {
  json!({
    "bool": {
      "should": predicates,
    }
  })
}

#[cfg(test)]
mod tests {
  use std::collections::HashSet;
  use std::iter::FromIterator;

  use serde_json::Value;

  use enums_db::by_table::media_files::media_file_class::MediaFileClass;
  use enums_db::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
  use enums_db::by_table::media_files::media_file_type::MediaFileType;
  use tokens::tokens::users::UserToken;

  use crate::searches::search_media_files::{build_query, SearchArgs};

  #[test]
  fn test_default_search() {
    let search = build_query(&SearchArgs {
      search_term: "foo",
      is_featured: None,
      maybe_creator_user_token: None,
      maybe_media_classes: None,
      maybe_media_types: None,
      maybe_engine_categories: None,
      client: &elasticsearch::Elasticsearch::default(),
    }).unwrap();

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.must[0].term.is_deleted").unwrap();

    assert_eq!(value[0], &Value::Bool(false));

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.should[0].fuzzy.maybe_title.value").unwrap();

    assert_eq!(value[0], &Value::String("foo".to_string()));

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.should[1].match.maybe_title.query").unwrap();

    assert_eq!(value[0], &Value::String("foo".to_string()));

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.should[2].multi_match.query").unwrap();

    assert_eq!(value[0], &Value::String("foo".to_string()));
  }

  #[test]
  fn test_featured() {
    let search = build_query(&SearchArgs {
      search_term: "asdf",
      is_featured: Some(true),
      maybe_creator_user_token: None,
      maybe_media_classes: None,
      maybe_media_types: None,
      maybe_engine_categories: None,
      client: &elasticsearch::Elasticsearch::default(),
    }).unwrap();

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.must[0].term.is_deleted").unwrap();

    assert_eq!(value[0], &Value::Bool(false));

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.must[1].term.is_featured").unwrap();

    assert_eq!(value[0], &Value::Bool(true));

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.should[0].fuzzy.maybe_title.value").unwrap();

    assert_eq!(value[0], &Value::String("asdf".to_string()));

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.should[1].match.maybe_title.query").unwrap();

    assert_eq!(value[0], &Value::String("asdf".to_string()));

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.should[2].multi_match.query").unwrap();

    assert_eq!(value[0], &Value::String("asdf".to_string()));
  }

  #[test]
  fn test_creator_user_token() {
    let search = build_query(&SearchArgs {
      search_term: "asdf",
      is_featured: None,
      maybe_creator_user_token: Some(&UserToken::new_from_str("USER_TOKEN")),
      maybe_media_classes: None,
      maybe_media_types: None,
      maybe_engine_categories: None,
      client: &elasticsearch::Elasticsearch::default(),
    }).unwrap();

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.must[0].term.is_deleted").unwrap();

    assert_eq!(value[0], &Value::Bool(false));

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.must[1].term.maybe_creator_user_token").unwrap();

    assert_eq!(value[0], &Value::String("USER_TOKEN".to_string()));

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.should[0].fuzzy.maybe_title.value").unwrap();

    assert_eq!(value[0], &Value::String("asdf".to_string()));

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.should[1].match.maybe_title.query").unwrap();

    assert_eq!(value[0], &Value::String("asdf".to_string()));

    let value = jsonpath_lib::select(
      &search, "$.query.bool.must[0].bool.should[2].multi_match.query").unwrap();

    assert_eq!(value[0], &Value::String("asdf".to_string()));
  }

  #[test]
  fn test_media_class() {
    let search = build_query(&SearchArgs {
      search_term: "bar",
      is_featured: None,
      maybe_creator_user_token: None,
      maybe_media_classes: Some(HashSet::from_iter(vec![
        MediaFileClass::Dimensional,
        MediaFileClass::Image,
      ])),
      maybe_media_types: None,
      maybe_engine_categories: None,
      client: &elasticsearch::Elasticsearch::default(),
    }).unwrap();

    let value = select(&search, "$.query.bool.must[0].bool.must[0].term.is_deleted");

    assert_eq!(value[0], &Value::Bool(false));

    let values = select_str_values(
      &search, "$.query.bool.must[0].bool.must[1].bool.should[*].term.media_class");

    assert_eq!(values.len(), 2);
    assert!(values.contains(&"image"));
    assert!(values.contains(&"dimensional"));
  }

  #[test]
  fn test_media_type() {
    let search = build_query(&SearchArgs {
      search_term: "baz",
      is_featured: None,
      maybe_creator_user_token: None,
      maybe_media_classes: None,
      maybe_media_types: Some(HashSet::from_iter(vec![
        MediaFileType::Glb,
        MediaFileType::Png,
      ])),
      maybe_engine_categories: None,
      client: &elasticsearch::Elasticsearch::default(),
    }).unwrap();

    let value = select(&search, "$.query.bool.must[0].bool.must[0].term.is_deleted");

    assert_eq!(value[0], &Value::Bool(false));

    let values = select_str_values(
      &search, "$.query.bool.must[0].bool.must[1].bool.should[*].term.media_type");

    assert_eq!(values.len(), 2);
    assert!(values.contains(&"glb"));
    assert!(values.contains(&"png"));
  }

  #[test]
  fn test_engine_category() {
    let search = build_query(&SearchArgs {
      search_term: "bin",
      is_featured: None,
      maybe_creator_user_token: None,
      maybe_media_classes: None,
      maybe_media_types: None,
      maybe_engine_categories: Some(HashSet::from_iter(vec![
        MediaFileEngineCategory::Animation,
        MediaFileEngineCategory::Character,
      ])),
      client: &elasticsearch::Elasticsearch::default(),
    }).unwrap();

    let value = select(&search, "$.query.bool.must[0].bool.must[0].term.is_deleted");

    assert_eq!(value[0], &Value::Bool(false));

    let values = select_str_values(
      &search, "$.query.bool.must[0].bool.must[1].bool.should[*].term.maybe_engine_category");

    assert_eq!(values.len(), 2);
    assert!(values.contains(&"animation"));
    assert!(values.contains(&"character"));
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
