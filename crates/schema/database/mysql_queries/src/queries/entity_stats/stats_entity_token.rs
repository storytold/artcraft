use enums_db::by_table::entity_stats::stats_entity_type::StatsEntityType;
use enums_db::by_table::user_bookmarks::user_bookmark_entity_type::UserBookmarkEntityType;
use enums_db::by_table::user_ratings::entity_type::UserRatingEntityType;
use tokens::tokens::comments::CommentToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;

pub enum StatsEntityToken {
  Comment(CommentToken),
  MediaFile(MediaFileToken),
  ModelWeight(ModelWeightToken),
}

impl StatsEntityToken {

  /// Bookmark entity types aren't 1:1, and they're not a superset (yet) either.
  pub fn from_bookmark_entity_type_and_token(entity_type: UserBookmarkEntityType, token: &str) -> Option<Self> {
    match entity_type {
      UserBookmarkEntityType::MediaFile => Some(Self::MediaFile(MediaFileToken::new_from_str(token))),
      UserBookmarkEntityType::ModelWeight => Some(Self::ModelWeight(ModelWeightToken::new_from_str(token))),
      _ => None,
    }
  }

  /// Rating entity types aren't 1:1, and they're not a superset (yet) either.
  pub fn from_rating_entity_type_and_token(entity_type: UserRatingEntityType, token: &str) -> Option<Self> {
    match entity_type {
      UserRatingEntityType::MediaFile => Some(Self::MediaFile(MediaFileToken::new_from_str(token))),
      UserRatingEntityType::ModelWeight => Some(Self::ModelWeight(ModelWeightToken::new_from_str(token))),
      _ => None,
    }
  }

  pub fn from_entity_type_and_token(entity_type: StatsEntityType, token: &str) -> Self {
    match entity_type {
      StatsEntityType::Comment => Self::Comment(CommentToken::new_from_str(token)),
      StatsEntityType::MediaFile => Self::MediaFile(MediaFileToken::new_from_str(token)),
      StatsEntityType::ModelWeight => Self::ModelWeight(ModelWeightToken::new_from_str(token)),
    }
  }

  pub fn get_composite_keys(&self) -> (StatsEntityType, &str) {
    match self {
      StatsEntityToken::Comment(comment_token) => (StatsEntityType::Comment, comment_token.as_str()),
      StatsEntityToken::MediaFile(media_file_token) => (StatsEntityType::MediaFile, media_file_token.as_str()),
      StatsEntityToken::ModelWeight(model_weight_token) => (StatsEntityType::ModelWeight, model_weight_token.as_str()),
    }
  }
}
