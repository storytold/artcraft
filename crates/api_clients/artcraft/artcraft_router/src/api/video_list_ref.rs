use tokens::tokens::media_files::MediaFileToken;

#[derive(Clone, Debug)]
pub enum VideoListRef {
  MediaFileTokens(Vec<MediaFileToken>),
  Urls(Vec<String>),
}
