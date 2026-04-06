use tokens::tokens::media_files::MediaFileToken;

#[derive(Copy, Clone, Debug)]
pub enum VideoListRef<'a> {
  MediaFileTokens(&'a Vec<MediaFileToken>),
  Urls(&'a Vec<String>),
}
