/// Kinovi credits per US dollar at the enterprise bulk purchase rate (us).
///
/// Current package: 525,000 credits for $2,159.0909 (~243.16 credits/$1,
/// rounded down to 243).
///
/// Historical packages, for reference:
/// - 500,000 credits for $2,159.09 (~231.58 credits/$1, rounded down to 231)
/// - 22,000 credits for $114 (~192.98 credits/$1, rounded to 193)
pub const ENTERPRISE_CREDITS_PER_DOLLAR: u64 = 243;

/// Kinovi credits per US dollar at the ordinary consumer purchase rate
/// (22,000 credits for $114, ~192.98 credits/$1).
pub const CONSUMER_CREDITS_PER_DOLLAR: u64 = 193;

/// [`ENTERPRISE_CREDITS_PER_DOLLAR`] as a float. Prefer this in new code;
/// the u64 constants will migrate here later.
pub const ENTERPRISE_CREDITS_PER_DOLLAR_FLOAT: f64 = 243.16f64;

/// [`CONSUMER_CREDITS_PER_DOLLAR`] as a float. Prefer this in new code;
/// the u64 constants will migrate here later.
pub const CONSUMER_CREDITS_PER_DOLLAR_FLOAT: f64 = 192.98f64;
