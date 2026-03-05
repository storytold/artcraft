use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::{web, App, Error, HttpResponse};

use crate::http_server::deprecated_endpoints::moderation::approval::pending_w2l_templates::get_pending_w2l_templates_handler;
use crate::http_server::deprecated_endpoints::moderation::categories::delete_category::delete_category_handler;
use crate::http_server::deprecated_endpoints::moderation::categories::edit_category::edit_category_handler;
use crate::http_server::deprecated_endpoints::moderation::categories::list_tts_categories_for_moderation::list_tts_categories_for_moderation_handler;
use crate::http_server::deprecated_endpoints::moderation::stats::get_on_prem_worker_stats::get_on_prem_worker_stats_handler;
use crate::http_server::deprecated_endpoints::moderation::stats::get_voice_count_stats::get_voice_count_stats_handler;
use crate::http_server::deprecated_endpoints::moderation::user_roles::list_roles::list_user_roles_handler;
use crate::http_server::deprecated_endpoints::moderation::user_roles::list_staff::list_staff_handler;
use crate::http_server::deprecated_endpoints::moderation::user_roles::set_user_role::set_user_role_handler;
use crate::http_server::deprecated_endpoints::moderation::users::list_users::list_users_handler;
use crate::http_server::endpoints::inference_job::admin::kill_inference_jobs_handler::kill_generic_inference_jobs_handler;
use crate::http_server::endpoints::moderation::info::moderator_token_info_handler::moderator_get_token_info_handler;
use crate::http_server::endpoints::moderation::ip_bans::add_ip_ban::add_ip_ban_handler;
use crate::http_server::endpoints::moderation::ip_bans::delete_ip_ban::delete_ip_ban_handler;
use crate::http_server::endpoints::moderation::ip_bans::get_ip_ban::get_ip_ban_handler;
use crate::http_server::endpoints::moderation::ip_bans::list_ip_bans::list_ip_bans_handler;
use crate::http_server::endpoints::moderation::jobs::get_tts_inference_queue_count::get_tts_inference_queue_count_handler;
use crate::http_server::endpoints::moderation::jobs::get_w2l_inference_queue_count::get_w2l_inference_queue_count_handler;
use crate::http_server::endpoints::moderation::jobs::kill_tts_inference_jobs::kill_tts_inference_jobs_handler;
use crate::http_server::endpoints::moderation::user_bans::ban_user::ban_user_handler;
use crate::http_server::endpoints::moderation::user_bans::list_banned_users::list_banned_users_handler;
use crate::http_server::endpoints::moderation::user::moderator_user_lookup_by_stripe_customer_id_handler::moderator_user_lookup_by_stripe_customer_id_handler;
use crate::http_server::endpoints::moderation::user::moderator_user_lookup_handler::moderator_user_lookup_handler;
use crate::http_server::endpoints::moderation::user_feature_flags::edit_user_feature_flags_handler::edit_user_feature_flags_handler;

pub fn add_moderator_routes<T, B> (app: App<T>) -> App<T>
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
  app.service(web::scope("/v1/moderation")
        .service(web::resource("/user_feature_flags/{username_or_token}")
            .route(web::post().to(edit_user_feature_flags_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(web::scope("/users")
            .service(web::resource("/lookup")
                .route(web::post().to(moderator_user_lookup_handler))
                .route(web::head().to(|| HttpResponse::Ok()))
            )
            .service(web::resource("/lookup_by_stripe_customer_id")
                .route(web::post().to(moderator_user_lookup_by_stripe_customer_id_handler))
                .route(web::head().to(|| HttpResponse::Ok()))
            )
        )
      )
      .service(web::scope("/moderation")
        .service(web::resource("/staff")
            .route(web::get().to(list_staff_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(web::resource("/token_info/{token}")
            .route(web::get().to(moderator_get_token_info_handler))
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
