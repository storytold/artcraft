use std::collections::HashMap;
use std::fs::{File, read_to_string};
use std::path::Path;

use anyhow::anyhow;
use log::info;
use serde_json::Value;

use errors::AnyhowResult;
use mysql_queries::payloads::generic_inference_args::inner_payloads::workflow_payload::{NewValue, WorkflowArgs};

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::workflow::comfy_ui_dependencies::ComfyDependencies;

pub struct WorkflowPromptArgs<'a> {
  pub workflow_path: &'a str,
  pub comfy_args: &'a WorkflowArgs,
  pub model_dependencies: &'a ComfyDependencies,
  pub maybe_positive_prompt: Option<&'a str>,
  pub maybe_negative_prompt: Option<&'a str>,
}

pub fn write_workflow_prompt(args: WorkflowPromptArgs<'_>) -> Result<String, ProcessSingleJobError> {
  let mut workflow_path = args.workflow_path.to_string();

  let mut json_modifications = None;

  if let Some(modifications) = args.comfy_args.maybe_json_modifications.clone() {
    // Old-style prompt modifications method
    json_modifications = Some(modifications);
  } else if let Some(style_name) = &args.comfy_args.style_name {
    // New-style prompt modifications method
    let style_path = args.model_dependencies.inference_command.styles_directory.join(style_name.to_filename());
    info!("style_path: {:?}", style_path);

    let style_json_content = read_to_string(&style_path).map_err(|e| ProcessSingleJobError::Other(anyhow!("error reading style json: {:?}", e)))?;
    let style_json: Value = serde_json::from_str(&style_json_content).map_err(|e| ProcessSingleJobError::Other(anyhow!("error parsing style json: {:?}", e)))?;

    let mapping_name = style_json.get("mapping_name").and_then(|v| v.as_str())
        .ok_or(ProcessSingleJobError::Other(anyhow!("Failed to get or convert mapping_name from style.json")))?;
    let mapping_path = args.model_dependencies.inference_command.mappings_directory.join(mapping_name);
    let mapping_json_content = read_to_string(&mapping_path).map_err(|e| ProcessSingleJobError::Other(anyhow!("error reading mapping json: {:?}", e)))?;
    let mapping_json: Value = serde_json::from_str(&mapping_json_content).map_err(|e| ProcessSingleJobError::Other(anyhow!("error parsing mapping json: {:?}", e)))?;

    let workflow_name = style_json.get("workflow_api_name").and_then(|v| v.as_str())
        .ok_or(ProcessSingleJobError::Other(anyhow!("Failed to get or convert workflow_api_name from style.json")))?;
    let workflow_original_location = args.model_dependencies.inference_command.workflows_directory.join(workflow_name);

    std::fs::copy(&workflow_original_location, &workflow_path).map_err(|e| ProcessSingleJobError::Other(anyhow!("error copying workflow: {:?}", e)))?;

    let style_modifications = style_json.get("modifications").ok_or(ProcessSingleJobError::Other(anyhow!("Failed to get modifications from style.json")))?;
    let positive_prompt = args.maybe_positive_prompt.as_deref();
    let maybe_negative_prompt = args.maybe_negative_prompt.as_deref();

    json_modifications = Some(get_style_modifications(style_modifications, &mapping_json, &positive_prompt, &maybe_negative_prompt));

  } else {
    return Err(ProcessSingleJobError::Other(anyhow!("No style nor json modifications provided")));
  }

  workflow_path = apply_jsonpath_modifications(json_modifications.unwrap(), &workflow_path)?;

  Ok(workflow_path)
}

fn apply_jsonpath_modifications(modifications: HashMap<String, NewValue>, workflow_path: &str) -> AnyhowResult<String> {

  info!("Prompt modifications: #{:?}", modifications);

  // Load prompt.json
  info!("Loading prompt file: {:?}", workflow_path);
  let prompt_file = File::open(workflow_path)?;
  let mut prompt_json: Value = serde_json::from_reader(prompt_file)?;

  // Modify json
  for (path, new_value) in modifications
      .iter()
      .map(|(k, v)| (k.as_str(), v))
  {
    prompt_json = replace_json_value(prompt_json, path, new_value)
        .map_err(|e| anyhow!("error replacing prompt json: {:?}", e))?;
  }

  // Save prompt.json
  let workflow_parent_dir = Path::new(workflow_path).parent().unwrap();
  let prompt_filepath = workflow_parent_dir.join("prompt.json");
  let prompt_file = File::create(&prompt_filepath)
      .map_err(|e| anyhow!("error creating prompt file: {:?}", e))?;
  info!("Saving prompt file: {:?}", prompt_file);
  serde_json::to_writer(prompt_file, &prompt_json)?;

  Ok(prompt_filepath.to_str().unwrap().to_string())
}


fn get_style_modifications(style_json: &Value, mapping_json: &Value, pos_in: &Option<&str>, neg_in: &Option<&str>) -> HashMap<String, NewValue> {
  let mut modifications = HashMap::new();
  let mut new_style_json = style_json.clone();

  // Loras have to be processed differently
  if let Some(loras) = style_json.get("loras").and_then(|l| l.as_array()) {
    if loras.len() > 8 {
      panic!("Too many loras, max is 8");
    }

    for (index, lora) in loras.iter().enumerate() {
      if let (Some(name), Some(strength)) = (lora.get("name"), lora.get("strength")) {
        new_style_json[format!("lora_{}_strength", index + 1)] = strength.clone();
        new_style_json[format!("lora_{}_name", index + 1)] = name.clone();
      }
    }
  }

  if let Some(pos) = pos_in {
    new_style_json["positive_prompt"] = Value::String(format!("{}, {}",pos, style_json["positive_prompt"].as_str().unwrap()));
  }
  if let Some(neg) = neg_in {
    new_style_json["negative_prompt"] = Value::String(format!("{}, {}",neg, style_json["negative_prompt"].as_str().unwrap()));
  }

  for (key, value) in new_style_json.as_object().unwrap() {
    if key == "loras" { continue; }

    let mapping_key = format!("$.{}", key);
    if let Ok(mapping_values) = jsonpath_lib::select(mapping_json, &mapping_key) {
      if let Some(mapping_value) = mapping_values.get(0).and_then(|v| v.as_str()) {
        modifications.insert(mapping_value.to_string(), NewValue::from_json(value));
      } else {
        println!("No mapping found for key '{}'", key);
      }
    }
  }

  modifications
}


fn replace_json_value(json: Value, path: &str, new_value: &NewValue) -> AnyhowResult<Value> {
  // First, attempt to read the value at the specified path
  let results = jsonpath_lib::select(&json, path).map_err(|err| {
    anyhow!("Invalid jsonpath '{}': {:?}", path, err)
  })?;

  // If the path does not exist or returns no results, return an error
  if results.is_empty() {
    return Err(anyhow!("Path '{}' does not exist in the provided JSON.", path));
  }

  // If the path exists, proceed with the replacement
  // Assuming replace_with returns a Result, handle it appropriately
  jsonpath_lib::replace_with(json, path, &mut |_| {
    match new_value {
      NewValue::String(s) => Some(Value::String(s.clone())),
      NewValue::Float(f) => serde_json::Number::from_f64(*f as f64)
          .map(Value::Number) // Convert Option to Some(Value::Number) if Some, else None
          .or_else(|| Some(Value::Null)), // If None, use Value::Null instead
      NewValue::Int(i) => Some(Value::Number(serde_json::Number::from(*i))),
      NewValue::Bool(b) => Some(Value::Bool(*b)),
    }
  }).map_err(|err| {
    anyhow!("Failed to replace json value at path '{}': {:?}", path, err)
  })
}
