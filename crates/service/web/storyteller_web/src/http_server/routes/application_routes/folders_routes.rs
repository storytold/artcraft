use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::{web, App, Error, HttpResponse};

use crate::http_server::endpoints::folders::folder::color_code_folder_handler::color_code_folder_handler;
use crate::http_server::endpoints::folders::folder::cover_image_folder_handler::cover_image_folder_handler;
use crate::http_server::endpoints::folders::folder::create_folder_handler::create_folder_handler;
use crate::http_server::endpoints::folders::folder::delete_folder_handler::delete_folder_handler;
use crate::http_server::endpoints::folders::folder::get_folder_handler::get_folder_handler;
use crate::http_server::endpoints::folders::folder::list_folders_handler::list_folders_handler;
use crate::http_server::endpoints::folders::folder::rename_folder_handler::rename_folder_handler;
use crate::http_server::endpoints::folders::folder::star_folder_handler::star_folder_handler;
use crate::http_server::endpoints::folders::media_files::bulk_add_folder_media_files_handler::bulk_add_folder_media_files_handler;
use crate::http_server::endpoints::folders::media_files::bulk_move_folder_media_files_handler::bulk_move_folder_media_files_handler;
use crate::http_server::endpoints::folders::media_files::bulk_remove_folder_media_files_handler::bulk_remove_folder_media_files_handler;
use crate::http_server::endpoints::folders::media_files::list_folder_media_files_handler::list_folder_media_files_handler;
use crate::http_server::endpoints::folders::subfolder::bulk_add_subfolders_handler::bulk_add_subfolders_handler;
use crate::http_server::endpoints::folders::subfolder::bulk_remove_subfolders_handler::bulk_remove_subfolders_handler;
use crate::http_server::endpoints::folders::subfolder::list_subfolders_handler::list_subfolders_handler;

pub fn add_folders_routes<T, B>(app: App<T>) -> App<T>
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
    web::scope("/v1/folders")
      // Folder CRUD
      .service(
        web::resource("/create")
          .route(web::post().to(create_folder_handler))
          .route(web::head().to(|| HttpResponse::Ok())),
      )
      .service(
        web::resource("/list_all")
          .route(web::get().to(list_folders_handler))
          .route(web::head().to(|| HttpResponse::Ok())),
      )
      .service(
        web::scope("/folder")
          .service(
            web::resource("/{folder_token}")
              .route(web::get().to(get_folder_handler))
              .route(web::delete().to(delete_folder_handler))
              .route(web::head().to(|| HttpResponse::Ok())),
          )
          .service(
            web::resource("/{folder_token}/rename")
              .route(web::put().to(rename_folder_handler))
              .route(web::head().to(|| HttpResponse::Ok())),
          )
          .service(
            web::resource("/{folder_token}/star")
              .route(web::put().to(star_folder_handler))
              .route(web::head().to(|| HttpResponse::Ok())),
          )
          .service(
            web::resource("/{folder_token}/color_code")
              .route(web::put().to(color_code_folder_handler))
              .route(web::head().to(|| HttpResponse::Ok())),
          )
          .service(
            web::resource("/{folder_token}/cover_image")
              .route(web::put().to(cover_image_folder_handler))
              .route(web::head().to(|| HttpResponse::Ok())),
          ),
      )
      // Subfolder membership
      .service(
        web::scope("/subfolders")
          .service(
            web::resource("/{folder_token}")
              .route(web::get().to(list_subfolders_handler))
              .route(web::head().to(|| HttpResponse::Ok())),
          )
          .service(
            web::resource("/{folder_token}/bulk_add")
              .route(web::post().to(bulk_add_subfolders_handler))
              .route(web::head().to(|| HttpResponse::Ok())),
          )
          .service(
            web::resource("/{folder_token}/bulk_remove")
              .route(web::post().to(bulk_remove_subfolders_handler))
              .route(web::head().to(|| HttpResponse::Ok())),
          ),
      )
      // Media-file membership
      .service(
        web::scope("/media_files")
          .service(
            web::resource("/{folder_token}")
              .route(web::get().to(list_folder_media_files_handler))
              .route(web::head().to(|| HttpResponse::Ok())),
          )
          .service(
            web::resource("/{folder_token}/bulk_add")
              .route(web::post().to(bulk_add_folder_media_files_handler))
              .route(web::head().to(|| HttpResponse::Ok())),
          )
          .service(
            web::resource("/{folder_token}/bulk_remove")
              .route(web::post().to(bulk_remove_folder_media_files_handler))
              .route(web::head().to(|| HttpResponse::Ok())),
          )
          .service(
            web::resource("/{folder_token}/bulk_move")
              .route(web::post().to(bulk_move_folder_media_files_handler))
              .route(web::head().to(|| HttpResponse::Ok())),
          ),
      ),
  )
}
