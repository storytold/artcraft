use tokens::tokens::media_files::MediaFileToken;

#[derive(Clone, Debug)]
pub enum VideoRef {
  MediaFileToken(MediaFileToken),
  Url(String),
}
