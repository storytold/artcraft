use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::{web, App, Error, HttpResponse};

use crate::http_server::endpoints::omni_api::generate::image::omni_api_image_generate_handler::omni_api_image_generate_handler;
use crate::http_server::endpoints::omni_api::generate::video::omni_api_video_generate_handler::omni_api_video_generate_handler;
use crate::http_server::endpoints::omni_api::upload::omni_upload_audio_media_file_handler::omni_upload_audio_media_file_handler;
use crate::http_server::endpoints::omni_api::upload::omni_upload_image_media_file_handler::omni_upload_image_media_file_handler;
use crate::http_server::endpoints::omni_api::upload::omni_upload_video_media_file_handler::omni_upload_video_media_file_handler;

/// API-key authenticated generation endpoints. These mirror `/v1/omni_gen/generate/*` but read the
/// caller's identity from the `Authorization` header API key instead of a session cookie. The
/// `cost` and `models` endpoints are not duplicated here — they need no user and the existing
/// `/v1/omni_gen/{cost,models}/*` routes suffice.
pub fn add_omni_api_routes<T, B>(app: App<T>) -> App<T>
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
  app.service(web::scope("/v1/omni_api")
      .service(web::scope("/generate")
          .service(web::resource("/video")
              .route(web::post().to(omni_api_video_generate_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/image")
              .route(web::post().to(omni_api_image_generate_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
      )
      .service(web::scope("/upload")
          .service(web::resource("/audio")
              .route(web::post().to(omni_upload_audio_media_file_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/image")
              .route(web::post().to(omni_upload_image_media_file_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/video")
              .route(web::post().to(omni_upload_video_media_file_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
      )
  )
}
