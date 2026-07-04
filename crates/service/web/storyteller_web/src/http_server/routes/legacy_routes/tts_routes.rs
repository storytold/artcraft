use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::error::Error;
use actix_web::{web, App, HttpResponse};

use crate::http_server::endpoints::tts::delete_tts_model::delete_tts_model_handler;
use crate::http_server::endpoints::tts::delete_tts_result::delete_tts_inference_result_handler;
use crate::http_server::endpoints::tts::edit_tts_model::edit_tts_model_handler;
use crate::http_server::endpoints::tts::edit_tts_result::edit_tts_inference_result_handler;
use crate::http_server::endpoints::tts::enqueue_infer_tts_handler::enqueue_infer_tts_handler::enqueue_infer_tts_handler;
use crate::http_server::endpoints::tts::enqueue_upload_tts_model::upload_tts_model_handler;
use crate::http_server::endpoints::tts::get_pending_tts_inference_job_count::get_pending_tts_inference_job_count_handler;
use crate::http_server::endpoints::tts::get_tts_inference_job_status_handler::get_tts_inference_job_status_handler;
use crate::http_server::endpoints::tts::get_tts_model::get_tts_model_handler;
use crate::http_server::endpoints::tts::get_tts_model_use_count::get_tts_model_use_count_handler;
use crate::http_server::endpoints::tts::get_tts_result::get_tts_inference_result_handler;
use crate::http_server::endpoints::tts::get_tts_upload_model_job_status::get_tts_upload_model_job_status_handler;
use crate::http_server::endpoints::tts::list_tts_models::list_tts_models_handler;
use crate::http_server::endpoints::tts::search_tts_models_handler::search_tts_models_handler;

// ==================== TTS ROUTES ====================

pub fn add_tts_routes<T, B> (app: App<T>) -> App<T>
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
  // NB(bt,2024-04-03): Newer /v1/tts/* routes don't have public use, but we'll start using it
  app.service(web::resource("/v1/tts/inference")
      .route(web::post().to(enqueue_infer_tts_handler))
      .route(web::head().to(|| HttpResponse::Ok()))
  )
      // NB(bt,2024-04-03): Older root /tts/* routes should be drained of traffic. They are used in the Twitch Streamer API though.
      .service(
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

