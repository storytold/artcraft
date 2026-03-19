#[cfg(feature = "accelerate")]
extern crate accelerate_src;
#[cfg(feature = "mkl")]
extern crate intel_mkl_src;

use candle_transformers::models::stable_diffusion;
use anyhow::{Error as E, Result};
use hf_hub::api::sync::Api;
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StableDiffusionVersion {
    V1_5,
    V1_5Inpaint,
    V2_1,
    V2Inpaint,
    Xl,
    XlInpaint,
    Turbo,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ModelFile {
    Tokenizer,
    Tokenizer2,
    Clip,
    Clip2,
    Unet,
    UnetLcm,
    Vae,
}

impl StableDiffusionVersion {
    pub fn repo(&self) -> &'static str {
        match self {
            Self::XlInpaint => "diffusers/stable-diffusion-xl-1.0-inpainting-0.1",
            Self::Xl => "stabilityai/stable-diffusion-xl-base-1.0",
            Self::V2Inpaint => "stabilityai/stable-diffusion-2-inpainting",
            Self::V2_1 => "stabilityai/stable-diffusion-2-1",
            Self::V1_5 => "Lykon/dreamshaper-7",
            Self::V1_5Inpaint => "stable-diffusion-v1-5/stable-diffusion-inpainting",
            Self::Turbo => "Lykon/dreamshaper-7",
        }
    }

    fn unet_file(&self, use_f16: bool) -> &'static str {
        match self {
            Self::V1_5
            | Self::V1_5Inpaint
            | Self::V2_1
            | Self::V2Inpaint
            | Self::Xl
            | Self::XlInpaint
            | Self::Turbo => {
                if use_f16 {
                    "unet/diffusion_pytorch_model.fp16.safetensors"
                } else {
                    "unet/diffusion_pytorch_model.safetensors"
                }
            }
        }
    }

    fn vae_file(&self, use_f16: bool) -> &'static str {
        match self {
            Self::V1_5
            | Self::V1_5Inpaint
            | Self::V2_1
            | Self::V2Inpaint
            | Self::Xl
            | Self::XlInpaint
            | Self::Turbo => {
                if use_f16 {
                    "vae/diffusion_pytorch_model.fp16.safetensors"
                } else {
                    "vae/diffusion_pytorch_model.safetensors"
                }
            }
        }
    }

    fn clip_file(&self, use_f16: bool) -> &'static str {
        match self {
            Self::V1_5
            | Self::V1_5Inpaint
            | Self::V2_1
            | Self::V2Inpaint
            | Self::Xl
            | Self::XlInpaint
            | Self::Turbo => {
                if use_f16 {
                    "text_encoder/model.fp16.safetensors"
                } else {
                    "text_encoder/model.safetensors"
                }
            }
        }
    }

    fn clip2_file(&self, use_f16: bool) -> &'static str {
        match self {
            Self::V1_5
            | Self::V1_5Inpaint
            | Self::V2_1
            | Self::V2Inpaint
            | Self::Xl
            | Self::XlInpaint
            | Self::Turbo => {
                if use_f16 {
                    "text_encoder_2/model.fp16.safetensors"
                } else {
                    "text_encoder_2/model.safetensors"
                }
            }
        }
    }
}

impl ModelFile {
    pub fn get(
        &self,
        filename: Option<String>,
        version: StableDiffusionVersion,
        use_f16: bool,
    ) -> Result<std::path::PathBuf> {
        match filename {
            Some(filename) => Ok(std::path::PathBuf::from(filename)),
            None => {
                let (repo, path) = match self {
                    Self::Tokenizer => {
                        let tokenizer_repo = match version {
                            StableDiffusionVersion::V1_5
                            | StableDiffusionVersion::V2_1
                            | StableDiffusionVersion::V1_5Inpaint
                            | StableDiffusionVersion::V2Inpaint => "openai/clip-vit-base-patch32",
                            StableDiffusionVersion::Xl
                            | StableDiffusionVersion::XlInpaint
                            | StableDiffusionVersion::Turbo => {
                                // This seems similar to the patch32 version except some very small
                                // difference in the split regex.
                                "openai/clip-vit-large-patch14"
                            }
                        };
                        (tokenizer_repo, "tokenizer.json")
                    }
                    Self::Tokenizer2 => {
                        ("laion/CLIP-ViT-bigG-14-laion2B-39B-b160k", "tokenizer.json")
                    }
                    Self::Clip => (version.repo(), version.clip_file(use_f16)),
                    Self::Clip2 => (version.repo(), version.clip2_file(use_f16)),
                    Self::UnetLcm => (
                        "SimianLuo/LCM_Dreamshaper_v7",
                        if use_f16 {
                            "unet/diffusion_pytorch_model.fp16.safetensors"
                        } else {
                            "unet/diffusion_pytorch_model.safetensors"
                        },
                    ),
                    Self::Unet => (version.repo(), version.unet_file(use_f16)),
                    Self::Vae => {
                        // Override for SDXL when using f16 weights.
                        // See https://github.com/huggingface/candle/issues/1060
                        if matches!(
                            version,
                            StableDiffusionVersion::Xl | StableDiffusionVersion::Turbo,
                        ) && use_f16
                        {
                            (
                                "madebyollin/sdxl-vae-fp16-fix",
                                "diffusion_pytorch_model.safetensors",
                            )
                        } else {
                            (version.repo(), version.vae_file(use_f16))
                        }
                    }
                };
                let filename = Api::new()?.model(repo.to_string()).get(path)?;
                Ok(filename)
            }
        }
    }
}
