use std::collections::HashMap;

use crate::fal_data::Model;
use crate::helpers::*;

pub fn schema_type_to_rust_type(
    info: &serde_json::Value,
    extra_types: &mut HashMap<String, (String, String)>,
    input_type: bool,
) -> String {
    let type_name = info["title"].as_str().unwrap().replace(" ", "");
    let params = info["properties"]
        .as_object()
        .unwrap()
        .iter()
        .map(|(k, v)| {
            let is_required = info["required"]
                .as_array()
                .map(|a| a.contains(&serde_json::Value::String(k.to_string())))
                .unwrap_or(false);

            let prefix = if k == "type" {
                "#[serde(rename = \"type\")]\npub ty:".to_owned()
            } else if is_rust_keyword(k) {
                format!("#[serde(rename = \"{k}\")]\npub r#{k}:")
            } else {
                let prop_name = to_snake_case(&k);
                format!("pub {prop_name}:")
            };

            let serialization_attr = if !is_required {
                "#[serde(skip_serializing_if = \"Option::is_none\")]\n"
            } else {
                ""
            };

            let description = v["description"].as_str().unwrap_or("");
            let examples = v["examples"].as_array();

            let docs = if !description.is_empty() {
                let description = description
                    .trim()
                    .split("\n")
                    .map(|line| line.trim())
                    .map(|line| format!("/// {line}"))
                    .collect::<Vec<String>>()
                    .join("\n");

                if let Some(examples) = examples {
                    let examples = examples
                        .iter()
                        .map(|e| serde_json::to_string(e).unwrap())
                        .map(|line| format!("/// {line}"))
                        .collect::<Vec<String>>()
                        .join("\n");

                    format!("{description}\n{examples}\n")
                } else {
                    format!("{description}\n")
                }
            } else {
                "".to_string()
            };

            format!(
                "{docs}{serialization_attr}{prefix} {}",
                schema_property_to_rust_type(v, is_required, extra_types,)
            )
        })
        .collect::<Vec<String>>()
        .join(",\n");

    let default_derive = if input_type { ", Default" } else { "" };

    format!(
        r#"
    #[derive(Debug, Serialize, Deserialize{default_derive})]
    pub struct {type_name} {{
        {params}
    }}
    "#
    )
}

pub fn schema_property_to_rust_type(
    property: &serde_json::Value,
    required: bool,
    extra_types: &mut HashMap<String, (String, String)>,
) -> String {
    let type_name = match property["type"].as_str() {
        Some("string") => "String".to_string(),
        Some("number") => "f64".to_string(),
        Some("integer") => "i64".to_string(),
        Some("boolean") => "bool".to_string(),
        Some("object") => {
            if property["additionalProperties"].as_object().is_some() {
                if let Some(title) = property["title"].as_str() {
                    get_or_build_object_type(title, property, extra_types)
                } else {
                    tracing::warn!("[additionalProperties] no title for object: {:?}", property);
                    "HashMap<String, serde_json::Value>".to_string()
                }
            } else {
                "HashMap<String, serde_json::Value>".to_string()
            }
        }
        Some("array") => {
            format!(
                "Vec<{}>",
                schema_property_to_rust_type(&property["items"], required, extra_types)
            )
        }
        _ => {
            if let Some(reference) = property["$ref"].as_str() {
                reference.split("/").last().unwrap().to_string()
            } else if let Some(all_of) = property["allOf"].as_array() {
                // fal API uses these to rename types usually, we should be able to just grab the first (only) element
                if all_of.len() != 1 {
                    tracing::warn!("allOf != 1 element: {:?}", all_of);
                }

                let first_element = all_of.first().unwrap();
                schema_property_to_rust_type(first_element, required, extra_types)
            } else if let Some(one_of) = property["oneOf"].as_array() {
                if one_of.len() == 1 {
                    schema_property_to_rust_type(one_of.first().unwrap(), required, extra_types)
                } else {
                    if let Some(title) = property["title"].as_str() {
                        get_or_build_enum(title, one_of, extra_types)
                    } else {
                        tracing::warn!("no title for oneOf: {:?}", property);
                        "serde_json::Value".to_string()
                    }
                }
            } else if let Some(any_of) = property["anyOf"].as_array() {
                if any_of.len() == 1 {
                    schema_property_to_rust_type(any_of.first().unwrap(), required, extra_types)
                } else {
                    if let Some(title) = property["title"].as_str() {
                        // technically this is not correct per OpenAPI spec,
                        // but I don't think this is being used correctly in fal anyways
                        get_or_build_enum(title, any_of, extra_types)
                    } else {
                        tracing::warn!("no title for anyOf: {:?}", property);
                        "serde_json::Value".to_string()
                    }
                }
            } else {
                tracing::warn!("Unsupported type: {:?}", property);
                "serde_json::Value".to_string()
            }
        }
    };

    if required {
        format!("{}", type_name)
    } else {
        format!("Option<{}>", type_name)
    }
}

// handle oneOf
pub fn get_or_build_enum(
    title: &str,
    options: &[serde_json::Value],
    extra_types: &mut HashMap<String, (String, String)>,
) -> String {
    let mut enum_name = title.to_string();
    enum_name = enum_name
        .replace(".", "_")
        .replace("-", "_")
        .replace(" ", "");
    enum_name = format!("{}Property", enum_name);

    if let Some((existing_type, _)) = extra_types.get(&enum_name) {
        existing_type.clone()
    } else {
        let variants = options
            .iter()
            .enumerate()
            .map(|(i, v)| {
                if let Some(enum_options) = v["enum"].as_array() {
                    enum_options
                        .iter()
                        .enumerate()
                        .map(|(j, op)| {
                            let mut variant_name =
                                snake_to_upper_camel(op.as_str().unwrap()).replace(":", "_");
                            if variant_name
                                .chars()
                                .next()
                                .map_or(false, |c| c.is_digit(10))
                            {
                                let prefix = v["title"]
                                    .as_str()
                                    .map(|s| snake_to_upper_camel(s))
                                    .unwrap_or("Property".to_string());
                                variant_name = format!("{prefix}_{variant_name}");
                            }
                            let original_name = op.as_str().unwrap();
                            let default_marker = if i == 0 && j == 0 { "#[default]\n" } else { "" };

                            format!("{default_marker}#[serde(rename=\"{original_name}\")]\n{variant_name}")
                        })
                        .collect()
                } else {
                    let variant_name =
                        if let Some(title) = v["title"].as_str() {
                            title.to_string()
                        } else if let Some(reference) = v["$ref"].as_str() {
                            reference.split("/").last().unwrap().to_string()
                        } else {
                            tracing::warn!("no title for oneOf: {:?}", v);
                            snake_to_upper_camel(v["type"].as_str().expect(
                                "if you don't have a title, you have to have a basic type =(",
                            ))
                        };
                    let variant_name = variant_name
                        .replace(".", "_")
                        .replace("-", "_")
                        .replace(" ", "");

                    let variant_type = schema_property_to_rust_type(v, true, extra_types);
                    let default_marker = if i == 0 { "#[default]\n" } else { "" };

                    vec![format!("{default_marker}{variant_name}({variant_type})")]
                }
            })
            .flatten()
            .collect::<Vec<String>>()
            .join(",\n");

        let enum_type = format!(
            "#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]\n#[allow(non_camel_case_types)]\npub enum {enum_name}\n{{\n{variants}\n}}"
        );

        extra_types.insert(enum_name.clone(), (enum_name.clone(), enum_type.clone()));

        enum_name
    }
}

pub fn get_or_build_object_type(
    title: &str,
    property: &serde_json::Value,
    extra_types: &mut HashMap<String, (String, String)>,
) -> String {
    let mut struct_name = title.to_string();
    struct_name = struct_name
        .replace(".", "_")
        .replace("-", "_")
        .replace(" ", "");

    if let Some((name, _)) = extra_types.get(&struct_name) {
        name.clone()
    } else {
        let mut property = property.clone();
        property["properties"] = property["additionalProperties"].clone();
        let struct_impl = schema_type_to_rust_type(&property, extra_types, true);
        extra_types.insert(struct_name.clone(), (struct_name.clone(), struct_impl));
        struct_name
    }
}

pub fn docs_from(model: &Model, openapi_params: &serde_json::Value) -> String {
    let openapi_description = openapi_params["post"]["description"].as_str().unwrap_or("");

    let title = &model.title;
    let category = &model.category;
    let machine_type = model
        .machine_type
        .as_ref()
        .map(|s| format!("Machine Type: {s}"))
        .unwrap_or("".to_string());
    let license_type = model
        .license_type
        .as_ref()
        .map(|s| format!("License Type: {s}"))
        .unwrap_or("".to_string());

    format!(
        "
    {title}

    Category: {category}
    {machine_type}
    {license_type}

    {openapi_description}
    "
    )
}
