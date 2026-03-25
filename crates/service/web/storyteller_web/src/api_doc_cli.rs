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

use std::fs::File;
use std::io::Write;

use utoipa::OpenApi;

use docs::api_doc::ApiDoc;
use errors::AnyhowResult;


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
async fn main() -> AnyhowResult<()> {
  let api_json = ApiDoc::openapi().to_pretty_json()?;

  let mut file = File::create("api.json")?;
  file.write_all(api_json.as_bytes())?;

  Ok(())
}
