use artcraft_router::api::common_resolution::CommonResolution as RouterCommonResolution;
use enums::common::generation::common_resolution::CommonResolution as EnumsCommonResolution;

/// Map from the router's CommonResolution to the enums crate's CommonResolution.
pub fn router_resolution_to_enums_resolution(res: RouterCommonResolution) -> EnumsCommonResolution {
  match res {
    RouterCommonResolution::OneK => EnumsCommonResolution::OneK,
    RouterCommonResolution::TwoK => EnumsCommonResolution::TwoK,
    RouterCommonResolution::ThreeK => EnumsCommonResolution::ThreeK,
    RouterCommonResolution::FourK => EnumsCommonResolution::FourK,
    RouterCommonResolution::HalfK => EnumsCommonResolution::HalfK,
    RouterCommonResolution::FourEightyP => EnumsCommonResolution::FourEightyP,
    RouterCommonResolution::SevenTwentyP => EnumsCommonResolution::SevenTwentyP,
    RouterCommonResolution::TenEightyP => EnumsCommonResolution::TenEightyP,
  }
}
