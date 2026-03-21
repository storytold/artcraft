use enums_db::by_table::model_weights::weights_types::WeightsType;
use std::collections::HashSet;
use serde_json::{json, Value};
use enums_db::by_table::model_weights::weights_category::WeightsCategory;
use tokens::tokens::users::UserToken;

pub fn must_be_not_deleted() -> Value {
  json!({
    "term": {
      "is_deleted": false,
    }
  })
}

// pub fn featured_predicate(is_featured: bool) -> Value {
//   json!({
//     "term": {
//       "is_featured": is_featured,
//     }
//   })
// }

pub fn creator_user_token_predicate(creator_user_token: &UserToken) -> Value {
  json!({
    "term": {
      "maybe_creator_user_token": creator_user_token.as_str(),
    }
  })
}

pub fn language_subtag_predicate(language_subtag: &str) -> Value {
  json!({
    "term": {
      "maybe_ietf_primary_language_subtag": language_subtag,
    }
  })
}


pub fn weights_categories_predicates(weights_categories: &HashSet<WeightsCategory>) -> Value {
  should_predicates(weights_categories.iter()
      .map(|weight_category| {
        json!({
          "term": {
            "weights_category": weight_category.to_str(),
          }
        })
      })
      .collect())
}

pub fn weights_types_predicates(weights_types: &HashSet<WeightsType>) -> Value {
  should_predicates(weights_types.iter()
      .map(|weights_type| {
        json!({
          "term": {
            "weights_type": weights_type.to_str(),
          }
        })
      })
      .collect())
}

// NB: "Should" is a logical OR.
pub fn should_predicates(predicates: Vec<Value>) -> Value {
  json!({
    "bool": {
      "should": predicates,
    }
  })
}

