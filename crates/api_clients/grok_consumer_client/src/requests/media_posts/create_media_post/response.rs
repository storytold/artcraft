use serde::Deserialize;

#[derive(Deserialize)]
pub struct CreateMediaPostRawResponse {
  pub post: PostData,
}

#[derive(Deserialize)]
pub struct PostData {
  /// The identifier for the post
  pub id: String,
}

/*
{
  "post": {
    "id": "3c896963-8e6b-4e71-83e1-4253b2bf2ac8", 
    "userId":"85980643-ffab-4984-a3de-59a608c47d7f", 
    "createTime":"2025-10-30T23:22:19.528702688Z", 
    "prompt":"", 
    "mediaType":"MEDIA_POST_TYPE_IMAGE", 
    "mediaUrl":"https://assets.grok.com/users/85980643-ffab-4984-a3de-59a608c47d7f/3c896963-8e6b-4e71-83e1-4253b2bf2ac8/content", 
    "mimeType":"image/jpeg", 
    "audioUrls":[], 
    "childPosts":[]
  }
}
*/
