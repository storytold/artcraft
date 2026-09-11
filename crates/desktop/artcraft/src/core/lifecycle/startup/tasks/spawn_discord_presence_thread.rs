use crate::core::threads::discord_presence_thread::discord_presence_thread;
use errors::AnyhowResult;

pub fn spawn_discord_presence_thread(
) -> AnyhowResult<()> {

  tauri::async_runtime::spawn(discord_presence_thread());

  Ok(())
}
