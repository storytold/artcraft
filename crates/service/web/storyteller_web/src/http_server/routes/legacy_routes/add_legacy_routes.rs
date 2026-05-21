use crate::http_server::deprecated_endpoints::animation::enqueue_face_animation::enqueue_face_animation_handler;
use crate::http_server::deprecated_endpoints::animation::enqueue_rerender_animation::enqueue_rerender_animation_handler;
use crate::http_server::deprecated_endpoints::api_tokens::create_api_token::create_api_token_handler;
use crate::http_server::deprecated_endpoints::api_tokens::delete_api_token::delete_api_token_handler;
use crate::http_server::deprecated_endpoints::api_tokens::edit_api_token::edit_api_token_handler;
use crate::http_server::deprecated_endpoints::api_tokens::list_api_tokens::list_api_tokens_handler;
use crate::http_server::deprecated_endpoints::categories::create_category::create_category_handler;
use crate::http_server::deprecated_endpoints::categories::get_category::get_category_handler;
use crate::http_server::deprecated_endpoints::categories::tts::assign_tts_category::assign_tts_category_handler;
use crate::http_server::deprecated_endpoints::categories::tts::list_fully_computed_assigned_tts_categories::list_fully_computed_assigned_tts_categories::list_fully_computed_assigned_tts_categories_handler;
use crate::http_server::deprecated_endpoints::categories::tts::list_tts_categories::list_tts_categories_handler;
use crate::http_server::deprecated_endpoints::categories::tts::list_tts_model_assigned_categories::list_tts_model_assigned_categories_handler;
use crate::http_server::deprecated_endpoints::conversion::enqueue_fbx_to_gltf_handler::enqueue_fbx_to_gltf_handler;
use crate::http_server::deprecated_endpoints::conversion::enqueue_render_engine_scene_to_video_handler::enqueue_render_engine_scene_to_video_handler;
use crate::http_server::deprecated_endpoints::engine::create_scene_handler::create_scene_handler;
use crate::http_server::deprecated_endpoints::engine::get_scene_handler::get_scene_handler;
use crate::http_server::deprecated_endpoints::engine::update_scene_handler::update_scene_handler;
use crate::http_server::deprecated_endpoints::events::list_events::list_events_handler;
use crate::http_server::deprecated_endpoints::flags::design_refresh_flag::disable_design_refresh_flag_handler::disable_design_refresh_flag_handler;
use crate::http_server::deprecated_endpoints::flags::design_refresh_flag::enable_design_refresh_flag_handler::enable_design_refresh_flag_handler;
use crate::http_server::deprecated_endpoints::investor_demo::disable_demo_mode_handler::disable_demo_mode_handler;
use crate::http_server::deprecated_endpoints::investor_demo::enable_demo_mode_handler::enable_demo_mode_handler;
use crate::http_server::deprecated_endpoints::leaderboard::get_leaderboard::leaderboard_handler;
use crate::http_server::deprecated_endpoints::media_uploads::list_user_media_uploads_of_type::list_user_media_uploads_of_type_handler;
use crate::http_server::deprecated_endpoints::media_uploads::upload_audio::upload_audio_handler;
use crate::http_server::deprecated_endpoints::media_uploads::upload_image::upload_image_handler;
use crate::http_server::deprecated_endpoints::media_uploads::upload_media::upload_media_handler;
use crate::http_server::deprecated_endpoints::mocap::enqueue_mocapnet::enqueue_mocapnet_handler;
use crate::http_server::deprecated_endpoints::vocoders::get_vocoder::get_vocoder_handler;
use crate::http_server::deprecated_endpoints::vocoders::list_vocoders::list_vocoders_handler;
use crate::http_server::endpoints::app_state::get_app_state_handler::get_app_state_handler;
use crate::http_server::endpoints::download_job::enqueue_generic_download::enqueue_generic_download_handler;
use crate::http_server::endpoints::download_job::get_generic_upload_job_status::get_generic_download_job_status_handler;
use crate::http_server::endpoints::misc::enable_alpha_easy_handler::enable_alpha_easy_handler;
use crate::http_server::endpoints::misc::enable_alpha_handler::enable_alpha_handler;
use crate::http_server::endpoints::stats::get_unified_queue_stats_handler::get_unified_queue_stats_handler;
use crate::http_server::endpoints::trending::list_trending_tts_models::list_trending_tts_models_handler;
use crate::http_server::endpoints::voice_clone_requests::check_if_voice_clone_request_submitted::check_if_voice_clone_request_submitted_handler;
use crate::http_server::endpoints::voice_clone_requests::create_voice_clone_request::create_voice_clone_request_handler;
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
use crate::http_server::routes::legacy_routes::beta_key_routes::add_beta_key_routes;
use crate::http_server::routes::legacy_routes::desktop_vc_app_routes::add_desktop_vc_app_routes;
use crate::http_server::routes::legacy_routes::image_studio_routes::add_image_studio_routes;
use crate::http_server::routes::legacy_routes::model_download_routes::add_model_download_routes;
use crate::http_server::routes::legacy_routes::studio_gen2_routes::add_studio_gen2_routes;
use crate::http_server::routes::legacy_routes::tts_routes::add_tts_routes;
use crate::http_server::routes::legacy_routes::voice_conversion_routes::add_voice_conversion_routes;
use crate::http_server::routes::legacy_routes::workflow_routes::add_workflow_routes;
use actix_helpers::route_builder::RouteBuilder;
use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::error::Error;
use actix_web::{web, App, HttpResponse};

pub fn add_legacy_routes<T, B> (app: App<T>) -> App<T>
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
  let mut app = add_vocoder_routes(app); // /vocoder
  app = add_remote_download_routes(app); // /v1/remote_downloads (prev. /retrieval, aka. "generic_download_jobs")
  app = add_category_routes(app); // /category
  app = add_api_token_routes(app); // /api_tokens
  app = add_voice_clone_request_routes(app); // /voice_clone_requests
  app = add_investor_demo_routes(app); // /demo_mode // TODO: DEFINITELY TEMPORARY
  app = add_flag_routes(app); // /flag
  app = add_voice_designer_routes(app); // /v1/voice_designer
  app = add_beta_key_routes(app); // /v1/beta_keys
  app = add_model_download_routes(app);
  app = add_studio_gen2_routes(app);
  app = add_image_studio_routes(app);
  app = add_workflow_routes(app);
  app = add_engine_routes(app); // /v1/engine/...
  app = add_desktop_vc_app_routes(app); // /v1/vc/...
  app = add_media_upload_routes(app); // /v1/media_upload/...
  app = add_trending_routes(app); // /v1/trending/...

  // Remaining FakeYou surface area
  app = add_tts_routes(app); // /tts
  app = add_voice_conversion_routes(app); // /v1/voice_conversion

  // ==================== Animations ====================

  let mut app = RouteBuilder::from_app(app)
      .add_post("/v1/animation/face_animation/create", enqueue_face_animation_handler)
      .add_post("/v1/animation/rerender/create", enqueue_rerender_animation_handler)
      .into_app();

  // ==================== Mocap ========================
  let mut app = RouteBuilder::from_app(app)
      .add_post("/v1/mocap/mocapnet/create", enqueue_mocapnet_handler)
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

  let app = app.service(web::resource("/leaderboard")
      .route(web::get().to(leaderboard_handler))
      .route(web::head().to(|| HttpResponse::Ok()))
  );

  // ==================== FakeYou Frontend Application State ====================

  let mut app = RouteBuilder::from_app(app)
      .add_get("/v1/app_state", get_app_state_handler)
      .into_app();

  // ==================== Stats ====================

  let mut app = RouteBuilder::from_app(app)
      .add_get("/v1/stats/queues", get_unified_queue_stats_handler)
      .into_app();

  let app = app.service(
    web::resource("/events")
      .route(web::get().to(list_events_handler))
      .route(web::head().to(|| HttpResponse::Ok()))
  );
  
  let app = app
      .service(enable_alpha_handler)
      .service(enable_alpha_easy_handler);

  app
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

//fn add_image_gen_routes<T,B> (app:App<T>)-> App<T>
//    where
//        B: MessageBody,
//        T: ServiceFactory<
//            ServiceRequest,
//            Config = (),
//            Response = ServiceResponse<B>,
//            Error = Error,
//            InitError = (),
//        >,
//{
//  //
//    app.service(
//        web::scope("/v1/image_gen")
//            .service(
//                web::scope("/upload")
//                    .route("/lora", web::post().to(enqueue_image_generation_request))
//                    .route("/model", web::post().to(enqueue_image_generation_request))
//            )
//            .service(
//                web::scope("/enqueue")
//                    .route("/inference", web::post().to(enqueue_image_generation_request))
//            )
//    )
//}

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

