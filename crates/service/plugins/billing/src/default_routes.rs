//! These routes are recommended, but do not have to be used by consumers of the billing system.

use actix_web::{App, HttpResponse, web};
use actix_web::body::MessageBody;
use actix_web::dev::{ServiceFactory, ServiceRequest, ServiceResponse};
use actix_web::error::Error;

use crate::stripe::http_endpoints::checkout::create::stripe_create_checkout_session_json_handler::stripe_create_checkout_session_json_handler;
use crate::stripe::http_endpoints::checkout::create::stripe_create_checkout_session_redirect_handler::stripe_create_checkout_session_redirect_handler;
use crate::stripe::http_endpoints::customer_portal::stripe_create_customer_portal_session_json_handler::stripe_create_customer_portal_session_json_handler;
use crate::stripe::http_endpoints::customer_portal::stripe_create_customer_portal_session_redirect_handler::stripe_create_customer_portal_session_redirect_handler;
use crate::stripe::http_endpoints::webhook::stripe_webhook_handler::stripe_webhook_handler;

pub fn add_suggested_stripe_billing_routes<T, B> (app: App<T>) -> App<T>
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
  // NB: The /v1/billing/active_subscriptions route has been moved to
  // storyteller-web (billing_fakeyou_routes). Only Stripe routes remain here.
  app.service(web::scope("/v1")
    .service(web::scope("/stripe")
      .service(web::resource("/webhook")
        .route(web::post().to(stripe_webhook_handler))
        .route(web::head().to(|| HttpResponse::Ok()))
      )
      .service(web::scope("/checkout")
        .service(web::resource("/create_redirect")
          .route(web::post().to(stripe_create_checkout_session_json_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(web::resource("/redirect")
          .route(web::get().to(stripe_create_checkout_session_redirect_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
        )
      )
      .service(web::scope("/portal")
        .service(web::resource("/create_redirect")
          .route(web::post().to(stripe_create_customer_portal_session_json_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
        )
        .service(web::resource("/redirect")
          .route(web::get().to(stripe_create_customer_portal_session_redirect_handler))
          .route(web::head().to(|| HttpResponse::Ok()))
        )
      )
    )
  )
}
