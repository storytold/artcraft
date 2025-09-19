# fal-rs

[![Crates.io](https://img.shields.io/crates/v/fal.svg)](https://crates.io/crates/fal)
[![Documentation](https://docs.rs/fal/badge.svg)](https://docs.rs/fal)
[![License](https://img.shields.io/badge/license-MIT%2FApache--2.0-blue.svg)](LICENSE-MIT)

A Rust client for the [fal.ai](https://fal.ai) API, providing easy access to state-of-the-art AI models for image generation, audio processing, and more.

## Features

- **Type-safe API**: Strongly typed interfaces for all fal.ai endpoints, generated and kept up-to-date straight from the API itself
- **Compile Time Efficient**: FAL API Endpoint modules are code generated from the API with granular features, so you only build the set of endpoints you actually use!
- **Async/Await Support**: Built on top of `reqwest` for efficient async operations
- **Queue System**: Built-in support for fal.ai's queue system for long-running operations

## Installation

Add this to your `Cargo.toml`:

```toml
[dependencies]
fal = "0.3"
```

## Usage
### Using public model endpoints

By default, endpoints are disabled. The FAL API has hundreds of endpoints, and are growing in number by the day. In order to prevent compile time and binary size bloat, this crate supports somewhat fine-grained crate features for enabling endpoints, as you need them. To use pre-built, fully-typed endpoint functions to call the API, you can enable them by enabling the corresponding feature for that group of endpoints. For example, for the `fal-ai/flux/dev` endpoint, I can enable it like this:

```toml
# In Cargo.toml
fal = { version = "0.3", features = ["endpoints_fal-ai_flux"] }
```

**Note**: The features go a maximum of two "levels", so you can enable `fal-ai/flux`, which enables all endpoints under `fal-ai/flux`, or `fal-ai`, or all endpoints in the API.

or, I can enable *all* endpoints under the `fal-ai` owner:

```toml
# In Cargo.toml
fal = { version = "0.3", features = ["endpoints_fal-ai"] }
```

or if I'm really crazy, I can just enable all endpoints in the API:

```toml
# In Cargo.toml
fal = { version = "0.3", features = ["endpoints"] }
```

Once enabled, the endpoint can be called like this:

```rust,no_run
use fal::prelude::*;
use fal::endpoints::fal_ai::flux;

#[tokio::main]
async fn main() {
    let api_key = std::env::var("FAL_API_KEY").unwrap();

    // Use the Flux Dev endpoint to generate an image
    let response = flux::dev::dev(flux::dev::DevTextToImageInput {
        prompt: "a majestic horse in a field".to_string(),
        ..Default::default()
    })
    .with_api_key(api_key) // If not provided, the FAL_API_KEY environment variable is used
    .send()
    .await
    .unwrap();

    println!("Generated image URL: {}", response.images[0].url);
}
```

### Using the Queue System

For long-running operations, you can use the [FAL Queue API](https://docs.fal.ai/model-endpoints/queue):

```rust,no_run
use fal::prelude::*;
use fal::endpoints::fal_ai::flux;
use futures::StreamExt;

#[tokio::main]
async fn main() {
    let queue = flux::dev::dev(flux::dev::DevTextToImageInput {
        prompt: "a majestic horse in a field".to_string(),
        ..Default::default()
    })
    .queue()
    .await
    .unwrap();

    // Stream status updates
    while let Some(status) = queue.stream(true).await.unwrap().next().await {
        let status = status.unwrap();
        println!("Status: {:?}", status.status);
        
        if status.status == Status::Completed {
            break;
        }
    }

    let response = queue.response().await.unwrap();
    println!("Generated image URL: {}", response.images[0].url);
}
```

### The `#[endpoint]` macro
You can easily create a custom endpoint function using the provided [endpoint](crate::endpoint) proc macro. This should only be necessary if you are using a private model endpoint, or you really just want control over your types. Otherwise, you should be able to find the endpoint you want to use in the pre-built endpoints module!

```rust,no_run
use fal::prelude::*;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct File {
    pub url: String,
    pub content_type: String,
    pub file_name: Option<String>,
    pub file_size: Option<i64>,
    pub width: Option<i64>,
    pub height: Option<i64>,
}

#[derive(Deserialize)]
pub struct FalResponse {
  pub images: Vec<File>,
}

#[endpoint(endpoint="fal-ai/flux/dev")]
pub fn flux_dev(prompt: String) -> FalResponse {}

// This endpoint function can now be used to call the fal endpoint:
#[tokio::main]
async fn main() {
    let response = flux_dev("an horse riding an astronaut".to_owned())
    .send()
    .await
    .unwrap();

    println!("Generated image URL: {}", response.images[0].url);
}
```

## Features

The crate comes with several optional features:

- `endpoints_*`: Include pre-generated endpoint modules for fal.ai services. See "Using public model endpoints" above for details.

## Generating Endpoint Modules

The `generate` package in this repository is used to automatically generate endpoint modules based on the fal.ai API specification. This ensures that the client always has up-to-date type definitions and endpoint implementations.

To generate endpoint modules:

1. Clone the repository
2. Run the generate package:

```bash
cargo run -p generate-endpoints
```

This will update the endpoint modules in the `fal/src/endpoints` directory with the latest API definitions, using the model registry from the FAL API.

## License

Licensed under either of:

 * Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE-APACHE) or http://www.apache.org/licenses/LICENSE-2.0)
 * MIT license ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)

at your option.

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.
