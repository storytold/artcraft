use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::{App, HttpResponse, web};
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::error::Error;

use actix_helpers::route_builder::RouteBuilder;
use billing_component::default_routes::add_suggested_stripe_billing_routes;
use reusable_types::server_environment::ServerEnvironment;

use crate::http_server::endpoints::animation::enqueue_face_animation::enqueue_face_animation_handler;
use crate::http_server::endpoints::animation::enqueue_rerender_animation::enqueue_rerender_animation_handler;
use crate::http_server::endpoints::api_tokens::create_api_token::create_api_token_handler;
use crate::http_server::endpoints::api_tokens::delete_api_token::delete_api_token_handler;
use crate::http_server::endpoints::api_tokens::edit_api_token::edit_api_token_handler;
use crate::http_server::endpoints::api_tokens::list_api_tokens::list_api_tokens_handler;
use crate::http_server::endpoints::categories::create_category::create_category_handler;
use crate::http_server::endpoints::categories::get_category::get_category_handler;
use crate::http_server::endpoints::categories::tts::assign_tts_category::assign_tts_category_handler;
use crate::http_server::endpoints::categories::tts::list_fully_computed_assigned_tts_categories::list_fully_computed_assigned_tts_categories::list_fully_computed_assigned_tts_categories_handler;
use crate::http_server::endpoints::categories::tts::list_tts_categories::list_tts_categories_handler;
use crate::http_server::endpoints::categories::tts::list_tts_model_assigned_categories::list_tts_model_assigned_categories_handler;
use crate::http_server::endpoints::comments::create_comment_handler::create_comment_handler;
use crate::http_server::endpoints::comments::delete_comment_handler::delete_comment_handler;
use crate::http_server::endpoints::comments::list_comments_handler::list_comments_handler;
use crate::http_server::endpoints::conversion::enqueue_fbx_to_gltf_handler::enqueue_fbx_to_gltf_handler;
use crate::http_server::endpoints::conversion::enqueue_render_engine_scene_to_video_handler::enqueue_render_engine_scene_to_video_handler;
use crate::http_server::endpoints::download_job::enqueue_generic_download::enqueue_generic_download_handler;
use crate::http_server::endpoints::download_job::get_generic_upload_job_status::get_generic_download_job_status_handler;
use crate::http_server::endpoints::engine::create_scene_handler::create_scene_handler;
use crate::http_server::endpoints::engine::get_scene_handler::get_scene_handler;
use crate::http_server::endpoints::engine::update_scene_handler::update_scene_handler;
use crate::http_server::endpoints::events::list_events::list_events_handler;
use crate::http_server::endpoints::featured_items::create_featured_item_handler::create_featured_item_handler;
use crate::http_server::endpoints::featured_items::delete_featured_item_handler::delete_featured_item_handler;
use crate::http_server::endpoints::featured_items::get_is_featured_item_handler::get_is_featured_item_handler;
use crate::http_server::endpoints::flags::design_refresh_flag::disable_design_refresh_flag_handler::disable_design_refresh_flag_handler;
use crate::http_server::endpoints::flags::design_refresh_flag::enable_design_refresh_flag_handler::enable_design_refresh_flag_handler;
use crate::http_server::endpoints::image_gen::enqueue_image_generation::enqueue_image_generation_request;
use crate::http_server::endpoints::investor_demo::disable_demo_mode_handler::disable_demo_mode_handler;
use crate::http_server::endpoints::investor_demo::enable_demo_mode_handler::enable_demo_mode_handler;
use crate::http_server::endpoints::leaderboard::get_leaderboard::leaderboard_handler;
use crate::http_server::endpoints::media_uploads::list_user_media_uploads_of_type::list_user_media_uploads_of_type_handler;
use crate::http_server::endpoints::media_uploads::upload_audio::upload_audio_handler;
use crate::http_server::endpoints::media_uploads::upload_image::upload_image_handler;
use crate::http_server::endpoints::media_uploads::upload_media::upload_media_handler;
use crate::http_server::endpoints::misc::default_route_404::default_route_404;
use crate::http_server::endpoints::misc::detect_locale_handler::detect_locale_handler;
use crate::http_server::endpoints::misc::enable_alpha_easy_handler::enable_alpha_easy_handler;
use crate::http_server::endpoints::misc::enable_alpha_handler::enable_alpha_handler;
use crate::http_server::endpoints::misc::root_index::get_root_index;
use crate::http_server::endpoints::mocap::enqueue_mocapnet::enqueue_mocapnet_handler;
use crate::http_server::endpoints::prompts::get_prompt_handler::get_prompt_handler;
use crate::http_server::endpoints::service::health_check_handler::get_health_check_handler;
use crate::http_server::endpoints::service::public_info_handler::get_public_info_handler;
use crate::http_server::endpoints::service::status_alert_handler::status_alert_handler;
use crate::http_server::endpoints::stats::get_unified_queue_stats_handler::get_unified_queue_stats_handler;
use crate::http_server::endpoints::stubs::app_model_downloads::get_app_model_downloads_handler;
use crate::http_server::endpoints::stubs::app_news::get_app_news_handler;
use crate::http_server::endpoints::stubs::app_plans::get_app_plans_handler;
use crate::http_server::endpoints::stubs::post_app_analytics::post_app_analytics_handler;
use crate::http_server::endpoints::subscriptions::unsubscribe_reason::set_unsubscribe_reason_handler;
use crate::http_server::endpoints::trending::list_trending_tts_models::list_trending_tts_models_handler;
use crate::http_server::endpoints::tts::delete_tts_model::delete_tts_model_handler;
use crate::http_server::endpoints::tts::delete_tts_result::delete_tts_inference_result_handler;
use crate::http_server::endpoints::tts::edit_tts_model::edit_tts_model_handler;
use crate::http_server::endpoints::tts::edit_tts_result::edit_tts_inference_result_handler;
use crate::http_server::endpoints::tts::enqueue_gptsovits_model_upload::enqueue_gptsovits_model_upload_handler;
use crate::http_server::endpoints::tts::enqueue_infer_tts_handler::enqueue_infer_tts_handler::enqueue_infer_tts_handler;
use crate::http_server::endpoints::tts::enqueue_upload_tts_model::upload_tts_model_handler;
use crate::http_server::endpoints::tts::get_pending_tts_inference_job_count::get_pending_tts_inference_job_count_handler;
use crate::http_server::endpoints::tts::get_tts_inference_job_status::get_tts_inference_job_status_handler;
use crate::http_server::endpoints::tts::get_tts_model::get_tts_model_handler;
use crate::http_server::endpoints::tts::get_tts_model_use_count::get_tts_model_use_count_handler;
use crate::http_server::endpoints::tts::get_tts_result::get_tts_inference_result_handler;
use crate::http_server::endpoints::tts::get_tts_upload_model_job_status::get_tts_upload_model_job_status_handler;
use crate::http_server::endpoints::tts::list_tts_models::list_tts_models_handler;
use crate::http_server::endpoints::tts::search_tts_models_handler::search_tts_models_handler;
use crate::http_server::endpoints::user_bookmarks::batch_get_user_bookmarks_handler::batch_get_user_bookmarks_handler;
use crate::http_server::endpoints::user_bookmarks::create_user_bookmark_handler::create_user_bookmark_handler;
use crate::http_server::endpoints::user_bookmarks::delete_user_bookmark_handler::delete_user_bookmark_handler;
use crate::http_server::endpoints::user_bookmarks::list_user_bookmarks_for_entity_handler::list_user_bookmarks_for_entity_handler;
use crate::http_server::endpoints::user_bookmarks::list_user_bookmarks_for_session_handler::list_user_bookmarks_for_session_handler;
use crate::http_server::endpoints::user_bookmarks::list_user_bookmarks_for_user_handler::list_user_bookmarks_for_user_handler;
use crate::http_server::endpoints::user_ratings::batch_get_user_rating_handler::batch_get_user_rating_handler;
use crate::http_server::endpoints::user_ratings::get_user_rating_handler::get_user_rating_handler;
use crate::http_server::endpoints::user_ratings::set_user_rating_handler::set_user_rating_handler;
use crate::http_server::endpoints::vocoders::get_vocoder::get_vocoder_handler;
use crate::http_server::endpoints::vocoders::list_vocoders::list_vocoders_handler;
use crate::http_server::endpoints::voice_clone_requests::check_if_voice_clone_request_submitted::check_if_voice_clone_request_submitted_handler;
use crate::http_server::endpoints::voice_clone_requests::create_voice_clone_request::create_voice_clone_request_handler;
use crate::http_server::endpoints::voice_conversion::inference::enqueue_voice_conversion_inference::enqueue_voice_conversion_inference_handler;
use crate::http_server::endpoints::voice_conversion::models::list_voice_conversion_models::list_voice_conversion_models_handler;
use crate::http_server::endpoints::voice_designer::inference::enqueue_tts_request::enqueue_tts_request;
use crate::http_server::endpoints::voice_designer::inference::enqueue_vc_request::enqueue_vc_request;
use crate::http_server::endpoints::voice_designer::voice_dataset_samples::delete_sample::delete_sample_handler;
use crate::http_server::endpoints::voice_designer::voice_dataset_samples::list_samples_by_dataset::list_samples_by_dataset_handler;
use crate::http_server::endpoints::voice_designer::voice_dataset_samples::upload_zs_sample::upload_zs_sample_handler;
use crate::http_server::endpoints::voice_designer::voice_datasets::create_dataset::create_dataset_handler;
use crate::http_server::endpoints::voice_designer::voice_datasets::delete_dataset::delete_dataset_handler;
use crate::http_server::endpoints::voice_designer::voice_datasets::get_dataset::get_dataset_handler;
use crate::http_server::endpoints::voice_designer::voice_datasets::list_datasets_by_session::list_datasets_by_session_handler;
use crate::http_server::endpoints::voice_designer::voice_datasets::list_datasets_by_user::list_datasets_by_user_handler;
use crate::http_server::endpoints::voice_designer::voice_datasets::update_dataset::update_dataset_handler;
use crate::http_server::endpoints::voice_designer::voices::create_voice::create_voice_handler;
use crate::http_server::endpoints::voice_designer::voices::delete_voice::delete_voice_handler;
use crate::http_server::endpoints::voice_designer::voices::get_voice::get_voice_handler;
use crate::http_server::endpoints::voice_designer::voices::list_available_voices::list_available_voices_handler;
use crate::http_server::endpoints::voice_designer::voices::list_voices_by_session::list_voices_by_session_handler;
use crate::http_server::endpoints::voice_designer::voices::list_voices_by_user::list_voices_by_user_handler;
use crate::http_server::endpoints::voice_designer::voices::search_voices::search_voices;
use crate::http_server::endpoints::voice_designer::voices::update_voice::update_voice_handler;
use crate::http_server::endpoints::w2l::delete_w2l_result::delete_w2l_inference_result_handler;
use crate::http_server::endpoints::w2l::delete_w2l_template::delete_w2l_template_handler;
use crate::http_server::endpoints::w2l::edit_w2l_result::edit_w2l_inference_result_handler;
use crate::http_server::endpoints::w2l::edit_w2l_template::edit_w2l_template_handler;
use crate::http_server::endpoints::w2l::enqueue_infer_w2l_with_uploads::enqueue_infer_w2l_with_uploads;
use crate::http_server::endpoints::w2l::enqueue_upload_w2l_template::upload_w2l_template_handler;
use crate::http_server::endpoints::w2l::get_w2l_inference_job_status::get_w2l_inference_job_status_handler;
use crate::http_server::endpoints::w2l::get_w2l_result::get_w2l_inference_result_handler;
use crate::http_server::endpoints::w2l::get_w2l_template::get_w2l_template_handler;
use crate::http_server::endpoints::w2l::get_w2l_template_use_count::get_w2l_template_use_count_handler;
use crate::http_server::endpoints::w2l::get_w2l_upload_template_job_status::get_w2l_upload_template_job_status_handler;
use crate::http_server::endpoints::w2l::list_w2l_templates::list_w2l_templates_handler;
use crate::http_server::endpoints::w2l::set_w2l_template_mod_approval::set_w2l_template_mod_approval_handler;
use crate::http_server::endpoints::workflows::enqueue::get_inference_preview_status_ws::ws_progress_route;
use crate::http_server::routes::beta_key_routes::add_beta_key_routes;
use crate::http_server::routes::job_routes::add_job_routes;
use crate::http_server::routes::media_files_routes::add_media_file_routes;
use crate::http_server::routes::moderation_routes::add_moderator_routes;
use crate::http_server::routes::user_routes::add_user_routes;
use crate::http_server::routes::weights_routes::add_weights_routes;
use crate::http_server::routes::workflow_routes::add_workflow_routes;

pub fn add_routes<T, B> (app: App<T>, server_environment: ServerEnvironment) -> App<T>
  where
      B: MessageBody,
      T: ServiceFactory<
        ServiceRequest,
        Config = (),
        Response = ServiceResponse<B>,
        Error = Error,
        InitError = (),
      >,
{
  let mut app = add_moderator_routes(app); /* /moderation */
  app = add_user_routes(app); // /create_account, /session, /login, /logout, etc.
  app = add_tts_routes(app); /* /tts */
  app = add_w2l_routes(app); /* /w2l */
  app = add_web_vc_routes(app); /* /v1/voice_conversion */
  app = add_vocoder_routes(app); /* /vocoder */
  app = add_remote_download_routes(app); /* /v1/remote_downloads (prev. /retrieval, aka. "generic_download_jobs") */
  app = add_category_routes(app); /* /category */
  app = add_api_token_routes(app); /* /api_tokens */
  app = add_voice_clone_request_routes(app); /* /voice_clone_requests */
  app = add_investor_demo_routes(app); /* /demo_mode */ // TODO: DEFINITELY TEMPORARY
  app = add_flag_routes(app); /* /flag */
  app = add_desktop_app_routes(app); /* /v1/vc/... */
  app = add_media_file_routes(app); /* /v1/media_files/... */
  app = add_media_upload_routes(app); /* /v1/media_upload/... */
  app = add_trending_routes(app); /* /v1/trending/... */
  app = add_user_rating_routes(app); /* /v1/user_rating/... */
  app = add_featured_item_routes(app); /* /v1/featured_item/... */
  app = add_subscription_routes(app); /* /v1/subscriptions/... */
  app = add_voice_designer_routes(app); /* /v1/voice_designer */
  app = add_beta_key_routes(app); /* /v1/beta_keys */
  app = add_image_gen_routes(app);
  app = add_weights_routes(app);
  app = add_workflow_routes(app);
  app = add_job_routes(app);
  app = add_engine_routes(app); /* /v1/engine/... */

  // if server_environment == ServerEnvironment::Development {
  //
  // }

  // ==================== Comments ====================

  let mut app = RouteBuilder::from_app(app)
      .add_get("/v1/comments/list/{entity_type}/{entity_token}", list_comments_handler)
      .add_post("/v1/comments/new", create_comment_handler)
      .add_post("/v1/comments/delete/{comment_token}", delete_comment_handler)
      .into_app();

  // ==================== User Bookmarks ====================

  let mut app = RouteBuilder::from_app(app)
      .add_get("/v1/user_bookmarks/batch", batch_get_user_bookmarks_handler)
      .add_post("/v1/user_bookmarks/create", create_user_bookmark_handler)
      .add_post("/v1/user_bookmarks/delete/{user_bookmark_token}", delete_user_bookmark_handler)
      .add_get("/v1/user_bookmarks/list/session", list_user_bookmarks_for_session_handler)
      .add_get("/v1/user_bookmarks/list/user/{username}", list_user_bookmarks_for_user_handler)
      .add_get("/v1/user_bookmarks/list/entity/{entity_type}/{entity_token}", list_user_bookmarks_for_entity_handler)
      .into_app();


  // ==================== Animations ====================

  let mut app = RouteBuilder::from_app(app)
      .add_post("/v1/animation/face_animation/create", enqueue_face_animation_handler)
      .add_post("/v1/animation/rerender/create", enqueue_rerender_animation_handler)
      .into_app();

  // ==================== Mocap ========================
  let mut app = RouteBuilder::from_app(app)
      .add_post("/v1/mocap/mocapnet/create", enqueue_mocapnet_handler)
      .into_app();

  // ==================== Prompts ====================

  let mut app = RouteBuilder::from_app(app)
      .add_get("/v1/prompts/{token}", get_prompt_handler)
      .into_app();

  // ==================== Format Conversion ====================

  let mut app = RouteBuilder::from_app(app)
      .add_post("/v1/conversion/enqueue_fbx_to_gltf", enqueue_fbx_to_gltf_handler)
      .into_app();

  // =================== BVH from Workflow ====================

  // TODO(bt,2024-03-15): Migrate from "bvh_to_workflow" to "render_engine_scene"
  let mut app = RouteBuilder::from_app(app)
    .add_post("/v1/conversion/enqueue_bvh_to_workflow", enqueue_render_engine_scene_to_video_handler)
    .add_post("/v1/conversion/enqueue_render_engine_scene", enqueue_render_engine_scene_to_video_handler)
    .into_app();

  // ==================== Stats ====================

  let mut app = RouteBuilder::from_app(app)
      .add_get("/v1/stats/queues", get_unified_queue_stats_handler)
      .into_app();

  // ==================== Service Status ====================

  let mut app = RouteBuilder::from_app(app)
      .add_get("/v1/status_alert_check", status_alert_handler)
      .into_app();

  // ==================== COMPONENTS ====================

  app = add_suggested_stripe_billing_routes(app); // /stripe, billing, webhooks, etc.
 
  // ==================== SERVICE ====================
  app.service(
    web::resource("/_status")
        .route(web::get().to(get_health_check_handler))
        .route(web::head().to(|| HttpResponse::Ok()))
  )
  .service(
    web::resource("/server_info") // NB/TODO(bt,2023-01-21): Couldn't scope to /v1/, actix routing table might not like collision
        .route(web::get().to(get_public_info_handler))
        .route(web::head().to(|| HttpResponse::Ok()))
  )
  // ==================== MISC ====================
  .service(
    web::resource("/events")
        .route(web::get().to(list_events_handler))
        .route(web::head().to(|| HttpResponse::Ok()))
  )
      .service(
        web::resource("/detect_locale")
            .route(web::get().to(detect_locale_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
  .service(
    web::resource("/leaderboard")
        .route(web::get().to(leaderboard_handler))
        .route(web::head().to(|| HttpResponse::Ok()))
  )
  .service(web::resource("/")
      .route(web::get().to(get_root_index))
      .route(web::head().to(|| HttpResponse::Ok()))
  )
  .service(enable_alpha_handler)
  .service(enable_alpha_easy_handler)
  .default_service( web::route().to(default_route_404))
}


// ==================== TTS ROUTES ====================

fn add_tts_routes<T, B> (app: App<T>) -> App<T>
  where
      B: MessageBody,
      T: ServiceFactory<
        ServiceRequest,
        Config = (),
        Response = ServiceResponse<B>,
        Error = Error,
        InitError = (),
      >,
{
  // NB(bt,2024-04-03): Newer /v1/tts/* routes don't have public use, but we'll start using it
  app.service(web::resource("/v1/tts/inference")
      .route(web::post().to(enqueue_infer_tts_handler))
      .route(web::head().to(|| HttpResponse::Ok()))
  )
  // NB(bt,2024-04-03): Older root /tts/* routes should be drained of traffic. They are used in the Twitch Streamer API though.
  .service(
    web::scope("/tts")
      .service(
        web::resource("/upload")
            .route(web::post().to(upload_tts_model_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/inference")
            .route(web::post().to(enqueue_infer_tts_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/list")
            .route(web::get().to(list_tts_models_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/search")
            .route(web::post().to(search_tts_models_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/model/{token}")
            .route(web::get().to(get_tts_model_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/model/{token}/delete")
            .route(web::post().to(delete_tts_model_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/model/{model_token}/count")
            .route(web::get().to(get_tts_model_use_count_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/model/{model_token}/edit")
            .route(web::post().to(edit_tts_model_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/model/gptsovits/upload")
            .route(web::post().to(enqueue_gptsovits_model_upload_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/result/{token}")
            .route(web::get().to(get_tts_inference_result_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/result/{token}/edit")
            .route(web::post().to(edit_tts_inference_result_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/result/{token}/delete")
            .route(web::post().to(delete_tts_inference_result_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/job/{token}")
            .route(web::get().to(get_tts_inference_job_status_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/upload_model_job/{token}")
            .route(web::get().to(get_tts_upload_model_job_status_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/queue_length")
            .route(web::get().to(get_pending_tts_inference_job_count_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
  )
}

// ==================== WAV2LIP ROUTES ====================

fn add_w2l_routes<T, B> (app: App<T>) -> App<T>
  where
      B: MessageBody,
      T: ServiceFactory<
        ServiceRequest,
        Config = (),
        Response = ServiceResponse<B>,
        Error = Error,
        InitError = (),
      >,
{
  app.service(
    web::scope("/w2l")
      .service(
        web::resource("/upload")
            .route(web::post().to(upload_w2l_template_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/inference")
            .route(web::post().to(enqueue_infer_w2l_with_uploads))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/list")
            .route(web::get().to(list_w2l_templates_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/template/{token}")
            .route(web::get().to(get_w2l_template_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/template/{template_token}/count")
            .route(web::get().to(get_w2l_template_use_count_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/template/{template_token}/edit")
            .route(web::post().to(edit_w2l_template_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/template/{token}/moderate")
            .route(web::post().to(set_w2l_template_mod_approval_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/template/{token}/delete")
            .route(web::post().to(delete_w2l_template_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/result/{token}")
            .route(web::get().to(get_w2l_inference_result_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/result/{token}/edit")
            .route(web::post().to(edit_w2l_inference_result_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/result/{token}/delete")
            .route(web::post().to(delete_w2l_inference_result_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/job/{token}")
            .route(web::get().to(get_w2l_inference_job_status_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/upload_template_job/{token}")
            .route(web::get().to(get_w2l_upload_template_job_status_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
  )
}

// ==================== WEB VOICE CONVERSION ROUTES ====================

fn add_web_vc_routes<T, B> (app: App<T>) -> App<T>
  where
      B: MessageBody,
      T: ServiceFactory<
        ServiceRequest,
        Config = (),
        Response = ServiceResponse<B>,
        Error = Error,
        InitError = (),
      >,
{
  app.service(
    web::scope("/v1/voice_conversion")
        .service(
          web::resource("/inference")
              .route(web::post().to(enqueue_voice_conversion_inference_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(
          web::resource("/model_list")
              .route(web::get().to(list_voice_conversion_models_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
        )
  )
}


// ==================== VOCODER ROUTES ====================

fn add_vocoder_routes<T, B> (app: App<T>) -> App<T>
  where
      B: MessageBody,
      T: ServiceFactory<
        ServiceRequest,
        Config = (),
        Response = ServiceResponse<B>,
        Error = Error,
        InitError = (),
      >,
{
  app.service(
    web::scope("/vocoder")
        .service(
          web::resource("/list")
              .route(web::get().to(list_vocoders_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(
          web::resource("/model/{token}")
              .route(web::get().to(get_vocoder_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
        )
  )
}

// ==================== RETRIEVAL ROUTES ("GENERIC_DOWNLOAD_JOBS") ====================

fn add_remote_download_routes<T, B> (app: App<T>) -> App<T>
  where
      B: MessageBody,
      T: ServiceFactory<
        ServiceRequest,
        Config = (),
        Response = ServiceResponse<B>,
        Error = Error,
        InitError = (),
      >,
{
  RouteBuilder::from_app(app)
      // NB: These are the new route names
      .add_post("/v1/remote_download/enqueue", enqueue_generic_download_handler)
      .add_get("/v1/remote_download/job_status/{token}", get_generic_download_job_status_handler)
      // NB: These are the old, deprecated route names that should be removed
      .add_post("/retrieval/enqueue", enqueue_generic_download_handler)
      .add_get("/retrieval/job_status/{token}", get_generic_download_job_status_handler)
      .into_app()
}

// ==================== CATEGORY ROUTES ====================

fn add_category_routes<T, B> (app: App<T>) -> App<T>
  where
      B: MessageBody,
      T: ServiceFactory<
        ServiceRequest,
        Config = (),
        Response = ServiceResponse<B>,
        Error = Error,
        InitError = (),
      >,
{
  app.service(
    web::scope("/v1/category")
        .service(
          web::scope("/list")
              .service(
                web::resource("/tts")
                    .route(web::get().to(list_tts_categories_handler))
                    .route(web::head().to(|| HttpResponse::Ok()))
              )
        )
        .service(
          web::scope("/computed_assignments")
              .service(
                web::resource("/tts")
                    .route(web::get().to(list_fully_computed_assigned_tts_categories_handler))
                    .route(web::head().to(|| HttpResponse::Ok()))
              )
        )
  )
      .service(
        web::scope("/category")
        .service(
          web::resource("/create")
              .route(web::post().to(create_category_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(
          web::resource("/view/{token}")
              .route(web::get().to(get_category_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(
          web::scope("/list")
              .service(
                web::resource("/tts")
                    .route(web::get().to(list_tts_categories_handler)) // TODO: Deprecate with use of /v1* copy
                    .route(web::head().to(|| HttpResponse::Ok()))
              )
        )
        .service(
          web::scope("/assign")
              .service(
                web::resource("/tts")
                    .route(web::post().to(assign_tts_category_handler))
                    .route(web::head().to(|| HttpResponse::Ok()))
              )
        )
        .service(
          web::scope("/assignments")
              .service(
                web::resource("/tts/{token}")
                    .route(web::get().to(list_tts_model_assigned_categories_handler))
                    .route(web::head().to(|| HttpResponse::Ok()))
              )
        )
  )
}

// ==================== API TOKEN ROUTES ====================

fn add_api_token_routes<T, B> (app: App<T>) -> App<T>
  where
      B: MessageBody,
      T: ServiceFactory<
        ServiceRequest,
        Config = (),
        Response = ServiceResponse<B>,
        Error = Error,
        InitError = (),
      >,
{
  app.service(web::scope("/api_tokens")
      .service(web::resource("/create")
          .route(web::post().to(create_api_token_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/edit")
          .route(web::post().to(edit_api_token_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/{api_token}/delete")
          .route(web::post().to(delete_api_token_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/list")
          .route(web::get().to(list_api_tokens_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
  )
}

// ==================== API TOKEN ROUTES ====================

fn add_voice_clone_request_routes<T, B> (app: App<T>) -> App<T>
  where
      B: MessageBody,
      T: ServiceFactory<
        ServiceRequest,
        Config = (),
        Response = ServiceResponse<B>,
        Error = Error,
        InitError = (),
      >,
{
  app.service(web::scope("/voice_clone_requests")
      .service(web::resource("/create")
          .route(web::post().to(create_voice_clone_request_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/check")
          .route(web::post().to(check_if_voice_clone_request_submitted_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
  )
}

// ==================== INVESTOR DEMO MODE ====================

fn add_investor_demo_routes<T, B> (app: App<T>) -> App<T>
  where
      B: MessageBody,
      T: ServiceFactory<
        ServiceRequest,
        Config = (),
        Response = ServiceResponse<B>,
        Error = Error,
        InitError = (),
      >,
{
  app.service(web::scope("/demo_mode")
      .service(web::resource("/enable")
          .route(web::get().to(enable_demo_mode_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/disable")
          .route(web::get().to(disable_demo_mode_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
  )
}

// ==================== FLAG ROUTES ====================

fn add_flag_routes<T, B> (app: App<T>) -> App<T>
  where
      B: MessageBody,
      T: ServiceFactory<
        ServiceRequest,
        Config = (),
        Response = ServiceResponse<B>,
        Error = Error,
        InitError = (),
      >,
{
  app.service(web::scope("/flags")
      .service(web::scope("/design_refresh")
          .service(web::resource("/enable")
              .route(web::get().to(enable_design_refresh_flag_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/disable")
              .route(web::get().to(disable_design_refresh_flag_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
      )
  )
}

// ==================== DESKTOP APP ROUTES ====================

fn add_desktop_app_routes<T, B> (app: App<T>) -> App<T>
    where
        B: MessageBody,
        T: ServiceFactory<
            ServiceRequest,
            Config = (),
            Response = ServiceResponse<B>,
            Error = Error,
            InitError = (),
        >,
{
    app.service(web::scope("/v1/vc")
        .service(web::resource("/report_analytics")
            .route(web::post().to(post_app_analytics_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(web::resource("/news")
            .route(web::get().to(get_app_news_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(web::resource("/features")
            .route(web::get().to(get_app_plans_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(web::resource("/downloads")
            .route(web::get().to(get_app_model_downloads_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
        )
    )
}

// ==================== MEDIA UPLOAD ROUTES ====================

fn add_media_upload_routes<T, B> (app: App<T>) -> App<T>
  where
      B: MessageBody,
      T: ServiceFactory<
        ServiceRequest,
        Config = (),
        Response = ServiceResponse<B>,
        Error = Error,
        InitError = (),
      >,
{
  app.service(web::scope("/v1/media_uploads")
      .service(web::resource("/upload")
          .route(web::post().to(upload_media_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/upload_audio")
          .route(web::post().to(upload_audio_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/upload_image")
          .route(web::post().to(upload_image_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/by_session/{media_type}")
          .route(web::get().to(list_user_media_uploads_of_type_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
  )
}

// ==================== TRENDING ROUTES ====================

fn add_trending_routes<T, B> (app: App<T>) -> App<T>
  where
      B: MessageBody,
      T: ServiceFactory<
        ServiceRequest,
        Config = (),
        Response = ServiceResponse<B>,
        Error = Error,
        InitError = (),
      >,
{
  app.service(web::scope("/v1/trending")
      .service(web::resource("/tts_models")
          .route(web::get().to(list_trending_tts_models_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
  )
}
// ==================== USER RATING ROUTES ====================

fn add_user_rating_routes<T, B> (app: App<T>) -> App<T>
  where
      B: MessageBody,
      T: ServiceFactory<
        ServiceRequest,
        Config = (),
        Response = ServiceResponse<B>,
        Error = Error,
        InitError = (),
      >,
{
  app.service(web::scope("/v1/user_rating")
      .service(web::resource("/batch")
          .route(web::get().to(batch_get_user_rating_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/rate")
          .route(web::post().to(set_user_rating_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/view/{entity_type}/{entity_token}")
          .route(web::get().to(get_user_rating_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
  )
}

// ==================== FEATURED ITEM ROUTES ====================

fn add_featured_item_routes<T, B> (app: App<T>) -> App<T>
  where
      B: MessageBody,
      T: ServiceFactory<
        ServiceRequest,
        Config = (),
        Response = ServiceResponse<B>,
        Error = Error,
        InitError = (),
      >,
{
  app.service(web::scope("/v1/featured_item")
      .service(web::resource("/create")
          .route(web::post().to(create_featured_item_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/delete")
          .route(web::delete().to(delete_featured_item_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/is_featured/{entity_type}/{entity_token}")
          .route(web::get().to(get_is_featured_item_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
  )
}

// ============= SUBSCRIPTION ROUTES ===================
fn add_subscription_routes<T, B> (app: App<T>) -> App<T>
  where
      B: MessageBody,
      T: ServiceFactory<
        ServiceRequest,
        Config = (),
        Response = ServiceResponse<B>,
        Error = Error,
        InitError = (),
      >,
{
    app.service(web::scope("/v1/subscriptions")
        .service(web::resource("/unsubscribe_reason")
            .route(web::post().to(set_unsubscribe_reason_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
        )
    )
}

fn add_voice_designer_routes<T,B> (app:App<T>)-> App<T>
  where 
    B: MessageBody,
    T: ServiceFactory<
      ServiceRequest,
      Config = (),
      Response = ServiceResponse<B>,
      Error = Error,
      InitError = (),
      >,
      {
        app.service(
          web::scope("/v1/voice_designer")
              .service(
                  web::scope("/dataset")
                      .route("/create", web::post().to(create_dataset_handler))
                      .service(web::resource("/{dataset_token}/update")
                          .route(web::post().to(update_dataset_handler))
                          .route(web::head().to(|| HttpResponse::Ok()))
                      )
                      .route("/{dataset_token}", web::get().to(get_dataset_handler))
                      .route("/{dataset_token}/delete", web::delete().to(delete_dataset_handler))
                      .route("/user/{username}/list", web::get().to(list_datasets_by_user_handler))
                      .route("/session/list", web::get().to(list_datasets_by_session_handler))
              )
              .service(
                  web::scope("/voice")
                      .route("/list", web::get().to(list_available_voices_handler))
                      .route("/search", web::post().to(search_voices))
                      .route("/create", web::post().to(create_voice_handler))
                      .route("/{voice_token}", web::get().to(get_voice_handler))
                      .route("/{voice_token}/update", web::post().to(update_voice_handler))
                      .route("/{voice_token}/delete", web::delete().to(delete_voice_handler))
                      .route("/user/{username}/list", web::get().to(list_voices_by_user_handler))
                      .route("/session/list", web::get().to(list_voices_by_session_handler))
              )
              .service(
                  web::scope("/sample")
                      .route("/upload", web::post().to(upload_zs_sample_handler))
                      .route("/{sample_token}/delete", web::delete().to(delete_sample_handler))
                      .route("/dataset/{dataset_token}/list", web::get().to(list_samples_by_dataset_handler))
              )
              .service(
                  web::scope("/inference")
                      .route("/enqueue_tts", web::post().to(enqueue_tts_request))
                      .route("/enqueue_vc", web::post().to(enqueue_vc_request))
              )
      )
}


fn add_image_gen_routes<T,B> (app:App<T>)-> App<T>
    where
        B: MessageBody,
        T: ServiceFactory<
            ServiceRequest,
            Config = (),
            Response = ServiceResponse<B>,
            Error = Error,
            InitError = (),
        >,
{
  // 
    app.service(
        web::scope("/v1/image_gen")
            .service(
                web::scope("/upload")              
                    .route("/lora", web::post().to(enqueue_image_generation_request))
                    .route("/model", web::post().to(enqueue_image_generation_request))
            )
            .service(
                web::scope("/enqueue")
                    .route("/inference", web::post().to(enqueue_image_generation_request))
            )
    )
}

// ==================== Engine Routes ====================

fn add_engine_routes<T, B>(app: App<T>) -> App<T>
  where
      B: MessageBody,
      T: ServiceFactory<
        ServiceRequest,
        Config = (),
        Response = ServiceResponse<B>,
        Error = Error,
        InitError = ()
      >
{
  app.service(web::scope("/v1/engine")
      .service(web::resource("/create_scene")
          .route(web::post().to(create_scene_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/scene/{token}")
          .route(web::get().to(get_scene_handler))
          .route(web::post().to(update_scene_handler))
      )
  )
}
