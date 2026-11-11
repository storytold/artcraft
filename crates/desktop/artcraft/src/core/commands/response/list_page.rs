use serde::Deserialize;

#[derive(Default, Deserialize)]
pub struct ListPageRequest {
  #[serde(rename = "limit")]
  pub maybe_limit: Option<usize>,
  #[serde(rename = "cursor")]
  pub maybe_cursor: Option<usize>,
}

/// Return a bounded offset page and a continuation cursor for the remaining entries.
pub fn list_page<T>(items: Vec<T>, request: Option<ListPageRequest>) -> (Vec<T>, Option<usize>) {
  let request = request.unwrap_or_default();
  let limit = request.maybe_limit.unwrap_or(50).clamp(1, 100);
  let offset = request.maybe_cursor.unwrap_or_default().min(items.len());
  let end = offset.saturating_add(limit).min(items.len());
  let maybe_next = (end < items.len()).then_some(end);
  (items.into_iter().skip(offset).take(limit).collect(), maybe_next)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn clamps_pages_and_handles_out_of_range_cursors() {
    let (first, next) = list_page((0..250).collect(), Some(ListPageRequest { maybe_limit: Some(usize::MAX), maybe_cursor: None }));
    assert_eq!(first, (0..100).collect::<Vec<_>>());
    assert_eq!(next, Some(100));
    let (last, next) = list_page((0..250).collect(), Some(ListPageRequest { maybe_limit: Some(100), maybe_cursor: Some(200) }));
    assert_eq!(last, (200..250).collect::<Vec<_>>());
    assert_eq!(next, None);
    assert!(list_page(vec![1], Some(ListPageRequest { maybe_limit: Some(0), maybe_cursor: Some(usize::MAX) })).0.is_empty());
  }
}
