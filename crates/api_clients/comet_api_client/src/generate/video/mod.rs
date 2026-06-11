//! Concrete, strongly-typed per-model bindings over the generic
//! [`crate::requests::create_video`] call. Each module encodes one model's
//! constraints (duration range, size options, image-input support) in the
//! type system and validates before hitting the wire.

pub mod generate_doubao_seedance_1p0_pro;
pub mod generate_doubao_seedance_1p5_pro;
pub mod generate_doubao_seedance_2p0;
pub mod generate_doubao_seedance_2p0_fast;
pub mod generate_vidu_q3;
pub mod generate_vidu_q3_turbo;
pub mod generate_wan_2p6;
pub mod generate_wan_2p7;
