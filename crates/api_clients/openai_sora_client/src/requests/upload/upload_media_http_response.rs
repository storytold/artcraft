use serde_derive::Deserialize;

#[derive(Debug, Deserialize)]
pub struct SoraMediaUploadResponse {
  /// This is the media token id.
  pub id: String,
  pub r#type: String,
  pub created_at: String,
  pub filename: String,
  pub extension: String,
  pub mime_type: String,
  pub url: String,
  pub width: Option<u32>,
  pub height: Option<u32>,
  pub duration_sec: Option<f64>,
  pub n_frames: Option<u32>,
  pub size_bytes: u64,
  pub thumbnail_url: Option<String>,
}

// Content-Disposition: form-data; name="file"; filename="imagename.webp"

/*
Response:
{
  "id": "media_01jqt9vt20erx9zvryf3v1pecx",
  "type": "image",
  "created_at": "2025-04-02T03:49:04.185867Z",
  "filename": "Rith_essa.webp",
  "extension": "jpeg",
  "mime_type": "image/jpeg",
  "url": "https://videos.openai.com/vg-assets/assets%2Fclient_upload%2Fmedia%2Fuser-9wf6JFdgRSJLjvSJ53LNAbV8%2Fmedia_01jqt9vt20erx9zvryf3v1pecx.jpeg?st=2025-04-02T02%3A39%3A01Z&se=2025-04-08T03%3A39%3A01Z&sks=b&skt=2025-04-02T02%3A39%3A01Z&ske=2025-04-08T03%3A39%3A01Z&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skoid=3d249c53-07fa-4ba4-9b65-0bf8eb4ea46a&skv=2019-02-02&sv=2018-11-09&sr=b&sp=r&spr=https%2Chttp&sig=%2BdnTQyw9OFF2kaVoEReT2cVfTqmKjGt18m7P4wKCWCI%3D&az=oaivgprodscus",
  "width": 1200,
  "height": 675,
  "duration_sec": null,
  "n_frames": 1,
  "size_bytes": 118501,
  "thumbnail_url": "https://videos.openai.com/vg-assets/assets%2Fclient_upload%2Fmedia%2Fuser-9wf6JFdgRSJLjvSJ53LNAbV8%2Fmedia_01jqt9vt20erx9zvryf3v1pecx.jpg?st=2025-04-02T02%3A39%3A01Z&se=2025-04-08T03%3A39%3A01Z&sks=b&skt=2025-04-02T02%3A39%3A01Z&ske=2025-04-08T03%3A39%3A01Z&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skoid=3d249c53-07fa-4ba4-9b65-0bf8eb4ea46a&skv=2019-02-02&sv=2018-11-09&sr=b&sp=r&spr=https%2Chttp&sig=9aU9xKI0BkhRtrTb0RD05%2BT6prBnmXk1I7nV2nTsFbY%3D&az=oaivgprodscus"
}

Error response:

Failed to upload scene media to Sora: Upload failed with status 401 Unauthorized: {
      "error": {
        "message": "Your authentication token has expired. Please try signing in again.",
        "type": "invalid_request_error",
        "param": null,
        "code": "token_expired"
      }
    }
*/
