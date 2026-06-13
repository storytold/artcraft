use anyhow::{anyhow, Result};
use log::error;
use serde_json::Value;

use crate::client::ArtCraftClient;
use crate::types::{Tool, ToolContent};

mod generate;
mod edit;
mod cost;
mod media;
mod jobs;
mod characters;
mod prompts;
mod tts;
mod voice;
mod weights;
mod studio;
mod account;
mod social;
mod referrals;
mod http;

pub fn get_all_tools() -> Vec<Tool> {
    let mut tools = Vec::new();

    tools.extend(generate::tools());
    tools.extend(edit::tools());
    tools.extend(cost::tools());
    tools.extend(media::tools());
    tools.extend(jobs::tools());
    tools.extend(characters::tools());
    tools.extend(prompts::tools());
    tools.extend(tts::tools());
    tools.extend(voice::tools());
    tools.extend(weights::tools());
    tools.extend(studio::tools());
    tools.extend(account::tools());
    tools.extend(social::tools());
    tools.extend(referrals::tools());

    tools
}

pub async fn execute_tool(
    name: &str,
    arguments: Value,
    client: &ArtCraftClient,
) -> Result<Vec<ToolContent>> {
    match name {
        // Generate
        "artcraft_generate_image" => generate::generate_image(arguments, client).await,
        "artcraft_generate_video" => generate::generate_video(arguments, client).await,
        "artcraft_generate_3d_object" => generate::generate_3d_object(arguments, client).await,
        "artcraft_generate_splat" => generate::generate_splat(arguments, client).await,

        // Edit
        "artcraft_edit_image" => edit::edit_image(arguments, client).await,
        "artcraft_remove_background" => edit::remove_background(arguments, client).await,
        "artcraft_inpaint_image" => edit::inpaint_image(arguments, client).await,
        "artcraft_edit_image_angle" => edit::edit_image_angle(arguments, client).await,
        "artcraft_edit_video" => edit::edit_video(arguments, client).await,

        // Cost & Models
        "artcraft_estimate_cost" => cost::estimate_cost(arguments, client).await,
        "artcraft_list_image_models" => cost::list_image_models(arguments, client).await,
        "artcraft_list_video_models" => cost::list_video_models(arguments, client).await,

        // Media
        "artcraft_upload_image" => media::upload_image(arguments, client).await,
        "artcraft_upload_video" => media::upload_video(arguments, client).await,
        "artcraft_upload_audio" => media::upload_audio(arguments, client).await,
        "artcraft_get_media_file" => media::get_media_file(arguments, client).await,
        "artcraft_list_media_files" => media::list_media_files(arguments, client).await,
        "artcraft_search_media" => media::search_media(arguments, client).await,
        "artcraft_delete_media_file" => media::delete_media_file(arguments, client).await,
        "artcraft_rename_media_file" => media::rename_media_file(arguments, client).await,
        "artcraft_set_media_visibility" => media::set_media_visibility(arguments, client).await,

        // Jobs
        "artcraft_get_job_status" => jobs::get_job_status(arguments, client).await,
        "artcraft_list_jobs" => jobs::list_jobs(arguments, client).await,
        "artcraft_terminate_job" => jobs::terminate_job(arguments, client).await,

        // Characters
        "artcraft_create_character" => characters::create_character(arguments, client).await,
        "artcraft_list_characters" => characters::list_characters(arguments, client).await,
        "artcraft_get_character" => characters::get_character(arguments, client).await,
        "artcraft_delete_character" => characters::delete_character(arguments, client).await,

        // Prompts
        "artcraft_create_prompt" => prompts::create_prompt(arguments, client).await,
        "artcraft_get_prompt" => prompts::get_prompt(arguments, client).await,

        // TTS
        "artcraft_tts_generate" => tts::tts_generate(arguments, client).await,
        "artcraft_tts_search_models" => tts::tts_search_models(arguments, client).await,

        // Voice
        "artcraft_voice_convert" => voice::voice_convert(arguments, client).await,
        "artcraft_list_voice_conversion_models" => voice::list_voice_conversion_models(arguments, client).await,
        "artcraft_create_voice" => voice::create_voice(arguments, client).await,
        "artcraft_list_voices" => voice::list_voices(arguments, client).await,
        "artcraft_create_voice_dataset" => voice::create_voice_dataset(arguments, client).await,
        "artcraft_upload_voice_sample" => voice::upload_voice_sample(arguments, client).await,

        // Weights
        "artcraft_list_weights" => weights::list_weights(arguments, client).await,
        "artcraft_search_weights" => weights::search_weights(arguments, client).await,
        "artcraft_get_weight" => weights::get_weight(arguments, client).await,
        "artcraft_delete_weight" => weights::delete_weight(arguments, client).await,

        // Studio
        "artcraft_studio_gen2" => studio::studio_gen2(arguments, client).await,

        // Account
        "artcraft_get_session_info" => account::get_session_info(arguments, client).await,
        "artcraft_get_credits" => account::get_credits(arguments, client).await,
        "artcraft_get_subscription" => account::get_subscription(arguments, client).await,

        // Social
        "artcraft_create_bookmark" => social::create_bookmark(arguments, client).await,
        "artcraft_list_bookmarks" => social::list_bookmarks(arguments, client).await,
        "artcraft_rate_media" => social::rate_media(arguments, client).await,
        "artcraft_create_comment" => social::create_comment(arguments, client).await,
        "artcraft_list_comments" => social::list_comments(arguments, client).await,
        "artcraft_list_tags" => social::list_tags(arguments, client).await,
        "artcraft_set_tags" => social::set_tags(arguments, client).await,

        // Referrals
        "artcraft_create_referral_code" => referrals::create_referral_code(arguments, client).await,
        "artcraft_list_referral_codes" => referrals::list_referral_codes(arguments, client).await,

        _ => {
            error!("Unknown tool: {}", name);
            Err(anyhow!("Unknown tool: {}", name))
        }
    }
}
