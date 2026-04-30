use crate::http_server::endpoints::prompts::batch_get_prompts_handler::batch_get_prompts_handler;
use crate::http_server::endpoints::prompts::create_prompt_handler::create_prompt_handler;
use crate::http_server::endpoints::prompts::get_prompt_handler::get_prompt_handler;
use actix_helpers::route_builder::RouteBuilder;
use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::error::Error;
use actix_web::App;

pub fn add_prompts_routes<T, B> (app: App<T>) -> App<T>
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
  RouteBuilder::from_app(app)
      // NB: This poor RouteBuilder utility requires that POST comes first, otherwise the GET glob
      // will capture it and force 504 Method Not Allowed for all POSTs.
      .add_get("/v1/prompt/batch", batch_get_prompts_handler)
      .add_post("/v1/prompts/create", create_prompt_handler)
      .add_get("/v1/prompts/{token}", get_prompt_handler)
      .into_app()
}
