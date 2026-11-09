use crate::core::commands::response::shorthand::ResponseOrErrorMessage;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::utils::local_generations::{list, LocalGeneration};
use log::error;
use serde_derive::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct ListLocalGenerationsSuccessResponse {
  pub images: Vec<LocalGeneration>,
}

impl SerializeMarker for ListLocalGenerationsSuccessResponse {}

#[tauri::command]
pub async fn list_local_generations_command(app_data_root: State<'_, AppDataRoot>) -> ResponseOrErrorMessage<ListLocalGenerationsSuccessResponse> {
  let root = app_data_root.inner().clone();
  let images = tauri::async_runtime::spawn_blocking(move || list(&root)).await;
  match images {
    Ok(Ok(images)) => Ok(ListLocalGenerationsSuccessResponse { images }.into()),
    result => {
      error!("Could not list local generations: {:?}", result);
      Err("Could not list local generations".into())
    },
  }
}
