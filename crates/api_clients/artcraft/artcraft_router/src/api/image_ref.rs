use tokens::tokens::media_files::MediaFileToken;

#[derive(Clone, Debug)]
pub enum ImageRef {
  MediaFileToken(MediaFileToken),
  Url(String),
}
