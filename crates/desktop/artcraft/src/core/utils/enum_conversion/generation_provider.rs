use crate::core::events::generation_events::common::GenerationServiceProvider;
use enums::common::generation_provider::GenerationProvider;

// TODO(bt,2025-07-15): Get rid of GenerationServiceProvider
pub fn to_generation_service_provider(provider: GenerationProvider) -> GenerationServiceProvider {
  match provider {
    GenerationProvider::Artcraft => GenerationServiceProvider::Artcraft,
    GenerationProvider::Fal => GenerationServiceProvider::Fal,
    GenerationProvider::Grok => GenerationServiceProvider::Grok,
    GenerationProvider::Midjourney => GenerationServiceProvider::Midjourney,
    GenerationProvider::Sora => GenerationServiceProvider::Sora,
    GenerationProvider::WorldLabs => GenerationServiceProvider::WorldLabs,
    GenerationProvider::Higgsfield => GenerationServiceProvider::Higgsfield,
    GenerationProvider::Krea => GenerationServiceProvider::Krea,
    GenerationProvider::Leonardo => GenerationServiceProvider::Leonardo,
    GenerationProvider::Magnific => GenerationServiceProvider::Magnific,
    GenerationProvider::Openart => GenerationServiceProvider::Openart,
    GenerationProvider::Picsart => GenerationServiceProvider::Picsart,
    GenerationProvider::Pixverse => GenerationServiceProvider::Pixverse,
    GenerationProvider::Runway => GenerationServiceProvider::Runway,
  }
}
