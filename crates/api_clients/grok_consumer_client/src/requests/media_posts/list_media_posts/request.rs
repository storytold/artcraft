use serde::Serialize;

#[derive(Serialize)]
pub struct MediaPostListRawRequest {
  /// eg. 40
  pub limit: usize,
  pub filter: FilterData,
}

#[derive(Serialize)]
pub struct FilterData {
  /// eg. "MEDIA_POST_SOURCE_LIKED"
  pub source: String,
}

/*
{
  "limit":40,
  "filter":{
    "source":"MEDIA_POST_SOURCE_LIKED"
  }
}
*/

