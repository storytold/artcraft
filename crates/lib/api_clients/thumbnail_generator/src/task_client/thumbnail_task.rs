use log::error;
use serde_json::{json, Value};


#[derive(Debug)]
pub enum ThumbnailTaskInputMimeType {
    MP4
}

pub enum ThumbnailTaskOutputMimeType {
    PNG,
    JPEG,
    GIF,
}

impl ThumbnailTaskInputMimeType {
    fn as_str(&self) -> &str {
        match self {
            ThumbnailTaskInputMimeType::MP4 => "video/mp4",
        }
    }

    fn as_string(&self) -> String {
        self.as_str().to_string()
    }

    fn to_output_mimetypes(&self) -> Vec<ThumbnailTaskOutputMimeType> {
        match self {
            ThumbnailTaskInputMimeType::MP4 => vec![
                ThumbnailTaskOutputMimeType::JPEG,
                ThumbnailTaskOutputMimeType::GIF,
            ],
        }
    }
}

impl ThumbnailTaskOutputMimeType {
    fn as_str(&self) -> &str {
        match self {
            ThumbnailTaskOutputMimeType::PNG => "image/png",
            ThumbnailTaskOutputMimeType::JPEG => "image/jpeg",
            ThumbnailTaskOutputMimeType::GIF => "image/gif",
        }
    }

    fn as_string(&self) -> String {
        self.as_str().to_string()
    }

    fn to_extension(&self) -> &str {
        match self {
            ThumbnailTaskOutputMimeType::PNG => "png",
            ThumbnailTaskOutputMimeType::JPEG => "jpg",
            ThumbnailTaskOutputMimeType::GIF => "gif",
        }
    }
}


#[derive(Debug)]
pub enum ThumbnailTaskError {
    InvalidTask,
    RequestError,
}

struct ThumbnailTask{
    bucket: String,
    path: String,
    source_mimetype: String,
    output_mimetype: String,
    output_extension: String,
    output_suffix: String,
    event_id: String,
}

#[derive(Debug)]
pub struct ThumbnailTaskBuilder{
    source_mimetype: ThumbnailTaskInputMimeType,
    bucket: Option<String>,
    path: Option<String>,
    output_extension: Option<String>,
    output_suffix: Option<String>,
    event_id: Option<String>,
}

impl ThumbnailTaskBuilder {
    pub fn new_for_source_mimetype(source_mimetype: ThumbnailTaskInputMimeType) -> Self {
        Self {
            source_mimetype,
            bucket: None,
            path: None,
            output_extension: None,
            output_suffix: None,
            event_id: None,
        }
    }

    pub fn with_bucket(&mut self, bucket: &str) -> &mut Self {
        self.bucket = Some(bucket.to_string());
        self
    }

    pub fn with_path(&mut self, path: &str) -> &mut Self {
        self.path = Some(path.to_string());
        self
    }

    pub fn with_output_suffix(&mut self, output_suffix: &str) -> &mut Self {
        self.output_suffix = Some(output_suffix.to_string());
        self
    }

    pub fn with_event_id(&mut self, event_id: &str) -> &mut Self {
        self.event_id = Some(event_id.to_string());
        self
    }

    fn build(&self, thumbnail_task_output_mime_type: ThumbnailTaskOutputMimeType) -> Result<ThumbnailTask, String> {
        Ok(ThumbnailTask {
            source_mimetype: self.source_mimetype.as_string(),
            output_mimetype: thumbnail_task_output_mime_type.as_string(),
            output_extension: thumbnail_task_output_mime_type.to_extension().to_string(),
            bucket: self.bucket.clone().ok_or("bucket is required")?,
            path: self.path.clone().ok_or("path is required")?,
            output_suffix: self.output_suffix.clone().unwrap_or("".to_string()),
            event_id: self.event_id.clone().ok_or("event_id is required")?,
        })
    }

    pub async fn send_all(&self) -> Result<(), ThumbnailTaskError> {
        let mut results: Vec<Result<(), ThumbnailTaskError>> = vec![];
        for output_mimetype in self.source_mimetype.to_output_mimetypes() {
            match self.build(output_mimetype) {
                Ok(task) => {
                    match task.send().await {
                        Ok(_) => {},
                        Err(err) => {
                            error!("Failed to send thumbnail task: {:?} with err {:?}", self, err);
                            results.push(Err(ThumbnailTaskError::RequestError));
                        },
                    }
                }
                Err(err) => {
                    error!("Invalid thumbnail task: {:?} with err {:?}", self, err);
                    results.push(Err(ThumbnailTaskError::InvalidTask));
                },
            };

        }

        if results.iter().any(|r| r.is_err()) {
            Err(ThumbnailTaskError::RequestError)
        } else {
            Ok(())
        }
    }
}

impl ThumbnailTask{
    fn request_json(&self) -> Value {
        let output_path = format!(
            "{}-{}.{}",
            self.path,
            self.output_suffix,
            self.output_extension);

        let input = json!({
            "bucket": self.bucket,
            "path": self.path,
            "type": self.source_mimetype,
        });

        let output = json!({
            "bucket": self.bucket,
            "path": output_path,
            "type": self.output_mimetype,
        });

        // TODO@madhukar: add tags -> metadata for gcs objects
        let tags = json!([]);

        json!({
            "event_id": self.event_id,
            "input": input,
            "output": output,
            "tags": tags,
        })
    }

    async fn send(&self) -> Result<(), reqwest::Error> {
        // TODO: retries?
        // TODO: move to config
        let url = easyenv::get_env_string_or_default(
            "THUMBNAIL_GENERATOR_API_URL",
            "http://media-server.thumbnail-generator/tasks",
        );

        let basic_auth = easyenv::get_env_string_or_default(
            "THUMBNAIL_GENERATOR_API_BASIC_AUTH",
            "",
        );

        let client = reqwest::Client::new();
        let task_json = self.request_json();
        client.post(url)
            .header("Authorization", "Basic ".to_owned() + &basic_auth)
            .json(&task_json)
            .send()
            .await?
            .error_for_status()?;
        Ok(())
    }
}
