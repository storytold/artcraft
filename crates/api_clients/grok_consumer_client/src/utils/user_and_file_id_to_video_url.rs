use crate::datatypes::api::file_id::FileId;
use crate::datatypes::api::user_id::UserId;

/// Return media URLs to images given the user and file IDs.
/// These are non-public and will return 403s unless you're logged in.
pub fn user_and_file_id_to_video_url(user: &UserId, file: &FileId, cache_bust: bool) -> String {
  let user_id = &user.0;
  let file_id = &file.0;
  if cache_bust {
    format!("https://assets.grok.com/users/{user_id}/generated/{file_id}/generated_video.mp4?cache=1")
  } else {
    format!("https://assets.grok.com/users/{user_id}/generated/{file_id}/generated_video.mp4")
  }
}

#[cfg(test)]
mod tests {
  use crate::datatypes::api::file_id::FileId;
  use crate::datatypes::api::user_id::UserId;
  use crate::utils::user_and_file_id_to_video_url::user_and_file_id_to_video_url;

  #[test]
  fn test_url() {
    let user = UserId(String::from("USER_UUID"));
    let file = FileId(String::from("FILE_UUID"));
    let url = user_and_file_id_to_video_url(&user, &file, false);
    assert_eq!(&url, "https://assets.grok.com/users/USER_UUID/generated/FILE_UUID/generated_video.mp4");

    let url = user_and_file_id_to_video_url(&user, &file, true);
    assert_eq!(&url, "https://assets.grok.com/users/USER_UUID/generated/FILE_UUID/generated_video.mp4?cache=1");
  }
}
