use tokens::tokens::media_files::MediaFileToken;


/// Fields useful for enriching media file listings
#[derive(Clone, Serialize)]
pub struct MediaFileSocialMetaLight {
    pub favorites_count: u64,
    pub comments_count: u64,
}

impl MediaFileSocialMetaLight {
    pub fn from_db_fields(
        favorites_count: u64,
        comments_count: u64,
    ) -> Self {
        Self {
            favorites_count,
            comments_count,
        }
    }
}
