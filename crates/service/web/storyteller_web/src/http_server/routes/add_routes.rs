use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::error::Error;
use actix_web::App;

use server_environment::ServerEnvironment;

use crate::http_server::routes::application_routes::add_application_routes::add_application_routes;
use crate::http_server::routes::legacy_routes::add_legacy_routes::add_legacy_routes;
use crate::http_server::routes::service_routes::add_service_routes;

pub fn add_routes<T, B> (app: App<T>, server_environment: ServerEnvironment) -> App<T>
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
  let mut app = app;
  
  app = add_legacy_routes(app); // various legacy routes, mostly deprecated
  app = add_application_routes(app); // Primary product service area routes
  app = add_service_routes(app); // Essential service routes (status, health, info, etc.)
 
  app
}



