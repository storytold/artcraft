use crate::core::commands::response::failure_response_wrapper::CommandErrorResponseWrapper;
use crate::core::commands::response::success_response_wrapper::CommandSuccessResponseWrapper;

// TODO(needs command response refactor):
//  - get_app_preferences_command
//  - update_app_preferences_command
//  - flip_image
//  - check_sora_session_command
//  - open_sora_login_command
//  - sora_image_generation_command

// TODO(already updated, need to update frontend):
//  - platform_info_command

// TODO(simplify error types):
//  - enqueue_text_to_image_command
//  - fal_background_removal_command
//  - fal_hunyuan_image_to_3d_command
//  - fal_kling_image_to_video_command
//  - get_fal_api_key_command
//  - set_fal_api_key_command
//  - sora_image_remix_command

/// Easy to use infallible response.
/// This always contains a success payload and never results in an error.
pub type InfallibleResponse<SuccessPayload> = CommandSuccessResponseWrapper<SuccessPayload>;

/// Easy to use Result<T, E> type.
/// 
/// There are easier ways to use Response<S, Et, Ep> : 
///  - `SimpleResponse` just returns strings on success or error (but provides clues to the frontend)
///  - `SuccessOrErrorMessage` returns an empty success payload or an error message
///  - `ResponseOrErrorMessage<SuccessPayload>` returns a success payload or an error message
///  - `ResponseOrErrorType<SuccessPayload, ErrType>` returns a success payload or an error type
///  - `ResponseOrError<SuccessPayload, ErrPayload>` returns a success payload or an error payload
/// 
pub type Response<SuccessPayload, ErrType, ErrPayload> =
  Result<CommandSuccessResponseWrapper<SuccessPayload>, CommandErrorResponseWrapper<ErrType, ErrPayload>>;

/// No inner payloads for this type. Just strings as messages.
pub type SimpleResponse = Response<(), (), ()>;

/// Either an empty success payload or error message.
pub type SuccessOrErrorMessage =
  Result<CommandSuccessResponseWrapper<()>, CommandErrorResponseWrapper<(), ()>>;

/// Either a success or error message.
pub type ResponseOrErrorMessage<SuccessPayload> =
  Result<CommandSuccessResponseWrapper<SuccessPayload>, CommandErrorResponseWrapper<(), ()>>;

/// Either a success or error type.
pub type ResponseOrErrorType<SuccessPayload, ErrType> =
  Result<CommandSuccessResponseWrapper<SuccessPayload>, CommandErrorResponseWrapper<ErrType, ()>>;

/// Either a success or error payload.
pub type ResponseOrError<SuccessPayload, ErrPayload> =
  Result<CommandSuccessResponseWrapper<SuccessPayload>, CommandErrorResponseWrapper<(), ErrPayload>>;
