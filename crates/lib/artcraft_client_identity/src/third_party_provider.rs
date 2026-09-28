/// A third-party provider, and the `Origin` of its own website that we present to its hosts.
#[derive(Debug, PartialEq, Eq)]
pub struct ThirdPartyProvider {
  pub name: &'static str,
  /// Registrable domains; subdomains match too.
  pub domains: &'static [&'static str],
  pub origin: &'static str,
}

/// Every third party that gets an invented origin. Origins match what each provider's native
/// Rust client already sends. First match wins, so more specific entries go first.
pub const THIRD_PARTY_PROVIDERS: [ThirdPartyProvider; 9] = [
  ThirdPartyProvider { name: "Grok", domains: &["grok.com", "x.ai"], origin: "https://grok.com" },
  ThirdPartyProvider { name: "Midjourney", domains: &["midjourney.com"], origin: "https://www.midjourney.com" },
  ThirdPartyProvider {
    name: "Sora",
    domains: &["sora.chatgpt.com", "sora.com", "openai.com", "oaistatic.com"],
    origin: "https://sora.chatgpt.com",
  },
  ThirdPartyProvider { name: "ChatGPT", domains: &["chatgpt.com"], origin: "https://chatgpt.com" },
  ThirdPartyProvider {
    name: "World Labs",
    domains: &["worldlabs.ai", "wlt-ai.art"],
    origin: "https://marble.worldlabs.ai",
  },
  ThirdPartyProvider { name: "Kinovi", domains: &["kinovi.ai"], origin: "https://kinovi.ai" },
  ThirdPartyProvider { name: "Seedance 2 Pro", domains: &["seedance2-pro.com"], origin: "https://seedance2-pro.com" },
  ThirdPartyProvider { name: "fal", domains: &["fal.ai", "fal.run", "fal.media"], origin: "https://fal.ai" },
  ThirdPartyProvider { name: "GMI Cloud", domains: &["gmicloud.ai"], origin: "https://console.gmicloud.ai" },
];
