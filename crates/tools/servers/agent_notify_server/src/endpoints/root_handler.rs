use actix_web::{HttpResponse, Responder};

const INDEX_HTML: &str = include_str!("../../static/index.html");

pub async fn root_handler() -> impl Responder {
  HttpResponse::Ok()
    .content_type("text/html; charset=utf-8")
    .body(INDEX_HTML)
}
