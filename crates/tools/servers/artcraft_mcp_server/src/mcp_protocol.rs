use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct JsonRpcRequest {
  pub jsonrpc: String,
  pub id: Option<Value>, // None for notifications
  pub method: String,
  pub params: Option<Value>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct JsonRpcResponse {
  pub jsonrpc: String,
  pub id: Value,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub result: Option<Value>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub error: Option<JsonRpcError>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct JsonRpcError {
  pub code: i64,
  pub message: String,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub data: Option<Value>,
}

impl JsonRpcResponse {
  pub fn success(id: Value, result: Value) -> Self {
    Self {
      jsonrpc: "2.0".to_string(),
      id,
      result: Some(result),
      error: None,
    }
  }

  pub fn error(id: Value, code: i64, message: &str) -> Self {
    Self {
      jsonrpc: "2.0".to_string(),
      id,
      result: None,
      error: Some(JsonRpcError {
        code,
        message: message.to_string(),
        data: None,
      }),
    }
  }
}

// Client info sent in initialize request
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InitializeParams {
  #[serde(rename = "protocolVersion")]
  pub protocol_version: String,
  pub capabilities: Value,
  #[serde(rename = "clientInfo")]
  pub client_info: ClientInfo,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ClientInfo {
  pub name: String,
  pub version: String,
}

// Server info sent in initialize response
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InitializeResult {
  #[serde(rename = "protocolVersion")]
  pub protocol_version: String,
  pub capabilities: ServerCapabilities,
  #[serde(rename = "serverInfo")]
  pub server_info: ServerInfo,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ServerCapabilities {
  #[serde(skip_serializing_if = "Option::is_none")]
  pub tools: Option<ToolsCapability>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ToolsCapability {
  #[serde(skip_serializing_if = "Option::is_none")]
  pub list_changed: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ServerInfo {
  pub name: String,
  pub version: String,
}

// Tools list request/response
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ListToolsResult {
  pub tools: Vec<McpTool>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct McpTool {
  pub name: String,
  pub description: String,
  #[serde(rename = "inputSchema")]
  pub input_schema: Value,
}

// Call tool request/response
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CallToolParams {
  pub name: String,
  pub arguments: Option<Value>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CallToolResult {
  pub content: Vec<McpContent>,
  #[serde(rename = "isError", skip_serializing_if = "Option::is_none")]
  pub is_error: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum McpContent {
  #[serde(rename = "text")]
  Text { text: String },
  #[serde(rename = "image")]
  Image {
    data: String, // base64
    #[serde(rename = "mimeType")]
    mime_type: String,
  },
}
