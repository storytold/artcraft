mod fal_data;
mod helpers;
mod module;
mod types;

use fal_data::*;
use module::*;
use types::*;

use std::collections::HashSet;

use cargo_manifest::Manifest;
use percent_encoding::{utf8_percent_encode, NON_ALPHANUMERIC};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let base_module_path = "src/endpoints";

    let mut root = Node::Module {
        name: "endpoints".to_string(),
        children: Vec::new(),
    };

    let client = reqwest::Client::new();

    let models: Vec<Model> = client
        .get("https://fal.ai/api/models")
        .send()
        .await
        .unwrap()
        .error_for_status()
        .unwrap()
        .json()
        .await
        .unwrap();

    // De-duplicate, because the /models endpoint returns multiple endpoints within an alias
    let mut visited_aliases = HashSet::new();

    for model in &models {
        let (owner, endpoint) = model
            .endpoint_id
            .split_once("/")
            .expect(&format!("could not split endpoint: {}", &model.endpoint_id));

        // URL encode the alias to handle special characters in the endpoint
        let parts = endpoint.split("/").collect::<Vec<&str>>();
        let alias = parts[0];

        if visited_aliases.contains(alias) {
            continue;
        }

        visited_aliases.insert(alias);

        let encoded_alias = utf8_percent_encode(alias, NON_ALPHANUMERIC).to_string();

        let app_data: AppData = client
            .get(format!(
                "https://fal.ai/api/models/app-data?owner={owner}&alias={encoded_alias}"
            ))
            .send()
            .await
            .unwrap()
            .error_for_status()
            .unwrap()
            .json()
            .await
            .unwrap();
        let paths = app_data.metadata.openapi["paths"].as_object().unwrap();

        for (path, params) in paths {
            if path == "/health" {
                // skip healthcheck endpoint
                continue;
            }

            let module_parts = if path == "/" {
                vec![]
            } else {
                path.split("/")
                    .skip(1)
                    .map(|s| s.replace(".", "_").replace("-", "_"))
                    .map(|s| {
                        if s.chars().next().unwrap().is_digit(10) {
                            format!("v{s}")
                        } else {
                            s.to_string()
                        }
                    })
                    .collect::<Vec<String>>()
            };

            let parent_parts = vec![
                owner.replace(".", "_").replace("-", "_"),
                alias
                    .split("/")
                    .collect::<Vec<&str>>()
                    .join("::")
                    .replace(".", "_")
                    .replace("-", "_"),
            ]
            .into_iter()
            .map(|s| {
                if s.chars().next().unwrap().is_digit(10) {
                    format!("v{s}")
                } else {
                    s.to_string()
                }
            })
            .collect::<Vec<_>>();

            let fn_name = if module_parts.is_empty() {
                parent_parts
                    .last()
                    .unwrap_or(&"default".to_string())
                    .to_string()
            } else {
                module_parts.last().unwrap().to_string()
            };

            // Combine parent and module parts for the full path
            let mut full_path_parts = Vec::new();
            // Don't include the root module name since it's just the container
            full_path_parts.extend(parent_parts.iter().map(String::as_str));
            full_path_parts.extend(module_parts.iter().map(String::as_str));

            let Some(output_type_ref) = params["post"]["responses"]["200"]["content"]
                ["application/json"]["schema"]["$ref"]
                .as_str()
            else {
                tracing::error!("no output type ref for {}", &model.endpoint_id);
                tracing::error!("params: {:?}", params);
                continue;
            };

            let output_type = {
                let Some(schema) = app_data
                    .metadata
                    .openapi
                    .pointer(&output_type_ref[1..])
                    .clone()
                else {
                    tracing::error!("no schema found for {}, skipping endpoint", output_type_ref);
                    continue;
                };
                schema.clone()
            };
            let input_types = app_data.metadata.openapi["components"]["schemas"]
                .as_object()
                .unwrap()
                .iter()
                .map(|(_, schema)| schema.clone())
                .collect::<Vec<_>>();

            let docs = docs_from(&model, params);

            let endpoint = format!("{owner}/{alias}{}", if path == "/" { "" } else { path });

            // Insert into the tree
            root.insert_path(
                &full_path_parts,
                &endpoint,
                &fn_name,
                params["post"].clone(),
                input_types,
                output_type,
                docs,
            );
        }

        tokio::time::sleep(std::time::Duration::from_millis(10)).await;
    }

    // Print the tree structure
    root.print_tree(0);

    // Write the module tree to files
    write_module_to_files(&root, base_module_path, true).expect("Failed to write module files");

    let mut manifest = Manifest::from_path("Cargo.toml").unwrap();

    // Write initial root mod.rs with module declarations
    let root_mod_content = match &root {
        Node::Module { children, .. } => children
            .iter()
            .filter_map(|child| {
                if let Node::Module { name, children } = child {
                    // Collect all child features recursively
                    let mut all_features = vec![format!("endpoints_{}", name.replace("_", "-"))];

                    // Helper function to collect child features
                    fn collect_child_features(node: &Node, features: &mut Vec<String>, parent_name: &str) {
                        if let Node::Module { name, children } = node {
                            let current_name = format!("{}_{}", parent_name, name.replace("_", "-"));
                            features.push(current_name.clone());

                            for child in children {
                                collect_child_features(child, features, &current_name);
                            }
                        }
                    }

                    // Collect features from all children
                    for child in children {
                        collect_child_features(child, &mut all_features, &format!("endpoints_{}", name.replace("_", "-")));
                    }

                    // Create the feature gates string with all features
                    let features_str = all_features
                        .into_iter()
                        .filter(|f| f.chars().filter(|c| *c == '_').count() <= 2)
                        .map(|f| format!("feature = \"{}\"", f))
                        .collect::<Vec<_>>()
                        .join(", ");

                    Some(format!(
                        "#[cfg(any(feature = \"endpoints\", {}))]\n#[cfg_attr(docsrs, doc(cfg(any(feature = \"endpoints\", {}))))]\npub mod {};",
                        features_str,
                        features_str,
                        name
                    ))
                } else {
                    None
                }
            })
            .collect::<Vec<_>>()
            .join("\n"),
        _ => String::new(),
    };
    std::fs::write(format!("{}/mod.rs", base_module_path), root_mod_content)
        .expect("Failed to write root mod.rs");

    update_manifest_features(&mut manifest, &root, "");

    let new_manifest = toml::to_string_pretty(&manifest).unwrap();
    std::fs::write("Cargo.toml", new_manifest).unwrap();
}

fn update_manifest_features(manifest: &mut Manifest, node: &Node, parent_path: &str) {
    // Remove all features that start with "endpoint"
    if let Some(features) = &mut manifest.features {
        features.retain(|name, _| !name.starts_with("endpoint"));
    }

    // Initialize features if not present
    if manifest.features.is_none() {
        manifest.features = Some(std::collections::BTreeMap::new());
    }

    // Add base endpoints feature
    if let Some(features) = &mut manifest.features {
        features.insert("endpoints".to_string(), vec![]);
    }

    // Recursively add features for each module
    add_module_features(manifest, node, parent_path);
}

fn add_module_features(manifest: &mut Manifest, node: &Node, parent_path: &str) {
    match node {
        Node::Module { name, children } => {
            let current_path = if parent_path.is_empty() {
                name.clone()
            } else {
                format!("{}_{}", parent_path, name.replace("_", "-"))
            };

            // Count segments to determine depth
            let segments: Vec<&str> = current_path.split('_').collect();

            // Only add feature if we haven't exceeded 3 levels and we're not at the root level
            if segments.len() <= 3 {
                // We want endpoints_fal-ai_dreamshaper but not deeper
                // Add feature for current module
                if let Some(features) = &mut manifest.features {
                    features.insert(current_path.clone(), vec![]);
                }
            }

            // Recurse into children
            for child in children {
                add_module_features(manifest, child, &current_path);
            }
        }
        Node::Leaf { .. } => {
            // Leaf nodes don't need features
        }
    }
}
