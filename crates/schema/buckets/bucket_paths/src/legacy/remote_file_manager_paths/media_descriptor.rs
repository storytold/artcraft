use crate::legacy::remote_file_manager_paths::file_descriptor::FileDescriptor;

// TODO ASK BRANDON WHAT path should this be?
const MEDIA_FILE_DIRECTORY: &str = "/media";

#[deprecated(note="DO NOT USE THIS AWFUL CLOUD BUCKET CLIENT. See `BucketClient`")]
pub struct MediaImagePngDescriptor;

impl FileDescriptor for MediaImagePngDescriptor {
    fn remote_directory_path(&self) -> &str {
        MEDIA_FILE_DIRECTORY
    }
    fn get_suffix(&self)->String {
        ".png".to_string()
    }

    fn get_prefix(&self)->String {
        "image_".to_string()
    }

    fn is_public(&self) -> bool {
        true
    }
}

pub struct MediaVideoMp4Descriptor;
impl FileDescriptor for MediaVideoMp4Descriptor {
    fn remote_directory_path(&self) -> &str {
        MEDIA_FILE_DIRECTORY
    }
    fn get_suffix(&self)->String {
        ".mp4".to_string()
    }

    fn get_prefix(&self)->String {
        "video_".to_string()
    }

    fn is_public(&self) -> bool {
        true
    }
}

pub struct UploadVideoMp4Descriptor;
impl FileDescriptor for UploadVideoMp4Descriptor {
    fn remote_directory_path(&self) -> &str {
        MEDIA_FILE_DIRECTORY
    }
    fn get_suffix(&self)->String {
        ".mp4".to_string()
    }

    fn get_prefix(&self)->String {
        "upload_".to_string()
    }

    fn is_public(&self) -> bool {
        true
    }
}
