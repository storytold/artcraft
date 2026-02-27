use tokens::tokens::media_files::MediaFileToken;

#[derive(Copy, Clone)]
pub enum ImageRef<'a> {
  MediaFileToken(&'a MediaFileToken),
  Url(&'a str),
}
