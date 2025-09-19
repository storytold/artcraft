use std::{future::Future, io::Cursor};

use base64::prelude::*;
use image::DynamicImage;

use crate::FalError;

#[deprecated(note = "use `reqwest::get` and `image::load_from_memory` instead")]
#[allow(deprecated)]
impl crate::File {
    /// Convert the File to an image
    pub fn into_image(self) -> impl Future<Output = Result<image::DynamicImage, FalError>> {
        async move {
            let image_bytes = reqwest::get(&self.url).await?.bytes().await?;
            let output = image::load_from_memory(&image_bytes)?;
            Ok(output)
        }
    }

    /// Convert the file into raw bytes
    pub fn into_raw_image(self) -> impl Future<Output = Result<Vec<u8>, FalError>> {
        async move {
            let image_bytes = reqwest::get(&self.url).await?.bytes().await?;
            Ok(image_bytes.to_vec())
        }
    }
}

pub trait ToDataUrl {
    fn to_data_url(&self) -> String;
}

impl ToDataUrl for DynamicImage {
    /// Convert the image into a PNG data URL.
    /// This is a convenience function to help with image-to-X endpoints.
    fn to_data_url(&self) -> String {
        image_to_data_url(self)
    }
}

fn image_to_data_url(image: &image::DynamicImage) -> String {
    let mut buf = Vec::new();
    let mut writer = Cursor::new(&mut buf);
    image
        .write_to(&mut writer, image::ImageFormat::Png)
        .unwrap();
    let data = BASE64_STANDARD.encode(&buf);
    format!("data:image/png;base64,{}", data)
}
