/// Normalize CLI args so that underscores in subcommand names are optional.
///
/// For each arg that isn't a flag (doesn't start with `-`), if removing all
/// underscores from the arg matches removing all underscores from a canonical
/// name, the arg is replaced with the canonical name.
///
/// This lets users type `findjob`, `find_job`, or even `f_ind_job` and all
/// resolve to the canonical `find_job`.
pub fn normalize_subcommand_args(
  args: impl IntoIterator<Item = String>,
  canonical_names: &[&str],
) -> Vec<String> {
  args.into_iter()
    .map(|arg| {
      if arg.starts_with('-') {
        return arg;
      }
      let stripped = arg.replace('_', "").to_lowercase();
      for &name in canonical_names {
        if name.replace('_', "").to_lowercase() == stripped {
          return name.to_string();
        }
      }
      arg
    })
    .collect()
}
