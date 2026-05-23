use serde::Deserialize;


/// Images with a binary blob and URLs.
/// We may receive several of these for a single prompt.
#[derive(Deserialize, Clone, Debug)]
pub struct MessageImageData {
  /// UUID.
  /// Probably an identifier for the original request/prompt.
  pub request_id: String, // Option<String>,

  /// UUID.
  /// This turns out to be the file ID in the image URL (and `job_id`).
  pub id: Option<String>,

  /// UUID.
  /// This turns out to be the file ID in the image URL (and `id`).
  pub job_id: Option<String>,

  /// Eg. null, "0", "50", "100"
  pub percentage_complete: Option<f32>,

  /// The user's prompt
  pub prompt: String,  //pub prompt: Option<String>,

  /// The X.ai enriched prompt
  pub full_prompt: String, //pub full_prompt: Option<String>,

  /// URL to the image.
  pub url: String, //pub url: Option<String>,
  
  // We don't need to decode - let's just download again
  // /// Base64 encoded image blob.
  // pub blob: Option<String>,

  // /// NSFW flag
  // pub r_rated: Option<bool>,

  // /// Name of the model used to generate the image
  // /// eg. "imagine_h_1", "imagine_x_1"
  // pub model_name: Option<String>,
}

/*
Received websocket message: {
  "type": "image",
  "blob": "...",
  "job_id": "260270db-2515-470b-a730-1fe87e11d21c",
  "grid_index": 0,
  "is_alteration": false,
  "order": 0,
  "section_id": 0,
  "request_id": "57b94c87-ae13-4ade-8fc0-ebd39fb511ec",
  "url": "https://imagine-public.x.ai/imagine-public/images/260270db-2515-470b-a730-1fe87e11d21c.png",
  "id": "260270db-2515-470b-a730-1fe87e11d21c",
  "prompt": "a dog riding a motorcycle",
  "full_prompt": "A dog sits in a motorcycle sidecar on a paved road with a natural background.",
  "percentage_complete": 100.0,
  "model_name": "imagine_x_1",
  "suggested_moderation_rule": "MODERATION_RULE_DEFAULT",
  "r_rated":false
}
*/
