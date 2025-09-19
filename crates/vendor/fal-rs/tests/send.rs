use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Default)]
pub struct File {
    pub url: String,
    pub content_type: String,
    pub file_name: Option<String>,
    pub file_size: Option<i64>,
    pub width: Option<i64>,
    pub height: Option<i64>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct FalMultiImageResponse {
    pub images: Vec<File>,
}

#[fal::endpoint(endpoint = "fal-ai/flux/dev")]
fn fal_dev(prompt: String) -> FalMultiImageResponse {}

#[tokio::test]
async fn test_simple_send() {
    let response = fal_dev("a horse".to_owned()).send().await.unwrap();

    assert!(response.images.len() > 0)
}
