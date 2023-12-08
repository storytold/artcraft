use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::{App, HttpResponse, web};
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::error::Error;

use actix_helpers::route_builder::RouteBuilder;
#[cfg(feature = "billing")]
use billing_component::default_routes::add_suggested_stripe_billing_routes;
use reusable_types::server_environment::ServerEnvironment;
use users_component::default_routes::add_suggested_api_v1_account_creation_and_session_routes;
use users_component::endpoints::edit_profile_handler::edit_profile_handler;
use users_component::endpoints::get_profile_handler::get_profile_handler;

use crate::http_server::endpoints::animation::enqueue_lipsync_animation::enqueue_lipsync_animation_handler;
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
use crate::http_server::endpoints::download_job::enqueue_generic_download::enqueue_generic_download_handler;
use crate::http_server::endpoints::download_job::get_generic_upload_job_status::get_generic_download_job_status_handler;
use crate::http_server::endpoints::events::list_events::list_events_handler;
use crate::http_server::endpoints::favorites::create_favorite_handler::create_favorite_handler;
use crate::http_server::endpoints::favorites::delete_favorite_handler::delete_favorite_handler;
use crate::http_server::endpoints::favorites::list_favorites_for_entity_handler::list_favorites_for_entity_handler;
use crate::http_server::endpoints::favorites::list_favorites_for_session_handler::list_favorites_for_session_handler;
use crate::http_server::endpoints::favorites::list_favorites_for_user_handler::list_favorites_for_user_handler;
use crate::http_server::endpoints::flags::design_refresh_flag::disable_design_refresh_flag_handler::disable_design_refresh_flag_handler;
use crate::http_server::endpoints::flags::design_refresh_flag::enable_design_refresh_flag_handler::enable_design_refresh_flag_handler;
use crate::http_server::endpoints::inference_job::get_inference_job_status::get_inference_job_status_handler;
use crate::http_server::endpoints::inference_job::get_pending_inference_job_count::get_pending_inference_job_count_handler;
use crate::http_server::endpoints::inference_job::kill_inference_jobs::kill_generic_inference_jobs_handler;
use crate::http_server::endpoints::inference_job::terminate_inference_job_handler::terminate_inference_job_handler;
use crate::http_server::endpoints::investor_demo::disable_demo_mode_handler::disable_demo_mode_handler;
use crate::http_server::endpoints::investor_demo::enable_demo_mode_handler::enable_demo_mode_handler;
use crate::http_server::endpoints::leaderboard::get_leaderboard::leaderboard_handler;
use crate::http_server::endpoints::media_files::delete_media_file::delete_media_file_handler;
use crate::http_server::endpoints::media_files::get_media_file::get_media_file_handler;
use crate::http_server::endpoints::media_files::list_media_files::list_media_files_handler;
use crate::http_server::endpoints::media_files::list_media_files_for_user::list_media_files_for_user_handler;
use crate::http_server::endpoints::media_uploads::list_user_media_uploads_of_type::list_user_media_uploads_of_type_handler;
use crate::http_server::endpoints::media_uploads::upload_audio::upload_audio_handler;
use crate::http_server::endpoints::media_uploads::upload_image::upload_image_handler;
use crate::http_server::endpoints::media_uploads::upload_media::upload_media_handler;
use crate::http_server::endpoints::misc::default_route_404::default_route_404;
use crate::http_server::endpoints::misc::detect_locale_handler::detect_locale_handler;
use crate::http_server::endpoints::misc::enable_alpha_easy_handler::enable_alpha_easy_handler;
use crate::http_server::endpoints::misc::enable_alpha_handler::enable_alpha_handler;
use crate::http_server::endpoints::misc::root_index::get_root_index;
use crate::http_server::endpoints::moderation::approval::pending_w2l_templates::get_pending_w2l_templates_handler;
use crate::http_server::endpoints::moderation::categories::delete_category::delete_category_handler;
use crate::http_server::endpoints::moderation::categories::edit_category::edit_category_handler;
use crate::http_server::endpoints::moderation::categories::list_tts_categories_for_moderation::list_tts_categories_for_moderation_handler;
use crate::http_server::endpoints::moderation::ip_bans::add_ip_ban::add_ip_ban_handler;
use crate::http_server::endpoints::moderation::ip_bans::delete_ip_ban::delete_ip_ban_handler;
use crate::http_server::endpoints::moderation::ip_bans::get_ip_ban::get_ip_ban_handler;
use crate::http_server::endpoints::moderation::ip_bans::list_ip_bans::list_ip_bans_handler;
use crate::http_server::endpoints::moderation::jobs::get_tts_inference_queue_count::get_tts_inference_queue_count_handler;
use crate::http_server::endpoints::moderation::jobs::get_w2l_inference_queue_count::get_w2l_inference_queue_count_handler;
use crate::http_server::endpoints::moderation::jobs::kill_tts_inference_jobs::kill_tts_inference_jobs_handler;
use crate::http_server::endpoints::moderation::stats::get_on_prem_worker_stats::get_on_prem_worker_stats_handler;
use crate::http_server::endpoints::moderation::stats::get_voice_count_stats::get_voice_count_stats_handler;
use crate::http_server::endpoints::moderation::user_bans::ban_user::ban_user_handler;
use crate::http_server::endpoints::moderation::user_bans::list_banned_users::list_banned_users_handler;
use crate::http_server::endpoints::moderation::user_roles::list_roles::list_user_roles_handler;
use crate::http_server::endpoints::moderation::user_roles::list_staff::list_staff_handler;
use crate::http_server::endpoints::moderation::user_roles::set_user_role::set_user_role_handler;
use crate::http_server::endpoints::moderation::users::list_users::list_users_handler;
use crate::http_server::endpoints::service::health_check_handler::get_health_check_handler;
use crate::http_server::endpoints::service::public_info_handler::get_public_info_handler;
use crate::http_server::endpoints::stats::get_unified_queue_stats::get_unified_queue_stats_handler;
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
use crate::http_server::endpoints::tts::enqueue_infer_tts_handler::enqueue_infer_tts_handler::enqueue_infer_tts_handler;
use crate::http_server::endpoints::tts::enqueue_upload_tts_model::upload_tts_model_handler;
use crate::http_server::endpoints::tts::get_pending_tts_inference_job_count::get_pending_tts_inference_job_count_handler;
use crate::http_server::endpoints::tts::get_tts_inference_job_status::get_tts_inference_job_status_handler;
use crate::http_server::endpoints::tts::get_tts_model::get_tts_model_handler;
use crate::http_server::endpoints::tts::get_tts_model_use_count::get_tts_model_use_count_handler;
use crate::http_server::endpoints::tts::get_tts_result::get_tts_inference_result_handler;
use crate::http_server::endpoints::tts::get_tts_upload_model_job_status::get_tts_upload_model_job_status_handler;
use crate::http_server::endpoints::tts::list_tts_models::list_tts_models_handler;
use crate::http_server::endpoints::tts::list_user_tts_inference_results::list_user_tts_inference_results_handler;
use crate::http_server::endpoints::tts::list_user_tts_models::list_user_tts_models_handler;
use crate::http_server::endpoints::tts::search_tts_models_handler::search_tts_models_handler;
use crate::http_server::endpoints::twitch::event_rules::create_event_rule::create_twitch_event_rule_handler;
use crate::http_server::endpoints::twitch::event_rules::delete_event_rule::delete_twitch_event_rule_handler;
use crate::http_server::endpoints::twitch::event_rules::edit_event_rule::edit_twitch_event_rule_handler;
use crate::http_server::endpoints::twitch::event_rules::get_event_rule::get_twitch_event_rule_for_user_handler;
use crate::http_server::endpoints::twitch::event_rules::list_event_rules_for_user::list_twitch_event_rules_for_user_handler;
use crate::http_server::endpoints::twitch::event_rules::reorder_twitch_event_rules::reorder_twitch_event_rules_handler;
use crate::http_server::endpoints::twitch::oauth::check_oauth_status::check_oauth_status_handler;
use crate::http_server::endpoints::twitch::oauth::oauth_begin_json::oauth_begin_enroll_json;
use crate::http_server::endpoints::twitch::oauth::oauth_begin_redirect::oauth_begin_enroll_redirect;
use crate::http_server::endpoints::twitch::oauth::oauth_end::oauth_end_enroll_from_redirect;
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
use crate::http_server::endpoints::w2l::list_user_w2l_inference_results::list_user_w2l_inference_results_handler;
use crate::http_server::endpoints::w2l::list_user_w2l_templates::list_user_w2l_templates_handler;
use crate::http_server::endpoints::w2l::list_w2l_templates::list_w2l_templates_handler;
use crate::http_server::endpoints::w2l::set_w2l_template_mod_approval::set_w2l_template_mod_approval_handler;

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
  app = add_tts_routes(app); /* /tts */
  app = add_w2l_routes(app); /* /w2l */
  app = add_web_vc_routes(app); /* /v1/voice_conversion */
  app = add_vocoder_routes(app); /* /vocoder */
  app = add_remote_download_routes(app); /* /v1/remote_downloads (prev. /retrieval, aka. "generic_download_jobs") */
  app = add_category_routes(app); /* /category */
  app = add_user_profile_routes(app); /* /user */
  app = add_api_token_routes(app); /* /api_tokens */
  app = add_voice_clone_request_routes(app); /* /voice_clone_requests */
  app = add_twitch_routes(app); /* /twitch */ // TODO: MAYBE TEMPORARY
  app = add_investor_demo_routes(app); /* /demo_mode */ // TODO: DEFINITELY TEMPORARY
  app = add_flag_routes(app); /* /flag */
  app = add_desktop_app_routes(app); /* /v1/vc/... */
  app = add_media_file_routes(app); /* /v1/media_files/... */
  app = add_media_upload_routes(app); /* /v1/media_upload/... */
  app = add_trending_routes(app); /* /v1/trending/... */
  app = add_user_rating_routes(app); /* /v1/user_rating/... */
  app = add_subscription_routes(app); /* /v1/subscriptions/... */
  app = add_voice_designer_routes(app); /* /v1/voice_designer */

  // ==================== Comments ====================

  let mut app = RouteBuilder::from_app(app)
      .add_get("/v1/comments/list/{entity_type}/{entity_token}", list_comments_handler)
      .add_post("/v1/comments/new", create_comment_handler)
      .add_post("/v1/comments/delete/{comment_token}", delete_comment_handler)
      .into_app();

  // ==================== Favorites ====================

  let mut app = RouteBuilder::from_app(app)
      .add_post("/v1/favorites/create", create_favorite_handler)
      .add_post("/v1/favorites/delete/{favorite_token}", delete_favorite_handler)
      .add_get("/v1/favorites/list/session", list_favorites_for_session_handler)
      .add_get("/v1/favorites/list/user/{username}", list_favorites_for_user_handler)
      .add_get("/v1/favorites/list/entity/{entity_type}/{entity_token}", list_favorites_for_entity_handler)
      .into_app();

  // ==================== Animations ====================

  let mut app = RouteBuilder::from_app(app)
      .add_post("/v1/animation/face_animation/create", enqueue_lipsync_animation_handler)
      .into_app();

  // ==================== "Generic" Inference ====================

  let mut app = RouteBuilder::from_app(app)
      .add_get("/v1/model_inference/job_status/{token}", get_inference_job_status_handler)
      .add_delete("/v1/model_inference/job/{token}", terminate_inference_job_handler, true)
      .add_get("/v1/model_inference/queue_length", get_pending_inference_job_count_handler)
      .into_app();

  // ==================== Stats ====================


  let mut app = RouteBuilder::from_app(app)
      .add_get("/v1/stats/queues", get_unified_queue_stats_handler)
      .into_app();

  // ==================== COMPONENTS ====================
  app = add_suggested_api_v1_account_creation_and_session_routes(app); // /create_account, /session, /login, /logout

  #[cfg(feature = "billing")]
  let mut app = add_suggested_stripe_billing_routes(app); // /stripe, billing, webhooks, etc.

  #[cfg(not(feature = "billing"))]
  let mut app = app;

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

// ==================== MODERATOR ROUTES ====================

fn add_moderator_routes<T, B> (app: App<T>) -> App<T>
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
  web::scope("/moderation")
      .service(
        web::resource("/staff")
            .route(web::get().to(list_staff_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::scope("/ip_bans")
            .service(
              web::resource("/list")
                  .route(web::get().to(list_ip_bans_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
            )
            .service(
              web::resource("/add")
                  .route(web::post().to(add_ip_ban_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
            )
            .service(
              web::resource("/{ip_address}")
                  .route(web::get().to(get_ip_ban_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
            )
            .service(
              web::resource("/{ip_address}/delete")
                  .route(web::post().to(delete_ip_ban_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
            )
      )
      .service(
        web::scope("/user")
            .service(
              web::resource("/list")
                  .route(web::get().to(list_users_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
            )
      )
      .service(
        web::scope("/user_bans")
            .service(
              web::resource("/list")
                  .route(web::get().to(list_banned_users_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
            )
            .service(
              web::resource("/manage_ban")
                  .route(web::post().to(ban_user_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
            )
      )
      .service(
        web::scope("/roles")
            .service(
              web::resource("/list")
                  .route(web::get().to(list_user_roles_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
            )
            .service(
              web::resource("/{username}/edit")
                  .route(web::post().to(set_user_role_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
            )
      )
      .service(
        web::scope("/jobs")
            .service(
              web::resource("/tts_inference_queue_stats")
                  .route(web::get().to(get_tts_inference_queue_count_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
            )
            .service(
              web::resource("/kill_tts_inference_jobs")
                  .route(web::post().to(kill_tts_inference_jobs_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
            )
            .service(
              web::resource("/w2l_inference_queue_stats")
                  .route(web::get().to(get_w2l_inference_queue_count_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
            )
            .service(
              web::resource("/kill_generic")
                  .route(web::post().to(kill_generic_inference_jobs_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
            )
      )
      .service(
        web::scope("/pending")
            .service(
              web::resource("/w2l_templates")
                  .route(web::get().to(get_pending_w2l_templates_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
            )
            .service(
              web::resource("/w2l_inference_queue_stats")
                  .route(web::get().to(get_w2l_inference_queue_count_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
            )
      )
      .service(
        web::scope("/stats")
            .service(
              web::resource("/tts_voices")
                  .route(web::get().to(get_voice_count_stats_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
            )
            .service(
              web::resource("/on_prem_workers")
                  .route(web::get().to(get_on_prem_worker_stats_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
            )
      )
      .service(
        web::scope("/categories")
            .service(
              web::resource("/{token}/edit")
                  .route(web::post().to(edit_category_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
            )
            .service(
              web::resource("/{token}/delete")
                  .route(web::post().to(delete_category_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
            )
            .service(
              web::resource("/tts/list")
                  .route(web::get().to(list_tts_categories_for_moderation_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
            )
      )
  )
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
  app.service(
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
        //.service(
        //  web::resource("/upload")
        //      .route(web::post().to(upload_w2l_template_handler))
        //      .route(web::head().to(|| HttpResponse::Ok()))
        //)
        //.service(
        //  web::resource("/template/{token}")
        //      .route(web::get().to(get_w2l_template_handler))
        //      .route(web::head().to(|| HttpResponse::Ok()))
        //)
        //.service(
        //  web::resource("/template/{template_token}/count")
        //      .route(web::get().to(get_w2l_template_use_count_handler))
        //      .route(web::head().to(|| HttpResponse::Ok()))
        //)
        //.service(
        //  web::resource("/template/{template_token}/edit")
        //      .route(web::post().to(edit_w2l_template_handler))
        //      .route(web::head().to(|| HttpResponse::Ok()))
        //)
        //.service(
        //  web::resource("/template/{token}/moderate")
        //      .route(web::post().to(set_w2l_template_mod_approval_handler))
        //      .route(web::head().to(|| HttpResponse::Ok()))
        //)
        //.service(
        //  web::resource("/template/{token}/delete")
        //      .route(web::post().to(delete_w2l_template_handler))
        //      .route(web::head().to(|| HttpResponse::Ok()))
        //)
        //.service(
        //  web::resource("/result/{token}")
        //      .route(web::get().to(get_w2l_inference_result_handler))
        //      .route(web::head().to(|| HttpResponse::Ok()))
        //)
        //.service(
        //  web::resource("/result/{token}/edit")
        //      .route(web::post().to(edit_w2l_inference_result_handler))
        //      .route(web::head().to(|| HttpResponse::Ok()))
        //)
        //.service(
        //  web::resource("/result/{token}/delete")
        //      .route(web::post().to(delete_w2l_inference_result_handler))
        //      .route(web::head().to(|| HttpResponse::Ok()))
        //)
        //.service(
        //  web::resource("/job/{token}")
        //      .route(web::get().to(get_w2l_inference_job_status_handler))
        //      .route(web::head().to(|| HttpResponse::Ok()))
        //)
        //.service(
        //  web::resource("/upload_template_job/{token}")
        //      .route(web::get().to(get_w2l_upload_template_job_status_handler))
        //      .route(web::head().to(|| HttpResponse::Ok()))
        //)
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
        //.service(
        //  web::resource("/model/{token}/edit")
        //      .route(web::post().to(edit_w2l_template_handler))
        //      .route(web::head().to(|| HttpResponse::Ok()))
        //)
        //.service(
        //  web::resource("/model/{token}/delete")
        //      .route(web::post().to(delete_w2l_template_handler))
        //      .route(web::head().to(|| HttpResponse::Ok()))
        //)
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

// ==================== USER PROFILE ROUTES ====================

fn add_user_profile_routes<T, B> (app: App<T>) -> App<T>
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
  web::scope("/user")
      .service(
        web::resource("/{username}/profile")
            .route(web::get().to(get_profile_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/{username}/edit_profile")
            .route(web::post().to(edit_profile_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/{username}/tts_models")
            .route(web::get().to(list_user_tts_models_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/{username}/tts_results")
            .route(web::get().to(list_user_tts_inference_results_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/{username}/w2l_templates")
            .route(web::get().to(list_user_w2l_templates_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/{username}/w2l_results")
            .route(web::get().to(list_user_w2l_inference_results_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
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

// ==================== MEDIA FILE ROUTES ====================

fn add_media_file_routes<T, B> (app: App<T>) -> App<T>
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
  app.service(web::scope("/v1/media_files")
      .service(web::resource("/file/{token}")
          .route(web::get().to(get_media_file_handler))
          .route(web::delete().to(delete_media_file_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/list")
          .route(web::get().to(list_media_files_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/list/user/{username}")
          .route(web::get().to(list_media_files_for_user_handler))
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

// ==================== TWITCH ROUTES ====================

// TODO: Maybe move these into an "oauth-gateway" type http service.
//  We'll want the domain to have reputation and not confuse people.
//  It'll also be nice to accrue all oauth things here.
fn add_twitch_routes<T, B> (app: App<T>) -> App<T>
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
  // TODO: Move oauth endpoints under /twitch/oauth (requires updating Twitch configs too.)
  app.service(web::scope("/twitch")
    .service(web::scope("/oauth")
        .service(web::resource("/enroll_json")
            .route(web::get().to(oauth_begin_enroll_json))
            .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(web::resource("/enroll_redirect_begin")
            .route(web::get().to(oauth_begin_enroll_redirect))
            .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(web::resource("/enroll_redirect_landing")
            .route(web::get().to(oauth_end_enroll_from_redirect))
            .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(web::resource("/check")
            .route(web::get().to(check_oauth_status_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
        )
    )
    .service(web::scope("/event_rule")
        .service(web::resource("/create")
            .route(web::post().to(create_twitch_event_rule_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(web::resource("/reorder")
            .route(web::post().to(reorder_twitch_event_rules_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(web::resource("/list")
            .route(web::get().to(list_twitch_event_rules_for_user_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(web::resource("/{token}/info")
            .route(web::get().to(get_twitch_event_rule_for_user_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(web::resource("/{token}/update")
            .route(web::post().to(edit_twitch_event_rule_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(web::resource("/{token}/delete")
            .route(web::delete().to(delete_twitch_event_rule_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
        )
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

