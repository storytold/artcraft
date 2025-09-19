use fal::prelude::*;
use futures::StreamExt;
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
async fn test_queue() {
    let queue = fal_dev("a horse".to_owned()).queue().await.unwrap();

    loop {
        let status = queue.status(false).await.unwrap();

        if status.status == Status::Completed {
            break;
        }

        tokio::time::sleep(std::time::Duration::from_secs(1)).await;
    }

    let response = queue.response().await.unwrap();

    assert!(response.images.len() > 0)
}

#[tokio::test]
async fn test_queue_status_stream() {
    let queue = fal_dev("a horse".to_owned()).queue().await.unwrap();

    while let Some(status) = queue.stream(false).await.unwrap().next().await {
        let status = status.unwrap();

        if status.status == Status::Completed {
            break;
        }
    }

    let response = queue.response().await.unwrap();

    assert!(response.images.len() > 0)
}
