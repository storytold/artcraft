//! Types shared by the four GPT Image 2.5 endpoints (Flare / Sunburst, text-to-image / edit).
//!
//! All four endpoints accept the same parameters and are priced from the same token table;
//! only the Fal endpoint path differs. The per-endpoint request types under `text/` and
//! `edit/` are thin wrappers around the params structs defined here.
//!
//! GPT Image 2.5 shares GPT Image 2's dimension constraints (multiples of 16, max edge 3840,
//! aspect <= 3:1, 655,360 <= pixels <= 8,294,400), so the resolution tiers and custom size
//! calculator in `gpt_image_2_resolution` are reused as-is.

pub mod gpt_image_2p5_text_to_image_params;
pub mod gpt_image_2p5_edit_image_params;
pub mod gpt_image_2p5_image_size;
pub mod gpt_image_2p5_quality;
pub mod gpt_image_2p5_background;
pub mod gpt_image_2p5_output_format;
pub mod gpt_image_2p5_num_images;
pub mod gpt_image_2p5_pricing;
pub mod raw;
