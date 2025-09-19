#[allow(unused_imports)]
use std::collections::HashMap;
#[allow(unused_imports)]
use serde::{Serialize, Deserialize};
#[allow(unused_imports)]
use crate::prelude::*;


                
    #[derive(Debug, Serialize, Deserialize)]
    pub struct WanT2VResponse {
        /// The seed used for generation.
pub seed: i64,
/// The generated video file./// The generated video file./// {"url":"https://v3.fal.media/files/lion/mF2VjLzSNyI-KTAuDQExX_tmpvkubnfyc.mp4"}

pub video: File
    }
    

                /// Wan-2.1 1.3B Text-to-Video
/// 
/// Category: text-to-video
/// Machine Type: H100
/// 
/// 
/// WAN 1.3B model for fast text-to-video generation.
                pub fn text_to_video(params: WanT2VRequest) -> FalRequest<WanT2VRequest, WanT2VResponse> {
                    FalRequest::new(
                        "fal-ai/wan/v2.1/1.3b/text-to-video",
                        params
                    )
                }
                