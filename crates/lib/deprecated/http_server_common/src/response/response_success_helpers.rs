use actix_web::HttpResponse;
use actix_web::web::Json;

#[derive(Serialize, utoipa::ToSchema)]
pub struct SimpleGenericJsonSuccess {
  pub success: bool,
}

impl SimpleGenericJsonSuccess {
  pub fn wrapped(success: bool) -> Json<Self> {
    Json(SimpleGenericJsonSuccess { success })
  }
}

pub fn simple_json_success() -> HttpResponse {
  let response = SimpleGenericJsonSuccess {
    success: true,
  };

  let body = serde_json::to_string(&response)
      .unwrap_or("{ \"success\": true }".to_string());

  HttpResponse::Ok()
      .content_type("application/json")
      .body(body)
}
