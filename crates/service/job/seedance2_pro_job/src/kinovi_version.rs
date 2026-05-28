
#[derive(Debug, Clone, Copy)]
pub enum KinoviVersion {
  Volcengine,
  BytePlus,
  BytePlusUltra,
}

impl KinoviVersion {
  pub fn has_characters(&self) -> bool {
    match self {
      KinoviVersion::Volcengine => true,
      KinoviVersion::BytePlus => false,
      KinoviVersion::BytePlusUltra => false,
    }
  }
}
