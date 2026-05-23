use crate::core::api_adapters::aspect_ratio::common_aspect_ratio::CommonAspectRatio;
use grok_consumer_client::requests::image_websocket::messages::websocket_client_message::ClientMessageAspectRatio;

pub fn aspect_ratio_to_grok_image(aspect_ratio: CommonAspectRatio) -> ClientMessageAspectRatio {
  match aspect_ratio {
    // Exact
    CommonAspectRatio::Square => ClientMessageAspectRatio::Square,
    CommonAspectRatio::WideThreeByTwo => ClientMessageAspectRatio::WideThreeByTwo,
    CommonAspectRatio::TallTwoByThree => ClientMessageAspectRatio::TallTwoByThree,
    
    // Close enough
    CommonAspectRatio::SquareHd => ClientMessageAspectRatio::Square,

    // Non-matching
    CommonAspectRatio::Auto
    | CommonAspectRatio::Auto2k
    | CommonAspectRatio::Auto4k => ClientMessageAspectRatio::Square,
    
    // Mismatch - wide
    CommonAspectRatio::Wide 
    | CommonAspectRatio::WideFiveByFour 
    | CommonAspectRatio::WideFourByThree 
    | CommonAspectRatio::WideSixteenByNine 
    | CommonAspectRatio::WideTwentyOneByNine => ClientMessageAspectRatio::WideThreeByTwo,

    // Mismatch - tall
    CommonAspectRatio::Tall 
    | CommonAspectRatio::TallFourByFive 
    | CommonAspectRatio::TallThreeByFour 
    | CommonAspectRatio::TallNineBySixteen 
    | CommonAspectRatio::TallNineByTwentyOne => ClientMessageAspectRatio::TallTwoByThree,
  }
}
