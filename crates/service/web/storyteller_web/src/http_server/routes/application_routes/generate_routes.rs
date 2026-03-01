use crate::http_server::endpoints::generate::cost_estimate::image::estimate_image_cost_handler::estimate_image_cost_handler;
use crate::http_server::endpoints::generate::cost_estimate::video::estimate_video_cost_handler::estimate_video_cost_handler;
use crate::http_server::endpoints::generate::image::edit::flux_pro_kontext_max_edit_image_handler::flux_pro_kontext_max_edit_image_handler;
use crate::http_server::endpoints::generate::image::edit::gemini_25_flash_edit_image_handler::gemini_25_flash_edit_image_handler;
use crate::http_server::endpoints::generate::image::edit::gpt_image_1_edit_image_handler::gpt_image_1_edit_image_handler;
use crate::http_server::endpoints::generate::image::edit::qwen_edit_image_handler::qwen_edit_image_handler;
use crate::http_server::endpoints::generate::image::edit::seededit_3_edit_image_handler::seededit_3_edit_image_handler;
use crate::http_server::endpoints::generate::image::generate_flux_1_dev_text_to_image_handler::generate_flux_1_dev_text_to_image_handler;
use crate::http_server::endpoints::generate::image::generate_flux_1_schnell_text_to_image_handler::generate_flux_1_schnell_text_to_image_handler;
use crate::http_server::endpoints::generate::image::generate_flux_pro_11_text_to_image_handler::generate_flux_pro_11_text_to_image_handler;
use crate::http_server::endpoints::generate::image::generate_flux_pro_11_ultra_text_to_image_handler::generate_flux_pro_11_ultra_text_to_image_handler;
use crate::http_server::endpoints::generate::image::generate_gpt_image_1_text_to_image_handler::generate_gpt_image_1_text_to_image_handler;
use crate::http_server::endpoints::generate::image::inpaint::flux_dev_juggernaut_inpaint_handler::flux_dev_juggernaut_inpaint_image_handler;
use crate::http_server::endpoints::generate::image::inpaint::flux_pro_1_inpaint_handler::flux_pro_1_inpaint_image_handler;
use crate::http_server::endpoints::generate::image::multi_function::bytedance_seedream_v4_multi_function_image_gen_handler::bytedance_seedream_v4_multi_function_image_gen_handler;
use crate::http_server::endpoints::generate::image::multi_function::bytedance_seedream_v4p5_multi_function_image_gen_handler::bytedance_seedream_v4p5_multi_function_image_gen_handler;
use crate::http_server::endpoints::generate::image::multi_function::gpt_image_1p5_multi_function_image_gen_handler::gpt_image_1p5_multi_function_image_gen_handler;
use crate::http_server::endpoints::generate::image::multi_function::nano_banana_multi_function_image_gen_handler::nano_banana_multi_function_image_gen_handler;
use crate::http_server::endpoints::generate::image::multi_function::nano_banana_pro_multi_function_image_gen_handler::nano_banana_pro_multi_function_image_gen_handler;
use crate::http_server::endpoints::generate::image::remove_image_background_handler::remove_image_background_handler;
use crate::http_server::endpoints::generate::object::generate_hunyuan_2_0_image_to_3d_handler::generate_hunyuan_2_0_image_to_3d_handler;
use crate::http_server::endpoints::generate::object::generate_hunyuan_2_1_image_to_3d_handler::generate_hunyuan_2_1_image_to_3d_handler;
use crate::http_server::endpoints::generate::object::multi_function::generate_hunyuan3d_v3_multi_function_object_handler::generate_hunyuan3d_v3_multi_function_object_handler;
use crate::http_server::endpoints::generate::video::generate_kling_1_6_pro_video_handler::generate_kling_1_6_pro_video_handler;
use crate::http_server::endpoints::generate::video::generate_kling_2_1_master_video_handler::generate_kling_2_1_master_video_handler;
use crate::http_server::endpoints::generate::video::generate_kling_2_1_pro_video_handler::generate_kling_2_1_pro_video_handler;
use crate::http_server::endpoints::generate::video::generate_seedance_1_0_lite_image_to_video_handler::generate_seedance_1_0_lite_image_to_video_handler;
use crate::http_server::endpoints::generate::video::generate_seedance_1_0_pro_image_to_video_handler::generate_seedance_1_0_pro_image_to_video_handler;
use crate::http_server::endpoints::generate::video::generate_veo_2_image_to_video_handler::generate_veo_2_image_to_video_handler;
use crate::http_server::endpoints::generate::video::generate_veo_3_fast_image_to_video_handler::generate_veo_3_fast_image_to_video_handler;
use crate::http_server::endpoints::generate::video::generate_veo_3_image_to_video_handler::generate_veo_3_image_to_video_handler;
use crate::http_server::endpoints::generate::video::multi_function::kling_2p5_turbo_pro_multi_function_video_gen_handler::kling_2p5_turbo_pro_multi_function_video_gen_handler;
use crate::http_server::endpoints::generate::video::multi_function::kling_2p6_pro_multi_function_video_gen_handler::kling_2p6_pro_multi_function_video_gen_handler;
use crate::http_server::endpoints::generate::video::multi_function::seedance_2p0_multi_function_video_gen_handler::seedance_2p0_multi_function_video_gen_handler;
use crate::http_server::endpoints::generate::video::multi_function::sora_2_multi_function_video_gen_handler::sora_2_multi_function_video_gen_handler;
use crate::http_server::endpoints::generate::video::multi_function::sora_2_pro_multi_function_video_gen_handler::sora_2_pro_multi_function_video_gen_handler;
use crate::http_server::endpoints::generate::video::multi_function::veo_3p1_fast_multi_function_video_gen_handler::veo_3p1_fast_multi_function_video_gen_handler;
use crate::http_server::endpoints::generate::video::multi_function::veo_3p1_multi_function_video_gen_handler::veo_3p1_multi_function_video_gen_handler;
use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::{web, App, Error, HttpResponse};

pub fn add_generate_routes<T, B> (app: App<T>) -> App<T>
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
  app.service(web::scope("/v1/generate")
      .service(web::scope("/cost_estimate")
          .service(web::resource("/image")
              .route(web::post().to(estimate_image_cost_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/video")
              .route(web::post().to(estimate_video_cost_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
      )
      .service(web::scope("/image")
          .service(web::scope("/multi_function")
              .service(web::resource("/bytedance_seedream_4")
                  .route(web::post().to(bytedance_seedream_v4_multi_function_image_gen_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
              )
              .service(web::resource("/bytedance_seedream_4p5")
                  .route(web::post().to(bytedance_seedream_v4p5_multi_function_image_gen_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
              )
              .service(web::resource("/gpt_image_1p5")
                  .route(web::post().to(gpt_image_1p5_multi_function_image_gen_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
              )
              .service(web::resource("/nano_banana")
                  .route(web::post().to(nano_banana_multi_function_image_gen_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
              )
              .service(web::resource("/nano_banana_pro")
                  .route(web::post().to(nano_banana_pro_multi_function_image_gen_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
              )
          )
          .service(web::scope("/edit")
              .service(web::resource("/flux_pro_kontext_max")
                  .route(web::post().to(flux_pro_kontext_max_edit_image_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
              )
              .service(web::resource("/gemini_25_flash")
                  .route(web::post().to(gemini_25_flash_edit_image_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
              )
              .service(web::resource("/gpt_image_1")
                  .route(web::post().to(gpt_image_1_edit_image_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
              )
              .service(web::resource("/qwen")
                  .route(web::post().to(qwen_edit_image_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
              )
              .service(web::resource("/seededit_3")
                  .route(web::post().to(seededit_3_edit_image_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
              )
          )
          .service(web::scope("/inpaint")
              .service(web::resource("/flux_dev_juggernaut")
                  .route(web::post().to(flux_dev_juggernaut_inpaint_image_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
              )
              .service(web::resource("/flux_pro_1")
                  .route(web::post().to(flux_pro_1_inpaint_image_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
              )
          )
          .service(web::resource("/flux_1_dev_text_to_image")
              .route(web::post().to(generate_flux_1_dev_text_to_image_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/flux_1_schnell_text_to_image")
              .route(web::post().to(generate_flux_1_schnell_text_to_image_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/flux_pro_1.1_text_to_image")
              .route(web::post().to(generate_flux_pro_11_text_to_image_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/flux_pro_1.1_ultra_text_to_image")
              .route(web::post().to(generate_flux_pro_11_ultra_text_to_image_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/gpt_image_1_text_to_image")
              .route(web::post().to(generate_gpt_image_1_text_to_image_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/remove_background")
              .route(web::post().to(remove_image_background_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
      )
      .service(web::scope("/video")
          .service(web::scope("/multi_function")
              .service(web::resource("/kling_2p5_turbo_pro")
                  .route(web::post().to(kling_2p5_turbo_pro_multi_function_video_gen_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
              )
              .service(web::resource("/kling_2p6_pro")
                  .route(web::post().to(kling_2p6_pro_multi_function_video_gen_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
              )
              .service(web::resource("/seedance_2p0")
                  .route(web::post().to(seedance_2p0_multi_function_video_gen_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
              )
              .service(web::resource("/sora_2")
                  .route(web::post().to(sora_2_multi_function_video_gen_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
              )
              .service(web::resource("/sora_2_pro")
                  .route(web::post().to(sora_2_pro_multi_function_video_gen_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
              )
              .service(web::resource("/veo_3p1")
                  .route(web::post().to(veo_3p1_multi_function_video_gen_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
              )
              .service(web::resource("/veo_3p1_fast")
                  .route(web::post().to(veo_3p1_fast_multi_function_video_gen_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
              )
          )
          .service(web::resource("/kling_1.6_pro_image_to_video")
              .route(web::post().to(generate_kling_1_6_pro_video_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/kling_2.1_master_image_to_video")
              .route(web::post().to(generate_kling_2_1_master_video_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/kling_2.1_pro_image_to_video")
              .route(web::post().to(generate_kling_2_1_pro_video_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/seedance_1.0_lite_image_to_video")
              .route(web::post().to(generate_seedance_1_0_lite_image_to_video_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/seedance_1.0_pro_image_to_video")
              .route(web::post().to(generate_seedance_1_0_pro_image_to_video_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/veo_2_image_to_video")
              .route(web::post().to(generate_veo_2_image_to_video_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/veo_3_image_to_video")
              .route(web::post().to(generate_veo_3_image_to_video_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/veo_3_fast_image_to_video")
              .route(web::post().to(generate_veo_3_fast_image_to_video_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
      )
      .service(web::scope("/object")
          .service(web::scope("/multi_function")
              .service(web::resource("/hunyuan3d_v3")
                  .route(web::post().to(generate_hunyuan3d_v3_multi_function_object_handler))
                  .route(web::head().to(|| HttpResponse::Ok()))
              )
          )
          .service(web::resource("/hunyuan_2.0_image_to_3d")
              .route(web::post().to(generate_hunyuan_2_0_image_to_3d_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
          .service(web::resource("/hunyuan_2.1_image_to_3d")
              .route(web::post().to(generate_hunyuan_2_1_image_to_3d_handler))
              .route(web::head().to(|| HttpResponse::Ok()))
          )
      )
  )
}
