use tokens::tokens::media_files::MediaFileToken;

#[derive(Clone, Debug)]
pub enum ImageListRef {
  MediaFileTokens(Vec<MediaFileToken>),
  Urls(Vec<String>),
}
