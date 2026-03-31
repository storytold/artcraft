use utoipa::OpenApi;

use crate::http_server::common_requests::auto_product_category::AutoProductCategory;
use crate::http_server::common_requests::media_file_token_path_info::MediaFileTokenPathInfo;
use crate::http_server::common_responses::media::cover_image_links::CoverImageLinks;
use crate::http_server::common_responses::media::media_file_cover_image_details::MediaFileCoverImageDetails;
use crate::http_server::common_responses::media::media_file_cover_image_details::MediaFileDefaultCover;
use crate::http_server::common_responses::media::weights_cover_image_details::*;
use crate::http_server::common_responses::media_file_origin_details::*;
use crate::http_server::common_responses::media_file_social_meta_lite::MediaFileSocialMetaLight;
use crate::http_server::common_responses::pagination_cursors::PaginationCursors;
use crate::http_server::common_responses::pagination_page::PaginationPage;
use crate::http_server::common_responses::simple_entity_stats::SimpleEntityStats;
use crate::http_server::common_responses::simple_response::SimpleResponse;
use crate::http_server::common_responses::tag_info::TagInfo;
use crate::http_server::common_responses::user_details_lite::{UserDefaultAvatarInfo, UserDetailsLight};
use crate::http_server::deprecated_endpoints::conversion::enqueue_fbx_to_gltf_handler::*;
use crate::http_server::deprecated_endpoints::engine::create_scene_handler::*;
use crate::http_server::deprecated_endpoints::image_gen::enqueue_image_generation::EnqueueImageGenRequestError;
use crate::http_server::deprecated_endpoints::image_gen::enqueue_image_generation::EnqueueImageGenRequestSuccessResponse;
use crate::http_server::deprecated_endpoints::workflows::enqueue::enqueue_face_fusion_workflow_handler::*;
use crate::http_server::deprecated_endpoints::workflows::enqueue::enqueue_live_portrait_workflow_handler::*;
use crate::http_server::deprecated_endpoints::workflows::enqueue::vst_common::vst_error::*;
use crate::http_server::deprecated_endpoints::workflows::enqueue::vst_common::vst_request::*;
use crate::http_server::deprecated_endpoints::workflows::enqueue::vst_common::vst_response::*;
use crate::http_server::deprecated_endpoints::workflows::enqueue_video_style_transfer_handler::*;
use crate::http_server::endpoints::analytics::log_browser_session_handler::*;
use crate::http_server::endpoints::app_state::components::get_permissions::AppStateLegacyPermissionFlags;
use crate::http_server::endpoints::app_state::components::get_permissions::AppStatePermissions;
use crate::http_server::endpoints::app_state::components::get_premium_info::AppStatePremiumInfo;
use crate::http_server::endpoints::app_state::components::get_premium_info::AppStateSubscriptionProductKey;
use crate::http_server::endpoints::app_state::components::get_server_info::AppStateServerInfo;
use crate::http_server::endpoints::app_state::components::get_status_alert::AppStateStatusAlertCategory;
use crate::http_server::endpoints::app_state::components::get_status_alert::AppStateStatusAlertInfo;
use crate::http_server::endpoints::app_state::components::get_user_info::AppStateUserInfo;
use crate::http_server::endpoints::app_state::components::get_user_locale::AppStateUserLocale;
use crate::http_server::endpoints::app_state::get_app_state_handler::*;
use crate::http_server::endpoints::beta_keys::create_beta_keys_handler::*;
use crate::http_server::endpoints::beta_keys::edit_beta_key_distributed_flag_handler::*;
use crate::http_server::endpoints::beta_keys::edit_beta_key_note_handler::*;
use crate::http_server::endpoints::beta_keys::list_beta_keys_handler::*;
use crate::http_server::endpoints::beta_keys::redeem_beta_key_handler::*;
use crate::http_server::endpoints::comments::create_comment_handler::*;
use crate::http_server::endpoints::comments::delete_comment_handler::*;
use crate::http_server::endpoints::comments::list_comments_handler::*;
use crate::http_server::endpoints::featured_items::create_featured_item_handler::*;
use crate::http_server::endpoints::featured_items::delete_featured_item_handler::*;
use crate::http_server::endpoints::featured_items::get_is_featured_item_handler::*;
use crate::http_server::endpoints::image_studio::upload::upload_snapshot_media_file_handler::*;
use crate::http_server::endpoints::inference_job::delete::dismiss_finished_session_jobs_handler::*;
use crate::http_server::endpoints::inference_job::delete::terminate_inference_job_handler::*;
use crate::http_server::endpoints::inference_job::get::batch_get_inference_job_status_handler::*;
use crate::http_server::endpoints::inference_job::get::get_inference_job_status_handler::*;
use crate::http_server::endpoints::inference_job::list::list_session_jobs_handler::*;
use crate::http_server::endpoints::media_files::common_responses::live_portrait::MediaFileLivePortraitDetails;
use crate::http_server::endpoints::media_files::edit::change_media_file_animation_type_handler::*;
use crate::http_server::endpoints::media_files::edit::change_media_file_engine_category_handler::*;
use crate::http_server::endpoints::media_files::edit::change_media_file_visibility_handler::*;
use crate::http_server::endpoints::media_files::edit::rename_media_file_handler::*;
use crate::http_server::endpoints::media_files::edit::set_media_file_cover_image_handler::*;
use crate::http_server::endpoints::media_files::get::batch_get_media_files_handler::*;
use crate::http_server::endpoints::media_files::get::get_media_file_handler::*;
use crate::http_server::endpoints::media_files::list::list_featured_media_files_handler::*;
use crate::http_server::endpoints::media_files::list::list_media_files_by_batch_token_handler::*;
use crate::http_server::endpoints::media_files::list::list_media_files_for_user_handler::*;
use crate::http_server::endpoints::media_files::list::list_media_files_handler::*;
use crate::http_server::endpoints::media_files::list::list_pinned_media_files_handler::*;
use crate::http_server::endpoints::media_files::search::search_featured_media_files_handler::*;
use crate::http_server::endpoints::media_files::search::search_session_media_files_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_audio_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_engine_asset::upload_engine_asset_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_error::MediaFileUploadError;
use crate::http_server::endpoints::media_files::upload::upload_generic::upload_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_image_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_new_engine_asset_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_new_scene_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_pmx::upload_pmx_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_saved_scene_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_scene_snapshot_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_spz_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_studio_shot::upload_studio_shot_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_video_new::upload_new_video_media_file_handler::*;
use crate::http_server::endpoints::media_files::upload::upload_video_old::upload_video_media_file_handler::*;
use crate::http_server::endpoints::media_files::upsert_upload::write_engine_asset::write_engine_asset_media_file_handler::*;
use crate::http_server::endpoints::media_files::upsert_upload::write_error::MediaFileWriteError;
use crate::http_server::endpoints::media_files::upsert_upload::write_scene_file::write_scene_file_media_file_handler::*;
use crate::http_server::endpoints::model_download::enqueue_gptsovits_model_download_handler::*;
use crate::http_server::endpoints::moderation::user_feature_flags::edit_user_feature_flags_handler::*;
use crate::http_server::endpoints::prompts::get_prompt_handler::*;
use artcraft_api_defs::common::responses::job_details::JobDetailsLipsyncRequest;
use artcraft_api_defs::common::responses::job_details::JobDetailsLivePortraitRequest;
use artcraft_api_defs::common::responses::media_links::*;
use artcraft_api_defs::common::responses::simple_generic_json_success::SimpleGenericJsonSuccess;
use artcraft_api_defs::generate::image::bg_removal::remove_image_background::RemoveImageBackgroundRequest;
use artcraft_api_defs::generate::image::bg_removal::remove_image_background::RemoveImageBackgroundResponse;
use artcraft_api_defs::generate::image::edit::gpt_image_1_edit_image::*;
use artcraft_api_defs::generate::image::text::generate_flux_1_dev_text_to_image::GenerateFlux1DevTextToImageAspectRatio;
use artcraft_api_defs::generate::image::text::generate_flux_1_dev_text_to_image::GenerateFlux1DevTextToImageNumImages;
use artcraft_api_defs::generate::image::text::generate_flux_1_dev_text_to_image::GenerateFlux1DevTextToImageRequest;
use artcraft_api_defs::generate::image::text::generate_flux_1_dev_text_to_image::GenerateFlux1DevTextToImageResponse;
use artcraft_api_defs::generate::image::text::generate_flux_1_schnell_text_to_image::GenerateFlux1SchnellTextToImageAspectRatio;
use artcraft_api_defs::generate::image::text::generate_flux_1_schnell_text_to_image::GenerateFlux1SchnellTextToImageNumImages;
use artcraft_api_defs::generate::image::text::generate_flux_1_schnell_text_to_image::GenerateFlux1SchnellTextToImageRequest;
use artcraft_api_defs::generate::image::text::generate_flux_1_schnell_text_to_image::GenerateFlux1SchnellTextToImageResponse;
use artcraft_api_defs::generate::image::text::generate_flux_pro_11_text_to_image::GenerateFluxPro11TextToImageAspectRatio;
use artcraft_api_defs::generate::image::text::generate_flux_pro_11_text_to_image::GenerateFluxPro11TextToImageNumImages;
use artcraft_api_defs::generate::image::text::generate_flux_pro_11_text_to_image::GenerateFluxPro11TextToImageRequest;
use artcraft_api_defs::generate::image::text::generate_flux_pro_11_text_to_image::GenerateFluxPro11TextToImageResponse;
use artcraft_api_defs::generate::image::text::generate_flux_pro_11_ultra_text_to_image::GenerateFluxPro11UltraTextToImageAspectRatio;
use artcraft_api_defs::generate::image::text::generate_flux_pro_11_ultra_text_to_image::GenerateFluxPro11UltraTextToImageNumImages;
use artcraft_api_defs::generate::image::text::generate_flux_pro_11_ultra_text_to_image::GenerateFluxPro11UltraTextToImageRequest;
use artcraft_api_defs::generate::image::text::generate_flux_pro_11_ultra_text_to_image::GenerateFluxPro11UltraTextToImageResponse;
use artcraft_api_defs::generate::image::text::generate_gpt_image_1_text_to_image::GenerateGptImage1TextToImageImageQuality;
use artcraft_api_defs::generate::image::text::generate_gpt_image_1_text_to_image::GenerateGptImage1TextToImageImageSize;
use artcraft_api_defs::generate::image::text::generate_gpt_image_1_text_to_image::GenerateGptImage1TextToImageNumImages;
use artcraft_api_defs::generate::image::text::generate_gpt_image_1_text_to_image::GenerateGptImage1TextToImageRequest;
use artcraft_api_defs::generate::image::text::generate_gpt_image_1_text_to_image::GenerateGptImage1TextToImageResponse;
use artcraft_api_defs::generate::object::generate_hunyuan_2_0_image_to_3d::GenerateHunyuan20ImageTo3dRequest;
use artcraft_api_defs::generate::object::generate_hunyuan_2_0_image_to_3d::GenerateHunyuan20ImageTo3dResponse;
use artcraft_api_defs::generate::object::generate_hunyuan_2_1_image_to_3d::GenerateHunyuan21ImageTo3dRequest;
use artcraft_api_defs::generate::object::generate_hunyuan_2_1_image_to_3d::GenerateHunyuan21ImageTo3dResponse;
use artcraft_api_defs::generate::splat::generate_worldlabs_marble_0p1_mini_splat::GenerateWorldlabsMarble0p1MiniSplatRequest;
use artcraft_api_defs::generate::splat::generate_worldlabs_marble_0p1_mini_splat::GenerateWorldlabsMarble0p1MiniSplatResponse;
use artcraft_api_defs::generate::splat::generate_worldlabs_marble_0p1_plus_splat::GenerateWorldlabsMarble0p1PlusSplatRequest;
use artcraft_api_defs::generate::splat::generate_worldlabs_marble_0p1_plus_splat::GenerateWorldlabsMarble0p1PlusSplatResponse;
use artcraft_api_defs::generate::video::generate_kling_1_6_pro_image_to_video::GenerateKling16ProAspectRatio;
use artcraft_api_defs::generate::video::generate_kling_1_6_pro_image_to_video::GenerateKling16ProDuration;
use artcraft_api_defs::generate::video::generate_kling_1_6_pro_image_to_video::GenerateKling16ProImageToVideoRequest;
use artcraft_api_defs::generate::video::generate_kling_1_6_pro_image_to_video::GenerateKling16ProImageToVideoResponse;
use artcraft_api_defs::generate::video::generate_kling_2_1_master_image_to_video::GenerateKling21MasterAspectRatio;
use artcraft_api_defs::generate::video::generate_kling_2_1_master_image_to_video::GenerateKling21MasterDuration;
use artcraft_api_defs::generate::video::generate_kling_2_1_master_image_to_video::GenerateKling21MasterImageToVideoRequest;
use artcraft_api_defs::generate::video::generate_kling_2_1_master_image_to_video::GenerateKling21MasterImageToVideoResponse;
use artcraft_api_defs::generate::video::generate_kling_2_1_pro_image_to_video::GenerateKling21ProAspectRatio;
use artcraft_api_defs::generate::video::generate_kling_2_1_pro_image_to_video::GenerateKling21ProDuration;
use artcraft_api_defs::generate::video::generate_kling_2_1_pro_image_to_video::GenerateKling21ProImageToVideoRequest;
use artcraft_api_defs::generate::video::generate_kling_2_1_pro_image_to_video::GenerateKling21ProImageToVideoResponse;
use artcraft_api_defs::generate::video::generate_seedance_1_0_lite_image_to_video::GenerateSeedance10LiteDuration;
use artcraft_api_defs::generate::video::generate_seedance_1_0_lite_image_to_video::GenerateSeedance10LiteImageToVideoRequest;
use artcraft_api_defs::generate::video::generate_seedance_1_0_lite_image_to_video::GenerateSeedance10LiteImageToVideoResponse;
use artcraft_api_defs::generate::video::generate_seedance_1_0_lite_image_to_video::GenerateSeedance10LiteResolution;
use artcraft_api_defs::generate::video::generate_veo_2_image_to_video::GenerateVeo2AspectRatio;
use artcraft_api_defs::generate::video::generate_veo_2_image_to_video::GenerateVeo2Duration;
use artcraft_api_defs::generate::video::generate_veo_2_image_to_video::GenerateVeo2ImageToVideoRequest;
use artcraft_api_defs::generate::video::generate_veo_2_image_to_video::GenerateVeo2ImageToVideoResponse;
use artcraft_api_defs::jobs::list_session_jobs::*;
use artcraft_api_defs::media_file::delete_media_file::DeleteMediaFilePathInfo;
use artcraft_api_defs::media_file::delete_media_file::DeleteMediaFileRequest;
use artcraft_api_defs::prompts::create_prompt::CreatePromptRequest;
use artcraft_api_defs::prompts::create_prompt::CreatePromptResponse;
use artcraft_api_defs::prompts::get_prompt::*;
use artcraft_api_defs::users::change_password::{ChangePasswordRequest, ChangePasswordResponse};
use artcraft_api_defs::users::edit_email::{EditEmailRequest, EditEmailResponse};
use artcraft_api_defs::users::edit_username::{EditUsernameRequest, EditUsernameResponse};
use billing_component::stripe::http_endpoints::checkout::create::stripe_create_checkout_session_error::CreateCheckoutSessionError;
use billing_component::stripe::http_endpoints::checkout::create::stripe_create_checkout_session_json_handler::*;
use billing_component::users::http_endpoints::list_active_user_subscriptions_handler::*;
use crate::http_server::endpoints::service::status_alert_handler::*;
use crate::http_server::endpoints::stats::get_unified_queue_stats_handler::*;
use crate::http_server::endpoints::studio_gen2::enqueue_studio_gen2_handler::*;
use crate::http_server::endpoints::studio_gen2::enqueue_studio_gen2_handler::EnqueueStudioGen2Request;
use crate::http_server::endpoints::tags::list_tags_for_entity_handler::*;
use crate::http_server::endpoints::tags::set_tags_for_entity_handler::*;
use crate::http_server::endpoints::tts::enqueue_infer_tts_handler::enqueue_infer_tts_handler::*;
use crate::http_server::endpoints::user_bookmarks::batch_get_user_bookmarks_handler::*;
use crate::http_server::endpoints::user_bookmarks::create_user_bookmark_handler::*;
use crate::http_server::endpoints::user_bookmarks::delete_user_bookmark_handler::*;
use crate::http_server::endpoints::user_bookmarks::list_user_bookmarks_for_entity_handler::*;
use crate::http_server::endpoints::user_bookmarks::list_user_bookmarks_for_user_handler::*;
use crate::http_server::endpoints::user_ratings::batch_get_user_rating_handler::*;
use crate::http_server::endpoints::user_ratings::get_user_rating_handler::*;
use crate::http_server::endpoints::user_ratings::set_user_rating_handler::*;
use crate::http_server::endpoints::users::change_password_handler::*;
use crate::http_server::endpoints::users::create_account_handler::*;
use crate::http_server::endpoints::users::edit_email_handler::*;
use crate::http_server::endpoints::users::edit_username_handler::*;
use crate::http_server::endpoints::users::get_profile_handler::*;
use crate::http_server::endpoints::users::google_sso::google_sso_handler::*;
use crate::http_server::endpoints::users::login_handler::*;
use crate::http_server::endpoints::users::logout_handler::*;
use crate::http_server::endpoints::users::session_info_handler::*;
use crate::http_server::endpoints::users::session_token_info_handler::*;
use crate::http_server::endpoints::voice_conversion::enqueue_voice_conversion_inference_handler::*;
use crate::http_server::endpoints::voice_designer::inference::enqueue_tts_request::*;
use crate::http_server::endpoints::voice_designer::voice_datasets::list_datasets_by_user::*;
use crate::http_server::endpoints::weights::delete::delete_weight_handler::*;
use crate::http_server::endpoints::weights::get::get_weight_handler::*;
use crate::http_server::endpoints::weights::list::list_available_weights_handler::*;
use crate::http_server::endpoints::weights::list::list_featured_weights_handler::*;
use crate::http_server::endpoints::weights::list::list_pinned_weights_handler::*;
use crate::http_server::endpoints::weights::list::list_weights_by_user_handler::*;
use crate::http_server::endpoints::weights::search::search_model_weights_impl::*;
use crate::http_server::endpoints::weights::update::set_model_weight_cover_image_handler::*;
use crate::http_server::endpoints::weights::update::update_weight_handler::*;
use enums::by_table::beta_keys::beta_key_product::BetaKeyProduct;
use enums::by_table::comments::comment_entity_type::CommentEntityType;
use enums::by_table::featured_items::featured_item_entity_type::FeaturedItemEntityType;
use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_job_external_third_party::InferenceJobExternalThirdParty;
use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_subtype::MediaFileSubtype;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::by_table::model_weights::{weights_category::WeightsCategory, weights_types::WeightsType};
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::by_table::user_bookmarks::user_bookmark_entity_type::UserBookmarkEntityType;
use enums::by_table::user_ratings::entity_type::UserRatingEntityType;
use enums::by_table::user_ratings::rating_value::UserRatingValue;
use enums::by_table::users::user_feature_flag::UserFeatureFlag;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation_provider::GenerationProvider;
use enums::common::job_status_plus::JobStatusPlus;
use enums::common::visibility::Visibility;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use enums_public::by_table::media_files::public_media_file_model_type::PublicMediaFileModelType;
use enums_public::by_table::model_weights::public_weights_types::PublicWeightsType;
use tokens::tokens::batch_generations::*;
use tokens::tokens::beta_keys::*;
use tokens::tokens::browser_session_logs::*;
use tokens::tokens::comments::*;
use tokens::tokens::generic_inference_jobs::*;
use tokens::tokens::media_files::*;
use tokens::tokens::model_weights::*;
use tokens::tokens::prompts::*;
use tokens::tokens::user_bookmarks::*;
use tokens::tokens::users::*;
use tokens::tokens::zs_voice_datasets::*;

// Cost estimate
use artcraft_api_defs::generate::cost_estimate::estimate_image_cost::*;
use artcraft_api_defs::generate::cost_estimate::estimate_video_cost::*;
// Image multi-function
use artcraft_api_defs::generate::image::multi_function::nano_banana_multi_function_image_gen::*;
use artcraft_api_defs::generate::image::multi_function::nano_banana_pro_multi_function_image_gen::*;
use artcraft_api_defs::generate::image::multi_function::nano_banana_2_multi_function_image_gen::*;
use artcraft_api_defs::generate::image::multi_function::gpt_image_1p5_multi_function_image_gen::*;
use artcraft_api_defs::generate::image::multi_function::bytedance_seedream_v4_multi_function_image_gen::*;
use artcraft_api_defs::generate::image::multi_function::bytedance_seedream_v4p5_multi_function_image_gen::*;
use artcraft_api_defs::generate::image::multi_function::bytedance_seedream_5_lite_multi_function_image_gen::*;
// Image edit (missing handlers)
use artcraft_api_defs::generate::image::angle::flux_2_lora_edit_image_angle::*;
use artcraft_api_defs::generate::image::angle::qwen_edit_2511_edit_image_angle::*;
use artcraft_api_defs::generate::image::edit::flux_pro_kontext_max_edit_image::*;
use artcraft_api_defs::generate::image::edit::gemini_25_flash_edit_image::*;
use artcraft_api_defs::generate::image::edit::qwen_edit_image::*;
use artcraft_api_defs::generate::image::edit::seededit_3_edit_image::*;
// Image inpaint
use artcraft_api_defs::generate::image::inpaint::flux_dev_juggernaut_inpaint_image::*;
use artcraft_api_defs::generate::image::inpaint::flux_pro_1_inpaint_image::*;
// Video (missing handlers)
use artcraft_api_defs::generate::video::generate_seedance_1_0_pro_image_to_video::*;
use artcraft_api_defs::generate::video::generate_veo_3_image_to_video::*;
use artcraft_api_defs::generate::video::generate_veo_3_fast_image_to_video::*;
// Video multi-function
use artcraft_api_defs::generate::video::multi_function::kling_2_5_turbo_multi_function_video_gen::*;
use artcraft_api_defs::generate::video::multi_function::kling_2_6_multi_function_video_gen::*;
use artcraft_api_defs::generate::video::multi_function::kling_3p0_pro_multi_function_video_gen::*;
use artcraft_api_defs::generate::video::multi_function::kling_3p0_standard_multi_function_video_gen::*;
use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::*;
use artcraft_api_defs::generate::video::multi_function::seedance_1p5_pro_multi_function_video_gen::*;
use artcraft_api_defs::generate::video::multi_function::sora_2_multi_function_video_gen::*;
use artcraft_api_defs::generate::video::multi_function::sora_2_pro_multi_function_video_gen::*;
use artcraft_api_defs::generate::video::multi_function::veo_3p1_multi_function_video_gen::*;
use artcraft_api_defs::generate::video::multi_function::veo_3p1_fast_multi_function_video_gen::*;
// Object multi-function
use artcraft_api_defs::generate::object::multi_function::hunyuan3d_v3_multi_function_object_gen::*;
// Analytics, credits, subscriptions, media files
use artcraft_api_defs::analytics::log_active_user::*;
use artcraft_api_defs::credits::get_session_credits::*;
use artcraft_api_defs::subscriptions::get_session_subscription::*;
use artcraft_api_defs::media_file::list_batch_generated_media_files::*;
// Handler modules with locally-defined types
use crate::http_server::endpoints::moderation::info::moderator_token_info_handler::*;
use artcraft_api_defs::characters::create_character::*;
use artcraft_api_defs::characters::delete_character::*;
use artcraft_api_defs::characters::edit_character::*;
use artcraft_api_defs::characters::get_character::*;
use artcraft_api_defs::characters::list_characters::*;
use artcraft_api_defs::moderation::alerts::moderation_send_alert::*;
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::*;
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::*;
use artcraft_api_defs::omni_gen::cost_response::omni_gen_image_cost_response::*;
use artcraft_api_defs::omni_gen::cost_response::omni_gen_video_cost_response::*;
use artcraft_api_defs::omni_gen::generate_response::omni_gen_image_generate_response::*;
use artcraft_api_defs::omni_gen::generate_response::omni_gen_video_generate_response::*;
use artcraft_api_defs::omni_gen::models::omni_gen_image_models::*;
use artcraft_api_defs::omni_gen::models::omni_gen_video_models::*;
use artcraft_api_defs::moderation::user::list_subscribing_users_by_signup_date::*;
use artcraft_api_defs::moderation::user::list_users_by_signup_date::*;
use artcraft_api_defs::moderation::user::user_lookup::*;
use artcraft_api_defs::moderation::user::user_lookup_by_stripe_customer_id::*;
use artcraft_api_defs::moderation::jobs::user::list_user_jobs::*;
use artcraft_api_defs::moderation::wallet_ledger_entries::list_wallet_ledger_entries_by_wallet::*;
use artcraft_api_defs::moderation::wallet_ledger_entries::moderator_get_wallet_ledger_entry::*;
use artcraft_api_defs::moderation::wallets::list_user_wallets::*;
use artcraft_api_defs::moderation::wallets::moderator_add_banked_balance_to_wallet::*;
use artcraft_api_defs::moderation::wallets::moderator_create_wallet_for_user::*;
use artcraft_api_defs::moderation::wallets::moderator_get_wallet::*;
use artcraft_api_defs::web_referrals::log_web_referral::*;
use crate::http_server::endpoints::web_referrals::log_web_referral_handler::*;
use crate::http_server::endpoints::webhooks::fal_webhook_handler::*;
use crate::http_server::endpoints::image_studio::update_gpt_image_job_status_handler::*;
use crate::http_server::endpoints::voice_conversion::enqueue_seed_vc_inference_handler::*;
use crate::http_server::endpoints::credits::get_session_credits_handler::*;
use crate::http_server::endpoints::subscriptions::get_session_subscription_handler::*;
use crate::http_server::endpoints::analytics::log_app_active_user_handler::*;
use crate::http_server::endpoints::analytics::log_app_active_user_json_handler::*;
use crate::http_server::endpoints::media_files::list::list_batch_generated_redux_media_files_handler::*;

#[derive(OpenApi)]
#[openapi(
  paths(
    billing_component::stripe::http_endpoints::checkout::create::stripe_create_checkout_session_json_handler::stripe_create_checkout_session_json_handler,
    billing_component::users::http_endpoints::list_active_user_subscriptions_handler::list_active_user_subscriptions_handler,
    crate::http_server::deprecated_endpoints::conversion::enqueue_fbx_to_gltf_handler::enqueue_fbx_to_gltf_handler,
    crate::http_server::deprecated_endpoints::engine::create_scene_handler::create_scene_handler,
    crate::http_server::deprecated_endpoints::workflows::enqueue::enqueue_face_fusion_workflow_handler::enqueue_face_fusion_workflow_handler,
    crate::http_server::deprecated_endpoints::workflows::enqueue::enqueue_live_portrait_workflow_handler::enqueue_live_portrait_workflow_handler,
    crate::http_server::deprecated_endpoints::workflows::enqueue::enqueue_studio_workflow_handler::enqueue_studio_workflow_handler,
    crate::http_server::deprecated_endpoints::workflows::enqueue::enqueue_video_style_transfer_workflow_handler::enqueue_video_style_transfer_workflow_handler,
    crate::http_server::deprecated_endpoints::workflows::enqueue_video_style_transfer_handler::enqueue_video_style_transfer_handler,
    crate::http_server::endpoints::analytics::log_browser_session_handler::log_browser_session_handler,
    crate::http_server::endpoints::app_state::get_app_state_handler::get_app_state_handler,
    crate::http_server::endpoints::beta_keys::create_beta_keys_handler::create_beta_keys_handler,
    crate::http_server::endpoints::beta_keys::edit_beta_key_distributed_flag_handler::edit_beta_key_distributed_flag_handler,
    crate::http_server::endpoints::beta_keys::edit_beta_key_note_handler::edit_beta_key_note_handler,
    crate::http_server::endpoints::beta_keys::list_beta_keys_handler::list_beta_keys_handler,
    crate::http_server::endpoints::beta_keys::redeem_beta_key_handler::redeem_beta_key_handler,
    crate::http_server::endpoints::comments::create_comment_handler::create_comment_handler,
    crate::http_server::endpoints::comments::delete_comment_handler::delete_comment_handler,
    crate::http_server::endpoints::comments::list_comments_handler::list_comments_handler,
    crate::http_server::endpoints::featured_items::create_featured_item_handler::create_featured_item_handler,
    crate::http_server::endpoints::featured_items::delete_featured_item_handler::delete_featured_item_handler,
    crate::http_server::endpoints::featured_items::get_is_featured_item_handler::get_is_featured_item_handler,
    crate::http_server::endpoints::generate::image::text::generate_flux_1_dev_text_to_image_handler::generate_flux_1_dev_text_to_image_handler,
    crate::http_server::endpoints::generate::image::text::generate_flux_1_schnell_text_to_image_handler::generate_flux_1_schnell_text_to_image_handler,
    crate::http_server::endpoints::generate::image::text::generate_flux_pro_11_text_to_image_handler::generate_flux_pro_11_text_to_image_handler,
    crate::http_server::endpoints::generate::image::text::generate_gpt_image_1_text_to_image_handler::generate_gpt_image_1_text_to_image_handler,
    crate::http_server::endpoints::generate::image::text::generate_flux_pro_11_ultra_text_to_image_handler::generate_flux_pro_11_ultra_text_to_image_handler,
    crate::http_server::endpoints::generate::image::bg_removal::remove_image_background_handler::remove_image_background_handler,
    crate::http_server::endpoints::generate::image::edit::gpt_image_1_edit_image_handler::gpt_image_1_edit_image_handler,
    crate::http_server::endpoints::generate::object::generate_hunyuan_2_1_image_to_3d_handler::generate_hunyuan_2_1_image_to_3d_handler,
    crate::http_server::endpoints::generate::object::generate_hunyuan_2_0_image_to_3d_handler::generate_hunyuan_2_0_image_to_3d_handler,
    crate::http_server::endpoints::generate::splat::generate_worldlabs_marble_0p1_mini_splat_handler::generate_worldlabs_marble_0p1_mini_splat_handler,
    crate::http_server::endpoints::generate::splat::generate_worldlabs_marble_0p1_plus_splat_handler::generate_worldlabs_marble_0p1_plus_splat_handler,
    crate::http_server::endpoints::generate::video::image::generate_kling_1_6_pro_video_handler::generate_kling_1_6_pro_video_handler,
    crate::http_server::endpoints::generate::video::image::generate_kling_2_1_master_video_handler::generate_kling_2_1_master_video_handler,
    crate::http_server::endpoints::generate::video::image::generate_kling_2_1_pro_video_handler::generate_kling_2_1_pro_video_handler,
    crate::http_server::endpoints::generate::video::image::generate_seedance_1_0_lite_image_to_video_handler::generate_seedance_1_0_lite_image_to_video_handler,
    crate::http_server::endpoints::generate::video::image::generate_veo_2_image_to_video_handler::generate_veo_2_image_to_video_handler,
    crate::http_server::endpoints::image_studio::upload::upload_snapshot_media_file_handler::upload_snapshot_media_file_handler,
    crate::http_server::endpoints::inference_job::delete::dismiss_finished_session_jobs_handler::dismiss_finished_session_jobs_handler,
    crate::http_server::endpoints::inference_job::delete::terminate_inference_job_handler::terminate_inference_job_handler,
    crate::http_server::endpoints::inference_job::get::batch_get_inference_job_status_handler::batch_get_inference_job_status_handler,
    crate::http_server::endpoints::inference_job::get::get_inference_job_status_handler::get_inference_job_status_handler,
    crate::http_server::endpoints::inference_job::list::list_session_jobs_handler::list_session_jobs_handler,
    crate::http_server::endpoints::media_files::delete::delete_media_file_handler::delete_media_file_handler,
    crate::http_server::endpoints::media_files::edit::change_media_file_animation_type_handler::change_media_file_animation_type_handler,
    crate::http_server::endpoints::media_files::edit::change_media_file_engine_category_handler::change_media_file_engine_category_handler,
    crate::http_server::endpoints::media_files::edit::change_media_file_visibility_handler::change_media_file_visibility_handler,
    crate::http_server::endpoints::media_files::edit::rename_media_file_handler::rename_media_file_handler,
    crate::http_server::endpoints::media_files::edit::set_media_file_cover_image_handler::set_media_file_cover_image_handler,
    crate::http_server::endpoints::media_files::get::batch_get_media_files_handler::batch_get_media_files_handler,
    crate::http_server::endpoints::media_files::get::get_media_file_handler::get_media_file_handler,
    crate::http_server::endpoints::media_files::list::list_featured_media_files_handler::list_featured_media_files_handler,
    crate::http_server::endpoints::media_files::list::list_media_files_by_batch_token_handler::list_media_files_by_batch_token_handler,
    crate::http_server::endpoints::media_files::list::list_media_files_for_user_handler::list_media_files_for_user_handler,
    crate::http_server::endpoints::media_files::list::list_media_files_handler::list_media_files_handler,
    crate::http_server::endpoints::media_files::list::list_pinned_media_files_handler::list_pinned_media_files_handler,
    crate::http_server::endpoints::media_files::search::search_featured_media_files_handler::search_featured_media_files_handler,
    crate::http_server::endpoints::media_files::search::search_session_media_files_handler::search_session_media_files_handler,
    crate::http_server::endpoints::media_files::upload::upload_audio_media_file_handler::upload_audio_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_engine_asset::upload_engine_asset_media_file_handler::upload_engine_asset_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_generic::upload_media_file_handler::upload_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_image_media_file_handler::upload_image_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_new_engine_asset_media_file_handler::upload_new_engine_asset_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_new_scene_media_file_handler::upload_new_scene_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_spz_media_file_handler::upload_spz_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_pmx::upload_pmx_media_file_handler::upload_pmx_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_saved_scene_media_file_handler::upload_saved_scene_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_scene_snapshot_media_file_handler::upload_scene_snapshot_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_studio_shot::upload_studio_shot_media_file_handler::upload_studio_shot_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_video_new::upload_new_video_media_file_handler::upload_new_video_media_file_handler,
    crate::http_server::endpoints::media_files::upload::upload_video_old::upload_video_media_file_handler::upload_video_media_file_handler,
    crate::http_server::endpoints::media_files::upsert_upload::write_engine_asset::write_engine_asset_media_file_handler::write_engine_asset_media_file_handler,
    crate::http_server::endpoints::media_files::upsert_upload::write_scene_file::write_scene_file_media_file_handler::write_scene_file_media_file_handler,
    crate::http_server::endpoints::model_download::enqueue_gptsovits_model_download_handler::enqueue_gptsovits_model_download_handler,
    crate::http_server::endpoints::moderation::user_feature_flags::edit_user_feature_flags_handler::edit_user_feature_flags_handler,
    crate::http_server::endpoints::prompts::create_prompt_handler::create_prompt_handler,
    crate::http_server::endpoints::prompts::get_prompt_handler::get_prompt_handler,
    crate::http_server::endpoints::service::status_alert_handler::status_alert_handler,
    crate::http_server::endpoints::stats::get_unified_queue_stats_handler::get_unified_queue_stats_handler,
    crate::http_server::endpoints::studio_gen2::enqueue_studio_gen2_handler::enqueue_studio_gen2_handler,
    crate::http_server::endpoints::tags::list_tags_for_entity_handler::list_tags_for_entity_handler,
    crate::http_server::endpoints::tags::set_tags_for_entity_handler::set_tags_for_entity_handler,
    crate::http_server::endpoints::tts::enqueue_infer_tts_handler::enqueue_infer_tts_handler::enqueue_infer_tts_handler,
    crate::http_server::endpoints::user_bookmarks::batch_get_user_bookmarks_handler::batch_get_user_bookmarks_handler,
    crate::http_server::endpoints::user_bookmarks::create_user_bookmark_handler::create_user_bookmark_handler,
    crate::http_server::endpoints::user_bookmarks::delete_user_bookmark_handler::delete_user_bookmark_handler,
    crate::http_server::endpoints::user_bookmarks::list_user_bookmarks_for_entity_handler::list_user_bookmarks_for_entity_handler,
    crate::http_server::endpoints::user_bookmarks::list_user_bookmarks_for_user_handler::list_user_bookmarks_for_user_handler,
    crate::http_server::endpoints::user_ratings::batch_get_user_rating_handler::batch_get_user_rating_handler,
    crate::http_server::endpoints::user_ratings::get_user_rating_handler::get_user_rating_handler,
    crate::http_server::endpoints::user_ratings::set_user_rating_handler::set_user_rating_handler,
    crate::http_server::endpoints::users::change_password_handler::change_password_handler,
    crate::http_server::endpoints::users::create_account_handler::create_account_handler,
    crate::http_server::endpoints::users::edit_email_handler::edit_email_handler,
    crate::http_server::endpoints::users::edit_username_handler::edit_username_handler,
    crate::http_server::endpoints::users::get_profile_handler::get_profile_handler,
    crate::http_server::endpoints::users::google_sso::google_sso_handler::google_sso_handler,
    crate::http_server::endpoints::users::login_handler::login_handler,
    crate::http_server::endpoints::users::logout_handler::logout_handler,
    crate::http_server::endpoints::users::session_info_handler::session_info_handler,
    crate::http_server::endpoints::users::session_token_info_handler::session_token_info_handler,
    crate::http_server::endpoints::voice_conversion::enqueue_voice_conversion_inference_handler::enqueue_voice_conversion_inference_handler,
    crate::http_server::endpoints::voice_designer::inference::enqueue_tts_request::enqueue_tts_request,
    crate::http_server::endpoints::voice_designer::voice_datasets::list_datasets_by_user::list_datasets_by_user_handler,
    crate::http_server::endpoints::weights::delete::delete_weight_handler::delete_weight_handler,
    crate::http_server::endpoints::weights::get::get_weight_handler::get_weight_handler,
    crate::http_server::endpoints::weights::list::list_available_weights_handler::list_available_weights_handler,
    crate::http_server::endpoints::weights::list::list_featured_weights_handler::list_featured_weights_handler,
    crate::http_server::endpoints::weights::list::list_pinned_weights_handler::list_pinned_weights_handler,
    crate::http_server::endpoints::weights::list::list_weights_by_user_handler::list_weights_by_user_handler,
    crate::http_server::endpoints::weights::search::search_model_weights_http_get_handler::search_model_weights_http_get_handler,
    crate::http_server::endpoints::weights::search::search_model_weights_http_post_handler::search_model_weights_http_post_handler,
    crate::http_server::endpoints::weights::update::set_model_weight_cover_image_handler::set_model_weight_cover_image_handler,
    crate::http_server::endpoints::weights::update::update_weight_handler::update_weight_handler,
    // Cost Estimate
    crate::http_server::endpoints::generate::cost_estimate::image::estimate_image_cost_handler::estimate_image_cost_handler,
    crate::http_server::endpoints::generate::cost_estimate::video::estimate_video_cost_handler::estimate_video_cost_handler,
    // Generate Images (Multi-Function)
    crate::http_server::endpoints::generate::image::multi_function::nano_banana_multi_function_image_gen_handler::nano_banana_multi_function_image_gen_handler,
    crate::http_server::endpoints::generate::image::multi_function::nano_banana_pro_multi_function_image_gen_handler::nano_banana_pro_multi_function_image_gen_handler,
    crate::http_server::endpoints::generate::image::multi_function::nano_banana_2_multi_function_image_gen_handler::nano_banana_2_multi_function_image_gen_handler,
    crate::http_server::endpoints::generate::image::multi_function::gpt_image_1p5_multi_function_image_gen_handler::gpt_image_1p5_multi_function_image_gen_handler,
    crate::http_server::endpoints::generate::image::multi_function::bytedance_seedream_v4_multi_function_image_gen_handler::bytedance_seedream_v4_multi_function_image_gen_handler,
    crate::http_server::endpoints::generate::image::multi_function::bytedance_seedream_v4p5_multi_function_image_gen_handler::bytedance_seedream_v4p5_multi_function_image_gen_handler,
    crate::http_server::endpoints::generate::image::multi_function::bytedance_seedream_5_lite_multi_function_image_gen_handler::bytedance_seedream_5_lite_multi_function_image_gen_handler,
    // Generate Images (Edit)
    crate::http_server::endpoints::generate::image::edit::flux_pro_kontext_max_edit_image_handler::flux_pro_kontext_max_edit_image_handler,
    crate::http_server::endpoints::generate::image::edit::gemini_25_flash_edit_image_handler::gemini_25_flash_edit_image_handler,
    crate::http_server::endpoints::generate::image::edit::qwen_edit_image_handler::qwen_edit_image_handler,
    crate::http_server::endpoints::generate::image::edit::seededit_3_edit_image_handler::seededit_3_edit_image_handler,
    // Generate Images (Angle)
    crate::http_server::endpoints::generate::image::angle::flux_2_lora_edit_image_angle_handler::flux_2_lora_edit_image_angle_handler,
    crate::http_server::endpoints::generate::image::angle::qwen_edit_2511_edit_image_angle_handler::qwen_edit_2511_edit_image_angle_handler,
    // Generate Images (Inpaint)
    crate::http_server::endpoints::generate::image::inpaint::flux_dev_juggernaut_inpaint_handler::flux_dev_juggernaut_inpaint_image_handler,
    crate::http_server::endpoints::generate::image::inpaint::flux_pro_1_inpaint_handler::flux_pro_1_inpaint_image_handler,
    // Generate Videos
    crate::http_server::endpoints::generate::video::image::generate_seedance_1_0_pro_image_to_video_handler::generate_seedance_1_0_pro_image_to_video_handler,
    crate::http_server::endpoints::generate::video::image::generate_veo_3_image_to_video_handler::generate_veo_3_image_to_video_handler,
    crate::http_server::endpoints::generate::video::image::generate_veo_3_fast_image_to_video_handler::generate_veo_3_fast_image_to_video_handler,
    // Generate Video (Multi-Function)
    crate::http_server::endpoints::generate::video::multi_function::kling_2p5_turbo_pro_multi_function_video_gen_handler::kling_2p5_turbo_pro_multi_function_video_gen_handler,
    crate::http_server::endpoints::generate::video::multi_function::kling_2p6_pro_multi_function_video_gen_handler::kling_2p6_pro_multi_function_video_gen_handler,
    crate::http_server::endpoints::generate::video::multi_function::kling_3p0_pro_multi_function_video_gen_handler::kling_3p0_pro_multi_function_video_gen_handler,
    crate::http_server::endpoints::generate::video::multi_function::kling_3p0_standard_multi_function_video_gen_handler::kling_3p0_standard_multi_function_video_gen_handler,
    crate::http_server::endpoints::generate::video::multi_function::seedance_1p5_pro_multi_function_video_gen_handler::seedance_1p5_pro_multi_function_video_gen_handler,
    crate::http_server::endpoints::generate::video::multi_function::seedance_2p0_multi_function_video_gen_handler::seedance_2p0_multi_function_video_gen_handler,
    crate::http_server::endpoints::generate::video::multi_function::sora_2_multi_function_video_gen_handler::sora_2_multi_function_video_gen_handler,
    crate::http_server::endpoints::generate::video::multi_function::sora_2_pro_multi_function_video_gen_handler::sora_2_pro_multi_function_video_gen_handler,
    crate::http_server::endpoints::generate::video::multi_function::veo_3p1_multi_function_video_gen_handler::veo_3p1_multi_function_video_gen_handler,
    crate::http_server::endpoints::generate::video::multi_function::veo_3p1_fast_multi_function_video_gen_handler::veo_3p1_fast_multi_function_video_gen_handler,
    // Generate Objects (Multi-Function)
    crate::http_server::endpoints::generate::object::multi_function::generate_hunyuan3d_v3_multi_function_object_handler::generate_hunyuan3d_v3_multi_function_object_handler,
    // Media Files
    crate::http_server::endpoints::media_files::list::list_batch_generated_redux_media_files_handler::list_batch_generated_redux_media_files_handler,
    // Analytics
    crate::http_server::endpoints::analytics::log_app_active_user_handler::log_app_active_user_handler,
    crate::http_server::endpoints::analytics::log_app_active_user_json_handler::log_app_active_user_json_handler,
    // Voice Conversion
    crate::http_server::endpoints::voice_conversion::enqueue_seed_vc_inference_handler::enqueue_infer_seed_vc_handler,
    // TTS
    crate::http_server::endpoints::tts::enqueue_infer_f5_tts_handler::enqueue_infer_f5_tts_handler::enqueue_infer_f5_tts_handler,
    // Characters
    crate::http_server::endpoints::characters::list_characters_handler::list_characters_handler,
    crate::http_server::endpoints::characters::create_character_handler::create_character_handler,
    crate::http_server::endpoints::characters::get_character_handler::get_character_handler,
    crate::http_server::endpoints::characters::edit_character_handler::edit_character_handler,
    crate::http_server::endpoints::characters::delete_character_handler::delete_character_handler,
    // Omni Gen
    crate::http_server::endpoints::omni_gen::cost::image::omni_gen_image_cost_handler::omni_gen_image_cost_handler,
    crate::http_server::endpoints::omni_gen::cost::video::omni_gen_video_cost_handler::omni_gen_video_cost_handler,
    crate::http_server::endpoints::omni_gen::generate::image::omni_gen_image_generate_handler::omni_gen_image_generate_handler,
    crate::http_server::endpoints::omni_gen::generate::video::omni_gen_video_generate_handler::omni_gen_video_generate_handler,
    crate::http_server::endpoints::omni_gen::models::image::omni_gen_image_models_handler::omni_gen_image_models_handler,
    crate::http_server::endpoints::omni_gen::models::video::omni_gen_video_models_handler::omni_gen_video_models_handler,
    // Moderation
    crate::http_server::endpoints::moderation::alerts::moderation_send_alert_handler::moderation_send_alert_handler,
    crate::http_server::endpoints::moderation::info::moderator_token_info_handler::moderator_get_token_info_handler,
    crate::http_server::endpoints::moderation::user::moderator_list_subscribing_users_by_signup_date::moderator_list_subscribing_users_by_signup_date_handler,
    crate::http_server::endpoints::moderation::user::moderator_list_users_by_signup_date::moderator_list_users_by_signup_date_handler,
    crate::http_server::endpoints::moderation::user::moderator_user_lookup_handler::moderator_user_lookup_handler,
    crate::http_server::endpoints::moderation::user::moderator_user_lookup_by_stripe_customer_id_handler::moderator_user_lookup_by_stripe_customer_id_handler,
    crate::http_server::endpoints::moderation::jobs::user::list_user_jobs_handler::list_user_jobs_handler,
    crate::http_server::endpoints::moderation::wallet_ledger_entries::list_wallet_ledger_entries_by_wallet_handler::list_wallet_ledger_entries_by_wallet_handler,
    crate::http_server::endpoints::moderation::wallet_ledger_entries::moderator_get_wallet_ledger_entry_handler::moderator_get_wallet_ledger_entry_handler,
    crate::http_server::endpoints::moderation::wallets::list_user_wallets_handler::list_user_wallets_handler,
    crate::http_server::endpoints::moderation::wallets::moderator_add_banked_balance_to_wallet_handler::moderator_add_banked_balance_to_wallet_handler,
    crate::http_server::endpoints::moderation::wallets::moderator_create_wallet_for_user_handler::moderator_create_wallet_for_user_handler,
    crate::http_server::endpoints::moderation::wallets::moderator_get_wallet_handler::moderator_get_wallet_handler,
    // Credits
    crate::http_server::endpoints::credits::get_session_credits_handler::get_session_credits_handler,
    // Subscriptions
    crate::http_server::endpoints::subscriptions::get_session_subscription_handler::get_session_subscription_handler,
    // Web Referrals
    crate::http_server::endpoints::web_referrals::log_web_referral_handler::log_web_referral_handler,
    // Webhooks
    crate::http_server::endpoints::webhooks::fal_webhook_handler::fal_webhook_handler,
    // Image Studio
    crate::http_server::endpoints::image_studio::update_gpt_image_job_status_handler::update_gpt_image_job_status_handler,
  ),
  components(schemas(
    // Tokens
    BatchGenerationToken,
    BetaKeyToken,
    BrowserSessionLogToken,
    CommentToken,
    InferenceJobToken,
    MediaFileToken,
    ModelWeightToken,
    PromptToken,
    UserBookmarkToken,
    UserToken,
    ZsVoiceDatasetToken,

    // Enums
    BetaKeyProduct,
    CommentEntityType,
    FeaturedItemEntityType,
    FrontendFailureCategory,
    GenerationProvider,
    InferenceCategory,
    JobStatusPlus,
    MediaFileAnimationType,
    MediaFileClass,
    MediaFileEngineCategory,
    MediaFileOriginCategory,
    MediaFileOriginProductCategory,
    MediaFileSubtype,
    MediaFileType,
    CommonModelType,
    CommonAspectRatio,
    CommonGenerationMode,
    CommonResolution,
    PromptContextSemanticType,
    PromptType,
    PublicMediaFileModelType,
    PublicWeightsType,
    StyleTransferName,
    UserFeatureFlag,
    WeightsCategory,
    WeightsType,

    // Other common enums
    AutoProductCategory,

    // Common path info
    MediaFileTokenPathInfo,

    // Common response structs
    JobDetailsLivePortraitRequest,
    JobDetailsLipsyncRequest,
    MediaFileLivePortraitDetails,
    MediaFileModelDetails,
    MediaFileOriginDetails,
    MediaFileSocialMetaLight,
    MediaFileWriteError,
    MediaFileWriteError,
    MediaLinks,
    PaginationCursors,
    PaginationPage,
    SimpleEntityStats,
    SimpleGenericJsonSuccess,
    SimpleResponse,
    TagInfo,
    UserDetailsLight,
    VideoPreviews,
    Visibility,

    // Common cover image types
    CoverImageLinks,
    MediaFileCoverImageDetails,
    MediaFileDefaultCover,
    UserDefaultAvatarInfo,
    WeightsCoverImageDetails,
    WeightsDefaultCoverInfo,

    // Endpoint API types
    AppStateError,
    AppStateLegacyPermissionFlags,
    AppStatePermissions,
    AppStatePremiumInfo,
    AppStateResponse,
    AppStateServerInfo,
    AppStateStatusAlertCategory,
    AppStateStatusAlertInfo,
    AppStateSubscriptionProductKey,
    AppStateUserInfo,
    AppStateUserLocale,
    BatchGetInferenceJobStatusError,
    BatchGetInferenceJobStatusQueryParams,
    BatchGetInferenceJobStatusSuccessResponse,
    BatchGetMediaFilesError,
    BatchGetMediaFilesModelInfo,
    CreatePromptRequest,
    CreatePromptResponse,
    BatchGetMediaFilesQueryParams,
    BatchGetMediaFilesSuccessResponse,
    BatchGetUserBookmarksError,
    BatchGetUserBookmarksQueryParams,
    BatchGetUserBookmarksResponse,
    BatchGetUserRatingError,
    BatchGetUserRatingQueryParams,
    BatchGetUserRatingResponse,
    GenerateGptImage1TextToImageImageQuality,
    GenerateGptImage1TextToImageImageSize,
    GenerateGptImage1TextToImageNumImages,
    GenerateGptImage1TextToImageRequest,
    GenerateGptImage1TextToImageResponse,
    BatchInferenceJobStatusResponsePayload,
    BatchMediaFileInfo,
    BatchRequestDetailsResponse,
    BatchResultDetailsResponse,
    BatchStatusDetailsResponse,
    BetaKeyItem,
    GetPromptImageContextItem,
    BookmarkRow,
    ByQueueStats,
    ChangeMediaFileAnimationTypeError,
    ChangeMediaFileAnimationTypeRequest,
    ChangeMediaFileEngineCategoryError,
    ChangeMediaFileEngineCategoryRequest,
    ChangeMediaFileVisibilityError,
    ChangeMediaFileVisibilityRequest,
    CreateAccountErrorResponse,
    CreateAccountErrorType,
    CreateAccountRequest,
    CreateAccountSuccessResponse,
    CreateBetaKeysError,
    CreateBetaKeysRequest,
    CreateBetaKeysSuccessResponse,
    CreateCheckoutSessionError,
    CreateCheckoutSessionRequest,
    CreateCheckoutSessionSuccessResponse,
    CreateCommentError,
    CreateCommentRequest,
    CreateCommentSuccessResponse,
    CreateFeaturedItemError,
    CreateFeaturedItemRequest,
    CreateFeaturedItemSuccessResponse,
    CreateSceneError,
    CreateSceneSuccessResponse,
    CreateUserBookmarkError,
    CreateUserBookmarkRequest,
    CreateUserBookmarkSuccessResponse,
    DeleteCommentError,
    DeleteCommentPathInfo,
    DeleteCommentRequest,
    DeleteFeaturedItemError,
    DeleteFeaturedItemRequest,
    DeleteMediaFilePathInfo,
    DeleteMediaFileRequest,
    DeleteUserBookmarkError,
    DeleteUserBookmarkPathInfo,
    DeleteUserBookmarkRequest,
    DeleteWeightError,
    DeleteWeightPathInfo,
    DeleteWeightRequest,
    DismissFinishedSessionJobsSuccessResponse,
    EditBetaKeyDistributedFlagError,
    EditBetaKeyDistributedFlagPathInfo,
    EditBetaKeyDistributedFlagRequest,
    EditBetaKeyDistributedFlagSuccessResponse,
    EditBetaKeyNoteError,
    EditBetaKeyNotePathInfo,
    EditBetaKeyNoteRequest,
    EditBetaKeyNoteSuccessResponse,
    EditUserFeatureFlagPathInfo,
    EditUserFeatureFlagsError,
    EditUserFeatureFlagsOption,
    EditUserFeatureFlagsRequest,
    ModerationSendAlertRequest,
    ModerationSendAlertResponse,
    ModerationSendAlertUrgency,
    ModeratorListSubscribingUsersBySignupDateEntry,
    ModeratorListSubscribingUsersBySignupDateRequest,
    ModeratorListSubscribingUsersBySignupDateResponse,
    ModeratorListUsersBySignupDateEntry,
    ModeratorListUsersBySignupDateRequest,
    ModeratorListUsersBySignupDateResponse,
    ModeratorUserLookupByStripeCustomerIdEntry,
    ModeratorUserLookupByStripeCustomerIdRequest,
    ModeratorUserLookupByStripeCustomerIdResponse,
    ModeratorUserLookupRequest,
    ModeratorUserLookupSuccessResponse,
    ModeratorUserLookupUserDetails,
    CreateCharacterRequest,
    CreateCharacterResponse,
    DeleteCharacterPathInfo,
    DeleteCharacterResponse,
    EditCharacterRequest,
    EditCharacterResponse,
    GetCharacterDetails,
    GetCharacterPathInfo,
    GetCharacterResponse,
    ListCharactersEntry,
    ListCharactersResponse,
    OmniGenImageCostAndGenerateRequest,
    OmniGenImageCostResponse,
    OmniGenImageGenerateResponse,
    OmniGenImageModelDetails,
    OmniGenImageModelProviderDetails,
    OmniGenImageModelsProvider,
    OmniGenImageModelsQuery,
    OmniGenImageModelsResponse,
    OmniGenImageProviderModelDetails,
    OmniGenVideoCostAndGenerateRequest,
    OmniGenVideoCostResponse,
    OmniGenVideoGenerateResponse,
    OmniGenVideoModelDetails,
    OmniGenVideoModelProviderDetails,
    OmniGenVideoModelsProvider,
    OmniGenVideoModelsQuery,
    OmniGenVideoModelsResponse,
    OmniGenVideoProviderModelDetails,
    ListUserJobsPathInfo,
    ListUserJobsResponse,
    ListUserJobsEntry,
    InferenceJobExternalThirdParty,
    ListUserWalletsPathInfo,
    ListUserWalletsResponse,
    ListUserWalletsEntry,
    ListWalletLedgerEntriesByWalletPathInfo,
    ListWalletLedgerEntriesByWalletResponse,
    ListWalletLedgerEntriesByWalletEntry,
    ModeratorAddBankedBalanceToWalletPathInfo,
    ModeratorAddBankedBalanceToWalletRequest,
    ModeratorAddBankedBalanceToWalletResponse,
    ModeratorCreateWalletForUserRequest,
    ModeratorCreateWalletForUserResponse,
    ModeratorGetWalletPathInfo,
    ModeratorGetWalletResponse,
    ModeratorGetWalletDetails,
    ModeratorGetWalletLedgerEntryPathInfo,
    ModeratorGetWalletLedgerEntryResponse,
    ModeratorGetWalletLedgerEntryDetails,
    GptImage1EditImageRequest,
    GptImage1EditImageImageSize,
    GptImage1EditImageNumImages,
    GptImage1EditImageImageQuality,
    GptImage1EditImageResponse,
    ChangePasswordError,
    ChangePasswordRequest,
    ChangePasswordResponse,
    EditEmailError,
    EditEmailRequest,
    EditEmailResponse,
    EditUsernameError,
    EditUsernameRequest,
    EditUsernameResponse,
    EnqueueFaceFusionCropDimensions,
    EnqueueFaceFusionWorkflowError,
    EnqueueFaceFusionWorkflowRequest,
    EnqueueFaceFusionWorkflowSuccessResponse,
    EnqueueFbxToGltfRequest,
    EnqueueFbxToGltfRequestError,
    EnqueueFbxToGltfRequestSuccessResponse,
    EnqueueGptSovitsModelDownloadError,
    EnqueueGptSovitsModelDownloadRequest,
    EnqueueGptSovitsModelDownloadSuccessResponse,
    EnqueueImageGenRequestError,
    EnqueueImageGenRequestSuccessResponse,
    EnqueueLivePortraitCropDimensions,
    EnqueueLivePortraitWorkflowError,
    EnqueueLivePortraitWorkflowRequest,
    EnqueueLivePortraitWorkflowSuccessResponse,
    EnqueueStudioGen2Error,
    EnqueueStudioGen2Request,
    EnqueueStudioGen2Response,
    EnqueueTTSRequest,
    EnqueueTTSRequestError,
    EnqueueTTSRequestSuccessResponse,
    EnqueueVideoStyleTransferError,
    EnqueueVideoStyleTransferRequest,
    EnqueueVideoStyleTransferSuccessResponse,
    EnqueueVoiceConversionInferenceError,
    EnqueueVoiceConversionInferenceRequest,
    EnqueueVoiceConversionInferenceSuccessResponse,
    FeaturedMediaFile,
    FeaturedModelWeightForList,
    FundamentalFrequencyMethod,
    GenerateFlux1DevTextToImageAspectRatio,
    GenerateFlux1DevTextToImageNumImages,
    GenerateFlux1DevTextToImageRequest,
    GenerateFlux1DevTextToImageResponse,
    GenerateFlux1SchnellTextToImageAspectRatio,
    GenerateFlux1SchnellTextToImageNumImages,
    GenerateFlux1SchnellTextToImageRequest,
    GenerateFlux1SchnellTextToImageResponse,
    GenerateFluxPro11TextToImageAspectRatio,
    GenerateFluxPro11TextToImageNumImages,
    GenerateFluxPro11TextToImageRequest,
    GenerateFluxPro11TextToImageResponse,
    GenerateFluxPro11UltraTextToImageAspectRatio,
    GenerateFluxPro11UltraTextToImageNumImages,
    GenerateFluxPro11UltraTextToImageRequest,
    GenerateFluxPro11UltraTextToImageResponse,
    GenerateHunyuan21ImageTo3dRequest,
    GenerateHunyuan21ImageTo3dResponse,
    GenerateHunyuan20ImageTo3dRequest,
    GenerateHunyuan20ImageTo3dResponse,
    GenerateWorldlabsMarble0p1MiniSplatRequest,
    GenerateWorldlabsMarble0p1MiniSplatResponse,
    GenerateWorldlabsMarble0p1PlusSplatRequest,
    GenerateWorldlabsMarble0p1PlusSplatResponse,
    GenerateKling16ProAspectRatio,
    GenerateKling16ProDuration,
    GenerateKling16ProImageToVideoRequest,
    GenerateKling16ProImageToVideoResponse,
    GenerateKling21MasterAspectRatio,
    GenerateKling21MasterDuration,
    GenerateKling21MasterImageToVideoRequest,
    GenerateKling21MasterImageToVideoResponse,
    GenerateKling21ProAspectRatio,
    GenerateKling21ProDuration,
    GenerateKling21ProImageToVideoRequest,
    GenerateKling21ProImageToVideoResponse,
    GenerateSeedance10LiteDuration,
    GenerateSeedance10LiteImageToVideoRequest,
    GenerateSeedance10LiteImageToVideoResponse,
    GenerateSeedance10LiteResolution,
    GenerateVeo2AspectRatio,
    GenerateVeo2Duration,
    GenerateVeo2ImageToVideoRequest,
    GenerateVeo2ImageToVideoResponse,
    GetInferenceJobStatusError,
    GetInferenceJobStatusPathInfo,
    GetInferenceJobStatusSuccessResponse,
    GetIsFeaturedItemError,
    GetIsFeaturedItemPathInfo,
    GetIsFeaturedItemSuccessResponse,
    GetMediaFileError,
    GetMediaFileModelInfo,
    GetMediaFileModeratorFields,
    GetMediaFilePathInfo,
    GetMediaFileSuccessResponse,
    GetProfilePathInfo,
    GetPromptError,
    GetPromptPathInfo,
    GetPromptSuccessResponse,
    GetUnifiedQueueStatsError,
    GetUnifiedQueueStatsSuccessResponse,
    GetUserRatingError,
    GetUserRatingResponse,
    GetWeightError,
    GetWeightPathInfo,
    GetWeightResponse,
    GoogleCreateAccountErrorResponse,
    GoogleCreateAccountErrorType,
    GoogleCreateAccountRequest,
    GoogleCreateAccountSuccessResponse,
    InferTtsError,
    InferTtsRequest,
    InferTtsSuccessResponse,
    InferenceJobStatusResponsePayload,
    InferenceJobTokenType,
    LegacyQueueDetails,
    ListActiveUserSubscriptionsError,
    ListActiveUserSubscriptionsResponse,
    ListAvailableWeightsQuery,
    ListAvailableWeightsSuccessResponse,
    ListBetaKeysError,
    ListBetaKeysFilterOption,
    ListBetaKeysQueryParams,
    ListBetaKeysSuccessResponse,
    ListCommentsError,
    ListCommentsPathInfo,
    ListCommentsSuccessResponse,
    ListDatasetsByUserError,
    ListDatasetsByUserPathInfo,
    ListDatasetsByUserSuccessResponse,
    ListFeaturedMediaFilesError,
    ListFeaturedMediaFilesQueryParams,
    ListFeaturedMediaFilesSuccessResponse,
    ListFeaturedWeightsError,
    ListFeaturedWeightsQueryParams,
    ListFeaturedWeightsSuccessResponse,
    ListMediaFilesByBatchError,
    ListMediaFilesByBatchPathInfo,
    ListMediaFilesByBatchSuccessResponse,
    ListMediaFilesError,
    ListMediaFilesForUserError,
    ListMediaFilesForUserPathInfo,
    ListMediaFilesForUserQueryParams,
    ListMediaFilesForUserSuccessResponse,
    ListMediaFilesQueryParams,
    ListMediaFilesSuccessResponse,
    ListPinnedMediaFilesError,
    ListPinnedMediaFilesSuccessResponse,
    ListPinnedWeightsError,
    ListPinnedWeightsSuccessResponse,
    ListSessionJobsError,
    ListSessionJobsItem,
    ListSessionJobsQueryParams,
    ListSessionJobsSuccessResponse,
    ListSessionRequestDetailsResponse,
    ListSessionResultDetailsResponse,
    ListSessionStatusDetailsResponse,
    ListTagsForEntityError,
    ListTagsForEntityPathInfo,
    ListTagsForEntitySuccessResponse,
    ListUserBookmarksForEntityError,
    ListUserBookmarksForEntityPathInfo,
    ListUserBookmarksForEntitySuccessResponse,
    ListUserBookmarksForUserError,
    ListUserBookmarksForUserSuccessResponse,
    ListUserBookmarksPathInfo,
    ListWeightError,
    ListWeightsByUserError,
    ListWeightsByUserPathInfo,
    ListWeightsByUserSuccessResponse,
    LogBrowserSessionError,
    LogBrowserSessionRequest,
    LogBrowserSessionSuccessResponse,
    LoginErrorResponse,
    LoginErrorType,
    LoginRequest,
    LoginSuccessResponse,
    LogoutError,
    LogoutSuccessResponse,
    MediaFileData,
    MediaFileForUserListItem,
    MediaFileInfo,
    MediaFileListItem,
    MediaFileUploadError,
    MediaFilesByBatchListItem,
    ModelWeightForList,
    ModelWeightSearchResult,
    ModernInferenceQueueStats,
    PinnedMediaFile,
    PinnedModelWeightForList,
    ProfileError,
    PromptInfo,
    RatingRow,
    RedeemBetaKeyError,
    RedeemBetaKeyRequest,
    RedeemBetaKeySuccessResponse,
    RemoveImageBackgroundRequest,
    RemoveImageBackgroundResponse,
    RenameMediaFileError,
    RenameMediaFileRequest,
    RequestDetailsResponse,
    ResultDetailsResponse,
    SearchFeaturedMediaFileListItem,
    SearchFeaturedMediaFilesError,
    SearchFeaturedMediaFilesQueryParams,
    SearchFeaturedMediaFilesSuccessResponse,
    SearchMediaFileListItem,
    SearchMediaFilesError,
    SearchMediaFilesQueryParams,
    SearchMediaFilesSuccessResponse,
    SearchModelWeightsError,
    SearchModelWeightsRequest,
    SearchModelWeightsSortDirection,
    SearchModelWeightsSortField,
    SearchModelWeightsSuccessResponse,
    SessionInfoError,
    SessionTokenInfoError,
    SessionTokenInfoSuccessResponse,
    SetMediaFileCoverImageError,
    SetMediaFileCoverImageRequest,
    SetModelWeightCoverImageError,
    SetModelWeightCoverImagePathInfo,
    SetModelWeightCoverImageRequest,
    SetModelWeightCoverImageResponse,
    SetTagsForEntityError,
    SetTagsForEntityPathInfo,
    SetTagsForEntityRequest,
    SetTagsForEntitySuccessResponse,
    SetUserRatingError,
    SetUserRatingRequest,
    SetUserRatingResponse,
    StatusAlertCategory,
    StatusAlertError,
    StatusAlertInfo,
    StatusAlertResponse,
    StatusDetailsResponse,
    SubscriptionProductKey,
    TerminateInferenceJobError,
    TerminateInferenceJobPathInfo,
    TerminateInferenceJobSuccessResponse,
    UpdateWeightError,
    UpdateWeightPathInfo,
    UpdateWeightRequest,
    UploadAudioMediaFileForm,
    UploadAudioMediaFileSuccessResponse,
    UploadEngineAssetMediaSuccessResponse,
    UploadImageMediaFileForm,
    UploadImageMediaFileSuccessResponse,
    UploadMediaSuccessResponse,
    UploadNewEngineAssetFileForm,
    UploadNewEngineAssetSuccessResponse,
    UploadNewSceneMediaFileForm,
    UploadNewSceneMediaFileSuccessResponse,
    UploadSpzMediaFileForm,
    UploadSpzMediaFileSuccessResponse,
    UploadNewVideoMediaFileForm,
    UploadNewVideoMediaFileSuccessResponse,
    UploadPmxFileForm,
    UploadPmxSuccessResponse,
    UploadSavedSceneMediaFileForm,
    UploadSavedSceneMediaFilePathInfo,
    UploadSavedSceneMediaFileSuccessResponse,
    UploadSceneSnapshotMediaFileForm,
    UploadSceneSnapshotMediaFileSuccessResponse,
    UploadSnapshotMediaFileForm,
    UploadSnapshotMediaFileSuccessResponse,
    UploadStudioShotFileForm,
    UploadStudioShotSuccessResponse,
    UploadVideoMediaSuccessResponse,
    UserBookmarkDetailsForUserList,
    UserBookmarkEntityType,
    UserBookmarkForEntityListItem,
    UserBookmarkListItem,
    UserProfileModeratorFields,
    UserProfileRecordForResponse,
    UserProfileUserBadge,
    UserRatingEntityType,
    UserRatingValue,
    VstError,
    VstRequest,
    VstSuccessResponse,
    Weight,
    WeightsData,
    WriteEngineAssetMediaSuccessResponse,
    WriteSceneFileMediaSuccessResponse,
    ZsDatasetRecord,

    // Cost Estimate types
    EstimateImageCostRequest,
    EstimateImageCostResponse,
    EstimateImageCostError,
    EstimateImageCostErrorType,
    EstimateVideoCostRequest,
    EstimateVideoCostResponse,
    EstimateVideoCostError,
    EstimateVideoCostErrorType,

    // Image Multi-Function types
    NanoBananaMultiFunctionImageGenRequest,
    NanoBananaMultiFunctionImageGenResponse,
    NanoBananaMultiFunctionImageGenAspectRatio,
    NanoBananaMultiFunctionImageGenNumImages,
    NanoBananaProMultiFunctionImageGenRequest,
    NanoBananaProMultiFunctionImageGenResponse,
    NanoBananaProMultiFunctionImageGenAspectRatio,
    NanoBananaProMultiFunctionImageGenNumImages,
    NanoBananaProMultiFunctionImageGenImageResolution,
    NanaBanana2MultiFunctionImageGenRequest,
    NanaBanana2MultiFunctionImageGenResponse,
    NanaBanana2MultiFunctionImageGenAspectRatio,
    NanaBanana2MultiFunctionImageGenNumImages,
    NanaBanana2MultiFunctionImageGenImageResolution,
    GptImage1p5MultiFunctionImageGenRequest,
    GptImage1p5MultiFunctionImageGenResponse,
    GptImage1p5MultiFunctionImageGenBackground,
    GptImage1p5MultiFunctionImageGenInputFidelity,
    GptImage1p5MultiFunctionImageGenNumImages,
    GptImage1p5MultiFunctionImageGenQuality,
    GptImage1p5MultiFunctionImageGenSize,
    BytedanceSeedreamV4MultiFunctionImageGenRequest,
    BytedanceSeedreamV4MultiFunctionImageGenResponse,
    BytedanceSeedreamV4MultiFunctionImageGenImageSize,
    BytedanceSeedreamV4MultiFunctionImageGenNumImages,
    BytedanceSeedreamV4p5MultiFunctionImageGenRequest,
    BytedanceSeedreamV4p5MultiFunctionImageGenResponse,
    BytedanceSeedreamV4p5MultiFunctionImageGenImageSize,
    BytedanceSeedreamV4p5MultiFunctionImageGenNumImages,
    BytedanceSeedream5LiteMultiFunctionImageGenRequest,
    BytedanceSeedream5LiteMultiFunctionImageGenResponse,
    BytedanceSeedream5LiteMultiFunctionImageGenImageSize,
    BytedanceSeedream5LiteMultiFunctionImageGenNumImages,

    // Image Angle types
    Flux2LoraEditImageAngleRequest,
    Flux2LoraEditImageAngleResponse,
    Flux2LoraEditImageAngleNumImages,
    Flux2LoraEditImageAngleImageSize,
    QwenEdit2511EditImageAngleRequest,
    QwenEdit2511EditImageAngleResponse,
    QwenEdit2511EditImageAngleNumImages,
    QwenEdit2511EditImageAngleImageSize,

    // Image Edit types
    FluxProKontextMaxEditImageRequest,
    FluxProKontextMaxEditImageResponse,
    FluxProKontextMaxEditImageNumImages,
    Gemini25FlashEditImageRequest,
    Gemini25FlashEditImageResponse,
    Gemini25FlashEditImageNumImages,
    QwenEditImageRequest,
    QwenEditImageResponse,
    QwenEditImageAcceleration,
    QwenEditImageNumImages,
    SeedEdit3EditImageRequest,
    SeedEdit3EditImageResponse,

    // Image Inpaint types
    FluxDevJuggernautInpaintImageRequest,
    FluxDevJuggernautInpaintImageResponse,
    FluxDevJuggernautInpaintImageNumImages,
    FluxPro1InpaintImageRequest,
    FluxPro1InpaintImageResponse,
    FluxPro1InpaintImageNumImages,

    // Video types (missing handlers)
    GenerateSeedance10ProImageToVideoRequest,
    GenerateSeedance10ProImageToVideoResponse,
    GenerateVeo3ImageToVideoRequest,
    GenerateVeo3ImageToVideoResponse,
    GenerateVeo3FastImageToVideoRequest,
    GenerateVeo3FastImageToVideoResponse,

    // Video Multi-Function types
    Kling2p5TurboProMultiFunctionVideoGenRequest,
    Kling2p5TurboProMultiFunctionVideoGenResponse,
    Kling2p6ProMultiFunctionVideoGenRequest,
    Kling2p6ProMultiFunctionVideoGenResponse,
    Kling3p0ProMultiFunctionVideoGenRequest,
    Kling3p0ProMultiFunctionVideoGenResponse,
    Kling3p0ProMultiFunctionVideoGenDuration,
    Kling3p0ProMultiFunctionVideoGenAspectRatio,
    Kling3p0StandardMultiFunctionVideoGenRequest,
    Kling3p0StandardMultiFunctionVideoGenResponse,
    Kling3p0StandardMultiFunctionVideoGenDuration,
    Kling3p0StandardMultiFunctionVideoGenAspectRatio,
    Seedance2p0MultiFunctionVideoGenRequest,
    Seedance2p0MultiFunctionVideoGenResponse,
    Sora2MultiFunctionVideoGenRequest,
    Sora2MultiFunctionVideoGenResponse,
    Seedance1p5ProMultiFunctionVideoGenRequest,
    Seedance1p5ProMultiFunctionVideoGenResponse,
    Seedance1p5ProMultiFunctionVideoGenResolution,
    Seedance1p5ProMultiFunctionVideoGenDuration,
    Seedance1p5ProMultiFunctionVideoGenAspectRatio,
    Sora2ProMultiFunctionVideoGenRequest,
    Sora2ProMultiFunctionVideoGenResponse,
    Veo3p1MultiFunctionVideoGenRequest,
    Veo3p1MultiFunctionVideoGenResponse,
    Veo3p1FastMultiFunctionVideoGenRequest,
    Veo3p1FastMultiFunctionVideoGenResponse,

    // Object Multi-Function types
    Hunyuan3dV3MultiFunctionObjectGenRequest,
    Hunyuan3dV3MultiFunctionObjectGenResponse,

    // Other types
    LogAppActiveUserRequest,
    LogAppActiveUserResponse,
    GetSessionCreditsPathInfo,
    GetSessionCreditsResponse,
    GetSessionSubscriptionPathInfo,
    GetSessionSubscriptionResponse,
    ListBatchGeneratedReduxMediaFilesPathInfo,
    ListBatchGeneratedReduxMediaFilesSuccessResponse,

    // Web Referrals
    LogWebReferralRequest,
    LogWebReferralResponse,
  ))
)]
pub struct ApiDoc;
