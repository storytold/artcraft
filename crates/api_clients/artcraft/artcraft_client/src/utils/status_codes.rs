pub const STATUS_400_BAD_REQUEST: u16 = 400;

pub const STATUS_401_UNAUTHORIZED : u16 = 401u16;

pub const STATUS_402_PAYMENT_REQUIRED : u16 = 402u16;
pub const STATUS_403_FORBIDDEN : u16 = 403u16;

pub const STATUS_404_NOT_FOUND : u16 = 404u16;

pub const STATUS_429_TOO_MANY_REQUESTS : u16 = 429u16;

pub const STATUS_500_INTERNAL_SERVER_ERROR : u16 = 500u16;

#[cfg(test)]
mod tests {
  use crate::utils::status_codes::*;

  #[test]
  pub fn test_codes() {
    assert_eq!(STATUS_401_UNAUTHORIZED, 401);
    assert_eq!(STATUS_402_PAYMENT_REQUIRED, 402);
    assert_eq!(STATUS_403_FORBIDDEN, 403);
    assert_eq!(STATUS_404_NOT_FOUND, 404);
    assert_eq!(STATUS_429_TOO_MANY_REQUESTS, 429);
    assert_eq!(STATUS_500_INTERNAL_SERVER_ERROR, 500);
  }
}
