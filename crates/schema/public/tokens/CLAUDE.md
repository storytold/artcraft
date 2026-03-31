# Tokens Crate

Strongly-typed primary key identifiers with Stripe-like prefixes (e.g. `user_abc123`, `prompt_xyz789`, etc.)

## Adding a New Token

1. Create file in `src/tokens/{entity_name}.rs`
2. Define as a newtype wrapper:
   ```rust
   #[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize, ToSchema)]
   #[cfg_attr(feature = "database", derive(sqlx::Type))]
   #[cfg_attr(feature = "database", sqlx(transparent))]
   pub struct MyToken(pub String);
   ```
3. Apply macros:
   ```rust
   impl_string_token!(MyToken);
   impl_mysql_token_from_row!(MyToken);
   impl_crockford_generator!(MyToken, 32usize, TokenPrefix::MyEntity, CrockfordLower);
   ```
4. Add the prefix to `TokenPrefix` enum in `src/token_prefix.rs`
5. Add to parent `mod.rs`
