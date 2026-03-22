use std::collections::HashSet;
use std::iter::FromIterator;

use elasticsearch::Elasticsearch;

use elasticsearch_schema::searches::search_media_files::{search_media_files, SearchArgs};
use enums_db::by_table::media_files::media_file_class::MediaFileClass;
use errors::AnyhowResult;

pub async fn test_search_media_files(client: &Elasticsearch) -> AnyhowResult<()> {

  let results = search_media_files(SearchArgs {
    search_term: "cac",
    is_featured: None,
    maybe_creator_user_token: None,
    maybe_media_classes: Some(HashSet::from_iter(vec![
      MediaFileClass::Dimensional,
      MediaFileClass::Image,
    ])),
    maybe_media_types: None,
    maybe_engine_categories: None,
    client,
  }).await?;

  for result in results {
    println!("Result: {:#?}", result);
  }

  Ok(())
}
