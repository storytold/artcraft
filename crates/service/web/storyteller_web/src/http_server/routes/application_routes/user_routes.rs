//! These routes are recommended, but do not have to be used by consumers of the user system.
use actix_web::body::MessageBody;
use actix_web::dev::{ServiceFactory, ServiceRequest, ServiceResponse};
use actix_web::error::Error;
use actix_web::{web, App, HttpResponse};

use crate::http_server::endpoints::tts::list_user_tts_inference_results::list_user_tts_inference_results_handler;
use crate::http_server::endpoints::tts::list_user_tts_models::list_user_tts_models_handler;
use crate::http_server::endpoints::users::change_password_handler::change_password_handler;
use crate::http_server::endpoints::users::create_account_handler::create_account_handler;
use crate::http_server::endpoints::users::edit_email_handler::edit_email_handler;
use crate::http_server::endpoints::users::edit_profile_handler::edit_profile_handler;
use crate::http_server::endpoints::users::edit_username_handler::edit_username_handler;
use crate::http_server::endpoints::users::get_profile_handler::get_profile_handler;
use crate::http_server::endpoints::users::google_sso::google_sso_handler::google_sso_handler;
use crate::http_server::endpoints::users::login_handler::login_handler;
use crate::http_server::endpoints::users::logout_handler::logout_handler;
use crate::http_server::endpoints::users::password_reset_redeem_handler::password_reset_redeem_handler;
use crate::http_server::endpoints::users::password_reset_request_handler::password_reset_request_handler;
use crate::http_server::endpoints::users::session_info_handler::session_info_handler;
use crate::http_server::endpoints::users::session_token_info_handler::session_token_info_handler;

pub fn add_user_routes<T, B> (app: App<T>) -> App<T>
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
  app
      .service(
        // TODO(bt,2022-11-16): non-/v1/ endpoints are deprecated and subject for future removal
        web::resource("/create_account")
            .route(web::post().to(create_account_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/v1/create_account")
            .route(web::post().to(create_account_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/v1/accounts/google_sso")
            .route(web::post().to(google_sso_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        // TODO(bt,2022-11-16): non-/v1/ endpoints are deprecated and subject for future removal
        web::resource("/login")
            .route(web::post().to(login_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
          web::resource("/v1/login")
              .route(web::post().to(login_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        // TODO(bt,2022-11-16): non-/v1/ endpoints are deprecated and subject for future removal
        web::resource("/logout")
            .route(web::post().to(logout_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
          web::resource("/v1/logout")
              .route(web::post().to(logout_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        // TODO(bt,2022-11-16): non-/v1/ endpoints are deprecated and subject for future removal
        web::resource("/session")
            .route(web::get().to(session_info_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
          web::resource("/v1/session")
              .route(web::get().to(session_info_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/v1/session_token")
            .route(web::get().to(session_token_info_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/v1/password_reset/request")
          .route(web::post().to(password_reset_request_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(
        web::resource("/v1/password_reset/redeem")
            .route(web::post().to(password_reset_redeem_handler))
            .route(web::head().to(|| HttpResponse::Ok()))
      )

      // NB(bt): Modern user profile routes
      .service(web::scope("/v1/user")
          .service(
            web::resource("/change_password")
                .route(web::post().to(change_password_handler))
                .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(
            web::resource("/edit_email")
                .route(web::post().to(edit_email_handler))
                .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(
            web::resource("/edit_username")
                .route(web::post().to(edit_username_handler))
                .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/{username}/profile")
              .route(web::get().to(get_profile_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(
            web::resource("/{username}/edit_profile")
                .route(web::post().to(edit_profile_handler))
                .route(web::head().to(|| HttpResponse::Ok()))
          )
      )
      // NB(bt): Legacy user profile routes
      .service(web::scope("/user")
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
          // NB: Removed endpoint
          .service(
            web::resource("/{username}/tts_models")
                .route(web::get().to(list_user_tts_models_handler))
                .route(web::head().to(|| HttpResponse::Ok()))
          )
          // NB: Removed endpoint
          .service(
            web::resource("/{username}/tts_results")
                .route(web::get().to(list_user_tts_inference_results_handler))
                .route(web::head().to(|| HttpResponse::Ok()))
          )
      )
}
