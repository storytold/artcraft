use tokens::tokens::media_files::MediaFileToken;

#[derive(Copy, Clone)]
pub enum AudioListRef<'a> {
  MediaFileTokens(&'a Vec<MediaFileToken>),
  Urls(&'a Vec<String>),
}
