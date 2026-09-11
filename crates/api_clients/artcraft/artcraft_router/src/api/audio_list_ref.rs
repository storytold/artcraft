use tokens::tokens::media_files::MediaFileToken;

#[derive(Clone, Debug)]
pub enum AudioListRef {
  MediaFileTokens(Vec<MediaFileToken>),
  Urls(Vec<String>),
}
