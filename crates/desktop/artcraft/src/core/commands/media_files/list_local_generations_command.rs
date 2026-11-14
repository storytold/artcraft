use crate::core::commands::response::shorthand::ResponseOrErrorType;
use crate::core::commands::response::provider_command_error::ProviderCommandError;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::utils::local_generations::{list, LocalGeneration};
use log::error;
use serde_derive::Serialize;
use tauri::State;
use crate::core::commands::response::list_page::{list_page, ListPageRequest};

#[derive(Serialize)]
pub struct ListLocalGenerationsSuccessResponse {
  pub images: Vec<LocalGeneration>,
  pub next_cursor: Option<usize>,
}

impl SerializeMarker for ListLocalGenerationsSuccessResponse {}

/// List local image/video history without sign-in. Optional limit/cursor input
/// returns up to 100 entries and a next cursor; failures use `storage_error`.
#[tauri::command]
pub async fn list_local_generations_command(request: Option<ListPageRequest>, app_data_root: State<'_, AppDataRoot>) -> ResponseOrErrorType<ListLocalGenerationsSuccessResponse, ProviderCommandError> {
  let root = app_data_root.inner().clone();
  let images = tauri::async_runtime::spawn_blocking(move || list(&root)).await;
  match images {
    Ok(Ok(images)) => {
      let (images, next_cursor) = list_page(images, request);
      Ok(ListLocalGenerationsSuccessResponse { images, next_cursor }.into())
    },
    result => {
      error!("Could not list local generations: {:?}", result);
      Err(ProviderCommandError::StorageError.response("Could not list local generations"))
    },
  }
}
