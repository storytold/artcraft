use actix_http::body::MessageBody;
use actix_service::ServiceFactory;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::{web, App, Error, HttpResponse};

use crate::http_server::endpoints::characters::create_character_handler::create_character_handler;
use crate::http_server::endpoints::characters::delete_character_handler::delete_character_handler;
use crate::http_server::endpoints::characters::edit_character_handler::edit_character_handler;
use crate::http_server::endpoints::characters::get_character_handler::get_character_handler;
use crate::http_server::endpoints::characters::list_characters_handler::list_characters_handler;

pub fn add_character_routes<T, B>(app: App<T>) -> App<T>
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
  app
    // List characters for the current session
    .service(web::resource("/v1/characters/session")
        .route(web::get().to(list_characters_handler))
        .route(web::head().to(|| HttpResponse::Ok()))
    )
    // Create a new character
    .service(web::resource("/v1/character/create")
        .route(web::post().to(create_character_handler))
        .route(web::head().to(|| HttpResponse::Ok()))
    )
    // Edit a character
    .service(web::resource("/v1/character/edit")
        .route(web::post().to(edit_character_handler))
        .route(web::head().to(|| HttpResponse::Ok()))
    )
    // Get or delete a character by token
    .service(web::resource("/v1/character/{character_token}")
        .route(web::get().to(get_character_handler))
        .route(web::delete().to(delete_character_handler))
        .route(web::head().to(|| HttpResponse::Ok()))
    )
}
