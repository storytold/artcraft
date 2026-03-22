use strum::EnumCount;
use strum::EnumIter;

/// This enum is not backed by a particular database table.
/// It's used in Jobs and DB payloads to agree upon ComfyUI style transfer style configurations.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Deserialize, Serialize, EnumIter, EnumCount)]
#[serde(rename_all = "snake_case")]
pub enum StyleTransferName {
  #[serde(rename = "anime_2_5d")]
  Anime2_5D,
  #[serde(rename = "anime_2d_flat")]
  Anime2DFlat,
  #[serde(rename = "cartoon_3d")]
  Cartoon3D,
  #[serde(rename = "comic_book")]
  ComicBook,
  #[serde(rename = "anime_ghibli")]
  AnimeGhibli,
  #[serde(rename = "ink_punk")]
  InkPunk,
  #[serde(rename = "ink_splash")]
  InkSplash,
  #[serde(rename = "ink_bw_style")]
  InkBWStyle,
  #[serde(rename = "jojo_style")]
  JojoStyle,
  #[serde(rename = "paper_origami")]
  PaperOrigami,
  #[serde(rename = "pixel_art")]
  PixelArt,
  #[serde(rename = "pop_art")]
  PopArt,
  #[serde(rename = "realistic_1")]
  Realistic1,
  #[serde(rename = "realistic_2")]
  Realistic2,
  #[serde(rename = "anime_retro_neon")]
  AnimeRetroNeon,
  #[serde(rename = "anime_standard")]
  AnimeStandard,
  #[serde(rename = "hr_giger")]
  HrGiger,
  #[serde(rename = "simpsons")]
  Simpsons,
  #[serde(rename = "carnage")]
  Carnage,
  #[serde(rename = "pastel_cute_anime")]
  AnimePastelCute,
  #[serde(rename = "bloom_lighting")]
  BloomLighting,
  #[serde(rename = "25d_horror")]
  Horror2_5D,
  #[serde(rename = "creepy")]
  Creepy,
  #[serde(rename = "creepy_vhs")]
  CreepyVhs,
  #[serde(rename = "trail_cam_footage")]
  TrailCamFootage,
  #[serde(rename = "old_black_white_movie")]
  OldBlackWhiteMovie,
  #[serde(rename = "horror_noir_black_white")]
  HorrorNoirBlackWhite,
  #[serde(rename = "techno_noir_black_white")]
  TechnoNoirBlackWhite,
  #[serde(rename = "black_white_20s")]
  BlackWhite20s,
  #[serde(rename = "cyberpunk_anime")]
  CyberpunkAnime,
  #[serde(rename = "dragonball")]
  Dragonball,
  #[serde(rename = "realistic_matrix")]
  RealisticMatrix,
  #[serde(rename = "realistic_cyberpunk")]
  RealisticCyberpunk,
  #[serde(rename = "dreamer")]
  Dreamer,
}

impl_enum_display_and_debug_using_to_str!(StyleTransferName);

impl StyleTransferName {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Anime2_5D => "anime_2_5d",
      Self::Anime2DFlat => "anime_2d_flat",
      Self::Cartoon3D => "cartoon_3d",
      Self::ComicBook => "comic_book",
      Self::AnimeGhibli => "anime_ghibli",
      Self::InkPunk => "ink_punk",
      Self::InkSplash => "ink_splash",
      Self::InkBWStyle => "ink_bw_style",
      Self::JojoStyle => "jojo_style",
      Self::PaperOrigami => "paper_origami",
      Self::PixelArt => "pixel_art",
      Self::PopArt => "pop_art",
      Self::Realistic1 => "realistic_1",
      Self::Realistic2 => "realistic_2",
      Self::AnimeRetroNeon => "anime_retro_neon",
      Self::AnimeStandard => "anime_standard",
      Self::HrGiger => "hr_giger",
      Self::Simpsons => "simpsons",
      Self::Carnage => "carnage",
      Self::AnimePastelCute => "pastel_cute_anime",
      Self::BloomLighting => "bloom_lighting",
      Self::Horror2_5D => "25d_horror",
      Self::Creepy => "creepy",
      Self::CreepyVhs => "creepy_vhs",
      Self::TrailCamFootage => "trail_cam_footage",
      Self::OldBlackWhiteMovie => "old_black_white_movie",
      Self::HorrorNoirBlackWhite => "horror_noir_black_white",
      Self::TechnoNoirBlackWhite => "techno_noir_black_white",
      Self::BlackWhite20s => "black_white_20s",
      Self::CyberpunkAnime => "cyberpunk_anime",
      Self::Dragonball => "dragonball",
      Self::RealisticMatrix => "realistic_matrix",
      Self::RealisticCyberpunk => "realistic_cyberpunk",
      Self::Dreamer => "dreamer",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "anime_2_5d" => Ok(Self::Anime2_5D),
      "anime_2d_flat" => Ok(Self::Anime2DFlat),
      "cartoon_3d" => Ok(Self::Cartoon3D),
      "comic_book" => Ok(Self::ComicBook),
      "anime_ghibli" => Ok(Self::AnimeGhibli),
      "ink_punk" => Ok(Self::InkPunk),
      "ink_splash" => Ok(Self::InkSplash),
      "ink_bw_style" => Ok(Self::InkBWStyle),
      "jojo_style" => Ok(Self::JojoStyle),
      "paper_origami" => Ok(Self::PaperOrigami),
      "pixel_art" => Ok(Self::PixelArt),
      "pop_art" => Ok(Self::PopArt),
      "realistic_1" => Ok(Self::Realistic1),
      "realistic_2" => Ok(Self::Realistic2),
      "anime_retro_neon" => Ok(Self::AnimeRetroNeon),
      "anime_standard" => Ok(Self::AnimeStandard),
      "hr_giger" => Ok(Self::HrGiger),
      "simpsons" => Ok(Self::Simpsons),
      "carnage" => Ok(Self::Carnage),
      "pastel_cute_anime" => Ok(Self::AnimePastelCute),
      "bloom_lighting" => Ok(Self::BloomLighting),
      "25d_horror" => Ok(Self::Horror2_5D),
      "creepy" => Ok(Self::Creepy),
      "creepy_vhs" => Ok(Self::CreepyVhs),
      "trail_cam_footage" => Ok(Self::TrailCamFootage),
      "old_black_white_movie" => Ok(Self::OldBlackWhiteMovie),
      "horror_noir_black_white" => Ok(Self::HorrorNoirBlackWhite),
      "techno_noir_black_white" => Ok(Self::TechnoNoirBlackWhite),
      "black_white_20s" => Ok(Self::BlackWhite20s),
      "cyberpunk_anime" => Ok(Self::CyberpunkAnime),
      "dragonball" => Ok(Self::Dragonball),
      "realistic_matrix" => Ok(Self::RealisticMatrix),
      "realistic_cyberpunk" => Ok(Self::RealisticCyberpunk),
      "dreamer" => Ok(Self::Dreamer),
      _ => Err(format!("Unknown StyleTransferName: {}", value)),
    }
  }

  pub fn to_filename(&self) -> &'static str {
    match self {
      Self::Anime2_5D => "1_2.5d_anime_model.json",
      Self::Anime2DFlat => "2_2d_flat_anime_model.json",
      Self::Cartoon3D => "3_3d_cartoon_style.json",
      Self::ComicBook => "4_comic_book_model.json",
      Self::AnimeGhibli => "5_ghibli_anime_model.json",
      Self::InkPunk => "6_ink_punk.json",
      Self::InkSplash => "7_ink_splash.json",
      Self::InkBWStyle => "8_ink_w_and_b_style.json",
      Self::JojoStyle => "9_jojo_style.json",
      Self::PaperOrigami => "10_paper_origami.json",
      Self::PixelArt => "11_pixel_art.json",
      Self::PopArt => "12_pop_art.json",
      Self::Realistic1 => "13_realistic_1.json",
      Self::Realistic2 => "14_realistic_2.json",
      Self::AnimeRetroNeon => "15_retro_neon_anime_90.json",
      Self::AnimeStandard => "16_standard_anime_model.json",
      Self::HrGiger => "17_hr_giger.json",
      Self::Simpsons => "18_simpsons.json",
      Self::Carnage => "19_carnage.json",
      Self::AnimePastelCute => "20_pastel_cute_anime.json",
      Self::BloomLighting => "21_bloom_lighting.json",
      Self::Horror2_5D => "22_25D_Horror.json",
      Self::Creepy => "23_creepy.json",
      Self::CreepyVhs => "24_creepy_vhs.json",
      Self::TrailCamFootage => "25_trail_cam_footage.json",
      Self::OldBlackWhiteMovie => "26_old_black_white_movie.json",
      Self::HorrorNoirBlackWhite => "27_horror_noir_black_white.json",
      Self::TechnoNoirBlackWhite => "28_techno_noir_black_white.json",
      Self::BlackWhite20s => "29_black_white_20s.json",
      Self::CyberpunkAnime => "30_cyberpunk_anime.json",
      Self::Dragonball => "31_dragonball.json",
      Self::RealisticMatrix => "32_realistic_matrix.json",
      Self::RealisticCyberpunk => "33_realistic_cyberpunk.json",
      Self::Dreamer => "34_dreamer.json",
    }
  }
}

#[cfg(test)]
mod tests {
  use super::StyleTransferName;
  use enums_shared::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(StyleTransferName::Anime2_5D, "anime_2_5d");
    assert_serialization(StyleTransferName::Dreamer, "dreamer");
  }

  mod mechanical_checks {
    use super::*;
    use strum::IntoEnumIterator;

    #[test]
    fn round_trip() {
      for variant in StyleTransferName::iter() {
        assert_eq!(variant, StyleTransferName::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, StyleTransferName::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, StyleTransferName::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 32; // TODO(bt): Confirm database column width, then remove this comment.
      for variant in StyleTransferName::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
