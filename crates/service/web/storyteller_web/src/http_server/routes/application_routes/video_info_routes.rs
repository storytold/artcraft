use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::error::Error;
use actix_web::{web, App, HttpResponse};

use crate::http_server::endpoints::video_info::video_info_notes_handler::video_info_notes_handler;
use crate::http_server::endpoints::video_info::video_info_read_info_handler::video_info_read_info_handler;
use crate::http_server::endpoints::video_info::video_info_upload_handler::video_info_upload_handler;

pub fn add_video_info_routes<T, B> (app: App<T>) -> App<T>
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
  app.service(web::scope("/v1/video_info")
      .service(web::resource("/read_only")
          .route(web::post().to(video_info_read_info_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/upload")
          .route(web::post().to(video_info_upload_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/notes")
          .route(web::post().to(video_info_notes_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
  )
}
