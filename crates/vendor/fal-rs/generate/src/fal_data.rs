use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct ModelGroup {
    pub key: String,
    pub label: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub struct Model {
    pub id: String,
    pub title: String,
    pub category: String,
    #[serde(default)]
    pub tags: Vec<String>,
    pub short_description: String,
    pub thumbnail_url: String,
    pub model_url: String,
    pub stream_url: Option<String>,
    pub date: String,
    pub machine_type: Option<String>,
    pub license_type: Option<String>,
    pub group: Option<ModelGroup>,
    #[serde(default)]
    pub result_comparison: bool,
    #[serde(default)]
    pub highlighted: bool,
    pub pricing_info_override: Option<String>,
    pub credits_required: Option<i32>,
    pub endpoint_id: String,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct AppDataMetadata {
    pub openapi: serde_json::Value,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct AppData {
    pub app_name: String,
    pub metadata: AppDataMetadata,
}
