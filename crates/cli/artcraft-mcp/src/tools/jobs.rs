use anyhow::{anyhow, Result};
use serde_json::{json, Value};

use artcraft_client::endpoints::jobs::list_session_jobs::{list_session_jobs, States};

use crate::client::ArtCraftClient;
use crate::types::{Tool, ToolContent};

pub fn tools() -> Vec<Tool> {
    vec![
        Tool {
            name: "artcraft_get_job_status".to_string(),
            description: "Poll the status of a single inference job by token.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "job_token": { "type": "string" }
                },
                "required": ["job_token"]
            })),
        },
        Tool {
            name: "artcraft_list_jobs".to_string(),
            description: "List all session jobs with optional state filters.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "status": { "type": "string", "enum": ["pending", "started", "completed", "failed", "cancelled"] },
                    "cursor": { "type": "string" },
                    "limit": { "type": "integer" }
                }
            })),
        },
        Tool {
            name: "artcraft_terminate_job".to_string(),
            description: "Cancel a running or pending job.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "job_token": { "type": "string" }
                },
                "required": ["job_token"]
            })),
        },
    ]
}

pub async fn get_job_status(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let job_token_str = arguments["job_token"].as_str()
        .ok_or_else(|| anyhow!("job_token is required"))?;

    let response = list_session_jobs(
        &client.api_host,
        client.creds_ref(),
        States::All,
    ).await?;

    let job = response.jobs.iter().find(|j| j.job_token.as_str() == job_token_str);

    match job {
        Some(j) => {
            let status = format!("{:?}", j.status.status);
            let progress = j.status.progress_percentage;
            let category = format!("{:?}", j.request.inference_category);
            let maybe_result = j.maybe_result.as_ref();

            let mut lines = vec![
                format!("Job: {}", j.job_token.as_str()),
                format!("Status: {}", status),
                format!("Progress: {}%", progress),
                format!("Category: {}", category),
                format!("Created: {}", j.created_at),
                format!("Updated: {}", j.updated_at),
            ];

            if let Some(extra) = &j.status.maybe_extra_status_description {
                lines.push(format!("Extra: {}", extra));
            }
            if let Some(failure) = &j.status.maybe_failure_message {
                lines.push(format!("Failure: {}", failure));
            }
            if let Some(result) = maybe_result {
                lines.push(format!("Result token: {}", result.entity_token));
                if let Some(completed_at) = result.maybe_successfully_completed_at {
                    lines.push(format!("Completed at: {}", completed_at));
                }
            }

            Ok(vec![ToolContent {
                content_type: "text".to_string(),
                text: lines.join("\n"),
            }])
        }
        None => {
            Ok(vec![ToolContent {
                content_type: "text".to_string(),
                text: format!("Job {} not found in session jobs.", job_token_str),
            }])
        }
    }
}

pub async fn list_jobs(_arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let response = list_session_jobs(
        &client.api_host,
        client.creds_ref(),
        States::All,
    ).await?;

    let mut lines = vec![format!("Found {} jobs:", response.jobs.len())];

    for job in &response.jobs {
        let status = format!("{:?}", job.status.status);
        let progress = job.status.progress_percentage;
        let category = format!("{:?}", job.request.inference_category);
        lines.push(format!(
            "  - {} | {} | {}% | {} | {}",
            job.job_token.as_str(),
            status,
            progress,
            category,
            job.created_at
        ));
    }

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: lines.join("\n"),
    }])
}

pub async fn terminate_job(_arguments: Value, _client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: "Terminate job not yet implemented in MCP server.".to_string(),
    }])
}
