# Enums Crate

Database-backed enums stored as VARCHAR fields in MySQL.

## Adding a New Enum

1. Create file: `src/by_table/{table_name}/{field_name}.rs`
2. Define the enum with required derives:
   ```rust
   #[cfg_attr(test, derive(EnumIter, EnumCount))]
   #[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema)]
   pub enum MyEnum { ... }
   ```
3. Implement `to_str()` and `from_str()` manually
4. Add macros: `impl_enum_display_and_debug_using_to_str!(MyEnum);` and `impl_mysql_enum_coders!(MyEnum);`
5. Add to parent `mod.rs`
6. Write tests: serialization, round-trip, `all_variants()` count

## Rules

- **NEVER change existing variant string values** - they are stored in the database
- New variants CAN be added freely - but be very careful about the Tauri API callers 
  ingesting new values. Make sure to pair the client with variants with an "Unknown(String)"
  catch-all / future-proof bucket.
- All string values must be snake_case
- Use `#[serde(rename = "snake_case_value")]` on each variant
