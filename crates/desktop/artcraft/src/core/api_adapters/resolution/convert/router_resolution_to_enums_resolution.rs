use artcraft_router::api::router_resolution::RouterResolution;
use enums::common::generation::common_resolution::CommonResolution as EnumsCommonResolution;

/// Map from the router's CommonResolution to the enums crate's CommonResolution.
pub fn router_resolution_to_enums_resolution(res: RouterResolution) -> EnumsCommonResolution {
  match res {
    RouterResolution::OneK => EnumsCommonResolution::OneK,
    RouterResolution::TwoK => EnumsCommonResolution::TwoK,
    RouterResolution::ThreeK => EnumsCommonResolution::ThreeK,
    RouterResolution::FourK => EnumsCommonResolution::FourK,
    RouterResolution::HalfK => EnumsCommonResolution::HalfK,
    RouterResolution::FourEightyP => EnumsCommonResolution::FourEightyP,
    RouterResolution::SevenTwentyP => EnumsCommonResolution::SevenTwentyP,
    RouterResolution::TenEightyP => EnumsCommonResolution::TenEightyP,
  }
}
