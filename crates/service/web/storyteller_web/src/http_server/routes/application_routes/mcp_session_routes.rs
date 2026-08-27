use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::{web, App, Error, HttpResponse};

use crate::http_server::endpoints::mcp_sessions::create_mcp_session_handler::create_mcp_session_handler;
use crate::http_server::endpoints::mcp_sessions::delete_mcp_session_handler::delete_mcp_session_handler;
use crate::http_server::endpoints::mcp_sessions::list_mcp_sessions_handler::list_mcp_sessions_handler;
use crate::http_server::endpoints::mcp_sessions::refresh_mcp_session_handler::refresh_mcp_session_handler;
use crate::http_server::endpoints::mcp_sessions::revoke_mcp_session_handler::revoke_mcp_session_handler;

pub fn add_mcp_session_routes<T, B>(app: App<T>) -> App<T>
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
    web::scope("/v1/mcp/session")
      // NB: Static routes are registered BEFORE the dynamic `/{token}/delete`
      // route so they take precedence. Session tokens are always `mcp_…`, so
      // they can never collide with these literals anyway.
      .service(
        web::resource("/create")
          .route(web::post().to(create_mcp_session_handler))
          .route(web::head().to(|| HttpResponse::Ok())),
      )
      .service(
        web::resource("/refresh")
          .route(web::post().to(refresh_mcp_session_handler))
          .route(web::head().to(|| HttpResponse::Ok())),
      )
      .service(
        web::resource("/revoke")
          .route(web::post().to(revoke_mcp_session_handler))
          .route(web::head().to(|| HttpResponse::Ok())),
      )
      .service(
        web::resource("/list")
          .route(web::get().to(list_mcp_sessions_handler))
          .route(web::head().to(|| HttpResponse::Ok())),
      )
      .service(
        web::resource("/{token}/delete")
          .route(web::post().to(delete_mcp_session_handler))
          .route(web::head().to(|| HttpResponse::Ok())),
      ),
  )
}
