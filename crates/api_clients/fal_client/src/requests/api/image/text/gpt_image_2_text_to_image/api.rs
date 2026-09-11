use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::image::common::gpt_image_2_resolution::{
  compute_custom_image_size, GptImage2AspectRatio, GptImage2Resolution,
};
use crate::requests::api::image::text::gpt_image_2_text_to_image::raw_request::{
  GptImage2TextToImageInput, GptImage2TextToImageOutput, ImageSizeParam,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct GptImage2TextToImageRequest {
  /// Text prompt describing the image to generate.
  pub prompt: String,

  /// Number of images to generate.
  pub num_images: GptImage2TextToImageNumImages,

  /// Output image size (aspect ratio preset).
  pub image_size: Option<GptImage2TextToImageSize>,

  /// Optional resolution tier. When present, a custom width x height is
  /// computed from the aspect ratio and this resolution, overriding the
  /// standard preset dimensions.
  pub resolution: Option<GptImage2Resolution>,

  /// Quality level.
  pub quality: Option<GptImage2TextToImageQuality>,

  /// Output format.
  pub output_format: Option<GptImage2TextToImageOutputFormat>,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage2TextToImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage2TextToImageSize {
  SquareHd,
  Square,
  Portrait4x3,
  Portrait16x9,
  Landscape4x3,
  Landscape16x9,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage2TextToImageQuality {
  Low,
  Medium,
  High,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage2TextToImageOutputFormat {
  Jpeg,
  Png,
  Webp,
}

/// Map our image_size enum to the GptImage2AspectRatio used by the resolution
/// calculator.
fn size_to_aspect(size: GptImage2TextToImageSize) -> GptImage2AspectRatio {
  match size {
    GptImage2TextToImageSize::Square => GptImage2AspectRatio::Square,
    GptImage2TextToImageSize::SquareHd => GptImage2AspectRatio::SquareHd,
    GptImage2TextToImageSize::Landscape4x3 => GptImage2AspectRatio::Landscape4x3,
    GptImage2TextToImageSize::Landscape16x9 => GptImage2AspectRatio::Landscape16x9,
    GptImage2TextToImageSize::Portrait4x3 => GptImage2AspectRatio::Portrait4x3,
    GptImage2TextToImageSize::Portrait16x9 => GptImage2AspectRatio::Portrait16x9,
  }
}

impl FalEndpoint for GptImage2TextToImageRequest {
  const ENDPOINT: &str = "openai/gpt-image-2";

  type RawRequest = GptImage2TextToImageInput;
  type RawResponse = GptImage2TextToImageOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let num_images = match self.num_images {
      GptImage2TextToImageNumImages::One => 1,
      GptImage2TextToImageNumImages::Two => 2,
      GptImage2TextToImageNumImages::Three => 3,
      GptImage2TextToImageNumImages::Four => 4,
    };

    let image_size = match (self.image_size, self.resolution) {
      // Resolution present: compute custom dimensions from aspect + resolution
      (Some(size), Some(resolution)) => {
        let aspect = size_to_aspect(size);
        let custom = compute_custom_image_size(aspect, resolution);
        Some(ImageSizeParam::Custom(custom))
      }
      // Resolution present but no image_size: default to Square
      (None, Some(resolution)) => {
        let custom = compute_custom_image_size(GptImage2AspectRatio::Square, resolution);
        Some(ImageSizeParam::Custom(custom))
      }
      // No resolution: use the standard preset string
      (Some(size), None) => {
        let preset = match size {
          GptImage2TextToImageSize::SquareHd => "square_hd",
          GptImage2TextToImageSize::Square => "square",
          GptImage2TextToImageSize::Portrait4x3 => "portrait_4_3",
          GptImage2TextToImageSize::Portrait16x9 => "portrait_16_9",
          GptImage2TextToImageSize::Landscape4x3 => "landscape_4_3",
          GptImage2TextToImageSize::Landscape16x9 => "landscape_16_9",
        };
        Some(ImageSizeParam::Preset(preset.to_string()))
      }
      // Neither: let the API default
      (None, None) => None,
    };

    let quality = self.quality.map(|q| match q {
      GptImage2TextToImageQuality::Low => "low",
      GptImage2TextToImageQuality::Medium => "medium",
      GptImage2TextToImageQuality::High => "high",
    }.to_string());

    let output_format = Some(match self.output_format {
      Some(GptImage2TextToImageOutputFormat::Jpeg) => "jpeg",
      Some(GptImage2TextToImageOutputFormat::Png) => "png",
      Some(GptImage2TextToImageOutputFormat::Webp) => "webp",
      None => "png",
    }.to_string());

    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      num_images: Some(num_images),
      image_size,
      quality,
      output_format,
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::api::image::common::gpt_image_2_resolution::GptImage2Resolution;
  use crate::requests::traits::fal_endpoint_trait::FalEndpoint;
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore] // manually test — requires real API key, incurs costs
  async fn test_text_to_image_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = GptImage2TextToImageRequest {
      prompt: "an anime girl riding on the back of a t-rex".to_string(),
      num_images: GptImage2TextToImageNumImages::One,
      image_size: None,
      resolution: None,
      quality: None,
      output_format: None,
    };

    let result = request.send_queue_request(&api_key).await?;
    println!("Request ID: {}", result.request_id);
    assert!(!result.request_id.is_empty());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real API key, incurs costs
  async fn test_text_to_image_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = GptImage2TextToImageRequest {
      prompt: "a corgi wearing sunglasses at the beach".to_string(),
      num_images: GptImage2TextToImageNumImages::Two,
      image_size: Some(GptImage2TextToImageSize::Landscape16x9),
      resolution: None,
      quality: Some(GptImage2TextToImageQuality::High),
      output_format: Some(GptImage2TextToImageOutputFormat::Png),
    };

    let result = request.send_webhook_request(
      &api_key,
      "https://example.com/webhook",
    ).await?;
    println!("Request ID: {:?}", result.request_id);
    assert!(result.request_id.is_some());
    Ok(())
  }

  /// Combinatorial test: every (image_size, resolution) pair.
  /// The prompt embeds the test parameters so the output image documents
  /// which combination was used.
  #[tokio::test]
  #[ignore] // manually test — requires real API key, incurs costs
  async fn test_combinatorial_size_and_resolution() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let sizes = [
      ("square", GptImage2TextToImageSize::Square),
      ("square_hd", GptImage2TextToImageSize::SquareHd),
      ("landscape_4x3", GptImage2TextToImageSize::Landscape4x3),
      ("landscape_16x9", GptImage2TextToImageSize::Landscape16x9),
      ("portrait_4x3", GptImage2TextToImageSize::Portrait4x3),
      ("portrait_16x9", GptImage2TextToImageSize::Portrait16x9),
    ];

    let resolutions = [
      ("1K", GptImage2Resolution::OneK),
      ("2K", GptImage2Resolution::TwoK),
      ("3K", GptImage2Resolution::ThreeK),
      ("4K", GptImage2Resolution::FourK),
    ];

    let surfaces = ["t-shirt", "sign", "monitor", "billboard", "coffee mug", "poster"];
    let mut surface_idx = 0;

    for (size_name, size) in &sizes {
      for (res_name, resolution) in &resolutions {
        let surface = surfaces[surface_idx % surfaces.len()];
        surface_idx += 1;

        let prompt = format!(
          "A photorealistic {} with the text \"{} {}\" printed on it, studio lighting, white background",
          surface, size_name, res_name,
        );

        let request = GptImage2TextToImageRequest {
          prompt,
          num_images: GptImage2TextToImageNumImages::One,
          image_size: Some(*size),
          resolution: Some(*resolution),
          quality: Some(GptImage2TextToImageQuality::Medium),
          output_format: Some(GptImage2TextToImageOutputFormat::Png),
        };

        let result = request.send_queue_request(&api_key).await?;
        println!("[{} + {}] Request ID: {}", size_name, res_name, result.request_id);
        assert!(!result.request_id.is_empty());
      }
    }

    Ok(())
  }

  mod to_raw_request_tests {
    use super::*;
    use crate::requests::api::image::text::gpt_image_2_text_to_image::raw_request::ImageSizeParam;

    #[test]
    fn preset_without_resolution() {
      let request = GptImage2TextToImageRequest {
        prompt: "test".to_string(),
        num_images: GptImage2TextToImageNumImages::One,
        image_size: Some(GptImage2TextToImageSize::Square),
        resolution: None,
        quality: None,
        output_format: None,
      };
      let raw = request.to_raw_request().unwrap();
      match raw.image_size.unwrap() {
        ImageSizeParam::Preset(s) => assert_eq!(s, "square"),
        ImageSizeParam::Custom(_) => panic!("expected preset"),
      }
    }

    #[test]
    fn custom_with_resolution() {
      let request = GptImage2TextToImageRequest {
        prompt: "test".to_string(),
        num_images: GptImage2TextToImageNumImages::One,
        image_size: Some(GptImage2TextToImageSize::Landscape16x9),
        resolution: Some(GptImage2Resolution::TwoK),
        quality: None,
        output_format: None,
      };
      let raw = request.to_raw_request().unwrap();
      match raw.image_size.unwrap() {
        ImageSizeParam::Custom(c) => {
          assert_eq!(c.width, 2048);
          assert_eq!(c.height, 1152);
        }
        ImageSizeParam::Preset(_) => panic!("expected custom"),
      }
    }

    #[test]
    fn resolution_without_image_size_defaults_to_square() {
      let request = GptImage2TextToImageRequest {
        prompt: "test".to_string(),
        num_images: GptImage2TextToImageNumImages::One,
        image_size: None,
        resolution: Some(GptImage2Resolution::TwoK),
        quality: None,
        output_format: None,
      };
      let raw = request.to_raw_request().unwrap();
      match raw.image_size.unwrap() {
        ImageSizeParam::Custom(c) => {
          assert_eq!(c.width, 2048);
          assert_eq!(c.height, 2048);
        }
        ImageSizeParam::Preset(_) => panic!("expected custom"),
      }
    }

    #[test]
    fn neither_size_nor_resolution() {
      let request = GptImage2TextToImageRequest {
        prompt: "test".to_string(),
        num_images: GptImage2TextToImageNumImages::One,
        image_size: None,
        resolution: None,
        quality: None,
        output_format: None,
      };
      let raw = request.to_raw_request().unwrap();
      assert!(raw.image_size.is_none());
    }
  }

  // NB: Pricing tests are in cost.rs
}
