use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::{App, Error, HttpResponse, web};
use actix_web::dev::{ServiceRequest, ServiceResponse};

use crate::http_server::endpoints::workflows::enqueue::enqueue_live_portrait_workflow_handler::enqueue_live_portrait_workflow_handler;
use crate::http_server::endpoints::workflows::enqueue::enqueue_studio_workflow_handler::enqueue_studio_workflow_handler;
use crate::http_server::endpoints::workflows::enqueue::enqueue_video_style_transfer_workflow_handler::enqueue_video_style_transfer_workflow_handler;
use crate::http_server::endpoints::workflows::enqueue::get_inference_preview_status::get_inference_preview_status_handler;
use crate::http_server::endpoints::workflows::enqueue_comfy_ui_handler::enqueue_comfy_ui_handler;
use crate::http_server::endpoints::workflows::enqueue_workflow_upload_request::enqueue_workflow_upload_request;

pub fn add_workflow_routes<T, B> (app: App<T>) -> App<T>
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
  let app = app.service(web::scope("/v1/workflows")
      .service(web::resource("/enqueue_acting_face")
          .route(web::post().to(enqueue_live_portrait_workflow_handler)) // TODO: Rename to below
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/enqueue_face_mirror")
          .route(web::post().to(enqueue_live_portrait_workflow_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/enqueue_studio")
          .route(web::post().to(enqueue_studio_workflow_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/enqueue_vst")
          .route(web::post().to(enqueue_video_style_transfer_workflow_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::resource("/preview_status/{token}")
        .route(web::get().to(get_inference_preview_status_handler))
        .route(web::head().to(|| HttpResponse::Ok()))
      )
  )
    // .service(web::resource("/ws")
    //   .route(web::get().to(ws_progress_route))
    //   .route(web::head().to(|| HttpResponse::Ok()))
    // )
    //

    ;

  add_legacy_workflow_routes(app)
}

fn add_legacy_workflow_routes<T,B> (app:App<T>)-> App<T>
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
  //app.service(
  //  // NB: We don't want this to live alongside the older endpoints for comfy and workflows -
  //  // We don't want to give away that we're using Comfy or ComfyUI workflows as a technique.
  //  web::scope("/v1/video")
  //      .service(web::resource("/enqueue_vst")
  //          .route(web::post().to(enqueue_video_style_transfer_handler))
  //          .route(web::head().to(|| HttpResponse::Ok()))
  //      )
  //)
  app.service(
    web::scope("/v1/workflow")
        .service(
          web::scope("/upload")
              .route("/prompt", web::post().to(enqueue_workflow_upload_request))
        )
        .service(
          web::scope("/comfy")
              .route("/create", web::post().to(enqueue_comfy_ui_handler))
        )
  )
}
