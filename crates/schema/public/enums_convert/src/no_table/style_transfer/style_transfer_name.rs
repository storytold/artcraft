use enums_api::no_table::style_transfer::style_transfer_name::StyleTransferName as Api;
use enums_db::no_table::style_transfer::style_transfer_name::StyleTransferName as Db;

pub fn style_transfer_name_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Anime2_5D => Db::Anime2_5D,
    Api::Anime2DFlat => Db::Anime2DFlat,
    Api::Cartoon3D => Db::Cartoon3D,
    Api::ComicBook => Db::ComicBook,
    Api::AnimeGhibli => Db::AnimeGhibli,
    Api::InkPunk => Db::InkPunk,
    Api::InkSplash => Db::InkSplash,
    Api::InkBWStyle => Db::InkBWStyle,
    Api::JojoStyle => Db::JojoStyle,
    Api::PaperOrigami => Db::PaperOrigami,
    Api::PixelArt => Db::PixelArt,
    Api::PopArt => Db::PopArt,
    Api::Realistic1 => Db::Realistic1,
    Api::Realistic2 => Db::Realistic2,
    Api::AnimeRetroNeon => Db::AnimeRetroNeon,
    Api::AnimeStandard => Db::AnimeStandard,
    Api::HrGiger => Db::HrGiger,
    Api::Simpsons => Db::Simpsons,
    Api::Carnage => Db::Carnage,
    Api::AnimePastelCute => Db::AnimePastelCute,
    Api::BloomLighting => Db::BloomLighting,
    Api::Horror2_5D => Db::Horror2_5D,
    Api::Creepy => Db::Creepy,
    Api::CreepyVhs => Db::CreepyVhs,
    Api::TrailCamFootage => Db::TrailCamFootage,
    Api::OldBlackWhiteMovie => Db::OldBlackWhiteMovie,
    Api::HorrorNoirBlackWhite => Db::HorrorNoirBlackWhite,
    Api::TechnoNoirBlackWhite => Db::TechnoNoirBlackWhite,
    Api::BlackWhite20s => Db::BlackWhite20s,
    Api::CyberpunkAnime => Db::CyberpunkAnime,
    Api::Dragonball => Db::Dragonball,
    Api::RealisticMatrix => Db::RealisticMatrix,
    Api::RealisticCyberpunk => Db::RealisticCyberpunk,
    Api::Dreamer => Db::Dreamer,
  }
}

pub fn style_transfer_name_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Anime2_5D => Api::Anime2_5D,
    Db::Anime2DFlat => Api::Anime2DFlat,
    Db::Cartoon3D => Api::Cartoon3D,
    Db::ComicBook => Api::ComicBook,
    Db::AnimeGhibli => Api::AnimeGhibli,
    Db::InkPunk => Api::InkPunk,
    Db::InkSplash => Api::InkSplash,
    Db::InkBWStyle => Api::InkBWStyle,
    Db::JojoStyle => Api::JojoStyle,
    Db::PaperOrigami => Api::PaperOrigami,
    Db::PixelArt => Api::PixelArt,
    Db::PopArt => Api::PopArt,
    Db::Realistic1 => Api::Realistic1,
    Db::Realistic2 => Api::Realistic2,
    Db::AnimeRetroNeon => Api::AnimeRetroNeon,
    Db::AnimeStandard => Api::AnimeStandard,
    Db::HrGiger => Api::HrGiger,
    Db::Simpsons => Api::Simpsons,
    Db::Carnage => Api::Carnage,
    Db::AnimePastelCute => Api::AnimePastelCute,
    Db::BloomLighting => Api::BloomLighting,
    Db::Horror2_5D => Api::Horror2_5D,
    Db::Creepy => Api::Creepy,
    Db::CreepyVhs => Api::CreepyVhs,
    Db::TrailCamFootage => Api::TrailCamFootage,
    Db::OldBlackWhiteMovie => Api::OldBlackWhiteMovie,
    Db::HorrorNoirBlackWhite => Api::HorrorNoirBlackWhite,
    Db::TechnoNoirBlackWhite => Api::TechnoNoirBlackWhite,
    Db::BlackWhite20s => Api::BlackWhite20s,
    Db::CyberpunkAnime => Api::CyberpunkAnime,
    Db::Dragonball => Api::Dragonball,
    Db::RealisticMatrix => Api::RealisticMatrix,
    Db::RealisticCyberpunk => Api::RealisticCyberpunk,
    Db::Dreamer => Api::Dreamer,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for db_variant in Db::iter() {
      let api = style_transfer_name_to_api(&db_variant);
      let db = style_transfer_name_to_db(&api);
      let back = style_transfer_name_to_api(&db);
      assert_eq!(api, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = style_transfer_name_to_api(&variant);
      let back = style_transfer_name_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
