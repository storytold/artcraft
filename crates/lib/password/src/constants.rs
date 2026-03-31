/// Special database sentinel value indicating that a password is not set.
/// This is used to support "no-password" signups, since the password hash database column is itself non-nullable.
pub const PASSWORD_HASH_SENTINEL_VALUE: &str = "*";
