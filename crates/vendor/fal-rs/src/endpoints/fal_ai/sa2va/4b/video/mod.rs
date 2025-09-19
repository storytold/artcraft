#[allow(unused_imports)]
use std::collections::HashMap;
#[allow(unused_imports)]
use serde::{Serialize, Deserialize};
#[allow(unused_imports)]
use crate::prelude::*;


                
    #[derive(Debug, Serialize, Deserialize)]
    pub struct ImageChatOutput {
        /// Dictionary of label: mask image/// Dictionary of label: mask image/// [{"content_type":"image/png","file_name":"019c3c1e3c50446e9996f709d36debb4.png","file_size":15724,"height":1200,"url":"https://v3.fal.media/files/monkey/6ITmhHQJ-69s-UxajrY5T_019c3c1e3c50446e9996f709d36debb4.png","width":1800},{"content_type":"image/png","file_name":"0a1522ca410942c7ad6c73efa15b3549.png","file_size":14905,"height":1200,"url":"https://v3.fal.media/files/monkey/IljtMxahoo9-7SUpx0fth_0a1522ca410942c7ad6c73efa15b3549.png","width":1800}]

pub masks: Vec<Image>,
/// Generated output/// Generated output/// "<p>  A white pickup truck  </p>   [SEG]  is parked on the side of  <p>  the red building  </p>   [SEG] , creating a unique and eye-catching contrast.<|im_end|>"

pub output: String
    }
    

                /// Sa2VA 8B Image
/// 
/// Category: vision
/// Machine Type: A100
/// License Type: commercial
                pub fn video(params: VideoInput) -> FalRequest<VideoInput, ImageChatOutput> {
                    FalRequest::new(
                        "fal-ai/sa2va/8b/image",
                        params
                    )
                }
                