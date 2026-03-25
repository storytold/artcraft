// Never allow these
#![forbid(private_bounds)]
#![forbid(private_interfaces)]
#![forbid(unused_must_use)] // NB: It's unsafe to not close/check some things

// Okay to toggle
//#![forbid(warnings)]
#![allow(unreachable_patterns)]
#![allow(unused_imports)]
#![allow(unused_mut)]
#![allow(unused_variables)]

// Always allow
#![allow(dead_code)]
#![allow(non_snake_case)]

#[macro_use] extern crate magic_crypt;
#[macro_use] extern crate serde_derive;

use std::error::Error;

use actix_web::{App, HttpServer};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

use docs::api_doc::ApiDoc;
use errors::AnyhowResult;

use crate::configs::static_api_tokens::StaticApiTokenSet;

pub mod billing;
pub mod configs;
pub mod docs;
pub mod email;
pub mod error;
pub mod http_server;
pub mod startup;
pub mod state;
pub mod threads;
pub mod util;

#[actix_web::main]
async fn main() -> Result<(), impl Error> {
  HttpServer::new(move || {
      App::new()
          .service(
              SwaggerUi::new("/{_:.*}")
                  .url("/api-docs/openapi.json", ApiDoc::openapi()),
          )
  })
  .bind(("localhost", 8989)).unwrap()
  .run().await
}