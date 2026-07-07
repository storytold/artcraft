use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::{web, App, Error, HttpResponse};

use crate::http_server::endpoints::omni_gen::cost::audio::omni_gen_audio_cost_handler::omni_gen_audio_cost_handler;
use crate::http_server::endpoints::omni_gen::cost::image::omni_gen_image_cost_handler::omni_gen_image_cost_handler;
use crate::http_server::endpoints::omni_gen::cost::mesh::omni_gen_mesh_cost_handler::omni_gen_mesh_cost_handler;
use crate::http_server::endpoints::omni_gen::cost::splat::omni_gen_splat_cost_handler::omni_gen_splat_cost_handler;
use crate::http_server::endpoints::omni_gen::cost::video::omni_gen_video_cost_handler::omni_gen_video_cost_handler;
use crate::http_server::endpoints::omni_gen::generate::audio::omni_gen_audio_generate_handler::omni_gen_audio_generate_handler;
use crate::http_server::endpoints::omni_gen::generate::image::omni_gen_image_generate_handler::omni_gen_image_generate_handler;
use crate::http_server::endpoints::omni_gen::generate::mesh::omni_gen_mesh_generate_handler::omni_gen_mesh_generate_handler;
use crate::http_server::endpoints::omni_gen::generate::splat::omni_gen_splat_generate_handler::omni_gen_splat_generate_handler;
use crate::http_server::endpoints::omni_gen::generate::video::omni_gen_video_generate_handler::omni_gen_video_generate_handler;
use crate::http_server::endpoints::omni_gen::models::audio::omni_gen_audio_models_handler::omni_gen_audio_models_handler;
use crate::http_server::endpoints::omni_gen::models::image::omni_gen_image_models_handler::omni_gen_image_models_handler;
use crate::http_server::endpoints::omni_gen::models::mesh::omni_gen_mesh_models_handler::omni_gen_mesh_models_handler;
use crate::http_server::endpoints::omni_gen::models::splat::omni_gen_splat_models_handler::omni_gen_splat_models_handler;
use crate::http_server::endpoints::omni_gen::models::video::omni_gen_video_models_handler::omni_gen_video_models_handler;

pub fn add_omni_gen_routes<T, B>(app: App<T>) -> App<T>
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
  app.service(web::scope("/v1/omni_gen")
      .service(web::scope("/cost")
          .service(web::resource("/video")
              .route(web::post().to(omni_gen_video_cost_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/image")
              .route(web::post().to(omni_gen_image_cost_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/audio")
              .route(web::post().to(omni_gen_audio_cost_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/mesh")
              .route(web::post().to(omni_gen_mesh_cost_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/splat")
              .route(web::post().to(omni_gen_splat_cost_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
      )
      .service(web::scope("/generate")
          .service(web::resource("/video")
              .route(web::post().to(omni_gen_video_generate_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/image")
              .route(web::post().to(omni_gen_image_generate_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/audio")
              .route(web::post().to(omni_gen_audio_generate_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/mesh")
              .route(web::post().to(omni_gen_mesh_generate_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/splat")
              .route(web::post().to(omni_gen_splat_generate_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
      )
      .service(web::scope("/models")
          .service(web::resource("/video")
              .route(web::get().to(omni_gen_video_models_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/image")
              .route(web::get().to(omni_gen_image_models_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/audio")
              .route(web::get().to(omni_gen_audio_models_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/mesh")
              .route(web::get().to(omni_gen_mesh_models_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/splat")
              .route(web::get().to(omni_gen_splat_models_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
      )
  )
}
