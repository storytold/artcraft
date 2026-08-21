pub mod add_media_file_tags_handler;
pub mod bulk_add_tags_handler;
pub mod bulk_list_media_file_tags_handler;
pub mod bulk_set_tags_handler;
pub mod clear_media_file_tags_handler;
pub mod delete_tag_handler;
pub mod list_media_file_tags_handler;
pub mod list_media_files_with_tag_handler;
pub mod list_tagged_media_files_handler;
pub mod list_tags_handler;
pub mod list_untagged_media_files_handler;
pub mod rename_tag_handler;
pub mod set_media_file_tags_handler;

// Public: `TagMediaFileListItem` is registered in `api_doc.rs`.
pub mod tag_media_file_list_item;

mod apply_tags;
mod tag_details;
mod tag_input;
