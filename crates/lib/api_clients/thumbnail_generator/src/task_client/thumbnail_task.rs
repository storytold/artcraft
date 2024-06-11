use log::error;
use serde_json::{json, Value};

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
    bucket: Option<String>,
    path: Option<String>,
    source_mimetype: Option<String>,
    output_mimetype: Option<String>,
    output_extension: Option<String>,
    output_suffix: Option<String>,
    event_id: Option<String>,
}

impl ThumbnailTaskBuilder {
    pub fn new() -> Self {
        Self {
            bucket: None,
            path: None,
            source_mimetype: None,
            output_mimetype: None,
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

    pub fn with_source_mimetype(&mut self, source_mimetype: &str) -> &mut Self {
        self.source_mimetype = Some(source_mimetype.to_string());
        self
    }

    pub fn with_output_mimetype(&mut self, output_mimetype: &str) -> &mut Self {
        self.output_mimetype = Some(output_mimetype.to_string());
        self
    }

    pub fn with_output_extension(&mut self, output_extension: &str) -> &mut Self {
        self.output_extension = Some(output_extension.to_string());
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

    fn build(&self) -> Result<ThumbnailTask, String> {
        Ok(ThumbnailTask {
            bucket: self.bucket.clone().ok_or("bucket is required")?,
            path: self.path.clone().ok_or("path is required")?,
            source_mimetype: self.source_mimetype.clone().ok_or("source_mimetype is required")?,
            output_mimetype: self.output_mimetype.clone().ok_or("output_mimetype is required")?,
            output_extension: self.output_extension.clone().ok_or("output_extension is required")?,
            output_suffix: self.output_suffix.clone().unwrap_or("".to_string()),
            event_id: self.event_id.clone().ok_or("event_id is required")?,
        })
    }

    pub async fn send(&self) -> Result<(), ThumbnailTaskError> {
        match self.build() {
            Ok(task) => {
                match task.send().await {
                    Ok(_) => Ok(()),
                    Err(_) => Err(ThumbnailTaskError::RequestError),
                }
            }
            Err(_) => {
                error!("Invalid thumbnail task: {:?}", self);
                Err(ThumbnailTaskError::InvalidTask)
            },
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
