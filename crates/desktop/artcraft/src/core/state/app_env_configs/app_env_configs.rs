use crate::core::state::app_env_configs::app_env_configs_serializeable::{AppEnvConfigsSerializable, StorytellerApiHost};
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use errors::AnyhowResult;
use artcraft_client::utils::api_host::ApiHost;

#[derive(Clone)]
pub struct AppEnvConfigs {
  pub storyteller_host: ApiHost,
}

impl AppEnvConfigs {

  pub fn load_from_filesystem(root: &AppDataRoot) -> AnyhowResult<Self> {
    println!("Loading app environmental configs from filesystem...");
    let input = AppEnvConfigsSerializable::load_from_filesystem(root)?;

    let storyteller = input.as_ref()
        .map(|i| i.storyteller_host)
        .flatten();

    let storyteller_api = match storyteller {
      Some(StorytellerApiHost::Localhost) => ApiHost::Localhost {
        port: input.as_ref()
            .and_then(|i| i.storyteller_port)
            .unwrap_or(12345)
      },
      Some(StorytellerApiHost::Production) => ApiHost::Storyteller,
      _ => ApiHost::Storyteller,
    };
    
    println!("Using storyteller API host: {:?}", storyteller_api);

    Ok(Self {
      storyteller_host: storyteller_api,
    })
  }
}
