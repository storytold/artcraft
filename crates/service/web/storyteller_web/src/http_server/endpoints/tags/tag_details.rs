use artcraft_api_defs::tags::common::TagDetails;
use mysql_queries::queries::tags::tag_row::TagRow;

pub fn tag_row_to_details(row: TagRow) -> TagDetails {
  TagDetails {
    tag_token: row.token,
    tag_value: row.tag_value,
    tag_value_lowercase: row.tag_value_lowercase,
    use_count: row.use_count,
  }
}
