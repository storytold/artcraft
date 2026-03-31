//! password
//!
//! Password-related functions
//!

// Never allow these
#![forbid(private_bounds)]
#![forbid(private_interfaces)]
#![forbid(unused_must_use)] // NB: It's unsafe to not close/check some things

// Okay to toggle
#![forbid(unreachable_patterns)]
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

// Always allow
#![allow(dead_code)]
#![allow(non_snake_case)]

// TODO(bt,2023-11-11): Start using a more modern / safer password hashing algorithm such as Argon2 or scrypt
//  https://medium.com/@mpreziuso/password-hashing-pbkdf2-scrypt-bcrypt-and-argon2-e25aaf41598e
//  https://stytch.com/blog/argon2-vs-bcrypt-vs-scrypt/
pub mod bcrypt_hash_password;
pub mod bcrypt_confirm_password;
pub mod constants;
pub mod errors;
