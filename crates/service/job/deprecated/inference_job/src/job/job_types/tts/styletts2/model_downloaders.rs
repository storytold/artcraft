use crate::util::downloaders::model_downloader::ModelDownloader;

pub struct StyleTTS2Downloaders;
//{
//    pub styletts2: StyleTTS2ModelMapping,
//}

impl StyleTTS2Downloaders {
    // TODO(KS): All checkpoints are in the container, so we don't need to download them here.
    // Maybe they should be here instead
    pub fn build_all_from_env() -> Self {
        Self {
        }
    }

    pub fn all_downloaders(&self) -> Vec<&dyn ModelDownloader> {
        vec![]
    }
}