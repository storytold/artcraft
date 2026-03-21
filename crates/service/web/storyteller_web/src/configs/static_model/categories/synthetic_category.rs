use enums_db::by_table::model_categories::model_type::ModelType;

#[derive(Clone, Eq, PartialEq, Hash, Debug)]
pub struct SyntheticCategory {
  /// A synthetic model category token that does not exist in the database.
  pub category_token: &'static str,
  pub maybe_super_category_token: Option<&'static str>,

  pub name: &'static str,
  pub name_for_dropdown: &'static str,

  pub model_type: ModelType,

  pub can_directly_have_models: bool,
  pub can_directly_have_subcategories: bool,

  /// Whether the frontend should alphabetically sort the models.
  pub should_be_sorted: bool,
}
