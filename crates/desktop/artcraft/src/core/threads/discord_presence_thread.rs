use anyhow::anyhow;
use discord_rich_presence::{DiscordIpc, DiscordIpcClient};
use errors::AnyhowResult;
use log::{debug, info};
use rand::random_range;

/// Our Discord App ID. Not sure if this is a secret.
const DISCORD_APP_ID : &str = "1366596912593113138";

const DISCORD_ARTCRAFT_LOGO_SPIN : &str = "https://getartcraft.com/discord-status-icons/artcraft-a-spin-512x512.webp";
const DISCORD_ARTCRAFT_LOGO_STATIC : &str = "https://getartcraft.com/discord-status-icons/artcraft-a-512x512.png";
const DISCORD_KITSUNE_MASK_LOGO : &str = "https://getartcraft.com/discord-status-icons/kitsune-mask-512x512.png";
const DISCORD_LINK_SPIN: &str = "https://getartcraft.com/discord-status-icons/link-spin-200x216.webp";

pub async fn discord_presence_thread() -> ! {
  loop {
    let client = DiscordIpcClient::new(DISCORD_APP_ID);
    let _err = discord_main_loop(client).await;
    tokio::time::sleep(std::time::Duration::from_millis(10_000)).await;
  }
}

async fn discord_main_loop(mut client: DiscordIpcClient) -> AnyhowResult<()> {
  info!("(Re)-connecting Discord IPC client...");

  client.connect()
      .map_err(|err| anyhow!("Error connecting to Discord IPC: {:?}", err))?;

  loop {
    debug!("Notifying discord presence API...");

    let discord_logo_image = get_random_discord_icon();

    let assets = discord_rich_presence::activity::Assets::new()
        .large_image(discord_logo_image)
        .large_text("https://GetArtCraft.com");
        //.small_image("https://storyteller.ai/android-chrome-192x192.png")
        //.small_text("small text");

    client.set_activity(discord_rich_presence::activity::Activity::new()
        //.state("Anyone can make arts!")
        .state("GetArtCraft.com")
        .details("Crafting Arts with ArtCraft")
        .activity_type(discord_rich_presence::activity::ActivityType::Playing)
        .assets(assets))
        .map_err(|err| anyhow!("Error setting Discord activity: {:?}", err))?;

    tokio::time::sleep(std::time::Duration::from_millis(60_000)).await;
  }
}

fn get_random_discord_icon() -> &'static str {
  let value = random_range(0..10u8);
  if value < 6 {
    DISCORD_ARTCRAFT_LOGO_SPIN
  } else if value < 7 {
    DISCORD_ARTCRAFT_LOGO_STATIC
  } else if value < 8 {
    DISCORD_KITSUNE_MASK_LOGO
  } else {
    DISCORD_LINK_SPIN
  }
}
