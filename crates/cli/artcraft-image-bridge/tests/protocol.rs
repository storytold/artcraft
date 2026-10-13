use rmcp::{model::CallToolRequestParams, transport::TokioChildProcess, ServiceExt};
use serde_json::json;

#[tokio::test]
async fn local_tools_survive_missing_invalid_and_misplaced_live_keys() -> anyhow::Result<()> {
  let temp = tempfile::tempdir()?;
  let root = temp.path().join("images");
  std::fs::create_dir(&root)?;
  let image = root.join("fixture.png");
  image::RgbaImage::new(2, 2).save(&image)?;
  let missing = temp.path().join("missing.dpapi");
  let invalid = temp.path().join("invalid.dpapi");
  let misplaced = root.join("invalid.dpapi");
  let secret_marker = "invalid-credential-must-never-appear-in-errors";
  std::fs::write(&invalid, secret_marker)?;
  std::fs::write(&misplaced, secret_marker)?;
  for (index, key) in [missing, invalid, misplaced].iter().enumerate() {
    let state = temp.path().join(format!("state-{index}"));
    let mut command = tokio::process::Command::new(env!("CARGO_BIN_EXE_artcraft-image-bridge"));
    command.arg(&root).arg(&state).arg("--live-key").arg(key);
    let client = ().serve(TokioChildProcess::new(command)?).await?;
    assert_eq!(client.list_all_tools().await?.len(), 4);
    let inspected = client
      .call_tool(
        CallToolRequestParams::new("artcraft_inspect_local_image")
          .with_arguments(json!({"path":image}).as_object().unwrap().clone()),
      )
      .await?;
    assert_ne!(inspected.is_error, Some(true));
    let wire = serde_json::to_value(&inspected)?;
    let info: serde_json::Value =
      serde_json::from_str(wire["content"][0]["text"].as_str().unwrap())?;
    let id = uuid::Uuid::new_v4().to_string();
    let failed = client
      .call_tool(
        CallToolRequestParams::new("artcraft_import_local_image").with_arguments(
          json!({"path":image,"expected_sha256":info["sha256"],"request_id":id,
          "accept_remote_link_access":true})
          .as_object()
          .unwrap()
          .clone(),
        ),
      )
      .await?;
    assert_eq!(failed.is_error, Some(true));
    let error = serde_json::to_string(&failed)?;
    assert!(!error.contains(secret_marker));
    assert!(
      error.contains("credential")
        || error.contains("Credential")
        || error.contains("encrypted key")
    );
    let status = client
      .call_tool(
        CallToolRequestParams::new("artcraft_get_import")
          .with_arguments(json!({"request_id":id}).as_object().unwrap().clone()),
      )
      .await?;
    assert_ne!(status.is_error, Some(true));
    assert_eq!(serde_json::to_value(&status)?["content"][0]["text"], "null");
    let recovery = client
      .call_tool(
        CallToolRequestParams::new("artcraft_explain_import_recovery")
          .with_arguments(json!({"request_id":id}).as_object().unwrap().clone()),
      )
      .await?;
    assert_ne!(recovery.is_error, Some(true));
    let wire = serde_json::to_value(&recovery)?;
    let report: serde_json::Value =
      serde_json::from_str(wire["content"][0]["text"].as_str().unwrap())?;
    assert_eq!(report["assessment"], "no_local_record");
    assert_eq!(report["remote_checked"], false);
    assert!(!wire.to_string().contains(secret_marker));
    assert!(!state.join(format!("{id}.json")).exists());
    client.cancel().await?;
  }
  Ok(())
}

#[tokio::test]
async fn concurrent_stdio_clients_can_both_discover_tools() -> anyhow::Result<()> {
  let temp = tempfile::tempdir()?;
  let root = temp.path().join("images");
  let state = temp.path().join("state");
  std::fs::create_dir(&root)?;
  let mut clients = Vec::new();
  for _ in 0..2 {
    let mut command = tokio::process::Command::new(env!("CARGO_BIN_EXE_artcraft-image-bridge"));
    command.arg(&root).arg(&state).arg("--mock");
    let client = ().serve(TokioChildProcess::new(command)?).await?;
    assert_eq!(client.list_all_tools().await?.len(), 4);
    clients.push(client);
  }
  for client in clients {
    client.cancel().await?;
  }
  Ok(())
}

#[tokio::test]
async fn standard_client_discovers_and_calls_stdio_tools() -> anyhow::Result<()> {
  let temp = tempfile::tempdir()?;
  let root = temp.path().join("images");
  std::fs::create_dir(&root)?;
  let image = root.join("input.png");
  image::RgbaImage::new(2, 2).save(&image)?;
  let mut command = tokio::process::Command::new(env!("CARGO_BIN_EXE_artcraft-image-bridge"));
  command
    .arg(&root)
    .arg(temp.path().join("state"))
    .arg("--mock");
  let client = ().serve(TokioChildProcess::new(command)?).await?;
  let tools = client.list_all_tools().await?;
  assert_eq!(tools.len(), 4);
  let wire = serde_json::to_value(&tools)?;
  assert!(wire[0].get("inputSchema").is_some());
  let inspect = client
    .call_tool(
      CallToolRequestParams::new("artcraft_inspect_local_image")
        .with_arguments(json!({"path": image}).as_object().unwrap().clone()),
    )
    .await?;
  assert_ne!(inspect.is_error, Some(true));
  let wire = serde_json::to_value(&inspect)?;
  let info: serde_json::Value = serde_json::from_str(wire["content"][0]["text"].as_str().unwrap())?;
  let id = uuid::Uuid::new_v4().to_string();
  let imported = client
    .call_tool(
      CallToolRequestParams::new("artcraft_import_local_image").with_arguments(
        json!({"path": image, "expected_sha256": info["sha256"], "request_id": id})
          .as_object()
          .unwrap()
          .clone(),
      ),
    )
    .await?;
  assert_ne!(imported.is_error, Some(true));
  let status = client
    .call_tool(
      CallToolRequestParams::new("artcraft_get_import")
        .with_arguments(json!({"request_id": id}).as_object().unwrap().clone()),
    )
    .await?;
  assert_ne!(status.is_error, Some(true));
  let bad = client
    .call_tool(
      CallToolRequestParams::new("artcraft_inspect_local_image")
        .with_arguments(json!({"path": "relative.png"}).as_object().unwrap().clone()),
    )
    .await?;
  assert_eq!(bad.is_error, Some(true));
  assert_eq!(serde_json::to_value(&bad)?["isError"], true);
  client.cancel().await?;
  Ok(())
}
