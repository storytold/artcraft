use std::collections::HashMap;

use crate::types::schema_type_to_rust_type;

pub enum Node {
    Module {
        name: String,
        children: Vec<Node>,
    },
    Leaf {
        endpoint: String,
        fn_name: String,
        definition: serde_json::Value,
        module_types: Vec<serde_json::Value>,
        output_type: serde_json::Value,
        docs: String,
    },
}

impl Node {
    pub fn insert_path(
        &mut self,
        path_parts: &[&str],
        endpoint: &str,
        fn_name: &str,
        definition: serde_json::Value,
        module_types: Vec<serde_json::Value>,
        output_type: serde_json::Value,
        docs: String,
    ) {
        match self {
            Node::Module { children, .. } => {
                if path_parts.is_empty() {
                    children.push(Node::Leaf {
                        endpoint: endpoint.to_string(),
                        fn_name: fn_name.to_string(),
                        definition,
                        module_types,
                        output_type,
                        docs,
                    });
                    return;
                }

                let current = path_parts[0];
                let remaining = &path_parts[1..];

                // Find or create the child module
                if let Some(child) = children.iter_mut().find(|n| match n {
                    Node::Module { name, .. } => name == current,
                    _ => false,
                }) {
                    child.insert_path(
                        remaining,
                        endpoint,
                        fn_name,
                        definition,
                        module_types,
                        output_type,
                        docs,
                    );
                } else {
                    let mut new_module = Node::Module {
                        name: current.to_string(),
                        children: Vec::new(),
                    };
                    new_module.insert_path(
                        remaining,
                        endpoint,
                        fn_name,
                        definition,
                        module_types,
                        output_type,
                        docs,
                    );
                    children.push(new_module);
                }
            }
            Node::Leaf { .. } => panic!("Cannot insert into a leaf node"),
        }
    }

    pub fn print_tree(&self, indent: usize) {
        match self {
            Node::Module { name, children } => {
                tracing::trace!("{}Module: {}", " ".repeat(indent), name);
                for child in children {
                    child.print_tree(indent + 2);
                }
            }
            Node::Leaf { fn_name, .. } => {
                tracing::trace!("{}Function: {}", " ".repeat(indent), fn_name);
            }
        }
    }
}

pub fn write_module_to_files(node: &Node, base_path: &str, is_root: bool) -> std::io::Result<()> {
    match node {
        Node::Module { name, children } => {
            let module_path = if is_root {
                base_path.to_string()
            } else {
                format!("{}/{}", base_path, name)
            };

            // Create directory if it doesn't exist
            std::fs::create_dir_all(&module_path)?;

            // Start with an empty string for mod content
            let mut mod_content = String::new();

            // Get direct child functions and modules
            let (functions, modules): (Vec<_>, Vec<_>) = children
                .iter()
                .partition(|child| matches!(child, Node::Leaf { .. }));

            // Add use declarations if we have direct functions/types
            if !functions.is_empty() {
                mod_content
                    .push_str("#[allow(unused_imports)]\nuse std::collections::HashMap;\n#[allow(unused_imports)]\nuse serde::{Serialize, Deserialize};\n#[allow(unused_imports)]\nuse crate::prelude::*;\n\n");
            }

            // Add pub mod declarations for child modules
            let mut has_child_modules = false;
            for child in &modules {
                if let Node::Module {
                    name: child_name, ..
                } = child
                {
                    has_child_modules = true;

                    let mut path_segments: Vec<String> = module_path
                        .split('/')
                        .map(|s| s.replace("_", "-"))
                        .collect();
                    path_segments.remove(0); // remove "src"

                    // Helper function to collect all descendant features
                    fn collect_all_features(node: &Node, base_path: &[String]) -> Vec<String> {
                        let mut features = Vec::new();

                        match node {
                            Node::Module { name, children: _ } => {
                                let mut current_path = base_path.to_vec();
                                current_path.push(name.replace("_", "-"));

                                let mut feature_path = vec![];

                                // Add each level of the path up to 3 levels
                                for segment in current_path.iter().take(3) {
                                    feature_path.push(segment.clone());
                                    features.push(feature_path.join("_"));
                                }
                            }
                            Node::Leaf { .. } => {}
                        }

                        features
                    }

                    // Collect all features from this module and all its descendants
                    let mut all_features = collect_all_features(child, &path_segments);

                    // Sort and deduplicate features
                    all_features.sort();
                    all_features.dedup();

                    // Create the feature gates string with all features
                    let feature_cfg = if !all_features.is_empty() {
                        let features_map = all_features
                            .into_iter()
                            .map(|f| format!("feature = \"{}\"", f))
                            .collect::<Vec<String>>()
                            .join(", ");

                        format!(
                            "#[cfg(any({features_map}))]\n#[cfg_attr(docsrs, doc(cfg(any({features_map}))))]",
                        )
                    } else {
                        String::new()
                    };

                    let module_decl = if feature_cfg.is_empty() {
                        format!("pub mod {};\n", child_name)
                    } else {
                        format!("{}\npub mod {};\n", feature_cfg, child_name)
                    };

                    mod_content.push_str(&module_decl);
                }
            }

            // Add a newline after module declarations if we have both modules and content
            if has_child_modules && !functions.is_empty() {
                mod_content.push_str("\n");
            }

            // Add direct functions and types
            if !functions.is_empty() {
                for child in functions {
                    mod_content.push_str(&generate_request_module(child));
                }
            }

            // Write mod.rs
            std::fs::write(format!("{}/mod.rs", module_path), mod_content)?;

            // Recursively handle child modules
            for child in modules {
                if let Node::Module { .. } = child {
                    write_module_to_files(child, &module_path, false)?;
                }
            }
        }
        Node::Leaf { .. } => {
            // Leaf nodes are handled within their parent module's mod.rs
        }
    }

    Ok(())
}

pub fn generate_request_module(node: &Node) -> String {
    match node {
        Node::Module { name, children } => {
            format!(
                r#"
                pub mod {name} {{
                    use super::*;

                    {}
                }}
                "#,
                children
                    .iter()
                    .map(|child| generate_request_module(child))
                    .collect::<Vec<String>>()
                    .join("\n")
            )
        }
        Node::Leaf {
            endpoint,
            fn_name,
            definition,
            module_types: input_types,
            output_type,
            docs,
        } => {
            let request_type_name = definition["requestBody"]["content"]["application/json"]
                ["schema"]["$ref"]
                .as_str()
                .unwrap()
                .split("/")
                .last()
                .unwrap();
            let return_type = output_type["title"].as_str().unwrap();

            let mut extra_types = HashMap::new();

            let mut input_types = input_types.clone();
            input_types.sort_by_key(|ty| ty["title"].as_str().unwrap().to_owned());

            let input_structs = input_types
                .iter()
                .map(|input_type| {
                    schema_type_to_rust_type(
                        input_type,
                        &mut extra_types,
                        input_type["title"].as_str().unwrap_or_default() != return_type,
                    )
                })
                .collect::<Vec<String>>()
                .join("\n");
            let mut extra_types = extra_types.into_iter().collect::<Vec<_>>();
            extra_types.sort_by_key(|(k, _)| k.clone());

            let extra_types_str = extra_types
                .into_iter()
                .map(|(_, (_, item))| item)
                .collect::<Vec<String>>()
                .join("\n\n");

            let docs = docs
                .trim()
                .split("\n")
                .map(|line| line.trim())
                .map(|line| format!("/// {line}"))
                .collect::<Vec<String>>()
                .join("\n");

            format!(
                r#"
                {input_structs}

                {extra_types_str}

                {docs}
                pub fn {fn_name}(params: {request_type_name}) -> FalRequest<{request_type_name}, {return_type}> {{
                    FalRequest::new(
                        "{endpoint}",
                        params
                    )
                }}
                "#,
            )
        }
    }
}
