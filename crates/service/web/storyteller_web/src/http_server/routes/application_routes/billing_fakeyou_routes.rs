use crate::http_server::endpoints::billing_fakeyou::list_active_user_subscriptions_handler::list_active_user_subscriptions_handler;
use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::{web, App, Error, HttpResponse};

pub fn add_billing_fakeyou_routes<T, B>(app: App<T>) -> App<T>
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
  app.service(web::scope("/v1")
    .service(web::scope("/billing")
      .service(web::resource("/active_subscriptions")
        .route(web::get().to(list_active_user_subscriptions_handler))
        .route(web::head().to(|| HttpResponse::Ok()))
      )
    )
  )
}
