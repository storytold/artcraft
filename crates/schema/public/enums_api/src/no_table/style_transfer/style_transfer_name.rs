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
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(StyleTransferName::Anime2_5D, "anime_2_5d");
      assert_serialization(StyleTransferName::Anime2DFlat, "anime_2d_flat");
      assert_serialization(StyleTransferName::Cartoon3D, "cartoon_3d");
      assert_serialization(StyleTransferName::ComicBook, "comic_book");
      assert_serialization(StyleTransferName::AnimeGhibli, "anime_ghibli");
      assert_serialization(StyleTransferName::InkPunk, "ink_punk");
      assert_serialization(StyleTransferName::InkSplash, "ink_splash");
      assert_serialization(StyleTransferName::InkBWStyle, "ink_bw_style");
      assert_serialization(StyleTransferName::JojoStyle, "jojo_style");
      assert_serialization(StyleTransferName::PaperOrigami, "paper_origami");
      assert_serialization(StyleTransferName::PixelArt, "pixel_art");
      assert_serialization(StyleTransferName::PopArt, "pop_art");
      assert_serialization(StyleTransferName::Realistic1, "realistic_1");
      assert_serialization(StyleTransferName::Realistic2, "realistic_2");
      assert_serialization(StyleTransferName::AnimeRetroNeon, "anime_retro_neon");
      assert_serialization(StyleTransferName::AnimeStandard, "anime_standard");
      assert_serialization(StyleTransferName::HrGiger, "hr_giger");
      assert_serialization(StyleTransferName::Simpsons, "simpsons");
      assert_serialization(StyleTransferName::Carnage, "carnage");
      assert_serialization(StyleTransferName::AnimePastelCute, "pastel_cute_anime");
      assert_serialization(StyleTransferName::BloomLighting, "bloom_lighting");
      assert_serialization(StyleTransferName::Horror2_5D, "25d_horror");
      assert_serialization(StyleTransferName::Creepy, "creepy");
      assert_serialization(StyleTransferName::CreepyVhs, "creepy_vhs");
      assert_serialization(StyleTransferName::TrailCamFootage, "trail_cam_footage");
      assert_serialization(StyleTransferName::OldBlackWhiteMovie, "old_black_white_movie");
      assert_serialization(StyleTransferName::HorrorNoirBlackWhite, "horror_noir_black_white");
      assert_serialization(StyleTransferName::TechnoNoirBlackWhite, "techno_noir_black_white");
      assert_serialization(StyleTransferName::BlackWhite20s, "black_white_20s");
      assert_serialization(StyleTransferName::CyberpunkAnime, "cyberpunk_anime");
      assert_serialization(StyleTransferName::Dragonball, "dragonball");
      assert_serialization(StyleTransferName::RealisticMatrix, "realistic_matrix");
      assert_serialization(StyleTransferName::RealisticCyberpunk, "realistic_cyberpunk");
      assert_serialization(StyleTransferName::Dreamer, "dreamer");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("anime_2_5d", StyleTransferName::Anime2_5D);
      assert_deserialization("anime_2d_flat", StyleTransferName::Anime2DFlat);
      assert_deserialization("cartoon_3d", StyleTransferName::Cartoon3D);
      assert_deserialization("comic_book", StyleTransferName::ComicBook);
      assert_deserialization("anime_ghibli", StyleTransferName::AnimeGhibli);
      assert_deserialization("ink_punk", StyleTransferName::InkPunk);
      assert_deserialization("ink_splash", StyleTransferName::InkSplash);
      assert_deserialization("ink_bw_style", StyleTransferName::InkBWStyle);
      assert_deserialization("jojo_style", StyleTransferName::JojoStyle);
      assert_deserialization("paper_origami", StyleTransferName::PaperOrigami);
      assert_deserialization("pixel_art", StyleTransferName::PixelArt);
      assert_deserialization("pop_art", StyleTransferName::PopArt);
      assert_deserialization("realistic_1", StyleTransferName::Realistic1);
      assert_deserialization("realistic_2", StyleTransferName::Realistic2);
      assert_deserialization("anime_retro_neon", StyleTransferName::AnimeRetroNeon);
      assert_deserialization("anime_standard", StyleTransferName::AnimeStandard);
      assert_deserialization("hr_giger", StyleTransferName::HrGiger);
      assert_deserialization("simpsons", StyleTransferName::Simpsons);
      assert_deserialization("carnage", StyleTransferName::Carnage);
      assert_deserialization("pastel_cute_anime", StyleTransferName::AnimePastelCute);
      assert_deserialization("bloom_lighting", StyleTransferName::BloomLighting);
      assert_deserialization("25d_horror", StyleTransferName::Horror2_5D);
      assert_deserialization("creepy", StyleTransferName::Creepy);
      assert_deserialization("creepy_vhs", StyleTransferName::CreepyVhs);
      assert_deserialization("trail_cam_footage", StyleTransferName::TrailCamFootage);
      assert_deserialization("old_black_white_movie", StyleTransferName::OldBlackWhiteMovie);
      assert_deserialization("horror_noir_black_white", StyleTransferName::HorrorNoirBlackWhite);
      assert_deserialization("techno_noir_black_white", StyleTransferName::TechnoNoirBlackWhite);
      assert_deserialization("black_white_20s", StyleTransferName::BlackWhite20s);
      assert_deserialization("cyberpunk_anime", StyleTransferName::CyberpunkAnime);
      assert_deserialization("dragonball", StyleTransferName::Dragonball);
      assert_deserialization("realistic_matrix", StyleTransferName::RealisticMatrix);
      assert_deserialization("realistic_cyberpunk", StyleTransferName::RealisticCyberpunk);
      assert_deserialization("dreamer", StyleTransferName::Dreamer);
    }

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
