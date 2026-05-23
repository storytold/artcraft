use serde::Serialize;

#[derive(Serialize)]
pub (super) struct CreateChatConversationWireRequest {
  #[serde(rename = "temporary")]
  pub (super) temporary: bool,

  #[serde(rename = "modelName")]
  pub (super) model_name: String,

  /// The prompt
  #[serde(rename = "message")]
  pub (super) message: String,

  #[serde(rename = "fileAttachments")]
  pub (super) file_attachments: Vec<String>,

  #[serde(rename = "toolOverrides")]
  pub (super) tool_overrides: ToolOverrides,

  #[serde(rename = "responseMetadata")]
  pub (super) response_metadata: ResponseMetadata,
}

#[derive(Serialize)]
pub (super) struct ToolOverrides {
  #[serde(rename = "videoGen")]
  pub (super) video_gen: bool,
}

#[derive(Serialize)]
pub (super) struct ResponseMetadata {
  #[serde(rename = "modelConfigOverride")]
  pub (super) model_config_override: ModelConfigOverride,
}

#[derive(Serialize)]
pub (super) struct ModelConfigOverride {
  #[serde(rename = "modelMap")]
  pub (super) model_map: ModelMap,
}


#[derive(Serialize)]
pub (super) struct ModelMap {
  #[serde(rename = "videoGenModelConfig")]
  pub (super) video_gen_model_config: VideoGenModelConfig,
}

#[derive(Serialize)]
pub (super) struct VideoGenModelConfig {
  #[serde(rename = "parentPostId")]
  pub (super) parent_post_id: String,

  /// Newer field as of November
  /// values: "1:1", "2:3" (tall),
  #[serde(rename = "aspectRatio")]
  pub (super) aspect_ratio: VideoGenAspectRatio,

  /// Newer field as of November
  /// default seems to be "6"
  #[serde(rename = "videoLength")]
  pub (super) video_length: u32,
}

#[derive(Serialize, Clone, Copy, Debug)]
pub (super) enum VideoGenAspectRatio {
  #[serde(rename = "2:3")]
  TallTwoByThree,

  #[serde(rename = "3:2")]
  WideThreeByTwo,

  #[serde(rename = "1:1")]
  Square,
}

/*

November 27 no image (text only) square aspect ratio -

--data-raw
  {
    "temporary":true,
    "modelName":"grok-3",
    "message":"A waterspout wrecks an oil tanker, misty, huge waves --mode=custom",
    "toolOverrides": {
      "videoGen":true
    },
    "responseMetadata": {
      "modelConfigOverride": {
        "modelMap": {
          "videoGenModelConfig": {
            "parentPostId":"b0b88b45-9724-49bd-a82c-c83ddcd2937f",
            "aspectRatio":"2:3",
            "videoLength":6
          }
        }
      }
    }
  }

October 29 request struct -

--data-raw
   {
     "temporary":true,
     "modelName":"grok-3",
     "message":"https://assets.grok.com/users/85980643-ffab-4984-a3de-59a608c47d7f/d6d73ffd-ce87-40a3-9cc2-3432d7192652/content  --mode=normal",
     "fileAttachments":["d6d73ffd-ce87-40a3-9cc2-3432d7192652"],
     "toolOverrides":{
       "videoGen":true
     },
     "responseMetadata":{
       "modelConfigOverride":{
         "modelMap":{
           "videoGenModelConfig":{
             "parentPostId":"d6d73ffd-ce87-40a3-9cc2-3432d7192652"
           }
         }
       }
     }
   }


October 29 generate from already uploaded image with prompt struct -
--data-raw
  {
    "temporary":true,
    "modelName":"grok-3",
    "message":"https://assets.grok.com/users/85980643-ffab-4984-a3de-59a608c47d7f/d6d73ffd-ce87-40a3-9cc2-3432d7192652/content  building gets hit by tornado --mode=custom",
    "fileAttachments":["d6d73ffd-ce87-40a3-9cc2-3432d7192652"],
    "toolOverrides":{
      "videoGen":true
    },
    "responseMetadata":{
      "modelConfigOverride":{
        "modelMap":{
          "videoGenModelConfig":{
            "parentPostId":"d6d73ffd-ce87-40a3-9cc2-3432d7192652"
          }
        }
      }
    }
  }

October 22 request struct -

--data-raw
  {
    "temporary":true,
    "modelName":"grok-3",
    "message":"https://assets.grok.com/users/85980643-ffab-4984-a3de-59a608c47d7f/21a79085-e206-4b0b-88ac-5f2b7a453e45/content  --mode=normal",
    "fileAttachments": [
      "21a79085-e206-4b0b-88ac-5f2b7a453e45"
    ],
    "toolOverrides": {
      "videoGen":true
    }
  }

*/

