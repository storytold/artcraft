use strum::EnumIter;
use utoipa::ToSchema;

/// This enum is not backed by a particular database table.
/// It's used in APIs and Jobs to agree upon ComfyUI style transfer style configurations.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Debug, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Deserialize, Serialize, EnumIter, ToSchema)]
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

  // New Styles (2024-05-03)

  #[serde(rename = "hr_giger")]
  HrGiger,
  #[serde(rename = "simpsons")]
  Simpsons,
  #[serde(rename = "carnage")]
  Carnage,
  #[serde(rename = "pastel_cute_anime")] // TODO: Rename
  AnimePastelCute,
  #[serde(rename = "bloom_lighting")]
  BloomLighting,
  #[serde(rename = "25d_horror")] // TODO: Rename
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

  // New Styles (2024-06-27)

  #[serde(rename = "dreamer")] // TODO: Land this in Gitub
  Dreamer,
}

#[cfg(test)]
mod tests {
  use super::StyleTransferName;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(StyleTransferName::iter().count(), 34);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in StyleTransferName::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: StyleTransferName = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
