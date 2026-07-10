use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::{web, App, Error, HttpResponse};

use crate::http_server::endpoints::tags::add_media_file_tags_handler::add_media_file_tags_handler;
use crate::http_server::endpoints::tags::bulk_add_tags_handler::bulk_add_tags_handler;
use crate::http_server::endpoints::tags::bulk_list_media_file_tags_handler::bulk_list_media_file_tags_handler;
use crate::http_server::endpoints::tags::bulk_set_tags_handler::bulk_set_tags_handler;
use crate::http_server::endpoints::tags::clear_media_file_tags_handler::clear_media_file_tags_handler;
use crate::http_server::endpoints::tags::delete_tag_handler::delete_tag_handler;
use crate::http_server::endpoints::tags::list_media_file_tags_handler::list_media_file_tags_handler;
use crate::http_server::endpoints::tags::list_media_files_with_tag_handler::list_media_files_with_tag_handler;
use crate::http_server::endpoints::tags::list_tagged_media_files_handler::list_tagged_media_files_handler;
use crate::http_server::endpoints::tags::list_tags_handler::list_tags_handler;
use crate::http_server::endpoints::tags::list_untagged_media_files_handler::list_untagged_media_files_handler;
use crate::http_server::endpoints::tags::rename_tag_handler::rename_tag_handler;
use crate::http_server::endpoints::tags::set_media_file_tags_handler::set_media_file_tags_handler;

pub fn add_tag_routes<T, B>(app: App<T>) -> App<T>
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
    web::scope("/v1/tags")
      // The user's tags
      .service(
        web::resource("/list")
          .route(web::get().to(list_tags_handler))
          .route(web::head().to(|| HttpResponse::Ok())),
      )
      .service(
        web::resource("/rename/{tag_token}")
          .route(web::put().to(rename_tag_handler))
          .route(web::head().to(|| HttpResponse::Ok())),
      )
      // Tagging many media files at once
      .service(
        web::resource("/bulk_add")
          .route(web::post().to(bulk_add_tags_handler))
          .route(web::head().to(|| HttpResponse::Ok())),
      )
      .service(
        web::resource("/bulk_set")
          .route(web::post().to(bulk_set_tags_handler))
          .route(web::head().to(|| HttpResponse::Ok())),
      )
      // Tag operations on a single media file
      .service(
        web::scope("/media_file")
          .service(
            web::resource("/list/{media_file_token}")
              .route(web::get().to(list_media_file_tags_handler))
              .route(web::head().to(|| HttpResponse::Ok())),
          )
          .service(
            web::resource("/add/{media_file_token}")
              .route(web::post().to(add_media_file_tags_handler))
              .route(web::head().to(|| HttpResponse::Ok())),
          )
          .service(
            web::resource("/set/{media_file_token}")
              .route(web::post().to(set_media_file_tags_handler))
              .route(web::head().to(|| HttpResponse::Ok())),
          )
          .service(
            web::resource("/clear/{media_file_token}")
              .route(web::post().to(clear_media_file_tags_handler))
              .route(web::head().to(|| HttpResponse::Ok())),
          ),
      )
      // Media-file listings by tag state
      .service(
        web::scope("/media_files")
          .service(
            web::resource("/list_untagged")
              .route(web::get().to(list_untagged_media_files_handler))
              .route(web::head().to(|| HttpResponse::Ok())),
          )
          .service(
            web::resource("/list_tagged")
              .route(web::get().to(list_tagged_media_files_handler))
              .route(web::head().to(|| HttpResponse::Ok())),
          )
          .service(
            web::resource("/with_tag/{tag_token}")
              .route(web::get().to(list_media_files_with_tag_handler))
              .route(web::head().to(|| HttpResponse::Ok())),
          )
          .service(
            web::resource("/bulk_list_tags")
              .route(web::post().to(bulk_list_media_file_tags_handler))
              .route(web::head().to(|| HttpResponse::Ok())),
          ),
      )
      // NB: registered last so the literal segments above win the match.
      .service(
        web::resource("/{tag_token}")
          .route(web::delete().to(delete_tag_handler))
          .route(web::head().to(|| HttpResponse::Ok())),
      ),
  )
}
