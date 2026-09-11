use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::image::common::gpt_image_2_resolution::{
  compute_custom_image_size, GptImage2AspectRatio, GptImage2Resolution,
};
use crate::requests::api::image::edit::gpt_image_2_edit_image::raw_request::{
  GptImage2EditImageInput, GptImage2EditImageOutput, ImageSizeParam,
};
use crate::requests::traits::fal_endpoint_trait::FalEndpoint;

#[derive(Clone, Debug)]
pub struct GptImage2EditImageRequest {
  /// Text prompt describing the edit to make.
  pub prompt: String,

  /// One or more source image URLs to edit.
  pub image_urls: Vec<String>,

  /// Number of images to generate.
  pub num_images: GptImage2EditImageNumImages,

  /// Optional mask URL indicating what part of the image to edit.
  pub mask_url: Option<String>,

  /// Output image size (aspect ratio preset).
  pub image_size: Option<GptImage2EditImageSize>,

  /// Optional resolution tier. When present, a custom width x height is
  /// computed from the aspect ratio and this resolution, overriding the
  /// standard preset dimensions. Not applicable when image_size is Auto.
  pub resolution: Option<GptImage2Resolution>,

  /// Quality level.
  pub quality: Option<GptImage2EditImageQuality>,

  /// Output format.
  pub output_format: Option<GptImage2EditImageOutputFormat>,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage2EditImageNumImages {
  One,
  Two,
  Three,
  Four,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage2EditImageSize {
  SquareHd,
  Square,
  Portrait4x3,
  Portrait16x9,
  Landscape4x3,
  Landscape16x9,
  Auto,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage2EditImageQuality {
  Low,
  Medium,
  High,
}

#[derive(Copy, Clone, Debug)]
pub enum GptImage2EditImageOutputFormat {
  Jpeg,
  Png,
  Webp,
}

/// Map image_size to GptImage2AspectRatio. Returns None for Auto (no
/// meaningful aspect ratio to compute custom dimensions from).
fn size_to_aspect(size: GptImage2EditImageSize) -> Option<GptImage2AspectRatio> {
  match size {
    GptImage2EditImageSize::Square => Some(GptImage2AspectRatio::Square),
    GptImage2EditImageSize::SquareHd => Some(GptImage2AspectRatio::SquareHd),
    GptImage2EditImageSize::Landscape4x3 => Some(GptImage2AspectRatio::Landscape4x3),
    GptImage2EditImageSize::Landscape16x9 => Some(GptImage2AspectRatio::Landscape16x9),
    GptImage2EditImageSize::Portrait4x3 => Some(GptImage2AspectRatio::Portrait4x3),
    GptImage2EditImageSize::Portrait16x9 => Some(GptImage2AspectRatio::Portrait16x9),
    GptImage2EditImageSize::Auto => None,
  }
}

fn size_to_preset_str(size: GptImage2EditImageSize) -> &'static str {
  match size {
    GptImage2EditImageSize::SquareHd => "square_hd",
    GptImage2EditImageSize::Square => "square",
    GptImage2EditImageSize::Portrait4x3 => "portrait_4_3",
    GptImage2EditImageSize::Portrait16x9 => "portrait_16_9",
    GptImage2EditImageSize::Landscape4x3 => "landscape_4_3",
    GptImage2EditImageSize::Landscape16x9 => "landscape_16_9",
    GptImage2EditImageSize::Auto => "auto",
  }
}

impl FalEndpoint for GptImage2EditImageRequest {
  const ENDPOINT: &str = "openai/gpt-image-2/edit";

  type RawRequest = GptImage2EditImageInput;
  type RawResponse = GptImage2EditImageOutput;

  fn to_raw_request(&self) -> Result<Self::RawRequest, FalErrorPlus> {
    let num_images = match self.num_images {
      GptImage2EditImageNumImages::One => 1,
      GptImage2EditImageNumImages::Two => 2,
      GptImage2EditImageNumImages::Three => 3,
      GptImage2EditImageNumImages::Four => 4,
    };

    let image_size = match (self.image_size, self.resolution) {
      // Resolution present with a non-Auto size: compute custom dimensions
      (Some(size), Some(resolution)) => {
        match size_to_aspect(size) {
          Some(aspect) => {
            let custom = compute_custom_image_size(aspect, resolution);
            Some(ImageSizeParam::Custom(custom))
          }
          // Auto + resolution: can't compute dimensions, fall back to preset
          None => Some(ImageSizeParam::Preset(size_to_preset_str(size).to_string())),
        }
      }
      // Resolution present but no image_size: default to Square
      (None, Some(resolution)) => {
        let custom = compute_custom_image_size(GptImage2AspectRatio::Square, resolution);
        Some(ImageSizeParam::Custom(custom))
      }
      // No resolution: use the standard preset string
      (Some(size), None) => {
        Some(ImageSizeParam::Preset(size_to_preset_str(size).to_string()))
      }
      // Neither: let the API default
      (None, None) => None,
    };

    let quality = self.quality.map(|q| match q {
      GptImage2EditImageQuality::Low => "low",
      GptImage2EditImageQuality::Medium => "medium",
      GptImage2EditImageQuality::High => "high",
    }.to_string());

    let output_format = Some(match self.output_format {
      Some(GptImage2EditImageOutputFormat::Jpeg) => "jpeg",
      Some(GptImage2EditImageOutputFormat::Png) => "png",
      Some(GptImage2EditImageOutputFormat::Webp) => "webp",
      None => "png",
    }.to_string());

    Ok(Self::RawRequest {
      prompt: self.prompt.clone(),
      image_urls: self.image_urls.clone(),
      num_images: Some(num_images),
      mask_url: self.mask_url.clone(),
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
  use test_data::web::image_urls::{ERNEST_SCARED_STUPID_IMAGE_URL, GHOST_IMAGE_URL, TREX_SKELETON_IMAGE_URL};

  #[tokio::test]
  #[ignore] // manually test — requires real API key, incurs costs
  async fn test_edit_image_queue() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = GptImage2EditImageRequest {
      image_urls: vec![
        GHOST_IMAGE_URL.to_string(),
        TREX_SKELETON_IMAGE_URL.to_string(),
        ERNEST_SCARED_STUPID_IMAGE_URL.to_string(),
      ],
      prompt: "add the ghost and scared man to the image of the t-rex skeleton, make it look spooky but friendly".to_string(),
      num_images: GptImage2EditImageNumImages::Two,
      mask_url: None,
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
  async fn test_edit_image_webhook() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let request = GptImage2EditImageRequest {
      image_urls: vec![GHOST_IMAGE_URL.to_string()],
      prompt: "make the ghost wear a top hat".to_string(),
      num_images: GptImage2EditImageNumImages::One,
      mask_url: None,
      image_size: Some(GptImage2EditImageSize::Square),
      resolution: None,
      quality: Some(GptImage2EditImageQuality::High),
      output_format: Some(GptImage2EditImageOutputFormat::Png),
    };

    let result = request.send_webhook_request(
      &api_key,
      "https://example.com/webhook",
    ).await?;
    println!("Request ID: {:?}", result.request_id);
    assert!(result.request_id.is_some());
    Ok(())
  }

  /// Combinatorial test: every (image_size, resolution) pair for edit-image.
  /// Uses a test_data source image and prompts to include the test parameters
  /// as text in the output.
  #[tokio::test]
  #[ignore] // manually test — requires real API key, incurs costs
  async fn test_combinatorial_size_and_resolution() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let sizes = [
      ("square", GptImage2EditImageSize::Square),
      ("square_hd", GptImage2EditImageSize::SquareHd),
      ("landscape_4x3", GptImage2EditImageSize::Landscape4x3),
      ("landscape_16x9", GptImage2EditImageSize::Landscape16x9),
      ("portrait_4x3", GptImage2EditImageSize::Portrait4x3),
      ("portrait_16x9", GptImage2EditImageSize::Portrait16x9),
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
          "Edit this image: add a {} with the text \"{} {}\" prominently displayed, studio lighting",
          surface, size_name, res_name,
        );

        let request = GptImage2EditImageRequest {
          prompt,
          image_urls: vec![GHOST_IMAGE_URL.to_string()],
          num_images: GptImage2EditImageNumImages::One,
          mask_url: None,
          image_size: Some(*size),
          resolution: Some(*resolution),
          quality: Some(GptImage2EditImageQuality::Medium),
          output_format: Some(GptImage2EditImageOutputFormat::Png),
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
    use crate::requests::api::image::edit::gpt_image_2_edit_image::raw_request::ImageSizeParam;

    fn make_request(
      image_size: Option<GptImage2EditImageSize>,
      resolution: Option<GptImage2Resolution>,
    ) -> GptImage2EditImageRequest {
      GptImage2EditImageRequest {
        prompt: "test".to_string(),
        image_urls: vec!["https://example.com/image.png".to_string()],
        num_images: GptImage2EditImageNumImages::One,
        mask_url: None,
        image_size,
        resolution,
        quality: None,
        output_format: None,
      }
    }

    #[test]
    fn preset_without_resolution() {
      let raw = make_request(Some(GptImage2EditImageSize::Square), None)
        .to_raw_request().unwrap();
      match raw.image_size.unwrap() {
        ImageSizeParam::Preset(s) => assert_eq!(s, "square"),
        ImageSizeParam::Custom(_) => panic!("expected preset"),
      }
    }

    #[test]
    fn auto_without_resolution() {
      let raw = make_request(Some(GptImage2EditImageSize::Auto), None)
        .to_raw_request().unwrap();
      match raw.image_size.unwrap() {
        ImageSizeParam::Preset(s) => assert_eq!(s, "auto"),
        ImageSizeParam::Custom(_) => panic!("expected preset"),
      }
    }

    #[test]
    fn custom_with_resolution() {
      let raw = make_request(
        Some(GptImage2EditImageSize::Landscape16x9),
        Some(GptImage2Resolution::TwoK),
      ).to_raw_request().unwrap();
      match raw.image_size.unwrap() {
        ImageSizeParam::Custom(c) => {
          assert_eq!(c.width, 2048);
          assert_eq!(c.height, 1152);
        }
        ImageSizeParam::Preset(_) => panic!("expected custom"),
      }
    }

    #[test]
    fn auto_with_resolution_falls_back_to_preset() {
      let raw = make_request(
        Some(GptImage2EditImageSize::Auto),
        Some(GptImage2Resolution::TwoK),
      ).to_raw_request().unwrap();
      match raw.image_size.unwrap() {
        ImageSizeParam::Preset(s) => assert_eq!(s, "auto"),
        ImageSizeParam::Custom(_) => panic!("expected preset for Auto + resolution"),
      }
    }

    #[test]
    fn resolution_without_image_size_defaults_to_square() {
      let raw = make_request(None, Some(GptImage2Resolution::TwoK))
        .to_raw_request().unwrap();
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
      let raw = make_request(None, None).to_raw_request().unwrap();
      assert!(raw.image_size.is_none());
    }
  }

  // NB: Pricing tests are in cost.rs
}
