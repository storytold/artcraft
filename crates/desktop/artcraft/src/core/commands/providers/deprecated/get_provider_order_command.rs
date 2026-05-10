use crate::core::commands::response::shorthand::ResponseOrErrorMessage;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::state::provider_priority::{Provider, ProviderPriorityStore};
use log::{error, info};
use serde_derive::Serialize;
use tauri::State;

#[derive(Serialize)]
pub struct GetProviderOrderResponse {
  pub providers: Vec<Provider>,
}

impl SerializeMarker for GetProviderOrderResponse{}

#[tauri::command]
pub async fn get_provider_order_command(
  provider_priority_store: State<'_, ProviderPriorityStore>,
) -> ResponseOrErrorMessage<GetProviderOrderResponse> {
  info!("get_provider_order_command called");

  let providers = provider_priority_store.get_priority()
    .map_err(|err| {
      error!("Failed to get provider order: {:?}", err);
      "Failed to retrieve provider order"
    })?;

  Ok(GetProviderOrderResponse {
    providers,
  }.into())
}
