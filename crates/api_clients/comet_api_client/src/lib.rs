//! comet_api_client
//!
//! HTTP client for CometAPI (https://www.cometapi.com/), which proxies a
//! variety of third-party generative models. We use it for Doubao Seedance 2.0
//! video generation ("Seedance 2.0" and "Seedance 2.0 Fast").
//!
//! Flow: enqueue with [`requests::create_video`], then poll with
//! [`requests::get_video_task`] until the task reaches a terminal status.
//!
//! NB: There is deliberately no webhook module. CometAPI documents callbacks
//! as provider-specific pass-through events with no standardized payload, and
//! the Seedance video endpoint has no documented callback parameter. Comet's
//! own guidance is to "keep polling as the source of truth".

pub mod creds;
pub mod error;
pub mod generate;
pub mod requests;

#[cfg(test)]
mod test_utils;
