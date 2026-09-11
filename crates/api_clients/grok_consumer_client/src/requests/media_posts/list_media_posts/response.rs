use serde::Deserialize;

#[derive(Deserialize, Debug)]
pub (crate) struct PostListRawResponse {
  pub posts: Vec<PostItem>,

  #[serde(rename = "nextCursor")]
  pub next_cursor: Option<String>,
}

#[derive(Deserialize, Debug)]
pub (crate) struct PostItem {
  /// The "id" of the post.
  /// This is how we assert video task completion
  pub id: String,

  /// Sometimes this is a VLM-generated prompt
  /// This might become the prompt of the video if the video has no prompt.
  pub prompt: Option<String>,

  /// eg. `MEDIA_POST_TYPE_IMAGE`
  #[serde(rename = "mediaType")]
  pub media_type: Option<String>,

  /// eg. "https://imagine-public.x.ai/imagine-public/share-images/abd9331b-c5ac-49cc-8bec-c410c7efde98.jpg"
  #[serde(rename = "mediaUrl")]
  pub media_url: Option<String>,

  #[serde(rename = "childPosts")]
  pub child_posts: Vec<ChildPostItem>,
}

#[derive(Deserialize, Debug)]
pub (crate) struct ChildPostItem {
  pub id: String,

  /// eg. `MEDIA_POST_TYPE_VIDEO`
  #[serde(rename = "mediaType")]
  pub media_type: Option<String>,

  /// eg. "https://assets.grok.com/users/85980643-ffab-4984-a3de-59a608c47d7f/generated/ecec690e-15bd-4f5f-b4e9-9b8733c3fd69/generated_video.mp4"
  #[serde(rename = "mediaUrl")]
  pub media_url: Option<String>,

  /// The unmodified user prompt
  #[serde(rename = "originalPrompt")]
  pub original_prompt: Option<String>,
}

/*
{
  "posts": [
    {
      "id": "abd9331b-c5ac-49cc-8bec-c410c7efde98",
      "userId": "85980643-ffab-4984-a3de-59a608c47d7f",
      "createTime": "2025-10-30T23:49:37.583477Z",
      "prompt": "",
      "mediaType": "MEDIA_POST_TYPE_IMAGE",
      "mediaUrl": "https://imagine-public.x.ai/imagine-public/share-images/abd9331b-c5ac-49cc-8bec-c410c7efde98.jpg",
      "mimeType": "image/jpeg",
      "audioUrls": [],
      "childPosts": [
        {
          "id": "ecec690e-15bd-4f5f-b4e9-9b8733c3fd69",
          "userId": "85980643-ffab-4984-a3de-59a608c47d7f",
          "createTime": "2025-10-30T23:50:04.862487Z",
          "prompt": "",
          "mediaType": "MEDIA_POST_TYPE_VIDEO",
          "mediaUrl": "https://assets.grok.com/users/85980643-ffab-4984-a3de-59a608c47d7f/generated/ecec690e-15bd-4f5f-b4e9-9b8733c3fd69/generated_video.mp4",
          "mimeType": "video/mp4",
          "originalPostId": "abd9331b-c5ac-49cc-8bec-c410c7efde98",
          "audioUrls": [],
          "childPosts": [],
          "originalPrompt": "an anime girl runs away from a giant t-rex",
          "mode": "custom",
          "modelName": "imagine_xdit_1"
        }
      ],
      "originalPrompt": "",
      "userInteractionStatus": {
        "likeStatus": true
      },
      "modelName": "imagine_h_1",
      "thumbnailImageUrl": "https://imagine-public.x.ai/cdn-cgi/image/width=500,fit=scale-down,format=auto/imagine-public/share-images/abd9331b-c5ac-49cc-8bec-c410c7efde98.jpg"
    },
    {
      "id": "3c896963-8e6b-4e71-83e1-4253b2bf2ac8",
 */